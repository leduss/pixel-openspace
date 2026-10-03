/*
 * npx pixel-openspace : lit les tâches planifiées de la machine et ouvre leur
 * open space dans le navigateur. Le serveur n'écoute que sur 127.0.0.1 ; il
 * sert la page, l'état des tâches toutes les quelques secondes, et, si on
 * l'y autorise, relance une tâche à la main.
 */

import { spawn } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { createServer } from 'node:http'
import { homedir } from 'node:os'
import { dirname, extname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { parseArgs } from 'node:util'
import type { Agent, Language, ThemeName, WallTile } from '../../registry/pixel-openspace/types'
import paquet from '../package.json'
import { suivreMeteo } from './meteo'
import { lireCron, lireLaunchd, lireSystemd, relancer, type Filtre, type Source, type Tache } from './sources'

/** Le fichier de réglages, tout optionnel. */
export type Reglages = {
  title?: string
  /** La météo derrière la fenêtre du chef : une ville ou « latitude,longitude ». */
  weather?: string
  language?: Language
  theme?: ThemeName
  sources?: Array<Source>
  match?: Array<string>
  exclude?: Array<string>
  allowRun?: boolean
  port?: number
  /** Par identifiant de tâche : un autre nom, un autre emoji, une description, ou la cacher. */
  agents?: Record<string, { name?: string; emoji?: string; role?: string; hidden?: boolean; staleAfterHours?: number }>
}

const AIDE = `pixel-openspace ${paquet.version}
Your scheduled jobs as pixel-art workers in an open space.

Usage: npx pixel-openspace [options]

Reads launchd agents (macOS), your crontab, and systemd user timers (Linux),
then opens the open space in your browser.

Options:
  -p, --port <n>        Port to listen on, on 127.0.0.1 (default 4747)
  -m, --match <text>    Only show jobs whose name contains this text (repeatable)
  -x, --exclude <text>  Hide jobs whose name contains this text (repeatable)
  -t, --theme <name>    geek, eighties, gym or modern (default geek)
  -l, --lang <en|fr>    Language of the room (default: from your system)
      --title <text>    The name on the wall
  -w, --weather <place> Real weather behind the lead's window: a city or "lat,lon" (Open-Meteo)
      --config <file>   Settings file (default ./pixel-openspace.json, then ~/.config/pixel-openspace/config.json)
      --allow-run       Let the Run button start a job (launchctl kickstart / systemctl start)
      --json            Print the jobs as JSON and exit
      --no-open         Do not open the browser
  -h, --help            Show this help
  -v, --version         Show the version
`

function lireReglages(chemin: string | undefined): Reglages {
  const candidats = chemin
    ? [resolve(chemin)]
    : [resolve('pixel-openspace.json'), join(homedir(), '.config', 'pixel-openspace', 'config.json')]
  for (const c of candidats) {
    if (existsSync(c)) return JSON.parse(readFileSync(c, 'utf8')) as Reglages
  }
  if (chemin) throw new Error(`settings file not found: ${chemin}`)
  return {}
}

/** La langue du système, à défaut d'en avoir choisi une. */
function langueSysteme(): Language {
  const locale = process.env.LC_ALL || process.env.LC_MESSAGES || process.env.LANG || Intl.DateTimeFormat().resolvedOptions().locale
  return locale.toLowerCase().startsWith('fr') ? 'fr' : 'en'
}

/** Toutes les tâches, réglages appliqués. */
export function collecter(reglages: Reglages, langue: Language, maintenant = new Date()): Array<Tache> {
  const filtre: Filtre = { match: reglages.match ?? [], exclude: reglages.exclude ?? [] }
  const sources = reglages.sources ?? ['launchd', 'cron', 'systemd']
  const lecteurs = { launchd: lireLaunchd, cron: lireCron, systemd: lireSystemd }
  const taches = sources.flatMap((s) => {
    try {
      return lecteurs[s](filtre, langue, maintenant)
    } catch (erreur) {
      console.error(`pixel-openspace: could not read ${s}: ${(erreur as Error).message}`)
      return []
    }
  })
  return taches
    .filter((t) => !reglages.agents?.[t.id]?.hidden)
    .map((t) => {
      const surcharge = { ...reglages.agents?.[t.id] }
      delete surcharge.hidden
      return { ...t, ...surcharge }
    })
    .sort((a, b) => a.name.localeCompare(b.name))
}

/** Le grand écran : le nombre de tâches, celles qui tournent, celles qui plantent, celles en retard. */
function mur(taches: Array<Tache>, langue: Language): Array<WallTile> {
  const fr = langue === 'fr'
  const compte = (s: Tache['status']) => taches.filter((t) => t.status === s).length
  return [
    { label: fr ? 'Tâches' : 'Jobs', value: taches.length, tone: 'info' },
    { label: fr ? 'En cours' : 'Running', value: compte('working'), tone: 'ok' },
    { label: fr ? 'En échec' : 'Failed', value: compte('failed'), tone: compte('failed') ? 'alert' : 'neutral' },
    { label: fr ? 'En retard' : 'Late', value: compte('late'), tone: compte('late') ? 'warn' : 'neutral' },
  ]
}

/** Ce que la page voit d'une tâche : l'Agent, sans la commande qui la relance. */
function versAgent(tache: Tache): Agent {
  const agent: Partial<Tache> = { ...tache }
  delete agent.source
  delete agent.cible
  return agent as Agent
}

const TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
}

