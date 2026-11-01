'use client'

/*
 * La salle en vue isométrique, pour le thème moderne. Le moteur ne change pas :
 * son plan se lit déjà comme une vue de dessus (y est la profondeur, le haut
 * est le fond de la salle), on le projette en iso. Le décor est redessiné en
 * volumes, et les agents deviennent des objets animés qui incarnent leur
 * tâche : une disquette pour la sauvegarde, une fusée pour la mise en prod.
 */

import type { ReactNode } from 'react'
import { BUREAU, CHEF_ID, LARGEUR, type PlaceBureau, type Plan, type Statut } from './engine'
import { useTheme } from './contexte'
import { direction } from './people'
import { ACCENT, Cliquable, useTextes } from './primitives'
import type { SceneObject, Weather, Zone } from './types'
import type { Pose, Vue } from './vue'

/** La profondeur raccourcie : la grande salle est plus profonde que large ne le laisse croire. */
const PROF = 0.75
const MUR = 90
const MARGE = 30
/** Les agents, un peu plus grands que le sol qui rétrécit en iso. */
const AGRANDI = 1.6
/** L'allée du haut, que tout le monde longe pour aller aux coins de pause (celle du moteur). */
const ALLEE_HAUT = 262
/** La verrière entre deux zones, décalée du couloir où l'on marche pour que personne ne la traverse. */
const DECALAGE_VERRIERE = 18
/** La largeur des passages dans la verrière, en face de chaque allée. */
const PASSAGE = 20

export type CadreIso = { largeur: number; hauteur: number; ox: number; oy: number }

export function cadreIso(hauteurPlan: number): CadreIso {
  const etendue = LARGEUR + PROF * hauteurPlan
  return { largeur: etendue + 2 * MARGE, hauteur: etendue / 2 + MUR + 2 * MARGE + 10, ox: PROF * hauteurPlan + MARGE, oy: MUR + MARGE }
}

/** Un point du plan, à une hauteur z, sur l'écran. */
export function projeter(c: CadreIso, x: number, y: number, z = 0): [number, number] {
  return [x - PROF * y + c.ox, (x + PROF * y) / 2 + c.oy - z]
}

/** Où accrocher la carte d'un agent, ramené à la largeur de la vue de face que la carte connaît. */
export function ancreIso(c: CadreIso, pose: Pose | null, place: PlaceBureau) {
  const k = LARGEUR / c.largeur
  if (pose) {
    const [x, y] = projeter(c, pose.x, pose.y)
    return { x: x * k, haut: (y - teteDe(pose)) * k, bas: y * k }
  }
  const [x, y] = projeter(c, place.cx, place.dy + BUREAU.hauteur / 2, 40)
  return { x: x * k, haut: y * k, bas: (y + 30) * k }
}

const profondeur = (x: number, y: number) => x + PROF * y

/* Les plans où dessiner à plat : le sol, un mur face au sud (le long de x), un mur face à l'est (le long de y). */
const surSol = (c: CadreIso) => `matrix(1 .5 ${-PROF} ${PROF / 2} ${c.ox} ${c.oy})`
const surMurSud = (c: CadreIso, y: number) => `matrix(1 .5 0 1 ${c.ox - PROF * y} ${c.oy + (PROF * y) / 2})`
const surMurEst = (c: CadreIso, x: number) => `matrix(${-PROF} ${PROF / 2} 0 1 ${x + c.ox} ${x / 2 + c.oy})`

const points = (...p: Array<[number, number]>) => p.map(([x, y]) => `${x},${y}`).join(' ')

/** Un volume : son dessus, sa face sud et sa face est, les seules qu'on voie. */
function Boite({
  c,
  x,
  y,
  l,
  p,
  h,
  z = 0,
  dessus,
  sud,
  est,
}: {
  c: CadreIso
  x: number
  y: number
  l: number
  p: number
  h: number
  z?: number
  dessus: string
  sud: string
  est: string
}) {
  const haut = z + h
  return (
    <g>
      <polygon
        points={points(
          projeter(c, x, y + p, z),
          projeter(c, x + l, y + p, z),
          projeter(c, x + l, y + p, haut),
          projeter(c, x, y + p, haut),
        )}
        fill={sud}
      />
      <polygon
        points={points(
          projeter(c, x + l, y, z),
          projeter(c, x + l, y + p, z),
          projeter(c, x + l, y + p, haut),
          projeter(c, x + l, y, haut),
        )}
        fill={est}
      />
      <polygon
        points={points(projeter(c, x, y, haut), projeter(c, x + l, y, haut), projeter(c, x + l, y + p, haut), projeter(c, x, y + p, haut))}
        fill={dessus}
      />
    </g>
  )
}

/** Le haut de la tête au-dessus des pieds : assis, on s'enfonce dans sa chaise. */
const teteDe = (pose: Pose) => (pose.assise ? 33 : 38) * AGRANDI

/*
 * Les agents sont des objets animés : chacun incarne sa tâche, avec des yeux,
 * des bras et des pieds. La forme vient de l'emoji de l'agent, la couleur de
 * sa tenue dans le thème ; le chef est une tasse couronnée, le livreur un carton.
 */
export type Forme =
  | 'disquette'
  | 'fusee'
  | 'enveloppe'
  | 'document'
  | 'piece'
  | 'graphique'
  | 'bouclier'
  | 'appareil'
  | 'note'
  | 'classeur'
  | 'tasse'
  | 'carton'

const PAR_EMOJI: Record<string, Forme> = {
  '💾': 'disquette',
  '💿': 'disquette',
  '🚀': 'fusee',
  '📨': 'enveloppe',
  '✉️': 'enveloppe',
  '📧': 'enveloppe',
  '📬': 'enveloppe',
  '🧾': 'document',
  '📄': 'document',
  '📝': 'document',
  '📋': 'document',
  '💶': 'piece',
  '💰': 'piece',
  '💵': 'piece',
  '🪙': 'piece',
  '📊': 'graphique',
  '📈': 'graphique',
  '📉': 'graphique',
  '🛡️': 'bouclier',
  '🔒': 'bouclier',
  '🔐': 'bouclier',
  '📸': 'appareil',
  '📷': 'appareil',
  '🎵': 'note',
  '🎶': 'note',
  '🗄️': 'classeur',
  '🗃️': 'classeur',
  '📁': 'classeur',
  '☕': 'tasse',
  '📦': 'carton',
}

export function formeDe(id: string, emoji?: string): Forme {
  if (id === CHEF_ID) return 'tasse'
  if (id.startsWith('livreur:')) return 'carton'
  return (emoji && PAR_EMOJI[emoji]) || 'document'
}

