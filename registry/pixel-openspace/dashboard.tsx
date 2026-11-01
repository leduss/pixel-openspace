'use client'

/*
 * Le tableau de bord autour de la salle : les chiffres de chaque source en
 * haut, la salle au milieu, le planning dessous ; à droite, ce qui a besoin de
 * toi, le détail d'un agent et l'équipe. Il prend les mêmes props que la salle,
 * plus les sources qui groupent les agents ; tout se recalcule depuis elles.
 */

import { useState, useSyncExternalStore, type CSSProperties, type ReactNode } from 'react'
import { THEMES } from './contexte'
import { Portrait } from './iso'
import { PixelOpenspace } from './pixel-openspace'
import type { Agent, AgentStatus, Language, OpenSpaceProps } from './types'

/** Where a group of agents runs: a machine, a repository, a queue. */
export type DashboardSource = {
  id: string
  name: string
  /** Written next to the name: "launchd", "owner/repo". */
  detail?: string
  /** What its agents are called: "jobs", "workflows". */
  unit?: string
  color?: string
  /** The ids of its agents. */
  agents: Array<string>
}

export type DashboardProps = Omit<OpenSpaceProps, 'zones'> & {
  /** Groups of agents: one card, one zone of the room and one filter each. Without it, every agent is in one source. */
  sources?: Array<DashboardSource>
}

const ACCENT = '#e8b923'
/* Les titres ronds : Fredoka si la page la charge dans --font-fredoka, sinon la police des titres de la salle. */
const TITRE = 'font-[family-name:var(--font-fredoka,var(--font-pixel))]'
const COULEURS = ['#9aa3ff', '#f6a26a', '#5eead4', '#f472b6', '#a3e635']

const ETATS: Record<AgentStatus, { couleur: string; texte: string; fond: string }> = {
  working: { couleur: ACCENT, texte: '#f5d25e', fond: '#2a2410' },
  ok: { couleur: '#4ade80', texte: '#86efac', fond: '#10241a' },
  late: { couleur: '#fb923c', texte: '#fdba74', fond: '#2a1a10' },
  asleep: { couleur: '#818cf8', texte: '#a5b4fc', fond: '#181a33' },
  failed: { couleur: '#ef4444', texte: '#fca5a5', fond: '#2a1219' },
  off: { couleur: '#71717a', texte: '#a1a6bd', fond: '#1c1d24' },
  never: { couleur: '#a1a1aa', texte: '#c3c8e0', fond: '#1c1d24' },
  'on-demand': { couleur: '#38bdf8', texte: '#7dd3fc', fond: '#0f2230' },
}
const LEGENDE: Array<AgentStatus> = ['working', 'ok', 'late', 'failed', 'asleep', 'on-demand', 'off']

