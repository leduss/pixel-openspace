/*
 * Les tâches de la machine, lues là où elles vivent : les agents launchd de
 * l'utilisateur (macOS), sa crontab, et ses timers systemd (Linux). Chacune
 * devient un Agent de l'open space, avec son état, son horaire et la dernière
 * ligne de son journal.
 */

import { execFileSync } from 'node:child_process'
import { closeSync, existsSync, openSync, readdirSync, readSync, statSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'
import type { Agent, AgentStatus, Language } from '../../registry/pixel-openspace/types'
import { decrire, horaireCron, horaireLaunchd, passagePrecedent, prochainPassage, type Horaire } from './horaire'

export type Source = 'launchd' | 'cron' | 'systemd'

/** Un agent, et de quoi le relancer à la main. */
export type Tache = Agent & { source: Source; cible: string }

export type Filtre = { match: Array<string>; exclude: Array<string> }

const lancer = (commande: string, args: Array<string>) =>
  execFileSync(commande, args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], timeout: 5000 })

/** Garde-t-on cette tâche ? `match` en retient certaines, `exclude` en écarte. */
export function retenue(nom: string, filtre: Filtre) {
  const bas = nom.toLowerCase()
  if (filtre.exclude.some((m) => bas.includes(m.toLowerCase()))) return false
  return !filtre.match.length || filtre.match.some((m) => bas.includes(m.toLowerCase()))
}

const EMOJIS: Array<[RegExp, string]> = [
  [/backup|sauvegard|dump|snapshot/, '💾'],
  [/mail|inbox|courrier|imap/, '📨'],
  [/deploy|deploie|release|publi/, '🚀'],
  [/prix|price|stock/, '💶'],
  [/factur|invoice|bill|paiement|payment/, '🧾'],
  [/audit|scan|secur|depend/, '🔍'],
  [/alert|monitor|health|ping|uptime|surveil/, '🚨'],
  [/sync|import|export|fetch|pull/, '🔄'],
  [/clean|nettoy|purge|prune|rotate/, '🧹'],
  [/report|rapport|stat|metric|analytic/, '📊'],
  [/social|tweet|post|facebook|insta|tiktok|discord|slack/, '📣'],
  [/colis|parcel|ship|track|livraison|delivery/, '📦'],
  [/brief|digest|resume|summary|news/, '📰'],
  [/photo|image|media|video/, '📸'],
  [/cert|ssl|renew/, '🔐'],
]

/** Un emoji d'après le nom de la tâche ; un robot à défaut. */
export function emojiPour(nom: string) {
  const bas = nom.toLowerCase()
  return EMOJIS.find(([motif]) => motif.test(bas))?.[1] ?? '🤖'
}

/** `fr.montematour.audit-dependances` devient « Audit dependances ». */
export function nomLisible(brut: string) {
  const sansExtension = brut.replace(/\.(sh|py|js|mjs|ts|rb|pl|php)$/, '')
  const fin =
    sansExtension
      .split(sansExtension.includes('/') ? '/' : '.')
      .filter(Boolean)
      .at(-1) ?? brut
  const mots = fin.replace(/[-_]+/g, ' ').trim()
  return mots.charAt(0).toUpperCase() + mots.slice(1)
}

/** La dernière ligne non vide d'un journal, sans ses codes de couleur, lue dans ses 4 derniers Ko. */
export function derniereLigne(chemin: string): string | null {
  try {
    const taille = statSync(chemin).size
    const longueur = Math.min(taille, 4096)
    const tampon = Buffer.alloc(longueur)
    const fd = openSync(chemin, 'r')
    readSync(fd, tampon, 0, longueur, taille - longueur)
    closeSync(fd)
    const lignes = tampon
      .toString('utf8')
      .replace(/\u001b\[[0-9;]*m/g, '')
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean)
    // Sans l'horodatage du début de ligne : l'open space affiche déjà l'heure du passage.
    const ligne = lignes.at(-1)?.replace(/^\[?\d{4}-\d{2}-\d{2}[T ][\d:.,]+(?:Z|[+-]\d{2}:?\d{2})?\]?\s*(?:[·|-]\s*)?/, '')
    return ligne ? (ligne.length > 140 ? `${ligne.slice(0, 139)}…` : ligne) : null
  } catch {
    return null
  }
}

/** Une période où la machine dormait, en millisecondes depuis l'époque. */
export type Veille = { debut: number; fin: number }

