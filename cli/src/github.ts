/*
 * Les workflows GitHub Actions d'un dépôt, chacun à son bureau : au travail
 * pendant un run, en échec après un échec, à jour sinon, éteint s'il est
 * désactivé. Son horaire vient du `schedule:` du workflow, en temps
 * universel ; ses passages du jour nourrissent la frise.
 *
 * L'API est lue en arrière-plan, comme la météo : toutes les minutes avec un
 * jeton, toutes les cinq minutes sans (GitHub n'accorde alors que 60 requêtes
 * par heure). Chaque réponse garde son ETag : une réponse inchangée revient en
 * 304, sans compter dans la limite.
 */

import { execFileSync } from 'node:child_process'
import type { AgentRun, AgentStatus, Language } from '../../registry/pixel-openspace/types'
import { decrire, horaireCron, prochainPassage, type Calendrier, type Horaire } from './horaire'
import { emojiPour, etatAuRepos, retenue, type Filtre, type Tache } from './sources'

export type Depot = { proprietaire: string; nom: string }

/** Un workflow, tel que l'API le liste. */
export type Workflow = { id: number; name: string; path: string; state: string; updated_at: string }

/** Un run, réduit à ce que la salle en montre. */
export type Run = {
  workflow_id: number
  status: string
  conclusion: string | null
  display_title: string
  event: string
  head_branch: string | null
  created_at: string
  run_started_at?: string | null
}

/** `owner/repo`, une adresse github.com, ou `.` pour le dépôt du dossier courant. */
export function lireDepot(texte: string, dossier = process.cwd()): Depot {
  if (texte.trim() === '.') return depotCourant(dossier)
  const depot = depotDuRemote(texte) ?? depotNu(texte)
  if (!depot) throw new Error(`not a GitHub repository: "${texte}", expected owner/repo`)
  return depot
}

function depotNu(texte: string): Depot | null {
  const m = texte
    .trim()
    .replace(/\.git$|\/$/g, '')
    .match(/^([\w.-]+)\/([\w.-]+)$/)
  return m ? { proprietaire: m[1], nom: m[2] } : null
}

/** Le dépôt d'une adresse de remote GitHub : `git@github.com:o/r.git`, `https://github.com/o/r`, `ssh://git@github.com/o/r.git`. */
export function depotDuRemote(url: string): Depot | null {
  const m = url.trim().match(/^(?:https?:\/\/(?:[^@/]+@)?|ssh:\/\/git@|git@)github\.com[:/]([\w.-]+)\/([\w.-]+?)(?:\.git)?\/?$/)
  return m ? { proprietaire: m[1], nom: m[2] } : null
}

/** Le dépôt GitHub du dossier courant, lu dans son remote `origin`. */
export function depotCourant(dossier: string): Depot {
  let url: string
  try {
    url = execFileSync('git', ['remote', 'get-url', 'origin'], {
      cwd: dossier,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
      timeout: 5000,
    })
  } catch {
    throw new Error('--github without a repository needs a git repository with an "origin" remote here; or pass owner/repo')
  }
  const depot = depotDuRemote(url)
  if (!depot) throw new Error(`the "origin" remote is not on GitHub (${url.trim()}); pass owner/repo`)
  return depot
}

/** Un `--github` (ou `-g`) sans dépôt derrière lui veut dire « le dépôt d'ici » : `parseArgs` le lit alors `--github=.`. */
export function githubSansValeur(args: Array<string>): Array<string> {
  return args.map((a, i) => ((a === '--github' || a === '-g') && (i === args.length - 1 || args[i + 1].startsWith('-')) ? '--github=.' : a))
}