/** Ce qu'il faut savoir de chaque forme pour l'animer : sa demi-largeur, et où vont les yeux. */
const GABARIT: Record<Forme, { demi: number; yeux: [number, number]; ecart: number }> = {
  disquette: { demi: 10, yeux: [0, -15], ecart: 3.4 },
  fusee: { demi: 7.5, yeux: [0, -14.5], ecart: 3.2 },
  enveloppe: { demi: 11, yeux: [0, -12.5], ecart: 4.5 },
  document: { demi: 9.5, yeux: [0, -17], ecart: 3.6 },
  piece: { demi: 10.5, yeux: [0, -20], ecart: 3.8 },
  graphique: { demi: 10, yeux: [0, -25.5], ecart: 3.8 },
  bouclier: { demi: 10, yeux: [0, -21], ecart: 3.6 },
  appareil: { demi: 11, yeux: [0, -22], ecart: 7 },
  note: { demi: 8, yeux: [-2, -12.5], ecart: 3 },
  classeur: { demi: 10, yeux: [0, -29], ecart: 3.6 },
  tasse: { demi: 9, yeux: [-1.5, -18], ecart: 3.4 },
  carton: { demi: 10, yeux: [0, -17], ecart: 3.8 },
}

/** Le corps d'une forme, les pieds à l'origine. De dos, sans ce qui ne se voit que de face. */
function Corps({ forme, couleur, dos }: { forme: Forme; couleur: string; dos: boolean }) {
  switch (forme) {
    case 'disquette':
      return (
        <>
          <rect x="-10" y="-30" width="20" height="22" rx="2.5" fill={couleur} />
          {dos ? null : (
            <>
              <rect x="-5" y="-30" width="10" height="7" fill="#cbd5e1" />
              <rect x="0.5" y="-28.5" width="2.5" height="4" fill={couleur} />
              <rect x="-7.5" y="-19.5" width="15" height="10" rx="1.2" fill="#f8fafc" />
            </>
          )}
        </>
      )
    case 'fusee':
      return (
        <>
          <path d="M -7.5 -16 L -12 -7 L -7 -9 Z" fill={couleur} />
          <path d="M 7.5 -16 L 12 -7 L 7 -9 Z" fill={couleur} />
          <path d="M 0 -36 C 7 -30 8.5 -20 7.5 -9 L -7.5 -9 C -8.5 -20 -7 -30 0 -36 Z" fill="#f1f5f9" />
          <path d="M 0 -36 C 4 -33 6 -30 6.6 -27 L -6.6 -27 C -6 -30 -4 -33 0 -36 Z" fill={couleur} />
          {dos ? null : <circle cx="0" cy="-22" r="2.6" fill="#7dd3fc" />}
        </>
      )
    case 'enveloppe':
      return (
        <>
          <rect x="-11" y="-26" width="22" height="17" rx="2" fill="#fefce8" />
          {dos ? null : (
            <>
              <path d="M -11 -26 L 0 -17.5 L 11 -26" fill="none" stroke="#a8a29e" strokeOpacity="0.8" />
              <circle cx="0" cy="-17.5" r="2.4" fill={couleur} />
            </>
          )}
        </>
      )
    case 'piece':
      return (
        <>
          <circle cx="0" cy="-19.5" r="10.5" fill="#fbbf24" />
          {dos ? null : <circle cx="0" cy="-19.5" r="8" fill="none" stroke="#d97706" strokeOpacity="1" strokeWidth="1.2" />}
        </>
      )
    case 'graphique':
      return (
        <>
          <rect x="-10" y="-31" width="20" height="22" rx="3" fill="#ffffff" />
          {dos ? null : (
            <>
              <rect x="-7" y="-15" width="3.5" height="5" fill={couleur} />
              <rect x="-1.75" y="-18" width="3.5" height="8" fill="#38bdf8" />
              <rect x="3.5" y="-21.5" width="3.5" height="11.5" fill="#4ade80" />
            </>
          )}
        </>
      )
    case 'bouclier':
      return (
        <>
          <path d="M 0 -32 L 10 -28 L 10 -19 C 10 -13 5.5 -10 0 -8 C -5.5 -10 -10 -13 -10 -19 L -10 -28 Z" fill={couleur} />
          {dos ? null : <path d="M 0 -29 L 7.5 -26 L 7.5 -19 C 7.5 -14.5 4 -12.5 0 -11 Z" fill="#ffffff" opacity="0.3" />}
        </>
      )
    case 'appareil':
      return (
        <>
          <rect x="-5" y="-28" width="8" height="4" rx="1" fill="#334155" />
          <rect x="-11" y="-25" width="22" height="16" rx="3" fill="#334155" />
          {dos ? null : (
            <>
              <rect x="-11" y="-21" width="4" height="2.4" fill={couleur} />
              <circle cx="0" cy="-16" r="5.5" fill="#0f172a" stroke="#94a3b8" strokeOpacity="1" strokeWidth="1.2" />
              <circle cx="-1.5" cy="-17.5" r="1.3" fill="#e2e8f0" />
            </>
          )}
        </>
      )
    case 'note':
      return (
        <>
          <rect x="2.5" y="-33" width="2.6" height="22" fill={couleur} />
          <path d="M 5.1 -33 Q 12 -29 10.5 -22.5 Q 9 -26.5 5.1 -27.5 Z" fill={couleur} />
          <ellipse cx="-2" cy="-12" rx="7.5" ry="6" fill={couleur} transform="rotate(-18 -2 -12)" />
        </>
      )
    case 'classeur':
      return (
        <>
          <rect x="-10" y="-33" width="20" height="24" rx="2" fill="#94a3b8" />
          {dos ? null : (
            <>
              <rect x="-8" y="-25" width="16" height="1.2" fill="#64748b" />
              <rect x="-8" y="-17" width="16" height="1.2" fill="#64748b" />
              <rect x="-2.5" y="-22.5" width="5" height="1.6" rx="0.8" fill={couleur} />
              <rect x="-2.5" y="-14.5" width="5" height="1.6" rx="0.8" fill={couleur} />
            </>
          )}
        </>
      )
    case 'tasse':
      return (
        <>
          <path d="M 6 -21.5 a 4 4 0 0 1 0 8" fill="none" stroke="#f8fafc" strokeOpacity="1" strokeWidth="2.6" />
          <rect x="-9" y="-25" width="15" height="16" rx="3" fill="#f8fafc" />
          <ellipse cx="-1.5" cy="-25" rx="7.5" ry="2" fill="#78350f" />
          {dos ? null : <rect x="-9" y="-14" width="15" height="2.4" fill={couleur} />}
          <path
            d="M -6.5 -27 L -6.5 -33 L -3.5 -29.5 L -1.5 -34.5 L 0.5 -29.5 L 3.5 -33 L 3.5 -27 Z"
            fill="#ffd65a"
            stroke="#a5770f"
            strokeOpacity="1"
          />
        </>
      )
    case 'carton':
      return (
        <>
          <rect x="-10" y="-26" width="20" height="17" rx="1.5" fill="#d6a565" />
          <rect x="-1.5" y="-26" width="3" height="17" fill="#f3d39b" />
        </>
      )
    default:
      return (
        <>
          <path d="M -9.5 -32 L 5 -32 L 9.5 -27.5 L 9.5 -9 L -9.5 -9 Z" fill="#ffffff" />
          {dos ? null : (
            <>
              <path d="M 5 -32 L 5 -27.5 L 9.5 -27.5 Z" fill="#e2e8f0" />
              <rect x="-6" y="-28" width="8" height="1.6" fill={couleur} />
              <rect x="-6" y="-24.5" width="12" height="1.6" fill="#cbd5e1" />
            </>
          )}
        </>
      )
  }
}