const MOTS = {
  en: {
    statuts: {
      working: 'Running',
      ok: 'Up to date',
      late: 'Late',
      asleep: 'Asleep',
      failed: 'Failed',
      off: 'Off',
      never: 'Never ran',
      'on-demand': 'On demand',
    } satisfies Record<AgentStatus, string>,
    toutes: 'All agents',
    agents: 'agents',
    occupes: 'running',
    passages: 'runs today',
    enEchec: 'failed',
    enRetard: 'late',
    souci: 'issues',
    prochain: 'Next',
    rien: 'Nothing planned',
    direct: 'Live',
    besoin: 'Needs you',
    alertes: (n: number) => `${n} alert${n > 1 ? 's' : ''}`,
    toutVaBien: 'all good',
    personne: 'Nobody is failing or late.',
    relancer: 'Run again',
    voir: 'View',
    dernier: 'last run',
    jamais: 'never',
    maintenant: 'NOW',
    auTravail: (role: string) => `${role}, screen on.`,
    aucunPassage: 'No run today.',
    echec: 'FAILED',
    equipe: 'Team',
    sources: 'sources',
    planning: 'Planning',
    planningSous: 'the day of your jobs, every source',
    tous: 'All',
    aVenir: 'Upcoming',
    enCours: 'Running',
    aSurveiller: 'To watch',
    termine: 'Done',
    vide: 'Nothing',
    vue: 'Room view',
    iso: 'Iso',
    face: 'Front',
    aLaDemande: 'on demand',
    demarre: (nom: string) => `${nom} started`,
    fini: (nom: string, message: string) => `${nom} is done: ${message}`,
    plante: (nom: string) => `${nom} failed`,
    dans: (d: string) => `in ${d}`,
    ilYa: (d: string) => `${d} ago`,
    instant: 'just now',
    jours: 'd',
    a: (h: string) => `at ${h}`,
  },
  fr: {
    statuts: {
      working: 'Au travail',
      ok: 'À jour',
      late: 'En retard',
      asleep: 'Endormi',
      failed: 'En échec',
      off: 'Absent',
      never: 'Jamais lancé',
      'on-demand': 'À la demande',
    } satisfies Record<AgentStatus, string>,
    toutes: 'Tous les agents',
    agents: 'agents',
    occupes: 'au travail',
    passages: 'passages aujourd’hui',
    enEchec: 'en échec',
    enRetard: 'en retard',
    souci: 'souci',
    prochain: 'Prochain',
    rien: 'Rien de prévu',
    direct: 'En direct',
    besoin: 'Besoin de toi',
    alertes: (n: number) => `${n} alerte${n > 1 ? 's' : ''}`,
    toutVaBien: 'tout va bien',
    personne: 'Personne n’est en échec ni en retard.',
    relancer: 'Relancer',
    voir: 'Voir',
    dernier: 'dernier passage',
    jamais: 'jamais',
    maintenant: 'MAINTENANT',
    auTravail: (role: string) => `${role}, écran allumé.`,
    aucunPassage: 'Aucun passage aujourd’hui.',
    echec: 'ÉCHEC',
    equipe: 'Équipe',
    sources: 'sources',
    planning: 'Planning',
    planningSous: 'la journée de tes tâches, toutes sources',
    tous: 'Tous',
    aVenir: 'À venir',
    enCours: 'Au travail',
    aSurveiller: 'À surveiller',
    termine: 'Terminé',
    vide: 'Rien',
    vue: 'Vue de la salle',
    iso: 'Iso',
    face: 'De face',
    aLaDemande: 'à la demande',
    demarre: (nom: string) => `${nom} a démarré`,
    fini: (nom: string, message: string) => `${nom} a fini : ${message}`,
    plante: (nom: string) => `${nom} a planté`,
    dans: (d: string) => `dans ${d}`,
    ilYa: (d: string) => `il y a ${d}`,
    instant: 'à l’instant',
    jours: 'j',
    a: (h: string) => `à ${h}`,
  },
} satisfies Record<Language, unknown>
type Mots = (typeof MOTS)[Language]

/* L'heure, relue toutes les 30 secondes ; le rendu serveur n'en a pas, pour ne pas désaccorder l'hydratation. */
let instant = Date.now()
function abonnerHorloge(prevenir: () => void) {
  instant = Date.now()
  const t = setInterval(() => {
    instant = Date.now()
    prevenir()
  }, 30_000)
  return () => clearInterval(t)
}
const lireHorloge = () => instant

/** Une durée en minutes, heures ou jours ; seule l'unité des jours change d'une langue à l'autre. */
const duree = (min: number, m: Mots) =>
  min < 60 ? `${min} min` : min < 60 * 24 ? `${Math.round(min / 60)} h` : `${Math.round(min / 60 / 24)} ${m.jours}`
const minutesJusqua = (iso: string, maintenant: number) => Math.round((new Date(iso).getTime() - maintenant) / 60_000)

function ecart(iso: string | null | undefined, maintenant: number, m: Mots): string | null {
  if (!iso) return null
  const minutes = minutesJusqua(iso, maintenant)
  if (minutes === 0) return m.instant
  return minutes > 0 ? m.dans(duree(minutes, m)) : m.ilYa(duree(-minutes, m))
}

function aujourdhui(iso: string | null | undefined, maintenant: number) {
  if (!iso) return false
  const minuit = new Date(maintenant)
  minuit.setHours(0, 0, 0, 0)
  return new Date(iso).getTime() >= minuit.getTime()
}

type Source = DashboardSource & { couleur: string }

function Pastille({ statut, m }: { statut: AgentStatus; m: Mots }) {
  const e = ETATS[statut]
  return (
    <span
      className="shrink-0 rounded-full px-2.5 py-[3px] text-[11px] font-semibold whitespace-nowrap"
      style={{ background: e.fond, color: e.texte }}
    >
      ● {m.statuts[statut]}
    </span>
  )
}