/**
 * Les périodes de veille du Mac, lues dans `pmset -g log` : d'un « Sleep » au
 * « Wake » qui suit. Un « DarkWake » ne les interrompt pas : c'est un réveil
 * technique, écran éteint, pendant lequel l'agenda de launchd ne passe pas. Une
 * veille sans réveil derrière court jusqu'à `maintenant`.
 */
export function lireVeilles(journal: string, maintenant: Date): Array<Veille> {
  const veilles: Array<Veille> = []
  let debut: number | null = null
  for (const ligne of journal.split('\n')) {
    const m = ligne.match(/^(\d{4}-\d{2}-\d{2}) (\d{2}:\d{2}:\d{2}) ([+-]\d{2})(\d{2}) (Sleep|Wake)\s*\t/)
    if (!m) continue
    const instant = Date.parse(`${m[1]}T${m[2]}${m[3]}:${m[4]}`)
    if (Number.isNaN(instant)) continue
    if (m[5] === 'Sleep') debut ??= instant
    else if (debut !== null) {
      veilles.push({ debut, fin: instant })
      debut = null
    }
  }
  if (debut !== null) veilles.push({ debut, fin: maintenant.getTime() })
  return veilles
}

/* Le journal de veille pèse plusieurs mégaoctets : relu au plus toutes les cinq minutes. */
let veillesEnCache: { lu: number; veilles: Array<Veille> } | null = null

/** Les veilles du Mac, ou aucune ailleurs et si `pmset` ne répond pas. */
export function veillesDuMac(maintenant: Date): Array<Veille> {
  if (process.platform !== 'darwin') return []
  if (veillesEnCache && maintenant.getTime() - veillesEnCache.lu < 5 * 60_000) return veillesEnCache.veilles
  let veilles: Array<Veille> = []
  try {
    const journal = execFileSync('pmset', ['-g', 'log'], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
      timeout: 15_000,
      maxBuffer: 256 * 1024 * 1024,
    })
    veilles = lireVeilles(journal, maintenant)
  } catch {
    /* Sans journal, aucune tâche ne passe pour endormie : elle reste en retard, comme avant. */
  }
  veillesEnCache = { lu: maintenant.getTime(), veilles }
  return veilles
}

/**
 * L'état d'une tâche qui ne tourne pas : en échec, jamais lancée, en retard
 * (son dernier passage prévu n'a pas eu lieu), endormie (il devait avoir lieu
 * pendant que la machine dormait : rien n'est cassé), ou à jour.
 */
export function etatAuRepos({
  horaire,
  dernier,
  echec,
  maintenant,
  veilles = [],
}: {
  horaire: Horaire
  dernier: Date | null
  echec: boolean
  maintenant: Date
  veilles?: Array<Veille>
}): AgentStatus {
  if (echec) return 'failed'
  if (horaire.type === 'aucun') return 'on-demand'
  if (!dernier) return 'never'
  const prevu = passagePrecedent(horaire, maintenant)
  // Un quart d'heure de grâce : la machine sortait peut-être de veille.
  if (prevu && dernier.getTime() < prevu.getTime() - 60_000 && maintenant.getTime() - prevu.getTime() > 15 * 60_000) {
    const t = prevu.getTime()
    return veilles.some((v) => t >= v.debut && t < v.fin) ? 'asleep' : 'late'
  }
  return 'ok'
}

const iso = (d: Date | null | undefined) => (d ? d.toISOString() : null)

/* ——— launchd ——— */

type Plist = {
  Label?: string
  Program?: string
  ProgramArguments?: Array<string>
  StartCalendarInterval?: Parameters<typeof horaireLaunchd>[0]['StartCalendarInterval']
  StartInterval?: number
  StandardOutPath?: string
  StandardErrorPath?: string
  Disabled?: boolean
}

/** `launchctl list` : le PID (ou rien) et le dernier code de sortie de chaque label chargé. */
function chargesLaunchd(): Map<string, { pid: number | null; sortie: number }> {
  const charges = new Map<string, { pid: number | null; sortie: number }>()
  for (const ligne of lancer('launchctl', ['list']).split('\n').slice(1)) {
    const [pid, sortie, label] = ligne.split('\t')
    if (label) charges.set(label, { pid: pid === '-' ? null : Number(pid), sortie: Number(sortie) || 0 })
  }
  return charges
}