function ouvrir(url: string) {
  const commande = process.platform === 'darwin' ? 'open' : process.platform === 'win32' ? 'cmd' : 'xdg-open'
  const args = process.platform === 'win32' ? ['/c', 'start', '', url] : [url]
  spawn(commande, args, { stdio: 'ignore', detached: true })
    .on('error', () => {})
    .unref()
}

function principal() {
  const { values: o } = parseArgs({
    options: {
      port: { type: 'string', short: 'p' },
      match: { type: 'string', short: 'm', multiple: true },
      exclude: { type: 'string', short: 'x', multiple: true },
      theme: { type: 'string', short: 't' },
      lang: { type: 'string', short: 'l' },
      title: { type: 'string' },
      config: { type: 'string' },
      'allow-run': { type: 'boolean' },
      json: { type: 'boolean' },
      weather: { type: 'string', short: 'w' },
      'no-open': { type: 'boolean' },
      help: { type: 'boolean', short: 'h' },
      version: { type: 'boolean', short: 'v' },
    },
  })
  if (o.help) return console.log(AIDE)
  if (o.version) return console.log(paquet.version)

  const fichier = lireReglages(o.config)
  const reglages: Reglages = {
    ...fichier,
    match: o.match ?? fichier.match,
    exclude: o.exclude ?? fichier.exclude,
    theme: (o.theme as ThemeName | undefined) ?? fichier.theme,
    language: (o.lang as Language | undefined) ?? fichier.language,
    title: o.title ?? fichier.title,
    weather: o.weather ?? fichier.weather,
    allowRun: o['allow-run'] ?? fichier.allowRun ?? false,
  }
  const langue = reglages.language ?? langueSysteme()

  if (o.json) return console.log(JSON.stringify(collecter(reglages, langue), null, 2))

  const meteo = reglages.weather ? suivreMeteo(reglages.weather, langue) : null
  const page = join(dirname(fileURLToPath(import.meta.url)), 'app')
  const port = Number(o.port ?? reglages.port ?? 4747)
  // Lire launchd prend un instant par tâche : l'état est gardé deux secondes.
  let cache: { quand: number; taches: Array<Tache> } | null = null
  const taches = () => {
    if (!cache || Date.now() - cache.quand > 2000) cache = { quand: Date.now(), taches: collecter(reglages, langue) }
    return cache.taches
  }

  const serveur = createServer((req, res) => {
    const url = new URL(req.url ?? '/', 'http://localhost')
    if (url.pathname === '/api/state' && req.method === 'GET') {
      const liste = taches()
      res.writeHead(200, { 'content-type': 'application/json', 'cache-control': 'no-store' })
      return res.end(
        JSON.stringify({
          title: reglages.title ?? (langue === 'fr' ? 'MES TÂCHES' : 'MY JOBS'),
          language: langue,
          theme: reglages.theme ?? 'geek',
          allowRun: reglages.allowRun,
          agents: liste.map(versAgent),
          wall: mur(liste, langue),
          weather: meteo?.lire() ?? null,
        }),
      )
    }
    const relance = url.pathname.match(/^\/api\/run\/(.+)$/)
    if (relance && req.method === 'POST') {
      // L'en-tête maison oblige un autre site à demander la permission (CORS), qu'il n'obtiendra pas.
      if (!reglages.allowRun || req.headers['x-pixel-openspace'] !== '1') {
        res.writeHead(403)
        return res.end()
      }
      const tache = taches().find((t) => t.id === decodeURIComponent(relance[1]))
      try {
        if (!tache) throw new Error('unknown job')
        relancer(tache)
        cache = null
        res.writeHead(204)
        return res.end()
      } catch (erreur) {
        res.writeHead(400, { 'content-type': 'text/plain' })
        return res.end((erreur as Error).message)
      }
    }
    const fichierPage = url.pathname === '/' ? 'index.html' : url.pathname.slice(1)
    if (!/^[\w.-]+$/.test(fichierPage) || !existsSync(join(page, fichierPage))) {
      res.writeHead(404)
      return res.end()
    }
    res.writeHead(200, { 'content-type': TYPES[extname(fichierPage)] ?? 'application/octet-stream' })
    res.end(readFileSync(join(page, fichierPage)))
  })

  serveur.on('error', (erreur: NodeJS.ErrnoException) => {
    console.error(erreur.code === 'EADDRINUSE' ? `pixel-openspace: port ${port} is busy, try --port ${port + 1}` : erreur.message)
    process.exit(1)
  })
  serveur.listen(port, '127.0.0.1', () => {
    const adresse = `http://127.0.0.1:${port}`
    const n = taches().length
    console.log(`pixel-openspace ${paquet.version}: ${n} job${n === 1 ? '' : 's'} at ${adresse}`)
    if (!n) console.log('No scheduled job found. Try --match <text> to include services, or check your crontab.')
    if (!o['no-open']) ouvrir(adresse)
  })
}

principal()
