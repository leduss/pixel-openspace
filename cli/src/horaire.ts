/*
 * Les horaires des tâches : ceux de cron et ceux de launchd se ramènent au
 * même calendrier, champ par champ. On en tire le prochain passage, le
 * dernier passage prévu, et une phrase lisible.
 */

import type { Language } from '../../registry/pixel-openspace/types'

/** Pour chaque champ, les valeurs permises, ou null pour « toutes ». Le dimanche vaut 0. */
export type Calendrier = {
  minute: Array<number> | null
  heure: Array<number> | null
  jour: Array<number> | null
  mois: Array<number> | null
  semaine: Array<number> | null
}

export type Horaire = { type: 'calendrier'; calendriers: Array<Calendrier> } | { type: 'intervalle'; secondes: number } | { type: 'aucun' }

const TOUTES = { minute: [0, 59], heure: [0, 23], jour: [1, 31], mois: [1, 12], semaine: [0, 7] } as const
const MOIS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec']
const JOURS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat']

const RACCOURCIS: Record<string, string> = {
  '@yearly': '0 0 1 1 *',
  '@annually': '0 0 1 1 *',
  '@monthly': '0 0 1 * *',
  '@weekly': '0 0 * * 0',
  '@daily': '0 0 * * *',
  '@midnight': '0 0 * * *',
  '@hourly': '0 * * * *',
}

/** Un champ de cron : `*`, `5`, `1-5`, `*\/15`, `mon,wed`… */
function champ(texte: string, nom: keyof typeof TOUTES, noms?: Array<string>): Array<number> | null {
  if (texte === '*') return null
  const [min, max] = TOUTES[nom]
  const valeur = (v: string) => {
    const i = noms?.indexOf(v.toLowerCase()) ?? -1
    if (i >= 0) return nom === 'mois' ? i + 1 : i
    const n = Number(v)
    if (!Number.isInteger(n) || n < min || n > max) throw new Error(`invalid ${nom}: ${v}`)
    return n
  }
  const valeurs = new Set<number>()
  for (const partie of texte.split(',')) {
    const [plage, pas = '1'] = partie.split('/')
    const [de, a] =
      plage === '*'
        ? [min, max]
        : plage.includes('-')
          ? plage.split('-').map(valeur)
          : [valeur(plage), partie.includes('/') ? max : valeur(plage)]
    for (let v = de; v <= a; v += Number(pas)) valeurs.add(nom === 'semaine' && v === 7 ? 0 : v)
  }
  return [...valeurs].sort((x, y) => x - y)
}

/** Les cinq champs d'une ligne de crontab, ou un de ses raccourcis. `@reboot` n'a pas d'horaire. */
export function horaireCron(expression: string): Horaire {
  if (expression === '@reboot') return { type: 'aucun' }
  const champs = (RACCOURCIS[expression] ?? expression).trim().split(/\s+/)
  if (champs.length !== 5) throw new Error(`invalid cron expression: ${expression}`)
  const [minute, heure, jour, mois, semaine] = champs
  return {
    type: 'calendrier',
    calendriers: [
      {
        minute: champ(minute, 'minute'),
        heure: champ(heure, 'heure'),
        jour: champ(jour, 'jour'),
        mois: champ(mois, 'mois', MOIS),
        semaine: champ(semaine, 'semaine', JOURS),
      },
    ],
  }
}

type IntervalleLaunchd = Partial<Record<'Minute' | 'Hour' | 'Day' | 'Month' | 'Weekday', number>>

/** `StartCalendarInterval` (un dictionnaire ou une liste) ou `StartInterval`, tels que launchd les lit. */
export function horaireLaunchd(plist: {
  StartCalendarInterval?: IntervalleLaunchd | Array<IntervalleLaunchd>
  StartInterval?: number
}): Horaire {
  if (plist.StartInterval) return { type: 'intervalle', secondes: plist.StartInterval }
  const brut = plist.StartCalendarInterval
  if (!brut) return { type: 'aucun' }
  const un = (v: number | undefined) => (v === undefined ? null : [v])
  return {
    type: 'calendrier',
    calendriers: (Array.isArray(brut) ? brut : [brut]).map((c) => ({
      minute: un(c.Minute),
      heure: un(c.Hour),
      jour: un(c.Day),
      mois: un(c.Month),
      semaine: c.Weekday === undefined ? null : [c.Weekday % 7],
    })),
  }
}

/** Le jour convient-il ? Comme cron : si le jour du mois et celui de la semaine sont tous deux fixés, l'un ou l'autre suffit. */
function jourConvient(c: Calendrier, d: Date) {
  if (c.mois && !c.mois.includes(d.getMonth() + 1)) return false
  const jour = !c.jour || c.jour.includes(d.getDate())
  const semaine = !c.semaine || c.semaine.includes(d.getDay())
  return c.jour && c.semaine ? c.jour.includes(d.getDate()) || c.semaine.includes(d.getDay()) : jour && semaine
}

const tout = (n: number) => Array.from({ length: n }, (_, i) => i)