export function lireLaunchd(filtre: Filtre, langue: Language, maintenant: Date): Array<Tache> {
  const dossier = join(homedir(), 'Library', 'LaunchAgents')
  if (process.platform !== 'darwin' || !existsSync(dossier)) return []
  const charges = chargesLaunchd()
  const veilles = veillesDuMac(maintenant)
  const taches: Array<Tache> = []
  for (const fichier of readdirSync(dossier).filter((f) => f.endsWith('.plist'))) {
    let plist: Plist
    try {
      plist = JSON.parse(lancer('plutil', ['-convert', 'json', '-o', '-', join(dossier, fichier)]))
    } catch {
      continue
    }
    const label = plist.Label ?? fichier.replace(/\.plist$/, '')
    const horaire = horaireLaunchd(plist)
    // Sans filtre, seules les tâches planifiées entrent : pas les services qui tournent en permanence.
    if (!filtre.match.length && horaire.type === 'aucun') continue
    if (!retenue(label, filtre)) continue

    const journaux = [plist.StandardOutPath, plist.StandardErrorPath].filter((c): c is string => Boolean(c) && existsSync(c!))
    const recent = journaux.sort((a, b) => statSync(b).mtimeMs - statSync(a).mtimeMs)[0]
    const dernier = recent ? statSync(recent).mtime : null
    const charge = charges.get(label)
    const status: AgentStatus =
      !charge || plist.Disabled ? 'off' : charge.pid ? 'working' : etatAuRepos({ horaire, dernier, echec: charge.sortie !== 0, maintenant, veilles })

    taches.push({
      id: label,
      name: nomLisible(label),
      emoji: emojiPour(label),
      role: [plist.Program ?? plist.ProgramArguments?.join(' ')].filter(Boolean).join('').slice(0, 120) || undefined,
      status,
      lastMessage: (recent && derniereLigne(recent)) ?? (status === 'failed' ? `exit ${charge?.sortie}` : null),
      lastRun: iso(dernier),
      nextRun: iso(prochainPassage(horaire, maintenant, dernier)),
      schedule: decrire(horaire, langue) ?? undefined,
      source: 'launchd',
      cible: label,
    })
  }
  return taches
}

/* ——— cron ——— */

/** Les lignes de tâche d'une crontab : ni commentaires, ni variables d'environnement. */
export function lignesCrontab(texte: string): Array<{ expression: string; commande: string }> {
  const lignes: Array<{ expression: string; commande: string }> = []
  for (const brute of texte.split('\n')) {
    const ligne = brute.trim()
    if (!ligne || ligne.startsWith('#') || /^[A-Za-z_][A-Za-z0-9_]*\s*=/.test(ligne)) continue
    const champs = ligne.split(/\s+/)
    const raccourci = champs[0].startsWith('@')
    const expression = raccourci ? champs[0] : champs.slice(0, 5).join(' ')
    const commande = champs.slice(raccourci ? 1 : 5).join(' ')
    if (commande) lignes.push({ expression, commande })
  }
  return lignes
}

/** Le nom d'une commande de crontab : son script plutôt que l'interpréteur, sans les redirections. */
export function nomCommande(commande: string) {
  // La première étape qui n'est pas un `cd`, sans ses redirections.
  const etape = commande.split(/\s*(?:&&|;|\|\|)\s*/).find((e) => !/^cd\s/.test(e)) ?? commande
  const mots = etape
    .split(/\s*(?:>>?|2>&1|\|)\s*/)[0]
    .split(/\s+/)
    .filter(
      (m) =>
        !m.startsWith('-') &&
        !/^(cd|sudo|env|nice|bash|sh|zsh|node|bun|python3?|ruby|php|perl|npx|bunx|\/usr\/bin\/env)$/.test(m.split('/').at(-1)!),
    )
  return mots[0] ?? commande
}

