import { describe, expect, it } from 'vitest'
import { nettoyerPreferences } from './preferences'

describe('préférences', () => {
  it('garde les réglages valides', () => {
    const p = {
      title: 'MON ATELIER',
      weatherPlace: 'Lanton',
      theme: 'gym',
      language: 'fr',
      seasonal: false,
      night: true,
      motion: false,
      timeline: false,
    }
    expect(nettoyerPreferences(p)).toEqual(p)
  })

  it('ignore ce qui est abîmé ou inconnu', () => {
    expect(nettoyerPreferences({ theme: 'disco', language: 'de', seasonal: 'non', title: 42, inconnu: true })).toEqual({})
    expect(nettoyerPreferences({ title: '   ', weatherPlace: '' })).toEqual({})
  })

  it('résiste à tout ce qui n’est pas un objet', () => {
    expect(nettoyerPreferences(null)).toEqual({})
    expect(nettoyerPreferences('geek')).toEqual({})
    expect(nettoyerPreferences([1, 2])).toEqual({})
  })

  it('coupe une enseigne trop longue', () => {
    expect(nettoyerPreferences({ title: 'A'.repeat(40) }).title).toHaveLength(24)
  })
})
