'use client'

/*
 * Les postes et les gens : le bureau de chaque agent, les sprites des bonshommes, leurs bulles et leurs étiquettes.
 */

import { memo } from 'react'
import { BUREAU, CHEF_ID, LARGEUR, type PlaceBureau } from './engine'
import { Anim, LAMPE_PLAN, Pixels, useTextes } from './primitives'
import { type Assise, type Pose, type Vue } from './vue'
import { useTheme } from './contexte'
import { Lampe, PlanteDeBureau, Poussiere } from './decor'

/* ——— Les postes ——— */

export function Poste({
  vue,
  place,
  occupe,
  bientot,
  monte,
  oublie,
  choisi,
  choisir,
}: {
  vue: Vue
  place: PlaceBureau
  occupe: boolean
  bientot: number | null
  /** Le bureau d'un agent qui arrive : il tombe du plafond et se pose. */
  monte: boolean
  /** Un agent qui ne passe plus depuis des jours : plante fanée, écran poussiéreux. */
  oublie: boolean
  choisi: boolean
  choisir: () => void
}) {
  const t = useTextes()
  const theme = useTheme()
  const { fiche, statut } = vue
  const { cx, dy } = place
  const x = cx - BUREAU.largeur / 2
  const dessus = BUREAU.hauteur - 12
  const chaise = { x: place.siege.pos.x, y: place.siege.pos.y + 4 }
  const chef = place.id === CHEF_ID
  const accent = chef ? '#e3b95a' : theme.tenue(fiche.id).c
  const allume = statut !== 'absent'
  const bureau = { cx, dy, x, dessus, statut, accent, bientot, emoji: fiche.emoji }

  return (
    <g
      role="button"
      tabIndex={0}
      aria-label={`${fiche.nom}, ${t.statuses[statut]}`}
      className="cursor-pointer outline-none"
      style={monte ? { animation: 'montage-bureau 1.4s cubic-bezier(0.2, 0.9, 0.3, 1.2) both' } : undefined}
      onClick={choisir}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          choisir()
        }
      }}
    >
      <title>{`${fiche.nom} — ${t.statuses[statut]}`}</title>
      {monte ? (
        <g>
          <rect x={cx - 34} y={dy - 36} width="68" height="14" fill="#1b1410" />
          <rect x={cx - 33} y={dy - 35} width="66" height="12" fill="var(--po-accent)" />
          <text x={cx} y={dy - 26} fontSize="8" textAnchor="middle" fill="#1b1410">
            {t.newDesk}
          </text>
          <Anim attributeName="opacity" values="1;0.4;1" dur="0.8s" repeatCount="indefinite" />
        </g>
      ) : null}
      {choisi ? (
        <rect
          x={x - 8}
          y={dy - 22}
          width={BUREAU.largeur + 16}
          height={BUREAU.hauteur + 66}
          fill="rgb(255 255 255 / 0.06)"
          stroke="var(--po-accent)"
          strokeWidth="2"
          strokeDasharray="6 4"
        />
      ) : null}

      {chef ? (
        <>
          <theme.Fauteuil x={cx} y={place.siege.pos.y} />
          <theme.BureauChef {...bureau} />
          {/* La plaque du chef, en laiton, tournée vers la pièce. */}
          <rect x={cx - 42} y={dy + dessus + 1} width="84" height="9" fill="#b8892f" />
          <rect x={cx - 41} y={dy + dessus + 2} width="82" height="7" fill="#e3b95a" />
          <Lampe x={cx - 37} y={dy + dessus + 3} statut={statut} />
          <text x={cx + 3} y={dy + dessus + 8.5} fontSize="8" textAnchor="middle" fill="#4a3412">
            {fiche.nom}
          </text>
        </>
      ) : (
        <>
          <theme.Bureau {...bureau} />
          {/* La tranche porte le nom, avec la lampe. */}
          <Lampe x={x + 6} y={dy + dessus + 3} statut={statut} />
          <text x={cx + 4} y={dy + dessus + 8.5} fontSize="9" textAnchor="middle" fill={theme.plaque} opacity={allume ? 1 : 0.5}>
            {fiche.nom}
          </text>
          {oublie ? <Poussiere cx={cx} dy={dy} /> : null}
          <PlanteDeBureau x={x - 15} y={dy + 30} fanee={oublie} />

          {/* Le siège : l'assise seule quand l'agent y est (son dossier passe devant lui), repoussé sinon. */}
          {occupe ? (
            <theme.Assise x={chaise.x} y={chaise.y} couleur={accent} />
          ) : (
            <g transform="translate(9 3)">
              <theme.Assise x={chaise.x} y={chaise.y} couleur={accent} />
              <theme.Dossier x={chaise.x} y={chaise.y} couleur={accent} />
            </g>
          )}
        </>
      )}
    </g>
  )
}

export type Direction = 'haut' | 'bas' | 'gauche' | 'droite'

export function direction(angle: number): Direction {
  const a = ((angle % 360) + 360) % 360
  if (a < 45 || a >= 315) return 'haut'
  if (a < 135) return 'droite'
  if (a < 225) return 'bas'
  return 'gauche'
}

