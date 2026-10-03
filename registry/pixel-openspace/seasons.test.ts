import { describe, expect, it } from 'vitest'
import { dimancheDePaques, fete } from './seasons'

const jour = (iso: string) => new Date(`${iso}T12:00:00`).getTime()
const enClair = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

describe('dimancheDePaques', () => {
  it('tombe aux dates connues', () => {
    expect(enClair(dimancheDePaques(2024))).toBe('2024-03-31')
    expect(enClair(dimancheDePaques(2025))).toBe('2025-04-20')
    expect(enClair(dimancheDePaques(2026))).toBe('2026-04-05')
    expect(enClair(dimancheDePaques(2027))).toBe('2027-03-28')
    expect(enClair(dimancheDePaques(2038))).toBe('2038-04-25')
  })
})

describe('fete', () => {
  it('décore tout octobre pour Halloween et tout décembre pour Noël', () => {
    expect(fete(jour('2026-10-01'))).toBe('halloween')
    expect(fete(jour('2026-10-31'))).toBe('halloween')
    expect(fete(jour('2026-12-01'))).toBe('noel')
    expect(fete(jour('2026-12-31'))).toBe('noel')
  })

  it('décore pour Pâques deux semaines avant, jusqu’au lundi de Pâques', () => {
    expect(fete(jour('2026-03-21'))).toBe(null)
    expect(fete(jour('2026-03-22'))).toBe('paques')
    expect(fete(jour('2026-04-05'))).toBe('paques')
    expect(fete(jour('2026-04-06'))).toBe('paques')
    expect(fete(jour('2026-04-07'))).toBe(null)
  })

  it('ne décore pas le reste de l’année', () => {
    expect(fete(jour('2026-07-14'))).toBe(null)
  })
})