/** Un objet animé, les pieds à l'origine : le corps, les bras, les jambes s'il est debout, et les yeux s'il nous regarde. */
function Mascotte({
  forme,
  couleur,
  sens,
  assis,
  pas,
  dort,
}: {
  forme: Forme
  couleur: string
  sens: 'haut' | 'bas' | 'gauche' | 'droite'
  assis: boolean
  pas: number
  dort: boolean
}) {
  const g = GABARIT[forme]
  // Tourné vers le fond (à son bureau), on le voit de trois quarts : il regarde vers son écran, en haut à droite.
  const dos = false
  const face = sens === 'droite' || sens === 'haut' ? 1 : sens === 'gauche' ? -1 : 0
  const [ex, ey] = g.yeux
  return (
    <g transform={assis ? 'translate(0 2)' : undefined}>
      {assis ? null : (
        <g stroke="#1c1917" strokeWidth="1.6" strokeLinecap="round">
          <path d={`M -4 -9 L -4 ${-3 - (pas === 1 ? 1.5 : 0)}`} />
          <path d={`M 4 -9 L 4 ${-3 - (pas === 2 ? 1.5 : 0)}`} />
        </g>
      )}
      {assis ? null : (
        <>
          <ellipse cx={-4 + face} cy={-2 - (pas === 1 ? 1.5 : 0)} rx="3" ry="1.8" fill="#1c1917" />
          <ellipse cx={4 + face} cy={-2 - (pas === 2 ? 1.5 : 0)} rx="3" ry="1.8" fill="#1c1917" />
        </>
      )}
      <g stroke="#1c1917" strokeWidth="1.5" strokeLinecap="round" fill="none">
        <path d={`M ${-g.demi + 0.5} -17 L ${-g.demi - 3} ${pas === 1 ? -13 : -12}`} />
        <path d={`M ${g.demi - 0.5} -17 L ${g.demi + 3} ${pas === 2 ? -13 : -12}`} />
      </g>
      <g stroke="#1c1917" strokeOpacity="0.35" strokeWidth="0.8">
        <Corps forme={forme} couleur={couleur} dos={dos} />
      </g>
      {dos ? null : dort ? (
        <g stroke="#1c1917" strokeWidth="1.1" strokeLinecap="round">
          <path d={`M ${ex - g.ecart - 1.4} ${ey + 0.5} h 2.8`} />
          <path d={`M ${ex + g.ecart - 1.4} ${ey + 0.5} h 2.8`} />
        </g>
      ) : (
        <>
          {[-1, 1].map((cote) => (
            <g key={cote}>
              <ellipse
                cx={ex + cote * g.ecart + face * 1.5}
                cy={ey}
                rx="2.2"
                ry="2.5"
                fill="#ffffff"
                stroke="#1c1917"
                strokeOpacity="0.4"
                strokeWidth="0.6"
              />
              <circle cx={ex + cote * g.ecart + face * 2.2} cy={ey + 0.4} r="1.2" fill="#1c1917" />
            </g>
          ))}
          {face ? null : (
            <path
              d={`M ${ex - 1.5} ${ey + 3.6} Q ${ex} ${ey + 5} ${ex + 1.5} ${ey + 3.6}`}
              fill="none"
              stroke="#1c1917"
              strokeOpacity="0.7"
              strokeWidth="0.9"
              strokeLinecap="round"
            />
          )}
        </>
      )}
    </g>
  )
}

/** Le portrait d'un agent, de face : pour les listes autour de la salle. */
export function Portrait({ id, emoji, couleur, taille = 28 }: { id: string; emoji?: string; couleur: string; taille?: number }) {
  return (
    <svg width={taille} height={taille} viewBox="-16 -38 32 34" aria-hidden="true" className="shrink-0">
      <Mascotte forme={formeDe(id, emoji)} couleur={couleur} sens="bas" assis={false} pas={0} dort={false} />
    </svg>
  )
}

/** Un agent dans la salle, les pieds sur son point projeté, tourné comme il marche. */
function Bonhomme({
  c,
  id,
  emoji,
  pose,
  dort,
  choisir,
}: {
  c: CadreIso
  id: string
  emoji?: string
  pose: Pose
  dort: boolean
  choisir?: (id: string) => void
}) {
  const theme = useTheme()
  const [sx, sy] = projeter(c, pose.x, pose.y)
  const pas = pose.marche ? 1 + (Math.floor(pose.pas / 170) % 2) : 0
  const assis = Boolean(pose.assise)
  return (
    <g
      transform={`translate(${sx} ${sy}) scale(${AGRANDI})`}
      className={choisir ? 'cursor-pointer' : undefined}
      onClick={choisir ? () => choisir(id) : undefined}
    >
      {assis ? null : <ellipse cx="0" cy="0" rx="10" ry="3" fill="#000000" opacity="0.22" />}
      <Mascotte forme={formeDe(id, emoji)} couleur={theme.tenue(id).c} sens={direction(pose.angle)} assis={assis} pas={pas} dort={dort} />
      {pose.porte ? (
        <rect x="-7" y="-36" width="14" height="9" rx="1.5" fill="#c08d52" stroke="#1c1917" strokeOpacity="0.35" strokeWidth="0.8" />
      ) : null}
    </g>
  )
}

/** Le chat de la salle, en lisse : roulé en boule, ou qui trottine. */
function ChatIso({ c, pose }: { c: CadreIso; pose: Pose }) {
  const [sx, sy] = projeter(c, pose.x, pose.y)
  const vers = direction(pose.angle) === 'gauche' ? -1 : 1
  return (
    <g transform={`translate(${sx} ${sy}) scale(${AGRANDI * vers} ${AGRANDI})`} pointerEvents="none">
      <ellipse cx="0" cy="0" rx="9" ry="2.5" fill="#000000" opacity="0.2" />
      {pose.marche ? (
        <>
          <path d="M -9 -8 Q -14 -14 -11 -18" fill="none" stroke="#44403c" strokeWidth="2" strokeLinecap="round" />
          <rect x="-9" y="-11" width="15" height="8" rx="4" fill="#44403c" />
          <rect x="-7" y="-4" width="2" height="4" rx="1" fill="#44403c" />
          <rect x="2" y="-4" width="2" height="4" rx="1" fill="#44403c" />
          <circle cx="7" cy="-12" r="4.5" fill="#44403c" />
          <path d="M 4 -15 L 5 -19 L 7 -16 M 8 -16 L 10 -19 L 11 -15" fill="#44403c" />
        </>
      ) : (
        <>
          <ellipse cx="0" cy="-4" rx="9" ry="5" fill="#44403c" />
          <circle cx="6" cy="-6" r="3.8" fill="#57534e" />
          <path d="M 4 -9 L 5 -12 L 7 -9.5 M 7.5 -9.5 L 9 -12 L 9.5 -8" fill="#57534e" />
        </>
      )}
    </g>
  )
}

