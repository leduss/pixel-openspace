'use client'

/*
 * Les décorations de saison : Halloween, Noël et Pâques.
 */

import { LARGEUR } from './engine'
import { Anim, MUR_SALLE, Pixels, etapes } from './primitives'
import { type Fete } from './seasons'

/** Les fêtes : Halloween tout le mois d'octobre, Noël tout le mois de décembre. */

/* Pâques : un œuf, le poussin, le lapin de profil. */
export const OEUF = ['..ee..', '.eeee.', 'ebbbbe', 'eeeeee', 'ewewew', '.eeee.', '..ee..']
export const POUSSIN = ['.yy...', 'yyey..', 'yyyyo.', '.yyy..', '.o.o..']
export const LAPIN = ['.....gw.gw', '.....gw.gw', '....wwwwww', 'w..wwwwwep', 'wwwwwwwwww', '.wwwwwwww.', '.ww....ww.']
/* Où sont cachés les œufs, et de quelles couleurs : x, y (ou « bas », au pied du mur du fond), fond, rayure, points. */
export const OEUFS: Array<[number, number | 'bas', string, string, string]> = [
  [44, 182, '#f9a8d4', '#f472b6', '#fdf2f8'],
  [318, 96, '#7c2d12', '#facc15', '#92400e'],
  [470, 182, '#a5f3fc', '#22d3ee', '#ecfeff'],
  [610, 176, '#7c2d12', '#facc15', '#92400e'],
  [846, 46, '#bbf7d0', '#4ade80', '#f0fdf4'],
  [962, 176, '#ddd6fe', '#a78bfa', '#f5f3ff'],
  [70, 300, '#fde68a', '#f59e0b', '#fffbeb'],
  [955, 470, '#7c2d12', '#facc15', '#92400e'],
  [420, 'bas', '#fecdd3', '#fb7185', '#fff1f2'],
  [690, 'bas', '#a5f3fc', '#38bdf8', '#ecfeff'],
]

export const CITROUILLE = ['...g....', '.oooooo.', 'ooyooyoo', 'oooooooo', 'oyyyyyyo', '.oooooo.']
export const FANTOME = ['.www.', 'wwwww', 'wewew', 'wwwww', 'wwwww', 'w.w.w']
export const SAPIN = [
  '....y....',
  '...ggg...',
  '..ggrgg..',
  '...ggg...',
  '..gbgggg.',
  '.gggggyg.',
  '..ggggg..',
  '.grggggbg',
  'ggggygggg',
  '....t....',
  '...ttt...',
]

export function Citrouille({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <Pixels grille={CITROUILLE} couleurs={{ o: '#ea580c', y: '#fde047', g: '#15803d' }} />
      <Anim attributeName="opacity" values="1;0.8;1" dur="2.2s" repeatCount="indefinite" />
    </g>
  )
}

/** Une toile d'araignée dans un coin de pièce, sous le mur du fond. */
export function Toile({ x, y, sens = 1 }: { x: number; y: number; sens?: 1 | -1 }) {
  const d = (n: number) => x + n * sens
  return (
    <path
      d={`M${x} ${y}H${d(26)}M${x} ${y}V${y + 26}M${x} ${y}L${d(20)} ${y + 20}M${d(10)} ${y}Q${d(9)} ${y + 9} ${x} ${y + 10}M${d(20)} ${y}Q${d(17)} ${y + 17} ${x} ${y + 20}`}
      stroke="#e5e7eb"
      strokeWidth="1"
      fill="none"
      opacity="0.6"
      shapeRendering="auto"
    />
  )
}

