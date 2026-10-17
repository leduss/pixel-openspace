/*
 * La salle en image, pour les README : la même scène que le composant, rendue
 * en SVG côté serveur, chacun à son bureau. Les animations du décor y sont des
 * `<animate>` natifs : l'image bouge sans JavaScript, et GitHub la sert telle
 * quelle.
 *
 * Next.js refuse `react-dom/server` dans une route, et n'y verrait les
 * composants `'use client'` de la salle que comme des références : ce fichier
 * est construit à part par Bun (`bun run carte:build`), et la route le charge
 * à l'exécution.
 */

import { renderToStaticMarkup } from 'react-dom/server'
import { THEMES, ThemeContexte } from '../../registry/pixel-openspace/contexte'
import { EcranMural, Fenetre, Horloge, TableauBlanc } from '../../registry/pixel-openspace/decor'
import { CHEF_ID, LARGEUR, plan } from '../../registry/pixel-openspace/engine'
import { Fetes } from '../../registry/pixel-openspace/festivities'
import { TEXTS } from '../../registry/pixel-openspace/i18n'
import { Annonce, Personnage, Poste } from '../../registry/pixel-openspace/people'
import { DefsCommunes, ExportSvgContexte, TextesContexte } from '../../registry/pixel-openspace/primitives'
import { fete } from '../../registry/pixel-openspace/seasons'
import type { Agent, Columns, Language, ThemeName } from '../../registry/pixel-openspace/types'
import { bientot, chefDecor, ecranParDefaut, posesAuBureau, prochainsPassages, versVue } from '../../registry/pixel-openspace/vue'

export type OptionsCarte = {
  agents: Array<Agent>
  titre: string
  theme?: ThemeName
  langue?: Language
  colonnes?: Columns
  maintenant?: number
}

/** La police de la salle quand elle est là, une police à chasse fixe sinon : une image ne charge pas de police. */
const POLICE = "'Pixelify Sans', ui-monospace, 'SFMono-Regular', Menlo, monospace"

/** La salle, en SVG autonome. */
export function rendreCarte({
  agents,
  titre,
  theme: nomTheme = 'geek',
  langue = 'en',
  colonnes = 5,
  maintenant = Date.now(),
}: OptionsCarte): string {
  const t = TEXTS[langue] ?? TEXTS.en
  const theme = THEMES[nomTheme] ?? THEMES.geek
  const chef = versVue(chefDecor(t), CHEF_ID)
  const vues = agents.map((a) => versVue(a))
  const lePlan = plan(
    vues.map((v) => v.fiche.id),
    t.phrases,
    theme.coins,
    colonnes,
  )
  const scene = posesAuBureau(lePlan)
  const postes = [{ vue: chef, place: lePlan.chef }, ...vues.map((vue, i) => ({ vue, place: lePlan.bureaux[i] }))]
  const presents = postes.filter(({ vue }) => vue.statut !== 'absent')

  const svg = renderToStaticMarkup(
    <ExportSvgContexte.Provider value>
      <TextesContexte.Provider value={t}>
        <ThemeContexte.Provider value={theme}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox={`0 0 ${LARGEUR} ${lePlan.hauteur}`}
            width={LARGEUR}
            height={lePlan.hauteur}
            shapeRendering="crispEdges"
            fontFamily={POLICE}
            role="img"
            aria-label={`${titre}: ${t.sceneLabel}`}
          >
            <title>{titre}</title>
            <rect width={LARGEUR} height={lePlan.hauteur} fill={theme.fond} />
            <DefsCommunes />
            <theme.Decor hauteur={lePlan.hauteur} titre={titre} liens={{}} aller={() => {}} jouer={() => {}} fete={fete(maintenant)} />
            <EcranMural tuiles={ecranParDefaut(agents, t)} />
            <TableauBlanc prochains={prochainsPassages(vues, maintenant, t.locale)} />
            <Fetes quoi={fete(maintenant)} bas={lePlan.hauteur - 20} />
            <Fenetre meteo={null} />
            <Horloge maintenant={maintenant} ouverture={maintenant} />
            {postes.map(({ vue, place }) => (
              <Poste
                key={vue.fiche.id}
                vue={vue}
                place={place}
                occupe={vue.statut !== 'absent'}
                bientot={bientot(vue, maintenant)}
                monte={false}
                oublie={false}
                choisi={false}
                choisir={() => {}}
              />
            ))}
            {presents.map(({ vue }) => (
              <Personnage
                key={vue.fiche.id}
                id={vue.fiche.id}
                pose={scene[vue.fiche.id]}
                etire={false}
                sieste={Boolean(theme.sieste) && vue.statut === 'endormi'}
              />
            ))}
            {/* Le dossier des chaises, devant le dos de l'agent. */}
            {presents
              .filter(({ vue }) => vue.fiche.id !== CHEF_ID)
              .map(({ vue, place }) => (
                <theme.Dossier key={vue.fiche.id} x={place.siege.pos.x} y={place.siege.pos.y + 4} couleur={theme.tenue(vue.fiche.id).c} />
              ))}
            {presents.map(({ vue }) => (
              <Annonce key={vue.fiche.id} vue={vue} pose={scene[vue.fiche.id]} parole={null} />
            ))}
          </svg>
        </ThemeContexte.Provider>
      </TextesContexte.Provider>
    </ExportSvgContexte.Provider>,
  )
  return `<?xml version="1.0" encoding="UTF-8"?>\n${svg}`
}

/** Un message à la place de la salle, quand elle ne peut pas se dessiner : une image ne peut rien dire d'autre. */
export function rendreMessage(texte: string): string {
  const svg = renderToStaticMarkup(
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 80" width="600" height="80" fontFamily={POLICE}>
      <rect width="600" height="80" rx="8" fill="#14110d" />
      <text x="20" y="34" fontSize="16" fill="#e8b923">
        pixel-openspace
      </text>
      <text x="20" y="58" fontSize="13" fill="#d6d3d1">
        {texte.length > 80 ? `${texte.slice(0, 79)}…` : texte}
      </text>
    </svg>,
  )
  return `<?xml version="1.0" encoding="UTF-8"?>\n${svg}`
}