/** Une plante en pot, en lisse. */
function PlanteIso({ c, x, y }: { c: CadreIso; x: number; y: number }) {
  const [sx, sy] = projeter(c, x, y)
  return (
    <g transform={`translate(${sx} ${sy}) scale(${AGRANDI})`} pointerEvents="none">
      <ellipse cx="0" cy="0" rx="9" ry="3.5" fill="#000000" opacity="0.2" />
      <path d="M -7 -14 L 7 -14 L 5.5 0 L -5.5 0 Z" fill="#f5f5f4" />
      <path d="M 0 -14 L 7 -14 L 5.5 0 L 0 0 Z" fill="#d6d3d1" />
      <ellipse cx="0" cy="-24" rx="11" ry="11" fill="#2f8a4a" />
      <ellipse cx="-4" cy="-28" rx="6" ry="6" fill="#3fa75c" />
      <ellipse cx="5" cy="-20" rx="5" ry="5" fill="#26763e" />
    </g>
  )
}

/* La couleur de chaque état, pour la pastille des étiquettes. */
const PASTILLE: Record<Statut, string> = {
  'au-travail': ACCENT,
  'a-jour': '#4ade80',
  'en-retard': '#fb923c',
  endormi: '#818cf8',
  'en-echec': '#ef4444',
  absent: '#71717a',
  jamais: '#a1a1aa',
  'a-la-demande': '#38bdf8',
}

const SANS = 'var(--font-atkinson, ui-sans-serif), system-ui, sans-serif'

/** Ce qu'on dit, dans une bulle crème au-dessus de la tête. */
function Bulle({ x, y, texte }: { x: number; y: number; texte: string }) {
  const court = texte.length > 40 ? `${texte.slice(0, 39)}…` : texte
  const largeur = Math.round(court.length * 5.6 + 22)
  return (
    <g pointerEvents="none" fontFamily={SANS}>
      <rect x={x - largeur / 2} y={y - 30} width={largeur} height="22" rx="8" fill="#fbf4e4" stroke="#1c1917" strokeOpacity="0.15" />
      <path d={`M ${x - 5} ${y - 8.5} L ${x} ${y - 2} L ${x + 5} ${y - 8.5} Z`} fill="#fbf4e4" />
      <text x={x} y={y - 15} textAnchor="middle" fontSize="11" fill="#1c1917">
        {court}
      </text>
    </g>
  )
}

/** Au-dessus de qui a un souci (en échec, en retard), un point d'exclamation rond ; les autres n'ont rien. */
function Alerte({ x, y, vue }: { x: number; y: number; vue: Vue }) {
  const { statut } = vue
  if (statut !== 'en-echec' && statut !== 'en-retard') return null
  return (
    <g pointerEvents="none" fontFamily={SANS}>
      <circle cx={x} cy={y - 10} r="7" fill={PASTILLE[statut]} stroke="#ffffff" strokeWidth="1.5" />
      <text x={x} y={y - 6} textAnchor="middle" fontSize="11" fontWeight="bold" fill="#ffffff">
        !
      </text>
    </g>
  )
}

/* L'écran du portable, selon l'état de l'agent. */
const ECRAN: Record<Statut, string> = {
  'au-travail': ACCENT,
  'a-jour': '#bfdbfe',
  'en-retard': '#fb923c',
  endormi: '#3730a3',
  'en-echec': '#ef4444',
  absent: '#1c1917',
  jamais: '#e7e5e4',
  'a-la-demande': '#7dd3fc',
}

/** Le poste d'un agent : un bureau assis-debout en chêne, son portable, sa chaise en maille. */
function PosteIso({
  c,
  vue,
  place,
  choisi,
  blanc,
  choisir,
}: {
  c: CadreIso
  vue: Vue
  place: PlaceBureau
  choisi: boolean
  /** Le plateau blanc des zones carrelées, plutôt que le chêne. */
  blanc: boolean
  choisir: () => void
}) {
  const theme = useTheme()
  const { cx, dy } = place
  const { statut, fiche } = vue
  const ecran = ECRAN[statut]
  const brille = statut === 'au-travail' || statut === 'en-echec'
  const [fx, fy] = projeter(c, cx, dy + 40)
  return (
    <g className="cursor-pointer" onClick={choisir}>
      {brille || choisi ? (
        <ellipse
          cx={fx}
          cy={fy + 12}
          rx="70"
          ry="30"
          fill={choisi ? '#ffffff' : ecran}
          opacity={choisi ? 0.18 : 0.28}
          filter="url(#iso-flou)"
        />
      ) : null}
      <Boite c={c} x={cx - 56} y={dy + 18} l={5} p={32} h={22} dessus="#f5f5f4" sud="#e7e5e4" est="#d6d3d1" />
      <Boite c={c} x={cx + 51} y={dy + 18} l={5} p={32} h={22} dessus="#f5f5f4" sud="#e7e5e4" est="#d6d3d1" />
      <Boite
        c={c}
        x={cx - 60}
        y={dy + 14}
        l={120}
        p={40}
        z={22}
        h={4}
        dessus={blanc ? '#fafaf9' : '#e2c597'}
        sud={blanc ? '#d6d3d1' : '#c8a06a'}
        est={blanc ? '#a8a29e' : '#b88f5a'}
      />
      {/* Le portable : sa base, et son écran tourné vers l'agent. */}
      <Boite c={c} x={cx - 16} y={dy + 34} l={32} p={14} z={26} h={2} dessus="#a8a29e" sud="#78716c" est="#78716c" />
      <g transform={surMurSud(c, dy + 34)}>
        <rect x={cx - 16} y={-48} width="32" height="20" fill="#292524" />
        <rect x={cx - 14} y={-46} width="28" height="16" fill={ecran} />
        {statut === 'au-travail' ? (
          <>
            <rect x={cx - 11} y={-43} width="14" height="2" fill="#0b0d10" opacity="0.35" />
            <rect x={cx - 11} y={-38} width="20" height="2" fill="#0b0d10" opacity="0.35" />
          </>
        ) : null}
      </g>
      {/* La plaque au bord du plateau. */}
      <g transform={surMurSud(c, dy + 54)}>
        <text x={cx - 52} y={-23} fontSize="8" fill="#5b4126">
          {fiche.emoji} {fiche.nom}
        </text>
      </g>
      {statut === 'en-echec' ? (
        <g opacity="0.75">
          {[0, 1, 2].map((i) => {
            const [sx, sy] = projeter(c, cx + 4 + i * 3, dy + 34, 56 + i * 12)
            return <circle key={i} cx={sx} cy={sy} r={4 + i * 2} fill="#a8a29e" opacity={0.8 - i * 0.2} />
          })}
        </g>
      ) : null}
      {/* La chaise : l'assise, sur son pied, à la couleur de la tenue. */}
      <Boite c={c} x={cx - 2} y={dy + 66} l={4} p={4} h={8} dessus="#44403c" sud="#292524" est="#1c1917" />
      <Boite c={c} x={cx - 10} y={dy + 60} l={20} p={16} z={8} h={4} dessus={theme.tenue(fiche.id).c} sud="#1c1917" est="#292524" />
    </g>
  )
}

