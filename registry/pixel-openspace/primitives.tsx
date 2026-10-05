'use client'

/*
 * Les briques communes à tous les thèmes : la grille de pixels, les plantes,
 * les néons, les objets cliquables, les animations par sauts, les mots de la
 * scène et la couleur des lampes.
 */

import { createContext, useContext, useEffect, useRef, type ReactNode } from 'react'
import type { Statut } from './engine'
import { TEXTS, type Texts } from './i18n'

/* Les mots de la scène, dans la langue choisie, à portée de chaque morceau du décor. */
export const TextesContexte = createContext<Texts>(TEXTS.en)
export const useTextes = () => useContext(TextesContexte)

/* La couleur d'accent : le laiton de l'atelier, réglable par --po-accent. */
export const ACCENT = 'var(--po-accent)'

/* La couleur de la lampe, sur le plan. */
export const LAMPE_PLAN: Record<Statut, string> = {
  'au-travail': ACCENT,
  'a-jour': '#4ade80',
  'en-retard': '#fb923c',
  endormi: '#818cf8',
  'en-echec': '#ef4444',
  absent: '#52525b',
  jamais: '#a1a1aa',
  'a-la-demande': '#38bdf8',
}

/*
 * Les animations du décor (LED, néons, télé, ventilateurs, pluie…) ne passent
 * pas par les animations SVG du navigateur : Chrome les recalcule toutes à
 * chaque image, même quand rien ne change, et la page mangeait un tiers de
 * processeur pour des diodes. Chacune s'inscrit ici, et la boucle de la scène
 * les fait avancer par sauts, comme dans un vieux jeu : un élément n'est touché
 * que quand sa valeur change vraiment, et tout se fige au calme.
 *
 * `<Anim>` reprend la syntaxe de `<animate>` (values, dur, begin, keyTimes) :
 * les valeurs se succèdent à intervalles égaux, ou aux instants de keyTimes.
 */
export type Piste = {
  cible: Element
  attribut: string
  /** Pour une transformation : translate, rotate… */
  type?: string
  valeurs: Array<string>
  instants: Array<number> | null
  dureeMs: number
  debutMs: number
  derniere?: string
}

export const pistes = new Set<Piste>()

export const enMs = (duree: string | undefined) => (duree ? Number.parseFloat(duree) * (duree.endsWith('ms') ? 1 : 1000) : 0)

export function Anim({
  attributeName,
  type,
  values,
  dur,
  begin,
  keyTimes,
}: {
  attributeName: string
  type?: string
  values: string
  dur: string
  begin?: string
  keyTimes?: string
  repeatCount?: string
}) {
  const repere = useRef<SVGDescElement>(null)
  useEffect(() => {
    const cible = repere.current?.parentElement
    if (!cible) return
    const piste: Piste = {
      cible,
      attribut: attributeName,
      type,
      valeurs: values.split(';').map((v) => v.trim()),
      instants: keyTimes ? keyTimes.split(';').map(Number) : null,
      dureeMs: enMs(dur),
      debutMs: enMs(begin),
    }
    pistes.add(piste)
    return () => {
      pistes.delete(piste)
    }
  }, [attributeName, type, values, dur, begin, keyTimes])
  return <desc ref={repere} />
}

/** Fait avancer toutes les animations du décor à l'instant `t` (ms). */
export function animerLeDecor(t: number) {
  for (const p of pistes) {
    if (!p.dureeMs) continue
    const phase = ((((t - p.debutMs) % p.dureeMs) + p.dureeMs) % p.dureeMs) / p.dureeMs
    let i = Math.min(p.valeurs.length - 1, Math.floor(phase * p.valeurs.length))
    if (p.instants) {
      i = 0
      while (i + 1 < p.instants.length && p.instants[i + 1] <= phase) i++
    }
    const v = p.type ? `${p.type}(${p.valeurs[i]})` : p.valeurs[i]
    if (v !== p.derniere) {
      p.derniere = v
      p.cible.setAttribute(p.attribut, v)
    }
  }
}

/** Un trajet découpé en étapes, pour les animations qui déplacent quelque chose. */
export function etapes(de: number, a: number, n: number): string {
  return Array.from({ length: n + 1 }, (_, i) => Math.round((de + ((a - de) * i) / n) * 100) / 100).join(';')
}

