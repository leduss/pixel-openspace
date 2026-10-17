/*
 * La carte de README : la salle d'un dépôt GitHub en image SVG animée.
 *
 *   ![office](https://pixel-openspace.vercel.app/api/card?repo=owner/repo)
 *
 * Chaque workflow GitHub Actions du dépôt à son bureau, à jour. La réponse est
 * gardée cinq minutes par le CDN, pour ménager l'API GitHub.
 */

import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { githubAgents } from '@/registry/pixel-openspace/github'
import { LANGUES, THEMES } from '@/registry/pixel-openspace/preferences'
import type { Columns, Language, ThemeName } from '@/registry/pixel-openspace/types'

type Rendu = typeof import('@/carte/rendu')

/* Le rendu est construit à part (bun run carte:build) : Next.js n'accepte pas react-dom/server dans une route. */
let rendu: Promise<Rendu> | null = null
const chargerRendu = () =>
  (rendu ??= import(/* turbopackIgnore: true */ pathToFileURL(path.join(process.cwd(), 'src/carte/dist/rendu.mjs')).href) as Promise<Rendu>)

const svg = (corps: string, secondes: number) =>
  new Response(corps, {
    headers: {
      'content-type': 'image/svg+xml; charset=utf-8',
      'cache-control': `public, max-age=${secondes}, s-maxage=${secondes}, stale-while-revalidate=${secondes * 2}`,
    },
  })

export async function GET(requete: Request) {
  const { searchParams: p } = new URL(requete.url)
  const { rendreCarte, rendreMessage } = await chargerRendu()
  const repo = p.get('repo')
  if (!repo) return svg(rendreMessage('Add ?repo=owner/repo to the address.'), 3600)
  const theme = THEMES.includes(p.get('theme') as ThemeName) ? (p.get('theme') as ThemeName) : 'geek'
  const langue = LANGUES.includes(p.get('lang') as Language) ? (p.get('lang') as Language) : 'en'
  const colonnes = ([4, 5, 6] as Array<Columns>).find((c) => String(c) === p.get('cols')) ?? 5
  try {
    const agents = await githubAgents({ repo, language: langue, cacheSeconds: 300 })
    if (!agents.length) return svg(rendreMessage(`${repo} has no GitHub Actions workflow.`), 300)
    return svg(
      rendreCarte({ agents, titre: p.get('title')?.slice(0, 24) || repo.split('/').at(-1)!.toUpperCase(), theme, langue, colonnes }),
      300,
    )
  } catch (erreur) {
    return svg(rendreMessage((erreur as Error).message.replace(/^pixel-openspace: /, '')), 60)
  }
}
