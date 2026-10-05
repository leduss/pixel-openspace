/*
 * Ce que la scène sait d'un agent, et les calculs purs qu'elle en tire : son état, depuis quand il est passé, quand il repasse, s'il est oublié, et l'obscurité de la salle.
 */

import { CHEF_ID, marcheur, type Marcheur, type Plan, type Statut } from './engine'
import { type Texts } from './i18n'
import type { Agent, AgentStatus } from './types'

/* ——— Ce que la scène sait d'un agent ——— */

/** Un agent tel que la scène le manipule : sa fiche, ce qu'il a dit, son état. */
export type Vue = {
  fiche: { id: string; nom: string; emoji: string; role: string; rythme: string | null; vieillitApresH: number }
  brut: { dernierMessage: string | null; dernierPassage: string | null }
  statut: Statut
  prochain: string | null
  source: Agent
}

export const STATUT: Record<AgentStatus, Statut> = {
  working: 'au-travail',
  ok: 'a-jour',
  late: 'en-retard',
  asleep: 'endormi',
  failed: 'en-echec',
  off: 'absent',
  never: 'jamais',
  'on-demand': 'a-la-demande',
}

export const signales = new Set<string>()

/** Le statut de la scène ; un statut inconnu compte comme « ok », signalé une fois en développement. */
export function statutDe(a: Agent): Statut {
  const statut = STATUT[a.status]
  if (statut) return statut
  const cle = `${a.id}:${a.status}`
  if (typeof process !== 'undefined' && process.env?.NODE_ENV !== 'production' && !signales.has(cle)) {
    signales.add(cle)
    console.warn(`pixel-openspace: unknown status "${a.status}" for agent "${a.id}", shown as "ok".`)
  }
  return 'a-jour'
}

export function versVue(a: Agent, id = a.id): Vue {
  return {
    fiche: {
      id,
      nom: a.name,
      emoji: a.emoji ?? '🤖',
      role: a.role ?? '',
      rythme: a.schedule ?? null,
      vieillitApresH: a.staleAfterHours ?? (a.status === 'on-demand' ? 24 * 7 : 72),
    },
    brut: { dernierMessage: a.lastMessage ?? null, dernierPassage: a.lastRun ?? null },
    statut: statutDe(a),
    prochain: a.nextRun ?? null,
    source: a,
  }
}

export type Equipe = { chef: Vue; agents: Array<Vue> }

export function depuis(iso: string | null, maintenant: number, t: Texts): string {
  if (!iso) return t.never
  const minutes = Math.round((maintenant - Date.parse(iso)) / 60_000)
  if (minutes < 1) return t.justNow
  if (minutes < 60) return t.minutesAgo(minutes)
  const heures = Math.round(minutes / 60)
  if (heures < 24) return t.hoursAgo(heures)
  return t.daysAgo(Math.round(heures / 24))
}

/** « 09:28 » aujourd'hui, « Mon 09:15 » un autre jour : de quoi tenir sur le tableau blanc. */
export function heureCourte(iso: string, maintenant: number, locale: string): string {
  const d = new Date(iso)
  const h = d.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })
  return d.toDateString() === new Date(maintenant).toDateString() ? h : `${d.toLocaleDateString(locale, { weekday: 'short' })} ${h}`
}

/** Assis à son bureau, assis au canapé, ou debout. */
export type Assise = 'bureau' | 'canape' | null

/** Ce que la page dessine d'un marcheur, à l'image près. */
export type Pose = {
  x: number
  y: number
  angle: number
  marche: boolean
  pas: number
  assise: Assise
  /** Le lieu où il se tient, ou vers lequel il marche. */
  lieu: string
  parole: string | null
  /** Le livreur, son colis dans les bras. */
  porte: boolean
}

export function poses(p: Plan, marcheurs: Array<Marcheur>): Record<string, Pose> {
  const scene: Record<string, Pose> = Object.fromEntries(
    marcheurs.map((m) => {
      const siege = m.id === CHEF_ID ? p.chef.siege : p.bureaux.find((b) => b.id === m.id)?.siege
      const arrive = !m.chemin.length
      const assise: Assise = arrive && m.lieu.assis ? (m.lieu === siege ? 'bureau' : 'canape') : null
      return [
        m.id,
        {
          x: m.pos.x,
          y: m.pos.y,
          angle: m.angle,
          marche: !arrive,
          pas: m.pas,
          assise,
          lieu: m.lieu.nom,
          parole: arrive ? m.parole : null,
          porte: m.porte,
        },
      ]
    }),
  )
  // Deux au canapé, et la conversation s'engage.
  const auCanape = Object.values(scene).filter((s) => s.assise === 'canape')
  if (auCanape.length > 1) for (const s of auCanape) s.parole ??= '…'
  return scene
}

export const posesAuBureau = (p: Plan) =>
  poses(
    p,
    [p.chef, ...p.bureaux].map((b) => marcheur(b.id, b.siege, 0)),
  )

/** Les minutes avant le prochain passage, quand il approche (dix minutes au plus). */
export function bientot(vue: Vue, maintenant: number): number | null {
  if (!vue.prochain || vue.statut === 'au-travail' || vue.statut === 'absent') return null
  const reste = Date.parse(vue.prochain) - maintenant
  // À moins de 30 s, c'est un passage dû maintenant, souvent celui d'un ordonnanceur en retard qui annonce
  // « tout de suite » à chaque relecture : sans ce seuil, l'écran resterait figé sur « dans 1 min ».
  if (reste < 30_000) return null
  const minutes = Math.ceil(reste / 60_000)
  return minutes <= 10 ? minutes : null
}

/** L'obscurité de la salle selon l'heure : nuit noire de 21 h à 6 h, le soir et le matin en pente douce. */
export function obscurite(maintenant: number): number {
  const d = new Date(maintenant)
  const h = d.getHours() + d.getMinutes() / 60
  const nuit = 0.62
  if (h >= 8 && h < 18) return 0
  if (h >= 21 || h < 6) return nuit
  return h >= 18 ? ((h - 18) / 3) * nuit : ((8 - h) / 2) * nuit
}

/** Un agent oublié : plus de passage depuis plus longtemps qu'on ne l'admet (staleAfterHours). */
export function oublie(vue: Vue, maintenant: number): boolean {
  if (vue.statut === 'absent' || vue.fiche.id === CHEF_ID) return false
  if (!vue.brut.dernierPassage) return vue.statut !== 'jamais' && vue.statut !== 'a-la-demande'
  const heures = (maintenant - Date.parse(vue.brut.dernierPassage)) / 3_600_000
  return heures > vue.fiche.vieillitApresH
}