/** Le bureau du chef : un grand plateau en chêne, son fauteuil noir derrière. */
function BureauChefIso({ c, choisir }: { c: CadreIso; choisir: () => void }) {
  return (
    <g className="cursor-pointer" onClick={choisir}>
      <Boite c={c} x={142} y={114} l={6} p={30} h={24} dessus="#1c1917" sud="#1c1917" est="#292524" />
      <Boite c={c} x={262} y={114} l={6} p={30} h={24} dessus="#1c1917" sud="#1c1917" est="#292524" />
      <Boite c={c} x={136} y={110} l={138} p={40} z={24} h={5} dessus="#c8a06a" sud="#a47b49" est="#8f6a3c" />
      <Boite c={c} x={190} y={116} l={30} p={4} z={29} h={18} dessus="#57534e" sud="#a8a29e" est="#78716c" />
      <Boite c={c} x={236} y={124} l={10} p={10} z={29} h={9} dessus="#fafaf9" sud="#e7e5e4" est="#d6d3d1" />
    </g>
  )
}

/** L'horloge du mur de gauche, à l'heure. */
function Horloge({ u }: { u: number }) {
  const maintenant = new Date()
  const minutes = maintenant.getMinutes()
  const heures = (maintenant.getHours() % 12) + minutes / 60
  const aiguille = (angle: number, longueur: number) => [u + Math.sin(angle) * longueur, -58 - Math.cos(angle) * longueur]
  const [hx, hy] = aiguille((heures / 12) * 2 * Math.PI, 5)
  const [mx, my] = aiguille((minutes / 60) * 2 * Math.PI, 7.5)
  return (
    <g>
      <circle cx={u} cy={-58} r="11" fill="#ffffff" stroke="#3a3f52" strokeWidth="2" />
      <path d={`M ${u} -58 L ${hx} ${hy}`} stroke="#1c1917" strokeWidth="1.8" strokeLinecap="round" />
      <path d={`M ${u} -58 L ${mx} ${my}`} stroke="#1c1917" strokeWidth="1.2" strokeLinecap="round" />
    </g>
  )
}

/** La fenêtre du mur de gauche : le ciel de la météo, de jour ou de nuit, la ville, et le lieu avec la température. */
function FenetreMeteo({ u, meteo }: { u: number; meteo: Weather | null }) {
  const jour = meteo?.day ?? true
  const ciel = meteo?.sky ?? 'clear'
  const sombre = ciel === 'storm' || ciel === 'rain'
  const [haut, bas] = jour ? (sombre ? ['#64748b', '#94a3b8'] : ['#38bdf8', '#bae6fd']) : ['#0a1030', '#2a3a78']
  const l = 120
  const h = 46
  const y0 = -74
  const id = `ciel-${u}`
  return (
    <g>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={haut} />
          <stop offset="1" stopColor={bas} />
        </linearGradient>
        <clipPath id={`${id}-vitre`}>
          <rect x={u} y={y0} width={l} height={h} />
        </clipPath>
      </defs>
      <rect x={u - 4} y={y0 - 4} width={l + 8} height={h + 8} rx="2" fill="#4a5584" />
      <g clipPath={`url(#${id}-vitre)`}>
        <rect x={u} y={y0} width={l} height={h} fill={`url(#${id})`} />
        {/* Le soleil, ou la lune et quelques étoiles. */}
        {ciel === 'clear' || ciel === 'clouds' ? (
          jour ? (
            <circle cx={u + l - 22} cy={y0 + 12} r="7" fill="#fde047" />
          ) : (
            <>
              <circle cx={u + l - 22} cy={y0 + 12} r="6" fill="#e9ecff" />
              <circle cx={u + l - 19} cy={y0 + 10} r="5" fill={haut} />
              {[
                [18, 8],
                [44, 14],
                [70, 6],
              ].map(([x, y]) => (
                <rect key={x} x={u + x} y={y0 + y} width="1.5" height="1.5" fill="#ffffff" />
              ))}
            </>
          )
        ) : null}
        {ciel === 'clouds' || sombre || ciel === 'snow' ? (
          <g fill={sombre ? '#475569' : '#f8fafc'} opacity={jour ? 0.95 : 0.6}>
            <ellipse cx={u + 34} cy={y0 + 14} rx="16" ry="6" />
            <ellipse cx={u + 46} cy={y0 + 10} rx="10" ry="6" />
            <ellipse cx={u + 84} cy={y0 + 18} rx="14" ry="5" />
          </g>
        ) : null}
        {ciel === 'rain' || ciel === 'storm'
          ? Array.from({ length: 14 }, (_, i) => (
              <path key={i} d={`M ${u + 6 + i * 8} ${y0 + 20 + (i % 3) * 5} l -2 6`} stroke="#bfdbfe" strokeWidth="1" />
            ))
          : null}
        {ciel === 'storm' ? <path d={`M ${u + 70} ${y0 + 18} l -5 9 h 5 l -4 9`} fill="none" stroke="#fde047" strokeWidth="1.6" /> : null}
        {ciel === 'snow'
          ? Array.from({ length: 16 }, (_, i) => (
              <circle key={i} cx={u + 5 + i * 7.3} cy={y0 + 18 + ((i * 7) % 20)} r="1.2" fill="#ffffff" />
            ))
          : null}
        {ciel === 'fog' ? <rect x={u} y={y0 + 18} width={l} height="16" fill="#e2e8f0" opacity="0.7" /> : null}
        {/* La ville en silhouette, ses fenêtres allumées la nuit. */}
        <g fill={jour ? '#475569' : '#0d1434'}>
          <rect x={u + 4} y={y0 + 30} width="14" height="16" />
          <rect x={u + 20} y={y0 + 24} width="12" height="22" />
          <rect x={u + 34} y={y0 + 34} width="18" height="12" />
          <rect x={u + 56} y={y0 + 22} width="10" height="24" />
          <rect x={u + 68} y={y0 + 30} width="20" height="16" />
          <rect x={u + 92} y={y0 + 26} width="12" height="20" />
          <rect x={u + 106} y={y0 + 32} width="14" height="14" />
        </g>
        {jour ? null : (
          <g fill="#f6d27a">
            <rect x={u + 23} y={y0 + 28} width="2" height="2" />
            <rect x={u + 59} y={y0 + 27} width="2" height="2" />
            <rect x={u + 72} y={y0 + 34} width="2" height="2" />
            <rect x={u + 95} y={y0 + 31} width="2" height="2" />
          </g>
        )}
      </g>
      <rect x={u + l / 2 - 1} y={y0} width="2" height={h} fill="#4a5584" />
      <rect x={u - 6} y={y0 + h + 4} width={l + 12} height="4" fill="#cbd5e1" />
      {/* Le lieu et la température, sur une petite plaque sous la fenêtre. */}
      {meteo ? (
        // Le mur de gauche est vu de l'autre côté : on retourne la plaque pour que le texte se lise à l'endroit.
        <g fontFamily={SANS} transform={`translate(${2 * (u + l / 2)} 0) scale(-1 1)`}>
          <rect x={u + l / 2 - 32} y={y0 + h + 11} width="64" height="12" rx="2" fill="#1e2a4d" />
          <text x={u + l / 2} y={y0 + h + 19.5} textAnchor="middle" fontSize="7" fontWeight="bold" fill="#f3f4fa">
            {meteo.place ? `${meteo.place} · ` : ''}
            {Math.round(meteo.temperature)}°
          </text>
        </g>
      ) : null}
    </g>
  )
}

/** Ce qu'on dessine dans la salle, rangé par profondeur, et la part de la salle (entre deux verrières) où il se trouve. */
type Objet = { cle: number; couche: number; noeud: ReactNode }

