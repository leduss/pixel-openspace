'use client'

import { useEffect, useRef, useState, useSyncExternalStore, type CSSProperties, type ReactNode } from 'react'
import { PixelOpenspace } from '@/registry/pixel-openspace/pixel-openspace'
import { Portrait } from '@/registry/pixel-openspace/iso'
import { THEME_MODERNE } from '@/registry/pixel-openspace/themes/modern'
import { MOTS, equipe } from '@/data/demo'
import type { Agent, AgentStatus } from '@/registry/pixel-openspace/types'

/*
 * Un essai de tableau de bord autour de la salle, d'après la maquette : les
 * chiffres de chaque source en haut, la salle iso au milieu, le planning
 * dessous ; à droite, ce qui a besoin de toi, le détail d'un agent et l'équipe.
 */

const ACCENT = '#e8b923'
const TITRE = 'font-[family-name:var(--font-fredoka)]'

const ETATS: Record<AgentStatus, { label: string; couleur: string; texte: string; fond: string }> = {
  working: { label: 'Au travail', couleur: ACCENT, texte: '#f5d25e', fond: '#2a2410' },
  ok: { label: 'À jour', couleur: '#4ade80', texte: '#86efac', fond: '#10241a' },
  late: { label: 'En retard', couleur: '#fb923c', texte: '#fdba74', fond: '#2a1a10' },
  asleep: { label: 'Endormi', couleur: '#818cf8', texte: '#a5b4fc', fond: '#181a33' },
  failed: { label: 'En échec', couleur: '#ef4444', texte: '#fca5a5', fond: '#2a1219' },
  off: { label: 'Absent', couleur: '#71717a', texte: '#a1a6bd', fond: '#1c1d24' },
  never: { label: 'Jamais lancé', couleur: '#a1a1aa', texte: '#c3c8e0', fond: '#1c1d24' },
  'on-demand': { label: 'À la demande', couleur: '#38bdf8', texte: '#7dd3fc', fond: '#0f2230' },
}

const LEGENDE: Array<AgentStatus> = ['working', 'ok', 'late', 'failed', 'asleep', 'on-demand', 'off']

/*
 * D'où viennent les tâches de la démo : la plupart tournent sur ce Mac, sous
 * launchd ; la mise en prod, l'audit et les rapports sont des workflows GitHub.
 */
type Source = {
  cle: 'mac' | 'github'
  nom: string
  puce: string
  court: string
  detail: string
  unite: string
  occupe: string
  passages: string
  couleur: string
  titre: string
  bord: string
  fond: string
  ids: Array<string>
}
const SOURCES: Array<Source> = [
  {
    cle: 'mac',
    nom: 'CE MAC',
    puce: 'CE MAC',
    court: 'Ce Mac',
    detail: 'launchd',
    unite: 'jobs',
    occupe: 'au travail',
    passages: 'passages aujourd’hui',
    couleur: '#7c86ff',
    titre: '#9aa3ff',
    bord: '#3c4680',
    fond: '#10142a',
    ids: ['backup', 'invoices', 'scraper', 'emails', 'social', 'photos', 'legacy'],
  },
  {
    cle: 'github',
    nom: 'GITHUB ACTIONS',
    puce: 'GITHUB',
    court: 'GitHub',
    detail: 'acme/ops',
    unite: 'workflows',
    occupe: 'en cours',
    passages: 'runs aujourd’hui',
    couleur: '#f0883e',
    titre: '#f6a26a',
    bord: '#5a3a2a',
    fond: '#14111f',
    ids: ['deploy', 'audit', 'reports'],
  },
]
const sourceDe = (id: string) => SOURCES.find((s) => s.ids.includes(id)) ?? SOURCES[0]

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

const duree = (m: number) => (m < 60 ? `${m} min` : m < 60 * 24 ? `${Math.round(m / 60)} h` : `${Math.round(m / 60 / 24)} j`)

function ecart(iso: string | null | undefined, maintenant: number): string | null {
  if (!iso) return null
  const minutes = Math.round((new Date(iso).getTime() - maintenant) / 60_000)
  if (minutes === 0) return 'à l’instant'
  return minutes > 0 ? `dans ${duree(minutes)}` : `il y a ${duree(-minutes)}`
}

const heure = (iso: string) => new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })

