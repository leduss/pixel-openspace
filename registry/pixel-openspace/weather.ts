/*
 * La vraie météo d'un lieu, par Open-Meteo : gratuit, sans clé, et ouvert aux
 * navigateurs (CORS). Le lieu est une ville (« Lanton », « Lyon, France ») ou
 * des coordonnées (« 44.70,-1.04 »). Sans React : le serveur local s'en sert aussi.
 */

import type { Language, Sky, Weather } from './types'

/** Les codes météo de l'OMS, ramenés à ce qu'une fenêtre en pixels sait dessiner. */
export function cielDe(code: number): Sky {
  if (code === 0 || code === 1) return 'clear'
  if (code === 2 || code === 3) return 'clouds'
  if (code === 45 || code === 48) return 'fog'
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) return 'snow'
  if (code >= 95) return 'storm'
  return 'rain'
}

/** « 44.70,-1.04 » : des coordonnées toutes prêtes, sans passer par la recherche de ville. */
export function coordonnees(lieu: string): { latitude: number; longitude: number } | null {
  const m = lieu.trim().match(/^(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)$/)
  if (!m) return null
  const [latitude, longitude] = [Number(m[1]), Number(m[2])]
  return Math.abs(latitude) <= 90 && Math.abs(longitude) <= 180 ? { latitude, longitude } : null
}

export type Endroit = { latitude: number; longitude: number; nom?: string }

/** Trouve une ville ; « Lyon, France » garde le premier mot pour la recherche. */
export async function localiser(lieu: string, langue: Language): Promise<Endroit> {
  const direct = coordonnees(lieu)
  if (direct) return direct
  const nom = lieu.split(',')[0].trim()
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(nom)}&count=1&language=${langue}&format=json`
  const reponse = await fetch(url, { signal: AbortSignal.timeout(5000) })
  const { results } = (await reponse.json()) as { results?: Array<{ latitude: number; longitude: number; name: string }> }
  if (!results?.length) throw new Error(`place not found: ${lieu}`)
  return { latitude: results[0].latitude, longitude: results[0].longitude, nom: results[0].name }
}

export async function lireMeteo(endroit: Endroit): Promise<Omit<Weather, 'place'>> {
  const url =
    `https://api.open-meteo.com/v1/forecast?latitude=${endroit.latitude}&longitude=${endroit.longitude}` +
    '&current=temperature_2m,weather_code,is_day&timezone=auto'
  const reponse = await fetch(url, { signal: AbortSignal.timeout(5000) })
  if (!reponse.ok) throw new Error(`weather: HTTP ${reponse.status}`)
  const { current } = (await reponse.json()) as { current: { temperature_2m: number; weather_code: number; is_day: number } }
  return { temperature: Math.round(current.temperature_2m), sky: cielDe(current.weather_code), day: current.is_day === 1 }
}