export const allerRetour = (de: number, a: number, n: number) => `${etapes(de, a, n)};${etapes(a, de, n).split(';').slice(1).join(';')}`

/* ——— Le pixel ——— */

/** Dessine une grille de caractères, un caractère par pixel, en fusionnant les pixels voisins d'une ligne. */
export function Pixels({ grille, couleurs, u = 3 }: { grille: Array<string>; couleurs: Record<string, string>; u?: number }) {
  const rects: Array<ReactNode> = []
  grille.forEach((ligne, y) => {
    let x = 0
    while (x < ligne.length) {
      const c = ligne[x]
      let n = 1
      while (ligne[x + n] === c) n++
      if (couleurs[c]) rects.push(<rect key={`${x}-${y}`} x={x * u} y={y * u} width={n * u} height={u} fill={couleurs[c]} />)
      x += n
    }
  })
  return <>{rects}</>
}

export const PLANTE = ['..g...g.', '.gGg.gGg', 'gGgggGg.', '.gGgGggg', '..gggGg.', '...ggg..', '.pppppp.', '.PPPPPP.', '..PPPP..']

export function Plante({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <Pixels grille={PLANTE} couleurs={{ g: '#4caf50', G: '#2e7d32', p: '#d07a3e', P: '#a35a2a' }} />
    </g>
  )
}

/* ——— Le décor ——— */

/* Les pans du mur de la grande salle, entre ses entrées : le bureau du chef, le coin gaming, la cuisine. */
export const MUR_SALLE = [
  [20, 238],
  [282, 360],
  [650, 740],
  [975, 980],
]

/** Un néon : le texte, et son halo flou derrière. */
export function Neon({ x, y, texte, couleur, taille = 9 }: { x: number; y: number; texte: string; couleur: string; taille?: number }) {
  return (
    <g shapeRendering="auto">
      <text x={x} y={y} fontSize={taille} textAnchor="middle" fill={couleur} filter="url(#flou-neon)" opacity="0.9">
        {texte}
      </text>
      <text x={x} y={y} fontSize={taille} textAnchor="middle" fill="#fffbeb">
        {texte}
        <Anim attributeName="opacity" values="1;1;0.75;1;1" dur="4s" repeatCount="indefinite" />
      </text>
    </g>
  )
}

/** Un objet du décor qu'on peut cliquer : il s'éclaire au survol et mène quelque part. */
export function Cliquable({
  titre,
  faire,
  actif = true,
  children,
}: {
  titre: string
  faire: () => void
  actif?: boolean
  children: ReactNode
}) {
  if (!actif) return <>{children}</>
  return (
    <g
      role="link"
      tabIndex={0}
      aria-label={titre}
      className="cursor-pointer outline-none transition-[filter] hover:brightness-125 focus-visible:brightness-125"
      onClick={faire}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          faire()
        }
      }}
    >
      <title>{titre}</title>
      {children}
    </g>
  )
}

/** Une source de lumière dans la nuit ; colorée, elle jette en plus une lueur de sa couleur. */
export type Lumiere = { x: number; y: number; r: number; couleur?: string }

/** Ce dont tous les thèmes ont besoin : la trotteuse de l'horloge, la chute d'un bureau qui se monte, le flou des néons. */
export function DefsCommunes() {
  return (
    <defs>
      <style>{`@keyframes trotteuse { to { transform: rotate(360deg) } }
      @keyframes montage-bureau {
        from { transform: translateY(-160px); opacity: 0 }
        60% { transform: translateY(6px); opacity: 1 }
        to { transform: none; opacity: 1 }
      }`}</style>
      <filter id="flou-neon" x="-20%" y="-50%" width="140%" height="200%">
        <feGaussianBlur stdDeviation="2.2" />
      </filter>
    </defs>
  )
}

/**
 * Un nombre stable tiré d'un identifiant : il choisit les cheveux, la peau et
 * la tenue d'un agent, qui restent les mêmes d'une visite à l'autre.
 */
export function hacher(id: string, graine: number, facteur: number) {
  let h = graine
  for (const c of id) h = (h * facteur + c.charCodeAt(0)) >>> 0
  return h
}