export function lireCron(filtre: Filtre, langue: Language, maintenant: Date): Array<Tache> {
  let texte: string
  try {
    texte = lancer('crontab', ['-l'])
  } catch {
    return []
  }
  let processus = ''
  try {
    processus = lancer('ps', ['-Ao', 'command'])
  } catch {
    // Sans ps, personne n'est vu au travail.
  }
  const vus = new Map<string, number>()
  const taches: Array<Tache> = []
  for (const { expression, commande } of lignesCrontab(texte)) {
    if (!retenue(commande, filtre)) continue
    let horaire: Horaire
    try {
      horaire = horaireCron(expression)
    } catch {
      continue
    }
    const nom = nomCommande(commande)
    const base = `cron:${nom}`
    const rang = (vus.get(base) ?? 0) + 1
    vus.set(base, rang)
    // cron ne garde pas d'historique : on suppose que le dernier passage prévu a eu lieu.
    const dernier = passagePrecedent(horaire, maintenant)
    taches.push({
      id: rang > 1 ? `${base}#${rang}` : base,
      name: nomLisible(nom),
      emoji: emojiPour(commande),
      role: commande.slice(0, 120),
      status: processus.includes(commande.split(/\s*(?:>>?|2>&1|\|)/)[0]) ? 'working' : horaire.type === 'aucun' ? 'on-demand' : 'ok',
      lastRun: iso(dernier),
      nextRun: iso(prochainPassage(horaire, maintenant)),
      schedule: decrire(horaire, langue) ?? expression,
      source: 'cron',
      cible: commande,
    })
  }
  return taches
}

/* ——— systemd ——— */

/** Les propriétés d'une unité systemd de l'utilisateur, les dates en secondes Unix. */
function proprietes(unite: string, noms: Array<string>): Record<string, string> {
  const sortie = lancer('systemctl', ['--user', 'show', unite, '--timestamp=unix', ...noms.flatMap((n) => ['-p', n])])
  return Object.fromEntries(
    sortie
      .split('\n')
      .filter((l) => l.includes('='))
      .map((l) => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1)]),
  )
}

/** `@1696320900`, ou une date écrite en clair par un systemd plus ancien. */
function dateSystemd(valeur: string | undefined): Date | null {
  if (!valeur || valeur === 'n/a' || valeur === '0') return null
  if (valeur.startsWith('@')) return new Date(Number(valeur.slice(1)) * 1000)
  const d = new Date(valeur.replace(/^\w{3} /, '').replace(/ [A-Z]{2,5}$/, ''))
  return Number.isNaN(d.getTime()) ? null : d
}

export function lireSystemd(filtre: Filtre, langue: Language): Array<Tache> {
  if (process.platform !== 'linux') return []
  let liste: string
  try {
    liste = lancer('systemctl', ['--user', 'list-units', '--type=timer', '--all', '--no-legend', '--plain'])
  } catch {
    return []
  }
  const taches: Array<Tache> = []
  for (const timer of liste
    .split('\n')
    .map((l) => l.trim().split(/\s+/)[0])
    .filter((u) => u?.endsWith('.timer'))) {
    try {
      const t = proprietes(timer, ['Unit', 'NextElapseUSecRealtime', 'LastTriggerUSec', 'TimersCalendar'])
      const service = t.Unit || timer.replace(/\.timer$/, '.service')
      if (!retenue(service, filtre)) continue
      const s = proprietes(service, ['ActiveState', 'Result', 'ExecMainStatus', 'Description'])
      const dernier = dateSystemd(t.LastTriggerUSec)
      const calendrier = t.TimersCalendar?.match(/OnCalendar=([^;]+?)\s*;/)?.[1]
      const status: AgentStatus =
        s.ActiveState === 'activating' || s.ActiveState === 'active'
          ? 'working'
          : s.Result && s.Result !== 'success'
            ? 'failed'
            : dernier
              ? 'ok'
              : 'never'
      let message: string | null = null
      try {
        message = lancer('journalctl', ['--user', '-u', service, '-n', '1', '-o', 'cat', '--no-pager']).trim().slice(0, 140) || null
      } catch {
        // Pas de journal lisible.
      }
      taches.push({
        id: `systemd:${service}`,
        name: nomLisible(service.replace(/\.service$/, '')),
        emoji: emojiPour(service),
        role: s.Description || undefined,
        status,
        lastMessage: message,
        lastRun: iso(dernier),
        nextRun: iso(dateSystemd(t.NextElapseUSecRealtime)),
        schedule: calendrier ?? (langue === 'fr' ? 'timer systemd' : 'systemd timer'),
        source: 'systemd',
        cible: service,
      })
    } catch {
      continue
    }
  }
  return taches
}

/** Relance une tâche à la main : `launchctl kickstart` ou `systemctl start`. cron n'a pas d'équivalent. */
export function relancer(tache: Tache) {
  if (tache.source === 'launchd') lancer('launchctl', ['kickstart', `gui/${process.getuid?.() ?? 501}/${tache.cible}`])
  else if (tache.source === 'systemd') lancer('systemctl', ['--user', 'start', '--no-block', tache.cible])
  else throw new Error('cron jobs cannot be started from here')
}
