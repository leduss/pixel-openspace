import { describe, expect, it } from 'vitest'
import { cielDe, coordonnees } from './meteo'

describe('météo', () => {
  it('ramène les codes de l’OMS à un ciel', () => {
    expect(cielDe(0)).toBe('clear')
    expect(cielDe(3)).toBe('clouds')
    expect(cielDe(45)).toBe('fog')
    expect(cielDe(61)).toBe('rain')
    expect(cielDe(73)).toBe('snow')
    expect(cielDe(95)).toBe('storm')
  })

  it('reconnaît des coordonnées', () => {
    expect(coordonnees('44.7036,-1.0386')).toEqual({ latitude: 44.7036, longitude: -1.0386 })
    expect(coordonnees(' 48.85 , 2.35 ')).toEqual({ latitude: 48.85, longitude: 2.35 })
    expect(coordonnees('Lanton')).toBeNull()
    expect(coordonnees('95,10')).toBeNull()
  })
})
