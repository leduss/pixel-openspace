/*
 * Le journal des versions, lu dans CHANGELOG.md ou CHANGELOG.fr.md au
 * moment du rendu : la landing suit le fichier, sans rien recopier.
 */

import { readFileSync } from 'node:fs'
import path from 'node:path'
import type { Language } from '@/registry/pixel-openspace/types'

export type Rubrique = { titre: string; lignes: Array<string> }
export type Version = { numero: string; date: string; intro: Array<string>; rubriques: Array<Rubrique> }

/** Découpe le journal en versions : « ## 0.5.0 · 2026-10-17 », ses « ### Ajouté », ses puces. */
export function lireJournal(texte: string): Array<Version> {
  const versions: Array<Version> = []
  let version: Version | null = null
  let rubrique: Rubrique | null = null
  for (const ligne of texte.split('\n')) {
    const titre = ligne.match(/^## (\d+\.\d+\.\d+)\s*·\s*(.+)$/)
    if (titre) {
      version = { numero: titre[1], date: titre[2].trim(), intro: [], rubriques: [] }
      rubrique = null
      versions.push(version)
      continue
    }
    // Un autre titre de niveau 2 (« Mettre à jour ») clôt la version en cours.
    if (ligne.startsWith('## ')) {
      version = null
      continue
    }
    if (!version) continue
    if (ligne.startsWith('### ')) {
      rubrique = { titre: ligne.slice(4).trim(), lignes: [] }
      version.rubriques.push(rubrique)
    } else if (ligne.startsWith('- ') && rubrique) {
      rubrique.lignes.push(ligne.slice(2).trim())
    } else if (ligne.trim() && rubrique?.lignes.length) {
      // La suite d'une puce coupée sur plusieurs lignes.
      rubrique.lignes[rubrique.lignes.length - 1] += ` ${ligne.trim()}`
    } else if (ligne.trim() && !rubrique) {
      version.intro.push(ligne.trim())
    }
  }
  return versions
}

/** Les versions du journal, dans la langue de la page. */
export function journal(langue: Language): Array<Version> {
  // Les deux noms écrits en toutes lettres : le build ne trace que ces deux fichiers, pas tout le projet.
  const fichier = langue === 'fr' ? path.join(process.cwd(), 'CHANGELOG.fr.md') : path.join(process.cwd(), 'CHANGELOG.md')
  return lireJournal(readFileSync(fichier, 'utf8'))
}
