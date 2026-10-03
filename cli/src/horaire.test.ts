import { describe, expect, it } from 'vitest'
import { decrire, horaireCron, horaireLaunchd, passagePrecedent, prochainPassage } from './horaire'

// Un samedi, 3 octobre 2026, à 15 h 40.
const MAINTENANT = new Date(2026, 9, 3, 15, 40)
const date = (j: number, h: number, m: number) => new Date(2026, 9, j, h, m)

describe('cron', () => {
  it('trouve le prochain passage quotidien', () => {
    expect(prochainPassage(horaireCron('30 7 * * *'), MAINTENANT)).toEqual(date(4, 7, 30))
    expect(passagePrecedent(horaireCron('30 7 * * *'), MAINTENANT)).toEqual(date(3, 7, 30))
  })

  it('comprend les pas, les plages et les noms', () => {
    expect(prochainPassage(horaireCron('*/15 * * * *'), MAINTENANT)).toEqual(date(3, 15, 45))
    expect(prochainPassage(horaireCron('0 9 * * mon-fri'), MAINTENANT)).toEqual(date(5, 9, 0))
    expect(prochainPassage(horaireCron('@monthly'), MAINTENANT)).toEqual(new Date(2026, 10, 1, 0, 0))
  })

  it('le dimanche vaut 0 comme 7', () => {
    expect(prochainPassage(horaireCron('0 10 * * 7'), MAINTENANT)).toEqual(date(4, 10, 0))
  })

  it('prend le jour du mois ou celui de la semaine quand les deux sont fixés', () => {
    // Le 15 du mois, ou le lundi : le lundi 5 vient en premier.
    expect(prochainPassage(horaireCron('0 8 15 * 1'), MAINTENANT)).toEqual(date(5, 8, 0))
  })

  it("n'a pas d'horaire au démarrage", () => {
    expect(horaireCron('@reboot')).toEqual({ type: 'aucun' })
  })

  it('refuse une ligne invalide', () => {
    expect(() => horaireCron('61 * * * *')).toThrow()
    expect(() => horaireCron('* * *')).toThrow()
  })
})

describe('launchd', () => {
  it('lit StartCalendarInterval, seul ou en liste', () => {
    const lundi = horaireLaunchd({ StartCalendarInterval: { Weekday: 1, Hour: 9, Minute: 15 } })
    expect(prochainPassage(lundi, MAINTENANT)).toEqual(date(5, 9, 15))
    const deuxFois = horaireLaunchd({
      StartCalendarInterval: [
        { Hour: 7, Minute: 0 },
        { Hour: 19, Minute: 0 },
      ],
    })
    expect(prochainPassage(deuxFois, MAINTENANT)).toEqual(date(3, 19, 0))
    expect(passagePrecedent(deuxFois, MAINTENANT)).toEqual(date(3, 7, 0))
  })

  it('compte un intervalle depuis le dernier passage', () => {
    const toutesLes10 = horaireLaunchd({ StartInterval: 600 })
    expect(prochainPassage(toutesLes10, MAINTENANT, date(3, 15, 35))).toEqual(date(3, 15, 45))
    expect(prochainPassage(toutesLes10, MAINTENANT)).toBeNull()
  })
})

describe('decrire', () => {
  it('met les horaires simples en mots', () => {
    expect(decrire(horaireCron('30 7 * * *'), 'fr')).toBe('chaque jour à 7 h 30')
    expect(decrire(horaireCron('30 7 * * *'), 'en')).toBe('daily at 7:30')
    expect(decrire(horaireCron('*/15 * * * *'), 'en')).toBe('every 15 min')
    expect(decrire(horaireCron('5 * * * *'), 'fr')).toBe('toutes les heures à 5 min')
    expect(decrire(horaireLaunchd({ StartCalendarInterval: { Weekday: 1, Hour: 9, Minute: 15 } }), 'fr')).toBe('le lundi à 9 h 15')
    expect(decrire(horaireCron('0 2 1 * *'), 'fr')).toBe('le 1er du mois à 2 h')
    expect(decrire(horaireLaunchd({ StartInterval: 1800 }), 'en')).toBe('every 30 min')
    expect(decrire(horaireLaunchd({ StartInterval: 86400 }), 'fr')).toBe('chaque jour')
  })

  it('regroupe plusieurs heures dans la journée', () => {
    expect(
      decrire(
        horaireLaunchd({
          StartCalendarInterval: [
            { Hour: 7, Minute: 30 },
            { Hour: 12, Minute: 30 },
          ],
        }),
        'fr',
      ),
    ).toBe('chaque jour à 7 h 30, 12 h 30')
  })

  it('renonce aux horaires compliqués', () => {
    expect(decrire(horaireCron('0 9 * 1-6 1'), 'en')).toBeNull()
  })
})