export function Fetes({ quoi, bas }: { quoi: Fete; bas: number }) {
  if (quoi === 'halloween') {
    return (
      <g pointerEvents="none">
        <Citrouille x={446} y={bas - 22} />
        <Citrouille x={532} y={bas - 22} />
        <Citrouille x={96} y={bas - 62} />
        <Citrouille x={250} y={60} />
        <Citrouille x={656} y={176} />
        <Citrouille x={830} y={118} />
        <Toile x={20} y={56} />
        <Toile x={682} y={56} sens={-1} />
        <Toile x={690} y={56} />
        <Toile x={980} y={56} sens={-1} />
        <Toile x={20} y={246} />
        <Toile x={980} y={246} sens={-1} />
        {/* Le fantôme qui flotte dans le coin gaming. */}
        <g opacity="0.85">
          <Pixels grille={FANTOME} couleurs={{ w: '#f8fafc', e: '#111827' }} />
          <Anim
            attributeName="transform"
            type="translate"
            values="600 120;620 110;600 100;580 110;600 120"
            dur="6s"
            repeatCount="indefinite"
          />
        </g>
      </g>
    )
  }
  if (quoi === 'paques') {
    const bas2 = bas - 36
    return (
      <g pointerEvents="none">
        {/* Les œufs cachés : peints en pastel, ou en chocolat dans leur papier doré. */}
        {OEUFS.map(([x, y, base, rayure, points], i) => (
          <g key={i} transform={`translate(${x} ${y === 'bas' ? bas2 : y})`}>
            <Pixels grille={OEUF} couleurs={{ e: base, b: rayure, w: points }} u={3} />
          </g>
        ))}
        {/* Le poussin perché sur le tableau blanc du chef. */}
        <g transform="translate(108 92)">
          <Pixels grille={POUSSIN} couleurs={{ y: '#fde047', e: '#111827', o: '#fb923c' }} u={3} />
        </g>
        {/* Le lapin qui traverse la grande salle, par petits bonds. */}
        <g>
          <Anim
            attributeName="transform"
            type="translate"
            values={etapes(-40, LARGEUR + 10, 48)
              .split(';')
              .map((x) => `${x} ${bas - 50}`)
              .join(';')}
            dur="18s"
            repeatCount="indefinite"
          />
          <g>
            <Anim attributeName="transform" type="translate" values="0 0;0 -7;0 -4;0 0" dur="0.6s" repeatCount="indefinite" />
            <Pixels grille={LAPIN} couleurs={{ w: '#f5f5f4', g: '#d6d3d1', e: '#111827', p: '#f9a8d4' }} />
          </g>
        </g>
      </g>
    )
  }
  if (quoi === 'noel') {
    return (
      <g pointerEvents="none">
        {/* Le sapin, ses boules qui clignotent, les cadeaux au pied. */}
        <g transform={`translate(876 ${bas - 64})`}>
          <Pixels grille={SAPIN} couleurs={{ g: '#15803d', y: '#fde047', r: '#ef4444', b: '#3b82f6', t: '#78350f' }} u={5} />
          {[
            [12, 22, '#f472b6'],
            [28, 32, '#facc15'],
            [16, 42, '#22d3ee'],
          ].map(([cx, cy, c], i) => (
            <rect key={i} x={cx as number} y={cy as number} width="4" height="4" fill={c as string}>
              <Anim attributeName="opacity" values="1;0.2;1" dur={`${0.8 + i * 0.3}s`} repeatCount="indefinite" />
            </rect>
          ))}
        </g>
        {[
          [856, '#dc2626'],
          [928, '#2563eb'],
        ].map(([x, c]) => (
          <g key={x}>
            <rect x={x as number} y={bas - 18} width="16" height="14" fill={c as string} />
            <rect x={(x as number) + 7} y={bas - 18} width="2" height="14" fill="#fde047" />
            <rect x={x as number} y={bas - 13} width="16" height="2" fill="#fde047" />
          </g>
        ))}
        {/* La guirlande le long du mur de la grande salle. */}
        {MUR_SALLE.flatMap(([de, a]) =>
          Array.from({ length: Math.floor((a - de) / 12) }, (_, i) => (
            <rect
              key={`${de}-${i}`}
              x={de + 4 + i * 12}
              y="243"
              width="3"
              height="3"
              fill={['#ef4444', '#facc15', '#22c55e', '#3b82f6'][i % 4]}
            >
              <Anim attributeName="opacity" values="1;0.25;1" dur="1.4s" begin={`${(i % 4) * 0.35}s`} repeatCount="indefinite" />
            </rect>
          )),
        )}
        {/* Un bonnet sur la baie serveur. */}
        <rect x="40" y="12" width="38" height="8" fill="#dc2626" />
        <rect x="40" y="18" width="38" height="3" fill="#f8fafc" />
        <rect x="76" y="8" width="5" height="5" fill="#f8fafc" />
      </g>
    )
  }
  return null
}