function Puce({ source }: { source: Source }) {
  return (
    <span
      className="self-start rounded-[5px] border px-[7px] py-px text-[10px] font-semibold uppercase"
      style={{ borderColor: `color-mix(in oklab, ${source.couleur} 45%, transparent)`, color: source.couleur }}
    >
      {source.name}
    </span>
  )
}

function Panneau({
  titre,
  aside,
  className,
  style,
  children,
}: {
  titre: ReactNode
  aside?: ReactNode
  className?: string
  style?: CSSProperties
  children: ReactNode
}) {
  return (
    <section
      className={['flex flex-col gap-3 rounded-[18px] border border-[#232a45] bg-[#0e1222] p-[18px]', className].filter(Boolean).join(' ')}
      style={style}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className={`${TITRE} m-0 flex items-center gap-2 text-[19px] font-semibold text-[#f3f4fa]`}>{titre}</h2>
        {aside ? <span className="text-xs text-[#9aa2c4]">{aside}</span> : null}
      </div>
      {children}
    </section>
  )
}

function Chiffre({ n, label, couleur }: { n: string | number; label: string; couleur?: string }) {
  return (
    <span className="whitespace-nowrap" style={couleur ? { color: couleur } : undefined}>
      <b className={`${TITRE} text-[22px]`} style={{ color: couleur ?? '#f3f4fa' }}>
        {n}
      </b>{' '}
      {label}
    </span>
  )
}

/** Une source : ce qui tourne, les passages du jour, ce qui coince, et le prochain départ. */
function CarteSource({ source, agents, maintenant, m }: { source: Source; agents: Array<Agent>; maintenant: number; m: Mots }) {
  const siens = agents.filter((a) => source.agents.includes(a.id))
  const passages = siens.reduce((n, a) => n + (a.runs ?? []).filter((r) => aujourdhui(r.at, maintenant)).length, 0)
  const echecs = siens.filter((a) => a.status === 'failed').length
  const retards = siens.filter((a) => a.status === 'late').length
  const prochain = siens
    .filter((a) => a.nextRun && new Date(a.nextRun).getTime() > maintenant)
    .sort((a, b) => new Date(a.nextRun!).getTime() - new Date(b.nextRun!).getTime())[0]
  return (
    <div
      className="flex flex-col gap-1.5 rounded-[14px] border border-[#262e52] bg-[#10142a] px-[18px] py-3.5"
      style={{ borderTop: `2px solid ${source.couleur}` }}
    >
      <div className="flex items-baseline gap-2.5">
        <span className={`${TITRE} text-[17px] font-bold tracking-wide uppercase`} style={{ color: source.couleur }}>
          {source.name}
        </span>
        <span className="text-[13px] text-[#9aa2c4]">
          {source.detail ? `${source.detail} · ` : ''}
          {siens.length} {source.unit ?? m.agents}
        </span>
      </div>
      <div className="flex flex-wrap items-baseline gap-x-4 text-[13px] text-[#9aa2c4]">
        <Chiffre n={`${siens.filter((a) => a.status === 'working').length}/${siens.length}`} label={m.occupes} />
        <Chiffre n={passages} label={m.passages} />
        {echecs ? <Chiffre n={echecs} label={m.enEchec} couleur="#fca5a5" /> : null}
        {retards ? <Chiffre n={retards} label={m.enRetard} couleur="#fdba74" /> : null}
        {!echecs && !retards ? <Chiffre n={0} label={m.souci} couleur="#86efac" /> : null}
      </div>
      <div className="text-xs text-[#9aa2c4]">
        {prochain ? (
          <>
            {m.prochain} : <b className="text-[#e7e9f3]">{prochain.name}</b> {ecart(prochain.nextRun, maintenant, m)}
          </>
        ) : (
          m.rien
        )}
      </div>
    </div>
  )
}

type Colonne = {
  titre: string
  couleur: string
  fond: string
  liste: Array<Agent>
  info: (a: Agent) => string | null
  texte: (a: Agent) => string
}

/**
 * The open space inside a dashboard: per-source cards on top, the room, a
 * planning board below; on the right, what needs you, the selected agent's
 * last runs and the team. Takes the same props as `PixelOpenspace`, plus
 * `sources`; the room is in isometric view unless `view` says otherwise.
 */
