/*
 * La météo derrière la fenêtre du chef, pour le serveur local : la recherche
 * Open-Meteo du composant (`weather.ts`), relue toutes les quinze minutes.
 */

import type { Language, Weather } from '../../registry/pixel-openspace/types'
import { lireMeteo, localiser, type Endroit } from '../../registry/pixel-openspace/weather'

export { cielDe, coordonnees } from '../../registry/pixel-openspace/weather'

/**
 * Suit la météo d'un lieu en arrière-plan. `lire()` rend le dernier temps
 * connu : hors réseau, la fenêtre garde le précédent, ou reste sans météo.
 */
export function suivreMeteo(lieu: string, langue: Language) {
  let actuelle: Weather | null = null
  let endroit: Endroit | null = null
  const rafraichir = async () => {
    try {
      endroit ??= await localiser(lieu, langue)
      actuelle = { ...(await lireMeteo(endroit)), place: endroit.nom ?? lieu }
    } catch (erreur) {
      console.error(`pixel-openspace: weather unavailable (${(erreur as Error).message})`)
    }
  }
  void rafraichir()
  setInterval(rafraichir, 15 * 60_000).unref()
  return { lire: () => actuelle }
}