/** Les expressions `cron:` du `schedule:` d'un workflow, sans lire tout le YAML. */
export function cronsDuWorkflow(yaml: string): Array<string> {
  return [...yaml.matchAll(/^\s*-?\s*cron:\s*(['"]?)([^'"#\n]+?)\1\s*(?:#.*)?$/gm)].map((m) => m[2].trim())
}

/**
 * Les runs d'un workflow qui disent son état : ceux de la branche par défaut,
 * pour qu'une pull request cassée ne mette pas son bureau en échec ; tous, s'il
 * n'y a jamais tourné (un workflow de pull requests).
 */
export function runsQuiComptent(runs: Array<Run>, brancheParDefaut: string): Array<Run> {
  const principaux = runs.filter((r) => r.head_branch === brancheParDefaut)
  return principaux.length ? principaux : runs
}

/** Toutes les expressions d'un workflow en un seul horaire, en temps universel. */
export function horaireDuWorkflow(crons: Array<string>): Horaire {
  const calendriers: Array<Calendrier> = []
  for (const c of crons) {
    try {
      const h = horaireCron(c, true)
      if (h.type === 'calendrier') calendriers.push(...h.calendriers)
    } catch {
      // Une expression illisible n'empêche pas les autres.
    }
  }
  return calendriers.length ? { type: 'calendrier', calendriers, utc: true } : { type: 'aucun' }
}

const EN_COURS = new Set(['queued', 'in_progress', 'waiting', 'requested', 'pending'])
const RATES = new Set(['failure', 'timed_out', 'startup_failure'])
/* GitHub retarde souvent ses crons de plusieurs minutes aux heures chargées : trois quarts d'heure avant de dire « en retard ». */
const GRACE_GITHUB = 45 * 60_000

const debutDuRun = (r: Run) => r.run_started_at ?? r.created_at

/** L'état d'un workflow d'après ses runs, le plus récent en premier. */
export function etatDuWorkflow(workflow: Workflow, runs: Array<Run>, horaire: Horaire, maintenant: Date): AgentStatus {
  if (workflow.state !== 'active') return 'off'
  const dernier = runs[0]
  if (!dernier) return horaire.type === 'aucun' ? 'on-demand' : 'never'
  if (EN_COURS.has(dernier.status)) return 'working'
  const echec = RATES.has(dernier.conclusion ?? '')
  // Sans horaire, un workflow qui a réussi est à jour : il attend le prochain push.
  if (horaire.type === 'aucun') return echec ? 'failed' : 'ok'
  return etatAuRepos({ horaire, dernier: new Date(debutDuRun(dernier)), echec, maintenant, grace: GRACE_GITHUB })
}

/** Un workflow à son bureau. `runs` : les siens, le plus récent en premier. */
export function versTache(
  depot: Depot,
  workflow: Workflow,
  runs: Array<Run>,
  crons: Array<string>,
  langue: Language,
  maintenant: Date,
): Tache {
  const horaire = horaireDuWorkflow(crons)
  const status = etatDuWorkflow(workflow, runs, horaire, maintenant)
  const minuit = new Date(maintenant)
  minuit.setHours(0, 0, 0, 0)
  const dernier = runs[0]
  // Les passages terminés d'aujourd'hui, du plus ancien au plus récent, pour la frise.
  const duJour: Array<AgentRun> = runs
    .filter((r) => r.status === 'completed' && Date.parse(debutDuRun(r)) >= minuit.getTime())
    .reverse()
    .map((r) => ({ at: debutDuRun(r), ok: !RATES.has(r.conclusion ?? ''), message: r.display_title }))
  const fr = langue === 'fr'
  // Un engrenage plutôt qu'un robot, quand le nom ne dit rien.
  const devine = emojiPour(`${workflow.name} ${workflow.path}`)
  const emoji = devine === '🤖' ? '⚙️' : devine
  const declencheur = dernier ? (fr ? `sur ${dernier.event}` : `on ${dernier.event}`) : undefined
  return {
    id: `github:${depot.proprietaire}/${depot.nom}/${workflow.path}`,
    name: workflow.name || workflow.path.split('/').at(-1)!,
    emoji,
    role: `${depot.proprietaire}/${depot.nom} · ${workflow.path}`,
    status,
    lastMessage: dernier
      ? `${dernier.display_title}${dernier.conclusion && RATES.has(dernier.conclusion) ? ` · ${dernier.conclusion}` : ''}`
      : null,
    lastRun: dernier ? debutDuRun(dernier) : null,
    nextRun: prochainPassage(horaire, maintenant)?.toISOString() ?? null,
    schedule: decrire(horaire, langue) ?? declencheur,
    runs: duJour,
    source: 'github',
    cible: String(workflow.id),
  }
}

/** Le jeton GitHub : la variable d'environnement, ou celui de `gh` s'il est connecté. */
export function jetonGithub(): string | null {
  const env = process.env.GITHUB_TOKEN || process.env.GH_TOKEN
  if (env) return env
  try {
    return execFileSync('gh', ['auth', 'token'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], timeout: 5000 }).trim() || null
  } catch {
    return null
  }
}

class LimiteAtteinte extends Error {}

/** Un client de l'API qui garde l'ETag et le corps de chaque réponse. */
function client(jeton: string | null) {
  const caches = new Map<string, { etag: string; corps: unknown }>()
  return async function lire<T>(chemin: string, brut = false): Promise<T> {
    const enCache = caches.get(chemin)
    const reponse = await fetch(`https://api.github.com${chemin}`, {
      headers: {
        accept: brut ? 'application/vnd.github.raw+json' : 'application/vnd.github+json',
        'x-github-api-version': '2022-11-28',
        'user-agent': 'pixel-openspace',
        ...(jeton ? { authorization: `Bearer ${jeton}` } : {}),
        ...(enCache ? { 'if-none-match': enCache.etag } : {}),
      },
      signal: AbortSignal.timeout(15_000),
    })
    if (reponse.status === 304 && enCache) return enCache.corps as T
    if ((reponse.status === 403 || reponse.status === 429) && reponse.headers.get('x-ratelimit-remaining') === '0') {
      const reprise = new Date(Number(reponse.headers.get('x-ratelimit-reset')) * 1000)
      throw new LimiteAtteinte(`GitHub rate limit reached until ${reprise.toLocaleTimeString()}`)
    }
    if (reponse.status === 404) throw new Error(`${chemin.split('/').slice(2, 4).join('/')} not found (or private: set GITHUB_TOKEN)`)
    if (!reponse.ok) throw new Error(`GitHub answered ${reponse.status} for ${chemin}`)
    const corps = brut ? await reponse.text() : await reponse.json()
    const etag = reponse.headers.get('etag')
    if (etag) caches.set(chemin, { etag, corps })
    return corps as T
  }
}

/**
 * Suit les workflows de quelques dépôts en arrière-plan. `lire()` rend les
 * dernières tâches connues ; `pret` se résout après la première lecture,
 * réussie ou non.
 */
export function suivreGithub(depots: Array<Depot>, filtre: Filtre, langue: Language, jeton = jetonGithub()) {
  const lire = client(jeton)
  const intervalle = jeton ? 60_000 : 5 * 60_000
  let taches: Array<Tache> = []
  // Le schedule de chaque workflow, relu quand le workflow change.
  const crons = new Map<string, { version: string; crons: Array<string> }>()
  // Le dernier run des workflows qui n'ont pas tourné récemment, relu une fois par demi-heure.
  const anciens = new Map<string, { lu: number; runs: Array<Run> }>()
  let limiteSignalee = false

  const lireDepot = async (d: Depot, maintenant: Date): Promise<Array<Tache>> => {
    const base = `/repos/${d.proprietaire}/${d.nom}/actions`
    const { default_branch } = await lire<{ default_branch: string }>(`/repos/${d.proprietaire}/${d.nom}`)
    const { workflows } = await lire<{ workflows: Array<Workflow> }>(`${base}/workflows?per_page=100`)
    const { workflow_runs } = await lire<{ workflow_runs: Array<Run> }>(`${base}/runs?per_page=100`)
    const resultat: Array<Tache> = []
    for (const w of workflows) {
      if (!retenue(`${w.name} ${w.path}`, filtre)) continue
      const cle = `${d.proprietaire}/${d.nom}/${w.path}`
      let runs = runsQuiComptent(
        workflow_runs.filter((r) => r.workflow_id === w.id),
        default_branch,
      )
      if (!runs.length && w.state === 'active') {
        const ancien = anciens.get(cle)
        if (!ancien || maintenant.getTime() - ancien.lu > 30 * 60_000) {
          const { workflow_runs: les } = await lire<{ workflow_runs: Array<Run> }>(`${base}/workflows/${w.id}/runs?per_page=1`)
          anciens.set(cle, { lu: maintenant.getTime(), runs: les })
        }
        runs = anciens.get(cle)!.runs
      }
      // Seuls les workflows que GitHub a déjà lancés sur horaire ont un schedule à lire : les autres ne coûtent pas de requête.
      const planifie = runs.some((r) => r.event === 'schedule')
      let horaire = crons.get(cle)
      if (!horaire || horaire.version !== `${w.updated_at}:${planifie}`) {
        // Les workflows dynamiques (CodeQL, Dependabot…) n'ont pas de fichier à lire.
        const yaml =
          planifie && w.path.startsWith('.github/workflows/')
            ? await lire<string>(`/repos/${d.proprietaire}/${d.nom}/contents/${w.path}`, true).catch(() => '')
            : ''
        horaire = { version: `${w.updated_at}:${planifie}`, crons: cronsDuWorkflow(yaml) }
        crons.set(cle, horaire)
      }
      resultat.push(versTache(d, w, runs, horaire.crons, langue, maintenant))
    }
    return resultat
  }

  const rafraichir = async () => {
    const maintenant = new Date()
    const lus = await Promise.all(
      depots.map(async (d) => {
        try {
          return await lireDepot(d, maintenant)
        } catch (erreur) {
          if (erreur instanceof LimiteAtteinte) {
            if (!limiteSignalee) console.error(`pixel-openspace: ${erreur.message}${jeton ? '' : '; set GITHUB_TOKEN to raise it'}`)
            limiteSignalee = true
          } else console.error(`pixel-openspace: could not read GitHub ${d.proprietaire}/${d.nom}: ${(erreur as Error).message}`)
          // Faute de mieux, la salle garde ce qu'elle savait de ce dépôt.
          return taches.filter((t) => t.id.startsWith(`github:${d.proprietaire}/${d.nom}/`))
        }
      }),
    )
    taches = lus.flat()
  }

  const pret = rafraichir()
  setInterval(() => void rafraichir(), intervalle).unref()
  return { lire: () => taches, pret, jeton: Boolean(jeton) }
}
