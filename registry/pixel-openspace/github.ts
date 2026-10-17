/*
 * La CI de ton projet dans la salle, sans rien écrire : `githubAgents()`
 * trouve le dépôt GitHub tout seul (sur Vercel, dans GitHub Actions, ou par
 * le remote `origin` en développement) et fait de chacun de ses workflows un
 * agent. À appeler côté serveur, dans une route d'API :
 *
 *   export async function GET() {
 *     return Response.json(await githubAgents())
 *   }
 *
 * Le serveur local (`npx pixel-openspace --github`) part des mêmes briques.
 */

import type { Agent, AgentRun, AgentStatus, Language } from './types'

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

export const EN_COURS = new Set(['queued', 'in_progress', 'waiting', 'requested', 'pending'])
export const RATES = new Set(['failure', 'timed_out', 'startup_failure'])

export const debutDuRun = (r: Run) => r.run_started_at ?? r.created_at

/** `owner/repo`, ou l'adresse d'un dépôt GitHub : `git@github.com:o/r.git`, `https://github.com/o/r`, `ssh://git@github.com/o/r.git`. */
export function depotDuRemote(url: string): Depot | null {
  const texte = url.trim()
  const m =
    texte.match(/^(?:https?:\/\/(?:[^@/]+@)?|ssh:\/\/git@|git@)github\.com[:/]([\w.-]+)\/([\w.-]+?)(?:\.git)?\/?$/) ??
    texte.match(/^([\w.-]+)\/([\w.-]+?)(?:\.git)?\/?$/)
  return m ? { proprietaire: m[1], nom: m[2] } : null
}

/* Les déclencheurs d'un travail en cours sur une autre branche. */
const D_UNE_BRANCHE = new Set(['pull_request', 'pull_request_target', 'push'])

/**
 * Les runs d'un workflow qui disent son état : pas ceux des pull requests ni
 * des pushes sur une autre branche que celle par défaut, pour qu'un travail en
 * cours ne mette pas son bureau en échec. Une release, un cron ou un lancement
 * à la main comptent toujours (une release porte le nom de son tag, pas celui
 * de la branche). Tous, s'il ne reste rien : un workflow de pull requests.
 */
export function runsQuiComptent(runs: Array<Run>, brancheParDefaut: string): Array<Run> {
  const principaux = runs.filter((r) => r.head_branch === brancheParDefaut || !D_UNE_BRANCHE.has(r.event))
  return principaux.length ? principaux : runs
}

const EMOJIS: Array<[RegExp, string]> = [
  [/deploy|release|publi|ship/i, '🚀'],
  [/test|ci\b|check|build/i, '🧪'],
  [/lint|format|style/i, '🧹'],
  [/codeql|secur|audit|scan|depend/i, '🔍'],
  [/doc|site|pages/i, '📚'],
  [/backup|dump|sauvegard/i, '💾'],
]

/** Un workflow à son bureau, d'après ses runs (le plus récent en premier). Sans son horaire : il ne sait pas être en retard. */
export function agentDuWorkflow(depot: Depot, workflow: Workflow, runs: Array<Run>, langue: Language, maintenant = new Date()): Agent {
  const dernier = runs[0]
  const status: AgentStatus =
    workflow.state !== 'active'
      ? 'off'
      : !dernier
        ? 'never'
        : EN_COURS.has(dernier.status)
          ? 'working'
          : RATES.has(dernier.conclusion ?? '')
            ? 'failed'
            : 'ok'
  const minuit = new Date(maintenant)
  minuit.setHours(0, 0, 0, 0)
  // Les passages terminés d'aujourd'hui, du plus ancien au plus récent, pour la frise.
  const runsDuJour: Array<AgentRun> = runs
    .filter((r) => r.status === 'completed' && Date.parse(debutDuRun(r)) >= minuit.getTime())
    .reverse()
    .map((r) => ({ at: debutDuRun(r), ok: !RATES.has(r.conclusion ?? ''), message: r.display_title }))
  const nom = workflow.name || workflow.path.split('/').at(-1)!
  return {
    id: `github:${depot.proprietaire}/${depot.nom}/${workflow.path}`,
    name: nom,
    emoji: EMOJIS.find(([motif]) => motif.test(`${nom} ${workflow.path}`))?.[1] ?? '⚙️',
    role: `${depot.proprietaire}/${depot.nom} · ${workflow.path}`,
    status,
    lastMessage: dernier ? `${dernier.display_title}${RATES.has(dernier.conclusion ?? '') ? ` · ${dernier.conclusion}` : ''}` : null,
    lastRun: dernier ? debutDuRun(dernier) : null,
    schedule: dernier ? (langue === 'fr' ? `sur ${dernier.event}` : `on ${dernier.event}`) : undefined,
    runs: runsDuJour,
  }
}

export class LimiteAtteinte extends Error {}