/* Un bonhomme fait 8 pixels sur 12 : la tête, le sweat à capuche, les jambes. */
export const TETE: Record<'haut' | 'bas' | 'droite', Array<string>> = {
  bas: ['..hhhh..', '.hhhhhh.', '.hssssh.', '.sesses.', '.cssssc.'],
  haut: ['..hhhh..', '.hhhhhh.', '.hhhhhh.', '.hhhhhh.', '.cchhcc.'],
  droite: ['..hhhh..', '.hhhhhh.', '.hhhsss.', '.hhhses.', '.ccsss..'],
}
/* La même, casque audio sur les oreilles. */
export const TETE_CASQUE: Record<'haut' | 'bas' | 'droite', Array<string>> = {
  bas: ['..kkkk..', '.khhhhk.', 'khsssshk', 'ksessesk', '.cssssc.'],
  haut: ['..kkkk..', '.khhhhk.', 'khhhhhhk', 'khhhhhhk', '.cchhcc.'],
  droite: ['..kkkk..', '.hhhkhh.', '.hhkkss.', '.hhkses.', '.ccsss..'],
}
/* Le sweat : la poche ventrale et les cordons de capuche (`t`). */
export const BUSTE: Record<'haut' | 'bas' | 'droite', Array<string>> = {
  bas: ['.ctcctc.', 'cctcctcc', 'sccccccs', '.cCCCCc.'],
  haut: ['.cccccc.', 'cccccccc', 'sccccccs', '.cccccc.'],
  droite: ['..cccc..', '..cccc..', '..ccsc..', '..cCCc..'],
}
/* Les jambes : debout, puis les deux temps du pas. */
export const JAMBES: Record<'face' | 'cote', Array<Array<string>>> = {
  face: [
    ['.pp..pp.', '.pp..pp.', '.bb..bb.'],
    ['.pp..pp.', '.pp..bb.', '.bb.....'],
    ['.pp..pp.', '.bb..pp.', '.....bb.'],
  ],
  cote: [
    ['..pppp..', '..pp.p..', '..bb.bb.'],
    ['..pppp..', '.pp...p.', '.bb...bb'],
    ['..pppp..', '...pp...', '...bbb..'],
  ],
}

/* Les bras levés de l'agent qui s'étire, vu de dos. */
export const ETIREMENT = ['s.hhhh.s', 'chhhhhhc', 'chhhhhhc', 'chhhhhhc', 'c.hhhh.c', '.cccccc.', 'cccccccc', 'cccccccc']

export function grilleSprite(sens: Direction, temps: number, assise: Assise, etire: boolean, casque: boolean): Array<string> {
  if (etire && assise === 'bureau' && sens === 'haut') return ETIREMENT
  const tete = casque ? TETE_CASQUE : TETE
  // Au bureau ou sur un pouf, de dos devant l'écran ; le chef, lui, trône face à la pièce.
  if (assise) return sens === 'bas' ? [...tete.bas, ...BUSTE.bas.slice(0, 3)] : [...tete.haut, ...BUSTE.haut.slice(0, 3)]
  const miroir = sens === 'gauche'
  const s = miroir ? 'droite' : sens
  const g = [...tete[s], ...BUSTE[s], ...JAMBES[s === 'droite' ? 'cote' : 'face'][temps]]
  return miroir ? g.map((l) => [...l].reverse().join('')) : g
}

export const CONTOUR = Object.fromEntries([...'hsectCkpb'].map((c) => [c, '#0b0d10']))

/** Le bonhomme, contour sombre compris. Mémorisé : il ne change qu'au pas suivant. */
export const Sprite = memo(function Sprite({
  id,
  sens,
  temps,
  assise,
  etire,
}: {
  id: string
  sens: Direction
  temps: number
  assise: Assise
  etire: boolean
}) {
  const theme = useTheme()
  const grille = grilleSprite(sens, temps, assise, etire, theme.casque(id))
  return (
    <>
      {[
        [-1, 0],
        [1, 0],
        [0, -1],
        [0, 1],
      ].map(([dx, dy]) => (
        <g key={`${dx}${dy}`} transform={`translate(${dx} ${dy})`}>
          <Pixels grille={grille} couleurs={CONTOUR} />
        </g>
      ))}
      <Pixels grille={grille} couleurs={theme.tenue(id)} />
    </>
  )
})

/** La hauteur du sprite au-dessus du point où il se tient, et le haut de sa tête. */
export function cadrage(pose: Pose) {
  const rangs = pose.assise ? 8 : 12
  // Assis, il s'enfonce dans son fauteuil ou son pouf : au bureau, sa tête passe sous la plaque.
  const bas = pose.assise ? pose.y + 8 : pose.y
  return { haut: bas - rangs * 3, bas }
}