/** Le premier passage après `depuis` (sens 1) ou le dernier avant (sens -1), sur un an au plus. */
function chercher(c: Calendrier, depuis: Date, sens: 1 | -1): Date | null {
  const heures = c.heure ?? tout(24)
  const minutes = c.minute ?? tout(60)
  const ordre = <T>(l: Array<T>) => (sens === 1 ? l : [...l].reverse())
  for (let i = 0; i <= 366; i++) {
    const jour = new Date(depuis.getFullYear(), depuis.getMonth(), depuis.getDate() + i * sens)
    if (!jourConvient(c, jour)) continue
    for (const h of ordre(heures)) {
      for (const m of ordre(minutes)) {
        const t = new Date(jour.getFullYear(), jour.getMonth(), jour.getDate(), h, m)
        if (sens === 1 ? t > depuis : t <= depuis) return t
      }
    }
  }
  return null
}

function extreme(horaire: Horaire, depuis: Date, sens: 1 | -1): Date | null {
  if (horaire.type !== 'calendrier') return null
  const dates = horaire.calendriers.map((c) => chercher(c, depuis, sens)).filter((d): d is Date => d !== null)
  if (!dates.length) return null
  return new Date((sens === 1 ? Math.min : Math.max)(...dates.map((d) => d.getTime())))
}

/** Le prochain passage prévu. Pour un intervalle, il se compte depuis le dernier passage. */
export function prochainPassage(horaire: Horaire, maintenant: Date, dernier?: Date | null): Date | null {
  if (horaire.type === 'intervalle') return dernier ? new Date(dernier.getTime() + horaire.secondes * 1000) : null
  return extreme(horaire, maintenant, 1)
}

/** Le dernier passage qui aurait dû avoir lieu. */
export function passagePrecedent(horaire: Horaire, maintenant: Date): Date | null {
  if (horaire.type === 'intervalle') return new Date(maintenant.getTime() - horaire.secondes * 1000)
  return extreme(horaire, maintenant, -1)
}

const NOMS_JOURS = {
  en: ['Sundays', 'Mondays', 'Tuesdays', 'Wednesdays', 'Thursdays', 'Fridays', 'Saturdays'],
  fr: ['le dimanche', 'le lundi', 'le mardi', 'le mercredi', 'le jeudi', 'le vendredi', 'le samedi'],
}

const heureLisible = (h: number, m: number, langue: Language) =>
  langue === 'fr' ? `${h} h${m ? ` ${String(m).padStart(2, '0')}` : ''}` : `${h}:${String(m).padStart(2, '0')}`

/** Un calendrier en mots, quand il est simple ; null sinon. */
function phrase(c: Calendrier, langue: Language): string | null {
  const fr = langue === 'fr'
  const seul = (l: Array<number> | null) => (l && l.length === 1 ? l[0] : null)
  const m = seul(c.minute)
  const h = seul(c.heure)
  if (c.mois) return null
  if (m !== null && h === null && !c.heure && !c.jour && !c.semaine)
    return fr ? `toutes les heures à ${m} min` : `hourly at :${String(m).padStart(2, '0')}`
  if (c.minute && !c.heure && !c.jour && !c.semaine && c.minute.length > 1) {
    const pas = c.minute[1] - c.minute[0]
    if (c.minute[0] === 0 && c.minute.every((v, i) => v === i * pas) && 60 % pas === 0)
      return fr ? `toutes les ${pas} min` : `every ${pas} min`
  }
  if (m === null || h === null) return null
  const a = heureLisible(h, m, langue)
  if (!c.jour && !c.semaine) return fr ? `chaque jour à ${a}` : `daily at ${a}`
  const s = seul(c.semaine)
  if (s !== null && !c.jour) return fr ? `${NOMS_JOURS.fr[s]} à ${a}` : `${NOMS_JOURS.en[s]} at ${a}`
  const j = seul(c.jour)
  if (j !== null && !c.semaine) return fr ? `le ${j === 1 ? '1er' : j} du mois à ${a}` : `monthly on day ${j} at ${a}`
  return null
}

/** L'horaire en mots : « chaque jour à 7 h 30 », « every 15 min »… null s'il est trop compliqué pour une phrase. */
export function decrire(horaire: Horaire, langue: Language): string | null {
  const fr = langue === 'fr'
  if (horaire.type === 'aucun') return null
  if (horaire.type === 'intervalle') {
    const s = horaire.secondes
    if (s % 86400 === 0)
      return fr
        ? `tous les ${s / 86400 === 1 ? '' : `${s / 86400} `}jours`.replace('tous les jours', 'chaque jour')
        : `every ${s / 86400 === 1 ? 'day' : `${s / 86400} days`}`
    if (s % 3600 === 0)
      return fr ? `toutes les ${s / 3600 === 1 ? 'heures' : `${s / 3600} h`}` : `every ${s / 3600 === 1 ? 'hour' : `${s / 3600} h`}`
    if (s % 60 === 0) return fr ? `toutes les ${s / 60} min` : `every ${s / 60} min`
    return fr ? `toutes les ${s} s` : `every ${s} s`
  }
  const phrases = horaire.calendriers.map((c) => phrase(c, langue))
  if (phrases.some((p) => p === null)) return null
  // Plusieurs heures dans la journée : « chaque jour à 7 h 30, 12 h 30 ».
  const prefixe = fr ? 'chaque jour à ' : 'daily at '
  if (phrases.length > 1 && phrases.every((p) => p!.startsWith(prefixe)))
    return prefixe + phrases.map((p) => p!.slice(prefixe.length)).join(', ')
  return phrases.join(', ')
}
