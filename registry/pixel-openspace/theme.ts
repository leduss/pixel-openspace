import type { ComponentType } from 'react'
import type { CoinDePause, Statut } from './engine'
import type { Lumiere } from './primitives'
import type { SceneObject } from './types'

/** Ce que le décor reçoit pour se dessiner et se rendre cliquable. */
export type PropsDecor = {
  hauteur: number
  /** L'enseigne du mur de la grande salle. */
  titre: string
  liens: Partial<Record<SceneObject, string>>
  aller: (objet: SceneObject) => void
  jouer: (jeu: 'snake' | 'casse-briques') => void
}

/** Ce qu'un bureau reçoit : sa place sur le plan, l'état de son agent, ce qui s'affiche sur son poste. */
export type PropsBureau = {
  /** Le centre du bureau, le haut du plateau, son bord gauche, et la hauteur du plateau sans sa tranche. */
  cx: number
  dy: number
  x: number
  dessus: number
  statut: Statut
  /** La couleur de l'agent : ses LED, son fauteuil. */
  accent: string
  /** Les minutes avant le prochain passage, quand il approche. */
  bientot: number | null
  emoji: string
}

export type PropsSiege = { x: number; y: number; couleur: string }

/**
 * Un thème d'open space : le décor des pièces, les postes, les tenues, les
 * coins de pause et les lumières de nuit. Le moteur, les bonshommes, les
 * bulles, le tableau blanc, l'horloge, la fenêtre et les saisons sont
 * communs à tous.
 */
export type Theme = {
  /** Les coins des pièces du haut où les agents vont faire une pause. */
  coins: Array<CoinDePause>
  /** Le coin où le café coule quand quelqu'un attend devant. */
  coinCafe?: string
  /** Le fond autour de la scène. */
  fond: string
  /** Les sols, les murs et les pièces du haut, avec leurs objets. */
  Decor: ComponentType<PropsDecor>
  /** Le bureau d'un agent : plateau, tranche, et tout ce qui est posé dessus. */
  Bureau: ComponentType<PropsBureau>
  /** Le bureau du chef, derrière lequel il trône face à la pièce. */
  BureauChef: ComponentType<PropsBureau>
  /** La couleur du nom sur la tranche des bureaux. */
  plaque: string
  /** L'assise du siège, son dossier (qui passe devant le dos de l'agent assis), et le fauteuil du chef. */
  Assise: ComponentType<PropsSiege>
  Dossier: ComponentType<PropsSiege>
  Fauteuil: ComponentType<{ x: number; y: number }>
  /** Les couleurs d'un bonhomme, d'après son identifiant : cheveux, peau, haut, bas… */
  tenue: (id: string) => Record<string, string>
  /** Porte-t-il un casque audio ? */
  casque: (id: string) => boolean
  /** Le café qui coule, quand quelqu'un attend au coin café. */
  CafeQuiCoule?: ComponentType
  /** Les lumières du décor dans la nuit. */
  lumieres: Array<Lumiere>
  /** Une lumière de plus par poste occupé (une tour RGB…). */
  lumierePoste?: (cx: number, dy: number, accent: string) => Array<Lumiere>
}