export function Personnage({ id, pose, etire, choisir }: { id: string; pose: Pose; etire: boolean; choisir?: (id: string) => void }) {
  const theme = useTheme()
  const temps = pose.marche ? 1 + (Math.floor(pose.pas / 170) % 2) : 0
  const { haut, bas } = cadrage(pose)
  return (
    <g className={choisir ? 'cursor-pointer' : undefined} onClick={choisir ? () => choisir(id) : undefined}>
      {pose.assise ? null : <ellipse cx={pose.x} cy={bas} rx="10" ry="3" fill="black" opacity="0.3" shapeRendering="auto" />}
      <g transform={`translate(${Math.round(pose.x) - 12} ${Math.round(haut)})`}>
        <Sprite id={id} sens={direction(pose.angle)} temps={temps} assise={pose.assise} etire={etire} />
        {/* Le colis du livreur, porté à bout de bras. */}
        {pose.porte ? (
          <g>
            <rect x="3" y="17" width="18" height="12" fill="#b45309" />
            <rect x="3" y="17" width="18" height="3" fill="#d97706" />
            <rect x="10" y="17" width="4" height="12" fill="#fde68a" />
          </g>
        ) : !pose.assise && theme.tasse?.(id) ? (
          /* La tasse, tenue à la main droite. */
          <g>
            <rect x="18" y="19" width="6" height="7" fill="#0b0d10" />
            <rect x="19" y="20" width="4" height="5" fill="#fafaf9" />
            <rect x="24" y="21" width="2" height="3" fill="#0b0d10" />
            <rect x="19" y="20" width="4" height="1" fill="#6b3a1e" />
          </g>
        ) : null}
      </g>
    </g>
  )
}

/**
 * Au-dessus de la tête, une chose à la fois : la bulle de celui qui parle,
 * l'icône de celui qui a un souci, ou l'étiquette de celui qui travaille.
 */
export function Annonce({ vue, pose, parole }: { vue: Vue; pose: Pose; parole: string | null }) {
  const t = useTextes()
  const { statut, fiche } = vue
  const { haut } = cadrage(pose)
  const x = Math.round(pose.x)

  if (parole) return <Parole x={x} haut={haut} texte={parole} />

  if (pose.assise === 'bureau' && (statut === 'en-echec' || statut === 'en-retard')) {
    return (
      <g transform={`translate(${x + 10} ${haut - 14})`} pointerEvents="none">
        <rect width="16" height="14" fill="#1b1410" />
        <rect x="1" y="1" width="14" height="12" fill={statut === 'en-echec' ? '#ef4444' : '#fb923c'} />
        <text x="8" y="11" fontSize="10" textAnchor="middle" fill="white">
          {statut === 'en-echec' ? '!' : 'z'}
        </text>
        <Anim
          attributeName="transform"
          type="translate"
          values={`${x + 10} ${haut - 14};${x + 10} ${haut - 17};${x + 10} ${haut - 14}`}
          dur="1.4s"
          repeatCount="indefinite"
        />
      </g>
    )
  }

  if (statut !== 'au-travail') return null
  const libelle = t.statuses[statut]
  const largeur = Math.round(Math.max(fiche.nom.length * 5.4, libelle.length * 4.6 + 12) + 12)
  return (
    <g transform={`translate(${x - Math.round(largeur / 2)} ${haut - 30})`} pointerEvents="none">
      <rect width={largeur} height="26" fill="#1b1410" />
      <rect x="1" y="1" width={largeur - 2} height="24" fill="#2b2420" />
      <text x="6" y="11" fontSize="9" fill="#fafaf9">
        {fiche.nom}
      </text>
      <rect x="6" y="15" width="5" height="5" fill={LAMPE_PLAN[statut]} />
      <text x="14" y="21" fontSize="8" fill={LAMPE_PLAN[statut]}>
        {libelle}
      </text>
    </g>
  )
}

/** Une bulle de bande dessinée, en pixels ; « … » fait danser trois points. */
export function Parole({ x, haut, texte }: { x: number; haut: number; texte: string }) {
  const points = texte === '…'
  const court = texte.length > 46 ? `${texte.slice(0, 45)}…` : texte
  const largeur = points ? 26 : Math.round(court.length * 4.5 + 12)
  const gauche = Math.min(Math.max(x - largeur / 2, 8), LARGEUR - largeur - 8)
  const y = haut - 24
  return (
    <g pointerEvents="none">
      <rect x={gauche - 1} y={y - 1} width={largeur + 2} height="18" fill="#1b1410" />
      <rect x={gauche} y={y} width={largeur} height="16" fill="#fafaf9" />
      <rect x={x - 4} y={y + 16} width="8" height="3" fill="#fafaf9" />
      <rect x={x - 1} y={y + 19} width="3" height="3" fill="#fafaf9" />
      {points ? (
        [7, 13, 19].map((dx, i) => (
          <rect key={dx} x={gauche + dx - 1} y={y + 7} width="3" height="3" fill="#44403c">
            <Anim attributeName="opacity" values="0.2;1;0.2" dur="1s" begin={`${i * 0.2}s`} repeatCount="indefinite" />
          </rect>
        ))
      ) : (
        <text x={gauche + 6} y={y + 11} fontSize="8" fill="#1c1917">
          {court}
        </text>
      )}
    </g>
  )
}