export function SceneIso({
  plan,
  zones,
  postes,
  presents,
  invites,
  poseChat,
  paroles,
  enseigne,
  meteo,
  liens,
  aller,
  jouer,
  choisi,
  choisir,
  cliquerAgent,
}: {
  plan: Plan
  zones: Array<Zone>
  postes: Array<{ vue: Vue; place: PlaceBureau }>
  presents: Array<{ vue: Vue; place: PlaceBureau; pose: Pose }>
  invites: Array<[string, Pose]>
  poseChat?: Pose
  paroles: Record<string, string>
  enseigne: string
  meteo: Weather | null
  liens: Partial<Record<SceneObject, string>>
  aller: (objet: SceneObject) => void
  jouer: (jeu: 'snake' | 'casse-briques') => void
  choisi: string | null
  choisir: (id: string) => void
  cliquerAgent: (id: string) => void
}) {
  const t = useTextes()
  const c = cadreIso(plan.hauteur)
  const fond = plan.hauteur - 14
  const lien = (objet: SceneObject) => ({ titre: t.objects[objet], faire: () => aller(objet), actif: Boolean(liens[objet]) })

  /* Les zones : où chacune commence et finit, entre les colonnes de bureaux ; une verrière entre deux. */
  const etendues = zones
    .map((zone) => {
      const cx = plan.bureaux.filter((b) => zone.agents.includes(b.id)).map((b) => b.cx)
      return cx.length ? { zone, de: Math.min(...cx), a: Math.max(...cx) } : null
    })
    .filter((e) => e !== null)
    .sort((a, b) => a.de - b.de)
  const bornes = etendues.map((e, k) => ({
    ...e,
    gauche: k === 0 ? 12 : (etendues[k - 1].a + e.de) / 2,
    droite: k === etendues.length - 1 ? 988 : (e.a + etendues[k + 1].de) / 2,
  }))
  const zoneDe = (x: number) => bornes.findIndex((b) => x >= b.gauche && x < b.droite)

  const verrieres = bornes.slice(1).map((b) => b.gauche + DECALAGE_VERRIERE)
  // Derrière une verrière (plus à gauche), on est dessiné avant elle.
  const coucheDe = (x: number) => verrieres.filter((v) => x >= v).length
  // Les passages : l'allée du haut, et l'allée de chaque rangée de bureaux.
  const allees = [ALLEE_HAUT, ...new Set(plan.bureaux.map((b) => b.dy + 108))].sort((a, b) => a - b)
  const panneaux: Array<[number, number]> = []
  let depuis = 200
  for (const y of allees) {
    if (y - PASSAGE > depuis) panneaux.push([depuis, y - PASSAGE])
    depuis = y + PASSAGE
  }
  if (fond > depuis) panneaux.push([depuis, fond])

  const objets: Array<Objet> = []
  const poser = (x: number, y: number, noeud: ReactNode) => objets.push({ cle: profondeur(x, y), couche: coucheDe(x), noeud })

  /* Le bureau du chef : la bibliothèque, la plante, le fauteuil et le grand bureau. */
  poser(
    75,
    23,
    <Cliquable key="biblio" {...lien('server-rack')}>
      <Boite c={c} x={30} y={16} l={90} p={14} h={72} dessus="#b88f5a" sud="#c8a06a" est="#a47b49" />
      <g transform={surMurSud(c, 30)}>
        {[-66, -46, -26].map((y) => (
          <rect key={y} x={34} y={y + 16} width="82" height="2" fill="#8f6a3c" />
        ))}
        {[36, 44, 50, 60, 70, 78, 92, 100].map((x, i) => (
          <rect
            key={x}
            x={x}
            y={-64 + (i % 3) * 20}
            width={5 + (i % 2) * 2}
            height="14"
            fill={['#2563eb', '#f97316', '#16a34a', '#e11d48', '#7c3aed'][i % 5]}
          />
        ))}
      </g>
    </Cliquable>,
  )
  poser(312, 89, <PlanteIso key="plante-chef" c={c} x={312} y={89} />)
  poser(
    205,
    90,
    <g key="fauteuil-chef">
      <Boite c={c} x={195} y={86} l={20} p={4} z={8} h={28} dessus="#292524" sud="#1c1917" est="#292524" />
      <Boite c={c} x={195} y={90} l={20} p={14} z={8} h={4} dessus="#44403c" sud="#1c1917" est="#292524" />
    </g>,
  )
  poser(205, 130, <BureauChefIso key="bureau-chef" c={c} choisir={() => choisir(CHEF_ID)} />)

  /* L'espace détente : les deux bornes, le canapé vert sauge face à l'écran, la table de ping-pong. */
  poser(
    367,
    26,
    <Cliquable key="snake" titre={t.objects.snake} faire={() => jouer('snake')}>
      <Boite c={c} x={352} y={16} l={30} p={22} h={58} dessus="#334155" sud="#1e293b" est="#0f172a" />
      <g transform={surMurSud(c, 38)}>
        <rect x={356} y={-50} width="22" height="16" fill="#22c55e" />
        <rect x={360} y={-46} width="8" height="3" fill="#052e16" />
      </g>
    </Cliquable>,
  )
  poser(
    411,
    26,
    <Cliquable key="casse-briques" titre={t.objects.breakout} faire={() => jouer('casse-briques')}>
      <Boite c={c} x={396} y={16} l={30} p={22} h={58} dessus="#4c1d95" sud="#3b0764" est="#2e1065" />
      <g transform={surMurSud(c, 38)}>
        <rect x={400} y={-50} width="22" height="16" fill="#f472b6" />
        <rect x={403} y={-48} width="16" height="3" fill="#fde047" />
      </g>
    </Cliquable>,
  )
  poser(
    510,
    150,
    <g key="canape-assise">
      <Boite c={c} x={462} y={138} l={96} p={22} h={12} dessus="#9caf88" sud="#7d9169" est="#6b7f58" />
    </g>,
  )
  poser(
    510,
    168,
    <g key="canape-dossier">
      <Boite c={c} x={458} y={160} l={104} p={10} h={28} dessus="#a9bb95" sud="#7d9169" est="#6b7f58" />
    </g>,
  )
  poser(
    636,
    78,
    <Cliquable key="ping-pong" {...lien('workbench')}>
      <Boite c={c} x={600} y={62} l={4} p={32} h={18} dessus="#1c1917" sud="#1c1917" est="#292524" />
      <Boite c={c} x={668} y={62} l={4} p={32} h={18} dessus="#1c1917" sud="#1c1917" est="#292524" />
      <Boite c={c} x={596} y={58} l={80} p={40} z={18} h={3} dessus="#15803d" sud="#166534" est="#14532d" />
      <g transform={surSol(c)}>
        <rect x={596} y={58} width="80" height="40" fill="none" stroke="#f0fdf4" strokeWidth="1" transform="translate(0 0)" />
      </g>
    </Cliquable>,
  )
  poser(358, 187, <PlanteIso key="plante-detente" c={c} x={358} y={187} />)
  poser(662, 195, <PlanteIso key="plante-detente-2" c={c} x={662} y={195} />)

  /* La cuisine ouverte : le comptoir et l'espresso, la fontaine, le frigo inox, la table haute. */
  poser(
    791,
    30,
    <g key="comptoir">
      <Boite c={c} x={730} y={16} l={122} p={28} h={34} dessus="#fafaf9" sud="#c8a06a" est="#b88f5a" />
      <Boite c={c} x={746} y={20} l={24} p={16} z={34} h={18} dessus="#57534e" sud="#292524" est="#1c1917" />
      {[
        [812, '#ef4444'],
        [820, '#facc15'],
        [828, '#84cc16'],
      ].map(([x, couleur]) => {
        const [sx, sy] = projeter(c, x as number, 30, 38)
        return <circle key={x} cx={sx} cy={sy} r="3.5" fill={couleur as string} />
      })}
    </g>,
  )
  poser(
    879,
    27,
    <Cliquable key="fontaine" {...lien('vending-machine')}>
      <Boite c={c} x={864} y={16} l={30} p={22} h={56} dessus="#f5f5f4" sud="#e7e5e4" est="#d6d3d1" />
      <g transform={surMurSud(c, 38)}>
        <rect x={870} y={-46} width="18" height="12" fill="#7dd3fc" />
      </g>
    </Cliquable>,
  )
  poser(
    946,
    31,
    <Cliquable key="frigo" {...lien('fridge')}>
      <Boite c={c} x={920} y={16} l={52} p={30} h={84} dessus="#d6d3d1" sud="#e7e5e4" est="#a8a29e" />
      <g transform={surMurSud(c, 46)}>
        <rect x={924} y={-50} width="44" height="1.5" fill="#a8a29e" />
        <rect x={960} y={-76} width="3" height="18" fill="#78716c" />
        <rect x={960} y={-44} width="3" height="18" fill="#78716c" />
      </g>
    </Cliquable>,
  )
  poser(
    821,
    130,
    <g key="table-haute">
      <Boite c={c} x={818} y={127} l={6} p={6} h={30} dessus="#1c1917" sud="#1c1917" est="#292524" />
      {(() => {
        const [sx, sy] = projeter(c, 821, 130, 30)
        return (
          <>
            <ellipse cx={sx} cy={sy + 2} rx="24" ry="12" fill="#c8a06a" />
            <ellipse cx={sx} cy={sy} rx="24" ry="12" fill="#e2c597" />
          </>
        )
      })()}
    </g>,
  )
  for (const x of [792, 850])
    poser(x, 152, <Boite key={`tabouret-${x}`} c={c} x={x - 6} y={146} l={12} p={12} h={20} dessus="#f5f5f4" sud="#e7e5e4" est="#d6d3d1" />)
  poser(712, 187, <PlanteIso key="plante-cuisine" c={c} x={712} y={187} />)

  /* La grande salle : les cartons kraft, une plante, puis les postes. */
  poser(
    60,
    fond - 34,
    <g key="cartons">
      <Boite c={c} x={36} y={fond - 50} l={40} p={30} h={22} dessus="#d6a565" sud="#b7834a" est="#9c6d3b" />
      <Boite c={c} x={44} y={fond - 44} l={28} p={22} z={22} h={18} dessus="#e0b577" sud="#c08d52" est="#a57541" />
    </g>,
  )
  poser(958, fond - 6, <PlanteIso key="plante-salle" c={c} x={958} y={fond - 6} />)

  for (const { vue, place } of postes) {
    if (place.id === CHEF_ID) continue
    poser(
      place.cx,
      place.dy + 25,
      <PosteIso
        key={`poste-${vue.fiche.id}`}
        c={c}
        vue={vue}
        place={place}
        choisi={choisi === vue.fiche.id}
        blanc={zoneDe(place.cx) % 2 === 1}
        choisir={() => choisir(vue.fiche.id)}
      />,
    )
  }

  /* Les gens : les agents, les invités, le chat. Assis à son bureau, on passe juste après sa chaise. */
  for (const { vue, pose } of presents) {
    poser(
      pose.x,
      pose.y + 1,
      <Bonhomme
        key={vue.fiche.id}
        c={c}
        id={vue.fiche.id}
        emoji={vue.fiche.emoji}
        pose={pose}
        dort={vue.statut === 'endormi' && pose.assise === 'bureau'}
        choisir={cliquerAgent}
      />,
    )
  }
  for (const [id, pose] of invites) poser(pose.x, pose.y + 1, <Bonhomme key={id} c={c} id={id} pose={pose} dort={false} />)
  if (poseChat) poser(poseChat.x, poseChat.y + 1, <ChatIso key="chat" c={c} pose={poseChat} />)

  const par = (couche: number) =>
    objets
      .filter((o) => o.couche === couche)
      .sort((a, b) => a.cle - b.cle)
      .map((o) => o.noeud)

  return (
    <svg
      viewBox={`0 0 ${c.largeur} ${c.hauteur}`}
      className="block w-full select-none"
      style={{ fontFamily: "var(--font-pixel, 'Pixelify Sans'), ui-monospace, monospace" }}
      role="img"
      aria-label={t.sceneLabel}
    >
      <defs>
        <pattern id="iso-chene" width="64" height="16" patternUnits="userSpaceOnUse">
          <rect width="64" height="16" fill="#e2c597" />
          <rect y="14" width="64" height="2" fill="#d2b282" />
          <rect x="40" width="2" height="16" fill="#d2b282" />
          <rect x="6" y="5" width="18" height="1" fill="#ead2a8" />
        </pattern>
        <pattern id="iso-moquette" width="12" height="12" patternUnits="userSpaceOnUse">
          <rect width="12" height="12" fill="#d6d3d1" />
          <rect x="3" y="3" width="2" height="2" fill="#cfcbc8" />
        </pattern>
        <pattern id="iso-beton" width="48" height="48" patternUnits="userSpaceOnUse">
          <rect width="48" height="48" fill="#e7e5e4" />
          <rect width="48" height="1" fill="#dcd9d6" />
          <rect width="1" height="48" fill="#dcd9d6" />
        </pattern>
        <pattern id="iso-carreaux" width="40" height="40" patternUnits="userSpaceOnUse">
          <rect width="40" height="40" fill="#ece8e1" />
          <rect width="40" height="1" fill="#d6d3d1" />
          <rect width="1" height="40" fill="#d6d3d1" />
        </pattern>
        <pattern id="iso-terrazzo" width="20" height="20" patternUnits="userSpaceOnUse">
          <rect width="20" height="20" fill="#f5f5f4" />
          <rect x="3" y="4" width="2" height="2" fill="#d6d3d1" />
          <rect x="12" y="9" width="2" height="1" fill="#a8a29e" />
          <rect x="7" y="15" width="1" height="2" fill="#fca5a5" />
        </pattern>
        <radialGradient id="iso-halo">
          <stop offset="0" stopColor="#5b4bff" stopOpacity="0.35" />
          <stop offset="1" stopColor="#5b4bff" stopOpacity="0" />
        </radialGradient>
        <filter id="iso-flou" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="10" />
        </filter>
      </defs>

      <ellipse cx={c.largeur / 2} cy={c.hauteur / 2 + 40} rx={c.largeur / 2} ry={c.hauteur / 2} fill="url(#iso-halo)" />

      {/* La dalle, les sols, et les deux murs du fond. */}
      <Boite c={c} x={6} y={8} l={982} p={fond - 8} z={-14} h={14} dessus="#d6d3d1" sud="#a8a29e" est="#78716c" />
      <g transform={surSol(c)}>
        {/* Le sol de chaque zone, du mur du fond jusqu'au bord : chêne, puis carrelage, en alternance. */}
        <rect x={12} y={14} width={976} height={fond - 14} fill="url(#iso-chene)" />
        {bornes.map((b, k) =>
          k % 2 === 1 ? (
            <rect
              key={b.zone.name}
              x={b.gauche + DECALAGE_VERRIERE}
              y={14}
              width={b.droite - b.gauche - DECALAGE_VERRIERE}
              height={fond - 14}
              fill="url(#iso-carreaux)"
            />
          ) : null,
        )}
        <rect x={452} y={124} width={116} height={52} fill="#d9e4d0" />
      </g>
      <g transform={surMurSud(c, 14)}>
        <rect x={12} y={-MUR} width={976} height={MUR} fill="#f5f5f4" />
        {Array.from({ length: 16 }, (_, i) => (
          <rect key={i} x={346 + i * 21} y={-MUR} width="4" height={MUR} fill="#e2c597" />
        ))}
        <rect x={12} y={-5} width={976} height="5" fill="#e7e5e4" />
        {/* L'écran de présentation de l'espace détente. */}
        <rect x={462} y={-80} width="96" height="48" fill="#1c1917" />
        <rect x={465} y={-77} width="90" height="42" fill="#0f172a" />
        <rect x={472} y={-48} width="10" height="10" fill="#38bdf8" />
        <rect x={486} y={-56} width="10" height="18" fill="#a78bfa" />
        <rect x={500} y={-64} width="10" height="26" fill={ACCENT} />
        <rect x={514} y={-52} width="10" height="14" fill="#4ade80" />
      </g>
      <g transform={surMurEst(c, 12)}>
        <rect x={14} y={-MUR} width={fond - 14} height={MUR} fill="#e7e5e4" />
        <rect x={14} y={-5} width={fond - 14} height="5" fill="#d6d3d1" />
        <Horloge u={70} />
        <FenetreMeteo u={150} meteo={meteo} />
        {/* Le tableau blanc, ses traits de feutre. */}
        <rect x={330} y={-68} width="92" height="44" rx="2" fill="#9aa3b5" />
        <rect x={332} y={-66} width="88" height="40" fill="#f6f7fa" />
        <rect x={340} y={-58} width="44" height="2" rx="1" fill="#3b82f6" />
        <rect x={340} y={-50} width="60" height="2" rx="1" fill="#ef4444" />
        <rect x={340} y={-42} width="34" height="2" rx="1" fill="#3b82f6" />
        <rect x={392} y={-30} width="20" height="3" rx="1" fill="#57534e" />
      </g>
      <Boite c={c} x={6} y={8} l={982} p={6} z={MUR} h={3} dessus="#a8a29e" sud="#a8a29e" est="#a8a29e" />
      <Boite c={c} x={6} y={14} l={6} p={fond - 14} z={MUR} h={3} dessus="#a8a29e" sud="#a8a29e" est="#a8a29e" />

      {/* Les enseignes de chaque zone, au mur du fond ; sans zones, le titre de la salle. */}
      {bornes.length ? (
        bornes.map((b, k) => {
          const largeur = Math.min(240, b.droite - b.gauche - 40)
          const x = k === 0 ? 150 : Math.min(b.gauche + DECALAGE_VERRIERE + 20, 988 - largeur - 10)
          const runs = postes
            .filter(({ vue }) => b.zone.agents.includes(vue.fiche.id))
            .flatMap(({ vue }) => vue.source.runs ?? [])
            .sort((r1, r2) => r1.at.localeCompare(r2.at))
            .slice(-12)
          return (
            <g key={b.zone.name} transform={surMurSud(c, 14)} fontFamily={SANS}>
              <rect x={x} y={-86} width={largeur} height="28" rx="3" fill="#1e2a4d" />
              <text x={x + 10} y={-69} fontSize="15" fontWeight="bold" fill={b.zone.color ?? '#9aa3ff'}>
                {b.zone.name}
              </text>
              {b.zone.detail ? (
                <text x={x + 10} y={-61.5} fontSize="5.5" fill="#c3c8e0" letterSpacing="1">
                  {b.zone.detail.toUpperCase()}
                </text>
              ) : null}
              {/* Les derniers passages de la zone, en carrés verts et rouges. */}
              {runs.map((r, i) => (
                <rect
                  key={r.at + i}
                  x={x + largeur - 10 - (12 - i) * 7}
                  y={-80}
                  width="5.5"
                  height="5.5"
                  fill={r.ok === false ? '#ef4444' : '#4ade80'}
                />
              ))}
            </g>
          )
        })
      ) : (
        <g transform={surMurSud(c, 14)}>
          <text x={150} y={-64} fontSize="13" fill="#1c1917" fontWeight="bold">
            {enseigne}
          </text>
        </g>
      )}

      {/* Les parts de la salle, de gauche à droite, séparées par des verrières percées en face des allées. */}
      {[...verrieres, null].map((v, k) => (
        <g key={k}>
          {par(k)}
          {v === null ? null : (
            <g transform={surMurEst(c, v)}>
              {panneaux.map(([de, a]) => (
                <g key={de}>
                  <rect x={de} y={-52} width={a - de} height="52" fill="#bae6fd" opacity="0.18" />
                  <rect x={de} y={-2.5} width={a - de} height="2.5" fill="#1f2540" />
                  <rect x={de} y={-52} width="2.5" height="52" fill="#1f2540" />
                  <rect x={a - 2.5} y={-52} width="2.5" height="52" fill="#1f2540" />
                  <rect x={de + (a - de) * 0.3} y={-44} width="3" height="34" fill="#ffffff" opacity="0.18" />
                </g>
              ))}
              <rect
                x={panneaux[0]?.[0] ?? 0}
                y={-54}
                width={(panneaux.at(-1)?.[1] ?? 0) - (panneaux[0]?.[0] ?? 0)}
                height="2.5"
                fill="#1f2540"
              />
            </g>
          )}
        </g>
      ))}

      {/* Les étiquettes et les bulles, au-dessus de tout. */}
      {presents.map(({ vue, pose }) => {
        const [x, y] = projeter(c, pose.x, pose.y)
        const haut = y - teteDe(pose)
        const parole = paroles[vue.fiche.id] ?? pose.parole
        return (
          <g key={vue.fiche.id}>
            {vue.statut === 'endormi' && pose.assise === 'bureau' ? (
              <text x={x + 8} y={haut - 4} fontFamily={SANS} fontSize="12" fontWeight="bold" fill="#818cf8">
                z<tspan fontSize="16">Z</tspan>
              </text>
            ) : null}
            {parole ? <Bulle x={x} y={haut - 20} texte={parole} /> : <Alerte x={x} y={haut} vue={vue} />}
          </g>
        )
      })}
      {invites.map(([id, pose]) => {
        if (!pose.parole) return null
        const [x, y] = projeter(c, pose.x, pose.y)
        return <Bulle key={id} x={x} y={y - teteDe(pose)} texte={pose.parole} />
      })}
    </svg>
  )
}