export function PixelOpenspaceDashboard({ sources: sourcesProp, view: vueProp = 'iso', theme = 'modern', ...salle }: DashboardProps) {
  const { agents, onRun, language = 'en', now } = salle
  const m = MOTS[language] ?? MOTS.en
  const horloge = useSyncExternalStore(abonnerHorloge, lireHorloge, () => null)
  const maintenant = now ?? horloge
  const [choisi, setChoisi] = useState<string | null>(null)
  const [vue, setVue] = useState(vueProp)
  const [filtre, setFiltre] = useState<string>('tous')
  // La dernière nouvelle, numérotée : chaque nouvelle rejoue l'animation qui l'affiche puis l'efface.
  const [annonce, setAnnonce] = useState<{ texte: string; n: number } | null>(null)

  /* Une notification quand un agent démarre, finit ou plante : on compare aux états du rendu d'avant. */
  const [avant, setAvant] = useState(agents)
  if (avant !== agents) {
    setAvant(agents)
    const precedents = new Map(avant.map((a) => [a.id, a]))
    const change = agents.find((a) => precedents.get(a.id)?.status !== a.status && precedents.has(a.id))
    if (change) {
      const texte =
        change.status === 'working'
          ? m.demarre(change.name)
          : change.status === 'failed'
            ? m.plante(change.name)
            : m.fini(change.name, change.lastMessage ?? '')
      setAnnonce({ texte, n: (annonce?.n ?? 0) + 1 })
    }
  }

  const tenue = THEMES[theme]?.tenue ?? THEMES.modern.tenue
  const sources: Array<Source> = (
    sourcesProp?.length ? sourcesProp : [{ id: 'tous', name: m.toutes, agents: agents.map((a) => a.id) }]
  ).map((s, k) => ({ ...s, couleur: s.color ?? COULEURS[k % COULEURS.length] }))
  const sourceDe = (id: string) => sources.find((s) => s.agents.includes(id)) ?? sources[0]
  const portrait = (a: Pick<Agent, 'id' | 'emoji'>, taille = 28) => (
    <Portrait id={a.id} emoji={a.emoji} couleur={tenue(a.id).c} taille={taille} />
  )

  if (maintenant === null) return <div className="min-h-[600px] rounded-[18px] bg-[#080b16]" />

  const aVenir = agents
    .filter((a) => a.nextRun && new Date(a.nextRun).getTime() > maintenant && a.status !== 'working')
    .sort((a, b) => new Date(a.nextRun!).getTime() - new Date(b.nextRun!).getTime())
  const prochain = aVenir[0]
  const alertes = agents.filter((a) => a.status === 'failed' || a.status === 'late')
  const detail = agents.find((a) => a.id === choisi) ?? alertes[0] ?? agents[0]
  const etapes = [...(detail?.runs ?? [])].reverse().slice(0, 5)
  const heure = (iso: string) =>
    new Date(iso).toLocaleTimeString(language === 'fr' ? 'fr-FR' : 'en-GB', { hour: '2-digit', minute: '2-digit' })
  const depart = (iso: string) => (aujourdhui(iso, maintenant) ? m.a(heure(iso)) : ecart(iso, maintenant, m))
  const filtres = (liste: Array<Agent>) => (filtre === 'tous' ? liste : liste.filter((a) => sourceDe(a.id).id === filtre))

  const colonnes: Array<Colonne> = [
    {
      titre: m.aVenir,
      couleur: '#9aa2c4',
      fond: '#0b0f1d',
      liste: filtres(aVenir).slice(0, 4),
      info: (a) => (a.nextRun ? depart(a.nextRun) : null),
      texte: (a) => a.schedule ?? a.role ?? '',
    },
    {
      titre: m.enCours,
      couleur: '#e9d48a',
      fond: '#12131f',
      liste: filtres(agents.filter((a) => a.status === 'working')),
      info: (a) => ecart(a.lastRun, maintenant, m),
      texte: (a) => a.role ?? '',
    },
    {
      titre: m.aSurveiller,
      couleur: '#fca5a5',
      fond: '#170f17',
      liste: filtres(alertes),
      info: (a) => m.statuts[a.status].toLowerCase(),
      texte: (a) => a.lastMessage ?? a.role ?? '',
    },
    {
      titre: m.termine,
      couleur: '#86efac',
      fond: '#0d1611',
      liste: filtres(agents.filter((a) => a.status === 'ok' && aujourdhui(a.lastRun, maintenant)))
        .sort((a, b) => (b.lastRun ?? '').localeCompare(a.lastRun ?? ''))
        .slice(0, 4),
      info: (a) => (a.lastRun ? heure(a.lastRun) : null),
      texte: (a) => a.lastMessage ?? '',
    },
  ]

  return (
    <div className="relative flex flex-col gap-[18px] rounded-[22px] bg-[#080b16] p-4 text-[#e7e9f3] sm:p-6">
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
        {/* Colonne de gauche */}
        <div className="flex min-w-0 flex-col gap-4">
          <div className="grid gap-3 md:grid-cols-[repeat(auto-fit,minmax(240px,1fr))]">
            {sources.map((s) => (
              <CarteSource key={s.id} source={s} agents={agents} maintenant={maintenant} m={m} />
            ))}
            <div className="flex flex-col items-center justify-center gap-0.5 rounded-[14px] border border-[#262e52] bg-[#10142a] px-3 py-3.5 text-center">
              <span className="text-[11px] font-semibold tracking-wider text-[#9aa2c4] uppercase">{m.prochain}</span>
              <span className={`${TITRE} text-[26px] font-bold text-[#f3f4fa]`}>
                {prochain ? duree(Math.max(0, minutesJusqua(prochain.nextRun!, maintenant)), m) : '—'}
              </span>
              <span className="text-xs text-[#9aa2c4]">{prochain ? `${prochain.name}, ${sourceDe(prochain.id).name}` : m.rien}</span>
            </div>
          </div>

          {/* La salle : une zone par source. */}
          <section aria-label={m.vue} className="overflow-hidden rounded-[18px]">
            <PixelOpenspace
              {...salle}
              theme={theme}
              view={vue}
              zones={sources.length > 1 ? sources.map((s) => ({ name: s.name, agents: s.agents, detail: s.detail, color: s.couleur })) : []}
            />
          </section>

          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-4 text-[13px] text-[#c3c8e0]">
              {LEGENDE.map((s) => (
                <span key={s} className="flex items-center gap-1.5">
                  <span className="size-2 rounded-full" style={{ background: ETATS[s].couleur }} />
                  {m.statuts[s]}
                </span>
              ))}
            </div>
            <div role="group" aria-label={m.vue} className="flex gap-0.5 rounded-[10px] border border-[#232a45] bg-[#121729] p-1">
              {(
                [
                  ['iso', m.iso],
                  ['front', m.face],
                ] as const
              ).map(([v, label]) => (
                <button
                  key={v}
                  type="button"
                  aria-pressed={vue === v}
                  onClick={() => setVue(v)}
                  className={`min-h-[34px] cursor-pointer rounded-[7px] px-3.5 text-[13px] ${vue === v ? 'bg-[#f3f4fa] font-semibold text-[#0d1124]' : 'text-[#9aa2c4]'}`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Le planning de la journée */}
          <Panneau
            titre={
              <>
                {m.planning} <span className="font-sans text-[13px] font-normal text-[#9aa2c4]">{m.planningSous}</span>
              </>
            }
            aside={
              sources.length > 1 ? (
                <span className="flex flex-wrap gap-2">
                  {[{ id: 'tous', name: m.tous, couleur: '#f3f4fa' }, ...sources].map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      aria-pressed={filtre === s.id}
                      onClick={() => setFiltre(s.id)}
                      className="min-h-[34px] cursor-pointer rounded-full border border-[#3a4266] px-3.5 text-[13px] font-semibold"
                      style={{ color: s.couleur, background: filtre === s.id ? '#1b2140' : 'transparent' }}
                    >
                      {s.name}
                    </button>
                  ))}
                </span>
              ) : undefined
            }
          >
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {colonnes.map((col) => (
                <div key={col.titre} className="flex flex-col gap-2 rounded-xl p-2.5" style={{ background: col.fond }}>
                  <div className="flex justify-between text-[11px] font-bold tracking-wider uppercase" style={{ color: col.couleur }}>
                    <span>● {col.titre}</span>
                    <span>{col.liste.length}</span>
                  </div>
                  {col.liste.length === 0 ? <span className="py-2 text-sm text-[#9aa2c4]">{m.vide}</span> : null}
                  {col.liste.map((a) => (
                    <button
                      key={a.id}
                      type="button"
                      onClick={() => setChoisi(a.id)}
                      className="flex cursor-pointer flex-col gap-1.5 rounded-[10px] border bg-[#141a30] px-3 py-2.5 text-left"
                      style={{ borderColor: a.status === 'failed' || a.status === 'late' ? ETATS[a.status].couleur : '#232a45' }}
                    >
                      <span className="flex items-baseline justify-between gap-2">
                        <span className="truncate text-sm font-semibold text-[#f3f4fa]">{a.name}</span>
                        <span className="shrink-0 text-[11px] text-[#9aa2c4]">{col.info(a)}</span>
                      </span>
                      <span className="line-clamp-2 text-xs text-[#9aa2c4]">{col.texte(a)}</span>
                      {sources.length > 1 ? <Puce source={sourceDe(a.id)} /> : null}
                      {a.status === 'working' ? (
                        <span className="h-1 overflow-hidden rounded-sm bg-[#232a45]">
                          <span className="block h-full w-2/5 animate-pulse rounded-sm" style={{ background: ACCENT }} />
                        </span>
                      ) : null}
                    </button>
                  ))}
                </div>
              ))}
            </div>
          </Panneau>
        </div>

        {/* Colonne de droite */}
        <div className="flex min-w-0 flex-col gap-4">
          <Panneau
            titre={
              <>
                <span className="size-2.5 rounded-full" style={{ background: ACCENT }} />
                {m.besoin}
              </>
            }
            aside={alertes.length ? m.alertes(alertes.length) : m.toutVaBien}
            className="border-2 bg-[#15131a]"
            style={{ borderColor: ACCENT, boxShadow: '0 0 24px rgba(232, 185, 35, 0.15)' }}
          >
            {alertes.length === 0 ? <p className="m-0 text-sm text-[#9aa2c4]">{m.personne}</p> : null}
            {alertes.map((a) => (
              <div
                key={a.id}
                className="flex flex-col gap-2.5 rounded-[10px] border-l-[3px] bg-[#1c1a24] p-3"
                style={{ borderLeftColor: ETATS[a.status].couleur }}
              >
                <div className="flex items-center gap-2.5">
                  {portrait(a, 30)}
                  <div className="flex flex-col gap-px">
                    <span className="flex items-center gap-2 text-sm font-semibold text-[#f3f4fa]">
                      {a.name} {sources.length > 1 ? <Puce source={sourceDe(a.id)} /> : null}
                    </span>
                    <span className="text-xs text-[#9aa2c4]">
                      {m.statuts[a.status].toLowerCase()} · {m.dernier} {ecart(a.lastRun, maintenant, m) ?? m.jamais}
                    </span>
                  </div>
                </div>
                <p className="m-0 text-sm font-semibold text-[#f3f4fa]">{a.lastMessage ?? a.role}</p>
                <div className="flex gap-2">
                  {onRun ? (
                    <button
                      type="button"
                      onClick={() => void onRun(a)}
                      className="min-h-[38px] cursor-pointer rounded-full bg-[#f0883e] px-[18px] text-sm font-semibold text-[#1c0f05]"
                    >
                      {m.relancer}
                    </button>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => setChoisi(a.id)}
                    className="min-h-[38px] cursor-pointer rounded-full border border-[#3a4266] px-[18px] text-sm font-medium text-[#e7e9f3]"
                  >
                    {m.voir}
                  </button>
                </div>
              </div>
            ))}
          </Panneau>

          {/* L'agent choisi et ses derniers passages */}
          {detail ? (
            <section
              aria-label={detail.name}
              className="flex flex-col gap-3.5 rounded-[18px] border border-[#232a45] bg-[#0e1222] p-[18px]"
            >
              <div className="flex items-start gap-3">
                <div
                  className="flex size-[46px] shrink-0 items-center justify-center rounded-xl"
                  style={{ background: ETATS[detail.status].fond }}
                >
                  {portrait(detail, 36)}
                </div>
                <div className="flex min-w-0 grow flex-col gap-0.5">
                  <div className="flex items-center justify-between gap-2">
                    <h2 className={`${TITRE} m-0 text-[21px] font-bold text-[#f3f4fa]`}>{detail.name}</h2>
                    <Pastille statut={detail.status} m={m} />
                  </div>
                  <span className="text-xs text-[#9aa2c4]">
                    {sources.length > 1 ? `${sourceDe(detail.id).name} · ` : ''}
                    {detail.schedule ?? m.aLaDemande} · {m.dernier} {ecart(detail.lastRun, maintenant, m) ?? m.jamais}
                  </span>
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[11px] font-bold tracking-wider text-[#9aa2c4]">{m.maintenant}</span>
                <p className="m-0 text-[15px] leading-snug font-medium text-[#f3f4fa]">
                  {detail.status === 'working' ? m.auTravail(detail.role ?? detail.name) : (detail.lastMessage ?? detail.role)}
                </p>
              </div>
              {etapes.length ? (
                <ol className="m-0 flex list-none flex-col p-0">
                  {etapes.map((r, i) => {
                    const rate = r.ok === false
                    return (
                      <li key={r.at + i} className="flex gap-3">
                        <div className="flex flex-col items-center">
                          <span
                            className="flex size-[22px] shrink-0 items-center justify-center rounded-full text-[11px] font-bold"
                            style={{ background: rate ? '#ef4444' : '#1f6b43', color: rate ? '#ffffff' : '#dcfce7' }}
                          >
                            {i + 1}
                          </span>
                          {i < etapes.length - 1 ? <span className="w-0.5 grow bg-[#2a3150]" /> : null}
                        </div>
                        <div className="flex flex-col gap-1 pb-3">
                          <div className="text-sm font-semibold text-[#f3f4fa]">
                            {heure(r.at)}{' '}
                            {rate ? (
                              <span className="text-[10px] font-bold text-[#fca5a5]">{m.echec}</span>
                            ) : (
                              <span className="text-[#4ade80]">✓</span>
                            )}
                          </div>
                          {rate ? (
                            <span className="self-start rounded-md bg-[#2a1219] px-2 py-[3px] text-xs font-semibold text-[#fca5a5]">
                              → {r.message}
                            </span>
                          ) : (
                            <div className="text-xs text-[#9aa2c4]">{r.message}</div>
                          )}
                        </div>
                      </li>
                    )
                  })}
                </ol>
              ) : (
                <p className="m-0 text-sm text-[#9aa2c4]">{m.aucunPassage}</p>
              )}
            </section>
          ) : null}

          {/* L'équipe, source par source */}
          <Panneau titre={m.equipe} aside={`${agents.length} ${m.agents}${sources.length > 1 ? ` · ${sources.length} ${m.sources}` : ''}`}>
            {sources.map((source) => (
              <div key={source.id} className="flex flex-col">
                {sources.length > 1 ? (
                  <div className="py-1 text-xs font-semibold uppercase" style={{ color: source.couleur }}>
                    {source.name} <span className="font-normal text-[#9aa2c4] normal-case">{source.detail}</span>
                  </div>
                ) : null}
                {agents
                  .filter((a) => source.agents.includes(a.id))
                  .map((a) => (
                    <button
                      key={a.id}
                      type="button"
                      onClick={() => setChoisi(a.id)}
                      aria-current={a.id === detail?.id}
                      className="flex cursor-pointer items-center gap-2.5 rounded-lg px-1 py-[5px] text-left aria-[current=true]:bg-[#161c33]"
                    >
                      {portrait(a)}
                      <span className="min-w-0 grow">
                        <span className="block truncate text-sm font-semibold text-[#f3f4fa]">
                          {a.name} <span className="text-xs font-normal text-[#9aa2c4]">{a.schedule}</span>
                        </span>
                        <span className="block truncate text-xs text-[#9aa2c4]">{a.lastMessage ?? a.role}</span>
                      </span>
                      <Pastille statut={a.status} m={m} />
                    </button>
                  ))}
              </div>
            ))}
          </Panneau>
        </div>
      </div>

      <style>{`@keyframes po-annonce { 0% { opacity: 0; transform: translate(-50%, 12px) } 8%, 85% { opacity: 1; transform: translate(-50%, 0) } 100% { opacity: 0; transform: translate(-50%, 12px) } }`}</style>
      <div role="status" aria-live="polite">
        {annonce ? (
          <div
            key={annonce.n}
            className="pointer-events-none fixed bottom-6 left-1/2 rounded-xl bg-[#f8f9fc] px-5 py-3 text-sm font-medium text-[#141428] opacity-0 shadow-[0_10px_30px_rgba(0,0,0,0.45)]"
            style={{ animation: 'po-annonce 3.5s ease forwards' }}
          >
            {annonce.texte}
          </div>
        ) : null}
      </div>
    </div>
  )
}