function aujourdhui(iso: string | null | undefined, maintenant: number) {
  if (!iso) return false
  const minuit = new Date(maintenant)
  minuit.setHours(0, 0, 0, 0)
  return new Date(iso).getTime() >= minuit.getTime()
}

/** Quand part-il : à telle heure aujourd'hui, ou dans tant de jours. */
const depart = (iso: string, maintenant: number) => (aujourdhui(iso, maintenant) ? `à ${heure(iso)}` : ecart(iso, maintenant))

const portrait = (a: { id: string; emoji?: string }, taille = 28) => (
  <Portrait id={a.id} emoji={a.emoji} couleur={THEME_MODERNE.tenue(a.id).c} taille={taille} />
)

function Pastille({ statut }: { statut: AgentStatus }) {
  const e = ETATS[statut]
  return (
    <span
      className="shrink-0 rounded-full px-2.5 py-[3px] text-[11px] font-semibold whitespace-nowrap"
      style={{ background: e.fond, color: e.texte }}
    >
      ● {e.label}
    </span>
  )
}

function Puce({ source }: { source: Source }) {
  return (
    <span
      className="self-start rounded-[5px] border px-[7px] py-px font-heading text-[10px]"
      style={{ borderColor: source.bord, color: source.titre }}
    >
      {source.puce}
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
function CarteSource({ source, agents, maintenant }: { source: Source; agents: Array<Agent>; maintenant: number }) {
  const siens = agents.filter((a) => source.ids.includes(a.id))
  const passages = siens.reduce((n, a) => n + (a.runs ?? []).filter((r) => aujourdhui(r.at, maintenant)).length, 0)
  const echecs = siens.filter((a) => a.status === 'failed').length
  const retards = siens.filter((a) => a.status === 'late').length
  const prochain = siens
    .filter((a) => a.nextRun && new Date(a.nextRun).getTime() > maintenant)
    .sort((a, b) => new Date(a.nextRun!).getTime() - new Date(b.nextRun!).getTime())[0]
  return (
    <div
      className="flex flex-col gap-1.5 rounded-[14px] border px-[18px] py-3.5"
      style={{ background: source.fond, borderColor: '#262e52', borderTop: `2px solid ${source.couleur}` }}
    >
      <div className="flex items-baseline gap-2.5">
        <span className={`${TITRE} text-[17px] font-bold tracking-wide`} style={{ color: source.titre }}>
          {source.nom}
        </span>
        <span className="text-[13px] text-[#9aa2c4]">
          {source.detail} · {siens.length} {source.unite}
        </span>
      </div>
      <div className="flex flex-wrap items-baseline gap-x-4 text-[13px] text-[#9aa2c4]">
        <Chiffre n={`${siens.filter((a) => a.status === 'working').length}/${siens.length}`} label={source.occupe} />
        <Chiffre n={passages} label={source.passages} />
        {echecs ? <Chiffre n={echecs} label="en échec" couleur="#fca5a5" /> : null}
        {retards ? <Chiffre n={retards} label="en retard" couleur="#fdba74" /> : null}
        {!echecs && !retards ? <Chiffre n={0} label="souci" couleur="#86efac" /> : null}
      </div>
      <div className="text-xs text-[#9aa2c4]">
        {prochain ? (
          <>
            Prochain : <b className="text-[#e7e9f3]">{prochain.name}</b> {depart(prochain.nextRun!, maintenant)}
          </>
        ) : (
          'Rien de prévu'
        )}
      </div>
    </div>
  )
}

type Filtre = 'tous' | Source['cle']

type Colonne = {
  titre: string
  couleur: string
  fond: string
  liste: Array<Agent>
  info: (a: Agent) => string | null
  texte: (a: Agent) => string
}

export function Tableau() {
  const m = MOTS.fr
  const [agents, setAgents] = useState(() => equipe('fr'))
  const maintenant = useSyncExternalStore(abonnerHorloge, lireHorloge, () => null)
  const [choisi, setChoisi] = useState('deploy')
  const [vue, setVue] = useState<'iso' | 'front'>('iso')
  const [filtre, setFiltre] = useState<Filtre>('tous')
  const [annonce, setAnnonce] = useState<string | null>(null)
  const minuteur = useRef<ReturnType<typeof setTimeout>>(undefined)

  const prevenir = (texte: string) => {
    setAnnonce(texte)
    clearTimeout(minuteur.current)
    minuteur.current = setTimeout(() => setAnnonce(null), 3_500)
  }

  const changer = (id: string, status: AgentStatus, lastMessage?: string) =>
    setAgents((liste) =>
      liste.map((a) => {
        if (a.id !== id) return a
        if (!lastMessage) return { ...a, status }
        const at = new Date().toISOString()
        return { ...a, status, lastMessage, lastRun: at, runs: [...(a.runs ?? []), { at, ok: status !== 'failed', message: lastMessage }] }
      }),
    )

  /* Comme la démo de la page d'accueil : toutes les 12 secondes, un agent se met au travail, puis finit. */
  useEffect(() => {
    const libres = equipe('fr').filter((a) => a.status === 'ok')
    const t = setInterval(() => {
      const a = libres[Math.floor(Math.random() * libres.length)]
      changer(a.id, 'working')
      prevenir(`${a.name} a démarré`)
      setTimeout(() => {
        const message = m.messages[Math.floor(Math.random() * m.messages.length)]
        changer(a.id, 'ok', message)
        prevenir(`${a.name} a fini : ${message}`)
      }, 6_000)
    }, 12_000)
    return () => clearInterval(t)
  }, [m.messages])

  const relancer = (a: Agent) => {
    changer(a.id, 'working')
    prevenir(`${a.name} relancé à la main`)
    setTimeout(() => {
      changer(a.id, 'ok', m.aLaMain)
      prevenir(`${a.name} est reparti`)
    }, 5_000)
  }

  if (maintenant === null) return <div className="min-h-dvh bg-[#080b16]" />

  const aVenir = agents
    .filter((a) => a.nextRun && new Date(a.nextRun).getTime() > maintenant && a.status !== 'working')
    .sort((a, b) => new Date(a.nextRun!).getTime() - new Date(b.nextRun!).getTime())
  const prochain = aVenir[0]
  const alertes = agents.filter((a) => a.status === 'failed' || a.status === 'late')
  const detail = agents.find((a) => a.id === choisi) ?? agents[0]
  const etapes = [...(detail.runs ?? [])].reverse().slice(0, 5)
  const filtres = (liste: Array<Agent>) => (filtre === 'tous' ? liste : liste.filter((a) => sourceDe(a.id).cle === filtre))

  const colonnes: Array<Colonne> = [
    {
      titre: 'À venir',
      couleur: '#9aa2c4',
      fond: '#0b0f1d',
      liste: filtres(aVenir).slice(0, 4),
      info: (a) => (a.nextRun ? depart(a.nextRun, maintenant) : null),
      texte: (a) => a.schedule ?? a.role ?? '',
    },
    {
      titre: 'Au travail',
      couleur: '#e9d48a',
      fond: '#12131f',
      liste: filtres(agents.filter((a) => a.status === 'working')),
      info: (a) => ecart(a.lastRun, maintenant),
      texte: (a) => a.role ?? '',
    },
    {
      titre: 'À surveiller',
      couleur: '#fca5a5',
      fond: '#170f17',
      liste: filtres(alertes),
      info: (a) => ETATS[a.status].label.toLowerCase(),
      texte: (a) => a.lastMessage ?? a.role ?? '',
    },
    {
      titre: 'Terminé',
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
    <div className="min-h-dvh bg-[#080b16] text-[#e7e9f3]">
      <main className="relative mx-auto flex w-full max-w-[1440px] flex-col gap-[18px] px-4 py-6 sm:px-7">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {portrait({ id: 'chef' }, 36)}
            <h1 className={`${TITRE} m-0 text-[30px] font-bold tracking-tight text-[#f3f4fa]`}>
              pixel<span style={{ color: ACCENT }}>-</span>openspace
            </h1>
          </div>
          <div className="flex items-center gap-3 rounded-full border border-[#232a45] bg-[#10142a] px-4 py-2">
            <span className="size-2 rounded-full bg-[#4ade80] shadow-[0_0_8px_#4ade80]" />
            <div className="flex flex-col leading-tight">
              <span className="text-[13px] font-semibold text-[#f3f4fa]">Ce Mac et GitHub Actions</span>
              <span className="text-[11px] text-[#9aa2c4]">En direct · {agents.length} agents</span>
            </div>
          </div>
        </header>

        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
          {/* Colonne de gauche */}
          <div className="flex min-w-0 flex-col gap-4">
            <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_150px_minmax(0,1fr)]">
              <CarteSource source={SOURCES[0]} agents={agents} maintenant={maintenant} />
              <div className="flex flex-col items-center justify-center gap-0.5 rounded-[14px] border border-[#262e52] bg-[#10142a] px-3 py-3.5 text-center">
                <span className="font-heading text-[11px] text-[#9aa2c4]">PROCHAIN</span>
                <span className={`${TITRE} text-[26px] font-bold text-[#f3f4fa]`}>
                  {prochain ? duree(Math.max(0, Math.round((new Date(prochain.nextRun!).getTime() - maintenant) / 60_000))) : '—'}
                </span>
                <span className="text-xs text-[#9aa2c4]">
                  {prochain ? `${prochain.name}, ${sourceDe(prochain.id).court}` : 'rien de prévu'}
                </span>
              </div>
              <CarteSource source={SOURCES[1]} agents={agents} maintenant={maintenant} />
            </div>

            {/* La salle : une zone par source. */}
            <section aria-label="La salle" className="overflow-hidden rounded-[18px]">
              <PixelOpenspace
                agents={agents}
                language="fr"
                title="ACME OPS"
                timeline={false}
                theme="modern"
                view={vue}
                zones={SOURCES.map((z) => ({
                  name: z.nom,
                  agents: z.ids,
                  detail: `${z.detail} · ${z.ids.length} ${z.unite}`,
                  color: z.titre,
                }))}
                weather={{ temperature: 14, sky: 'clouds', day: true, place: 'Lanton' }}
                onRun={relancer}
              />
            </section>

            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-4 text-[13px] text-[#c3c8e0]">
                {LEGENDE.map((s) => (
                  <span key={s} className="flex items-center gap-1.5">
                    <span className="size-2 rounded-full" style={{ background: ETATS[s].couleur }} />
                    {ETATS[s].label}
                  </span>
                ))}
              </div>
              <div
                role="group"
                aria-label="Vue de la salle"
                className="flex gap-0.5 rounded-[10px] border border-[#232a45] bg-[#121729] p-1"
              >
                {(
                  [
                    ['iso', 'Iso'],
                    ['front', 'De face'],
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
                  Planning{' '}
                  <span className="font-sans text-[13px] font-normal text-[#9aa2c4]">la journée de tes tâches, toutes sources</span>
                </>
              }
              aside={
                <span className="flex gap-2">
                  {(
                    [
                      ['tous', 'Tous', '#3a4266', '#f3f4fa'],
                      ['mac', 'Ce Mac', '#262e52', '#9aa3ff'],
                      ['github', 'GitHub', '#3a2a2a', '#f6a26a'],
                    ] as const
                  ).map(([cle, label, bord, couleur]) => (
                    <button
                      key={cle}
                      type="button"
                      aria-pressed={filtre === cle}
                      onClick={() => setFiltre(cle)}
                      className="min-h-[34px] cursor-pointer rounded-full border px-3.5 text-[13px] font-semibold"
                      style={{ borderColor: bord, color: couleur, background: filtre === cle ? '#1b2140' : 'transparent' }}
                    >
                      {label}
                    </button>
                  ))}
                </span>
              }
            >
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {colonnes.map((col) => (
                  <div key={col.titre} className="flex flex-col gap-2 rounded-xl p-2.5" style={{ background: col.fond }}>
                    <div className="flex justify-between text-[11px] font-bold tracking-wider uppercase" style={{ color: col.couleur }}>
                      <span>● {col.titre}</span>
                      <span>{col.liste.length}</span>
                    </div>
                    {col.liste.length === 0 ? <span className="py-2 text-sm text-[#9aa2c4]">Rien</span> : null}
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
                        <Puce source={sourceDe(a.id)} />
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
                  Besoin de toi
                </>
              }
              aside={alertes.length ? `${alertes.length} alerte${alertes.length > 1 ? 's' : ''}` : 'tout va bien'}
              className="border-2 bg-[#15131a]"
              style={{ borderColor: ACCENT, boxShadow: '0 0 24px rgba(232, 185, 35, 0.15)' }}
            >
              {alertes.length === 0 ? <p className="m-0 text-sm text-[#9aa2c4]">Personne n’est en échec ni en retard.</p> : null}
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
                        {a.name} <Puce source={sourceDe(a.id)} />
                      </span>
                      <span className="text-xs text-[#9aa2c4]">
                        {ETATS[a.status].label.toLowerCase()} · dernier passage {ecart(a.lastRun, maintenant)}
                      </span>
                    </div>
                  </div>
                  <p className="m-0 text-sm font-semibold text-[#f3f4fa]">{a.lastMessage ?? a.role}</p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => relancer(a)}
                      className="min-h-[38px] cursor-pointer rounded-full bg-[#f0883e] px-[18px] text-sm font-semibold text-[#1c0f05]"
                    >
                      Relancer
                    </button>
                    <button
                      type="button"
                      onClick={() => setChoisi(a.id)}
                      className="min-h-[38px] cursor-pointer rounded-full border border-[#3a4266] px-[18px] text-sm font-medium text-[#e7e9f3]"
                    >
                      Voir
                    </button>
                  </div>
                </div>
              ))}
            </Panneau>

            {/* L'agent choisi et ses derniers passages */}
            <section
              aria-label={detail.name}
              className="flex flex-col gap-3.5 rounded-[18px] border border-[#232a45] bg-[#0e1222] p-[18px]"
            >
              <div className="flex items-start gap-3">
                <div
                  className="flex size-[46px] shrink-0 items-center justify-center rounded-xl text-2xl"
                  style={{ background: ETATS[detail.status].fond }}
                >
                  {detail.emoji}
                </div>
                <div className="flex min-w-0 grow flex-col gap-0.5">
                  <div className="flex items-center justify-between gap-2">
                    <h2 className={`${TITRE} m-0 text-[21px] font-bold text-[#f3f4fa]`}>{detail.name}</h2>
                    <Pastille statut={detail.status} />
                  </div>
                  <span className="text-xs text-[#9aa2c4]">
                    {sourceDe(detail.id).court} · {detail.schedule ?? 'à la demande'} · dernier passage{' '}
                    {ecart(detail.lastRun, maintenant) ?? 'jamais'}
                  </span>
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[11px] font-bold tracking-wider text-[#9aa2c4]">MAINTENANT</span>
                <p className="m-0 text-[15px] leading-snug font-medium text-[#f3f4fa]">
                  {detail.status === 'working' ? `${detail.role}, écran allumé.` : (detail.lastMessage ?? detail.role)}
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
                              <span className="font-heading text-[10px] text-[#fca5a5]">ÉCHEC</span>
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
                <p className="m-0 text-sm text-[#9aa2c4]">Aucun passage aujourd’hui.</p>
              )}
            </section>

            {/* L'équipe, source par source */}
            <Panneau titre="Équipe" aside={`${agents.length} agents · ${SOURCES.length} sources`}>
              {SOURCES.map((source) => (
                <div key={source.cle} className="flex flex-col">
                  <div className="py-1 text-xs font-semibold" style={{ color: source.titre }}>
                    {source.nom} <span className="font-normal text-[#9aa2c4]">{source.detail}</span>
                  </div>
                  {agents
                    .filter((a) => source.ids.includes(a.id))
                    .map((a) => (
                      <button
                        key={a.id}
                        type="button"
                        onClick={() => setChoisi(a.id)}
                        aria-current={a.id === detail.id}
                        className="flex cursor-pointer items-center gap-2.5 rounded-lg px-1 py-[5px] text-left aria-[current=true]:bg-[#161c33]"
                      >
                        {portrait(a)}
                        <span className="min-w-0 grow">
                          <span className="block truncate text-sm font-semibold text-[#f3f4fa]">
                            {a.name} <span className="text-xs font-normal text-[#9aa2c4]">{a.schedule}</span>
                          </span>
                          <span className="block truncate text-xs text-[#9aa2c4]">{a.lastMessage ?? a.role}</span>
                        </span>
                        <Pastille statut={a.status} />
                      </button>
                    ))}
                </div>
              ))}
            </Panneau>
          </div>
        </div>

        <div
          role="status"
          className={[
            'fixed bottom-6 left-1/2 -translate-x-1/2 rounded-xl bg-[#f8f9fc] px-5 py-3 text-sm font-medium text-[#141428] shadow-[0_10px_30px_rgba(0,0,0,0.45)] transition-all',
            annonce ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-3 opacity-0',
          ].join(' ')}
        >
          {annonce}
        </div>
      </main>
    </div>
  )
}
