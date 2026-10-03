/*
 * Ce que le visiteur a réglé derrière la roue dentée, tel qu'il est gardé dans
 * son navigateur. Relu champ par champ : une valeur abîmée ou d'une ancienne
 * version est ignorée plutôt que de faire planter la salle.
 */

import type { Language, ThemeName } from './types'

/** Ce que le visiteur a changé ; ce qu'il n'a pas touché suit les props. */
export type Preferences = {
  title?: string
  /** Le lieu de la météo à la fenêtre, à la place de celle des props. */
  weatherPlace?: string
  theme?: ThemeName
  language?: Language
  seasonal?: boolean
  night?: boolean
  motion?: boolean
  timeline?: boolean
}

export const THEMES: Array<ThemeName> = ['geek', 'eighties', 'gym', 'modern', 'kitchen']
export const LANGUES: Array<Language> = ['en', 'fr']
export const LONGUEUR_ENSEIGNE = 24

const INTERRUPTEURS = ['seasonal', 'night', 'motion', 'timeline'] as const

/** Ne garde que les réglages valides d'un objet venu du stockage. */
export function nettoyerPreferences(brut: unknown): Preferences {
  if (!brut || typeof brut !== 'object' || Array.isArray(brut)) return {}
  const b = brut as Record<string, unknown>
  const p: Preferences = {}
  if (typeof b.title === 'string' && b.title.trim()) p.title = b.title.slice(0, LONGUEUR_ENSEIGNE)
  if (typeof b.weatherPlace === 'string' && b.weatherPlace.trim()) p.weatherPlace = b.weatherPlace
  if (THEMES.includes(b.theme as ThemeName)) p.theme = b.theme as ThemeName
  if (LANGUES.includes(b.language as Language)) p.language = b.language as Language
  for (const cle of INTERRUPTEURS) if (typeof b[cle] === 'boolean') p[cle] = b[cle]
  return p
}

const CLE = 'pixel-openspace:settings'

export function lirePreferences(): Preferences {
  try {
    return nettoyerPreferences(JSON.parse(localStorage.getItem(CLE) ?? '{}'))
  } catch {
    return {}
  }
}

export function ecrirePreferences(preferences: Preferences) {
  try {
    if (Object.keys(preferences).length) localStorage.setItem(CLE, JSON.stringify(preferences))
    else localStorage.removeItem(CLE)
  } catch {
    /* Navigation privée ou stockage bloqué : le réglage vaut pour cette visite. */
  }
}

/*
 * Le magasin des préférences : le stockage n'est lu qu'une fois, et toutes les
 * salles ouvertes sont prévenues d'un changement, même dans un autre onglet.
 * Sans React : `navigateur.ts` le branche sur useSyncExternalStore.
 */
const AUCUNE: Preferences = {}
let enCache: Preferences | null = null
const abonnes = new Set<() => void>()

const prevenir = () => abonnes.forEach((f) => f())

/** Un autre onglet a changé les réglages : on les relira. */
function changeAilleurs(e: StorageEvent) {
  if (e.key !== CLE) return
  enCache = null
  prevenir()
}

export function preferencesActuelles(): Preferences {
  return (enCache ??= lirePreferences())
}

/** Au rendu serveur et pendant l'hydratation : rien n'est encore réglé. */
export const preferencesServeur = (): Preferences => AUCUNE

export function abonnerPreferences(f: () => void) {
  if (!abonnes.size) window.addEventListener('storage', changeAilleurs)
  abonnes.add(f)
  return () => {
    abonnes.delete(f)
    if (!abonnes.size) window.removeEventListener('storage', changeAilleurs)
  }
}

/** Change quelques réglages ; `null` les efface tous, et les props reprennent la main. */
export function changerPreferences(modif: Preferences | null) {
  const apres = modif === null ? {} : nettoyerPreferences({ ...preferencesActuelles(), ...modif })
  enCache = apres
  ecrirePreferences(apres)
  prevenir()
}
