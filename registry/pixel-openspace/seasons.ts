/**
 * Les fêtes de la salle : Halloween tout octobre, Noël tout décembre, et
 * Pâques des deux semaines qui la précèdent jusqu'au lundi de Pâques.
 */
export type Fete = 'halloween' | 'noel' | 'paques' | null

/** Le dimanche de Pâques d'une année, par l'algorithme grégorien (Meeus, Jones, Butcher). */
export function dimancheDePaques(annee: number): Date {
  const a = annee % 19
  const b = Math.floor(annee / 100)
  const c = annee % 100
  const d = Math.floor(b / 4)
  const e = b % 4
  const f = Math.floor((b + 8) / 25)
  const g = Math.floor((b - f + 1) / 3)
  const h = (19 * a + b - d - g + 15) % 30
  const i = Math.floor(c / 4)
  const k = c % 4
  const l = (32 + 2 * e + 2 * i - h - k) % 7
  const m = Math.floor((a + 11 * h + 22 * l) / 451)
  const mois = Math.floor((h + l - 7 * m + 114) / 31)
  const jour = ((h + l - 7 * m + 114) % 31) + 1
  return new Date(annee, mois - 1, jour)
}

const JOUR_MS = 86_400_000

export function fete(maintenant: number): Fete {
  const d = new Date(maintenant)
  if (d.getMonth() === 9) return 'halloween'
  if (d.getMonth() === 11) return 'noel'
  const paques = dimancheDePaques(d.getFullYear()).getTime()
  const aujourdhui = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
  // Deux semaines avant le dimanche de Pâques, jusqu'au lundi de Pâques inclus.
  if (aujourdhui >= paques - 14 * JOUR_MS && aujourdhui <= paques + JOUR_MS) return 'paques'
  return null
}