/** Un client de l'API GitHub qui garde l'ETag et le corps de chaque réponse : une réponse inchangée revient en 304, sans compter dans la limite. */
export function clientGithub(jeton: string | null | undefined) {
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
      cache: 'no-store',
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

/** Le workflow et ses runs qui comptent, pour chaque workflow d'un dépôt. */
export async function lireWorkflows(lire: ReturnType<typeof clientGithub>, d: Depot) {
  const { default_branch } = await lire<{ default_branch: string }>(`/repos/${d.proprietaire}/${d.nom}`)
  const base = `/repos/${d.proprietaire}/${d.nom}/actions`
  const { workflows } = await lire<{ workflows: Array<Workflow> }>(`${base}/workflows?per_page=100`)
  const { workflow_runs } = await lire<{ workflow_runs: Array<Run> }>(`${base}/runs?per_page=100`)
  return workflows.map((workflow) => ({
    workflow,
    runs: runsQuiComptent(
      workflow_runs.filter((r) => r.workflow_id === workflow.id),
      default_branch,
    ),
  }))
}

/* ——— githubAgents ——— */

export type GithubAgentsOptions = {
  /** `owner/repo`, ou plusieurs. Par défaut, le dépôt du projet : sur Vercel, dans GitHub Actions, ou le remote `origin` en développement. */
  repo?: string | Array<string>
  /** Par défaut `GITHUB_TOKEN`, puis `GH_TOKEN`. Facultatif pour un dépôt public, mais GitHub n'accorde alors que 60 requêtes par heure. */
  token?: string
  /** La langue des déclencheurs : « on push », « sur push ». */
  language?: Language
  /** Combien de secondes garder la réponse : 60 avec un jeton, 300 sans, par défaut. */
  cacheSeconds?: number
}

/** Le dépôt GitHub du projet, sans qu'on ait à le dire. */
async function depotDuProjet(): Promise<Depot> {
  const env = process.env
  if (env.GITHUB_REPOSITORY) {
    const d = depotDuRemote(env.GITHUB_REPOSITORY)
    if (d) return d
  }
  if (env.VERCEL_GIT_PROVIDER === 'github' && env.VERCEL_GIT_REPO_OWNER && env.VERCEL_GIT_REPO_SLUG) {
    return { proprietaire: env.VERCEL_GIT_REPO_OWNER, nom: env.VERCEL_GIT_REPO_SLUG }
  }
  try {
    // En développement : le remote du dossier. Importé à la demande, pour ne rien coûter ailleurs.
    const { execFileSync } = await import('node:child_process')
    const url = execFileSync('git', ['remote', 'get-url', 'origin'], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
      timeout: 5000,
    })
    const d = depotDuRemote(url)
    if (d) return d
  } catch {
    // Pas de git ici.
  }
  throw new Error('pixel-openspace: could not find the GitHub repository of this project; pass githubAgents({ repo: "owner/repo" })')
}

const clients = new Map<string, ReturnType<typeof clientGithub>>()
const reponses = new Map<string, { lu: number; agents: Array<Agent> }>()

/**
 * Les workflows GitHub Actions du projet, un agent chacun : au travail pendant
 * un run, en échec après un échec, à jour sinon, éteint s'il est désactivé.
 * Les runs de la branche par défaut comptent d'abord ; ceux du jour vont sur
 * la frise. Côté serveur seulement : le jeton ne doit pas partir au navigateur.
 */
export async function githubAgents(options: GithubAgentsOptions = {}): Promise<Array<Agent>> {
  const jeton = options.token ?? process.env.GITHUB_TOKEN ?? process.env.GH_TOKEN ?? null
  const depots = options.repo
    ? [options.repo].flat().map((r) => {
        const d = depotDuRemote(r)
        if (!d) throw new Error(`pixel-openspace: not a GitHub repository: "${r}", expected owner/repo`)
        return d
      })
    : [await depotDuProjet()]
  const duree = (options.cacheSeconds ?? (jeton ? 60 : 300)) * 1000
  const cle = `${jeton ?? ''}|${options.language ?? 'en'}|${depots.map((d) => `${d.proprietaire}/${d.nom}`).join(',')}`
  const enCache = reponses.get(cle)
  if (enCache && Date.now() - enCache.lu < duree) return enCache.agents

  const cleClient = jeton ?? ''
  if (!clients.has(cleClient)) clients.set(cleClient, clientGithub(jeton))
  const lire = clients.get(cleClient)!
  const maintenant = new Date()
  try {
    const parDepot = await Promise.all(
      depots.map(async (d) =>
        (await lireWorkflows(lire, d)).map(({ workflow, runs }) =>
          agentDuWorkflow(d, workflow, runs, options.language ?? 'en', maintenant),
        ),
      ),
    )
    const agents = parDepot.flat()
    reponses.set(cle, { lu: Date.now(), agents })
    return agents
  } catch (erreur) {
    // Une limite atteinte ou un réseau qui flanche : la salle garde ce qu'elle savait, s'il y a quelque chose.
    if (enCache) return enCache.agents
    throw erreur
  }
}
