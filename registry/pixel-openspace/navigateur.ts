'use client'

/*
 * Ce que seul le navigateur connaît, lu sans décalage avec le rendu serveur :
 * useSyncExternalStore donne la valeur du serveur pendant l'hydratation, puis
 * celle du navigateur, sans état recopié dans un effet.
 */

import { useSyncExternalStore } from 'react'
import { abonnerPreferences, preferencesActuelles, preferencesServeur } from './preferences'

const sansAbonnement = () => () => {}

/** Vrai dans le navigateur ; faux au rendu serveur et pendant l'hydratation. */
export function useDansLeNavigateur() {
  return useSyncExternalStore(
    sansAbonnement,
    () => true,
    () => false,
  )
}

/** Les réglages du visiteur, à jour dans toutes les salles ouvertes. */
export function usePreferences() {
  return useSyncExternalStore(abonnerPreferences, preferencesActuelles, preferencesServeur)
}
