'use client'

import { createContext, memo, useContext, useEffect, useRef, useState, type CSSProperties } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ButtonGroup } from '@/components/ui/button-group'
import { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { JeuArcade, lireRecord, type Jeu } from './arcade'
import {
  BUREAU,
  CHAT_ID,
  CHEF_ID,
  LARGEUR,
  avancer,
  chat,
  estInvite,
  invite,
  marcheur,
  plan,
  type Invite,
  type Marcheur,
  type PlaceBureau,
  type Plan,
  type Statut,
} from './engine'
import { TEXTS, type Texts } from './i18n'
import {
  ACCENT,
  Anim,
  DefsCommunes,
  LAMPE_PLAN,
  MUR_SALLE,
  Pixels,
  TextesContexte,
  animerLeDecor,
  etapes,
  useTextes,
  type Lumiere,
} from './primitives'
import type { Theme } from './theme'
import { THEME_80 } from './themes/eighties'
import { THEME_GEEK } from './themes/geek'
import { Frise } from './timeline'
import { ecrirePreferences, lirePreferences, Reglages, useMeteoDuLieu, type Preferences } from './settings'
import { THEME_GYM } from './themes/gym'
import { THEME_MODERNE } from './themes/modern'
import { fete, type Fete } from './seasons'
import type { Agent, AgentStatus, OpenSpaceProps, SceneObject, ThemeName, WallTile, Weather } from './types'

/*
 * pixel-openspace — an open space in pixel art where your scheduled jobs and
 * AI agents come to work. The code speaks French inside (it was born in a
 * French workshop); everything it shows follows the `language` prop.
 */

/* ——— Ce que la scène sait d'un agent ——— */

/** Un agent tel que la scène le manipule : sa fiche, ce qu'il a dit, son état. */
type Vue = {
  fiche: { id: string; nom: string; emoji: string; role: string; rythme: string | null; vieillitApresH: number }
  brut: { dernierMessage: string | null; dernierPassage: string | null }
  statut: Statut
  prochain: string | null
  source: Agent
}

const STATUT: Record<AgentStatus, Statut> = {
  working: 'au-travail',
  ok: 'a-jour',
  late: 'en-retard',
  failed: 'en-echec',
  off: 'absent',
  never: 'jamais',
  'on-demand': 'a-la-demande',
}

function versVue(a: Agent, id = a.id): Vue {
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
    statut: STATUT[a.status],
    prochain: a.nextRun ?? null,
    source: a,
  }
}

type Equipe = { chef: Vue; agents: Array<Vue> }

/* Les thèmes disponibles, par leur nom public. */
const THEMES: Record<ThemeName, Theme> = { geek: THEME_GEEK, eighties: THEME_80, gym: THEME_GYM, modern: THEME_MODERNE }

/* Le thème de la scène, à portée des postes et des bonshommes. */
const ThemeContexte = createContext<Theme>(THEME_GEEK)
const useTheme = () => useContext(ThemeContexte)

function depuis(iso: string | null, maintenant: number, t: Texts): string {
  if (!iso) return t.never
  const minutes = Math.round((maintenant - Date.parse(iso)) / 60_000)
  if (minutes < 1) return t.justNow
  if (minutes < 60) return t.minutesAgo(minutes)
  const heures = Math.round(minutes / 60)
  if (heures < 24) return t.hoursAgo(heures)
  return t.daysAgo(Math.round(heures / 24))
}

/** « 09:28 » aujourd'hui, « Mon 09:15 » un autre jour : de quoi tenir sur le tableau blanc. */
function heureCourte(iso: string, maintenant: number, locale: string): string {
  const d = new Date(iso)
  const h = d.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })
  return d.toDateString() === new Date(maintenant).toDateString() ? h : `${d.toLocaleDateString(locale, { weekday: 'short' })} ${h}`
}

/** Assis à son bureau, assis au canapé, ou debout. */
type Assise = 'bureau' | 'canape' | null

/** Ce que la page dessine d'un marcheur, à l'image près. */
type Pose = {
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

function poses(p: Plan, marcheurs: Array<Marcheur>): Record<string, Pose> {
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

const posesAuBureau = (p: Plan) =>
  poses(
    p,
    [p.chef, ...p.bureaux].map((b) => marcheur(b.id, b.siege, 0)),
  )

/** Le temps qu'une parole reste affichée, celui qu'on met à s'étirer, et celui qu'un bureau met à se monter. */
const PAROLE_MS = 9_000
const ETIREMENT_MS = 2_500
const MONTAGE_MS = 8_000
/** Vingt secondes sans que rien ne bouge, et la scène se met au repos. */
const CALME_MS = 20_000
/** Une image toutes les 33 ms : 30 images par seconde. */
const IMAGE_MS = 1000 / 30 - 1

/** Les états qui valent une notification. */
const SOUCIS: Array<Statut> = ['en-echec', 'en-retard', 'absent']

/* Ce que ce navigateur retient : les alertes voulues, le son, et les agents qu'il a déjà vus. */
const CLE_ALERTES = 'pixel-openspace:alerts'
const CLE_SON = 'pixel-openspace:sound'
const CLE_CONNUS = 'pixel-openspace:known-agents'

function lire(cle: string): string | null {
  try {
    return localStorage.getItem(cle)
  } catch {
    return null
  }
}

function ecrire(cle: string, valeur: string) {
  try {
    localStorage.setItem(cle, valeur)
  } catch {
    /* Navigation privée ou stockage bloqué : on s'en passe. */
  }
}

/** Les minutes avant le prochain passage, quand il approche (dix minutes au plus). */
function bientot(vue: Vue, maintenant: number): number | null {
  if (!vue.prochain || vue.statut === 'au-travail' || vue.statut === 'absent') return null
  const minutes = Math.ceil((Date.parse(vue.prochain) - maintenant) / 60_000)
  return minutes > 0 && minutes <= 10 ? minutes : null
}

/** L'obscurité de la salle selon l'heure : nuit noire de 21 h à 6 h, le soir et le matin en pente douce. */
function obscurite(maintenant: number): number {
  const d = new Date(maintenant)
  const h = d.getHours() + d.getMinutes() / 60
  const nuit = 0.62
  if (h >= 8 && h < 18) return 0
  if (h >= 21 || h < 6) return nuit
  return h >= 18 ? ((h - 18) / 3) * nuit : ((8 - h) / 2) * nuit
}

const CHEF_DECOR = (t: Texts): Agent => ({ id: CHEF_ID, name: t.leadName, emoji: '🧑‍💼', role: t.leadRole, status: 'ok' })

/**
 * The open space. Pass your agents (and optionally a lead, wall tiles,
 * announcements and the weather); update the props as their state changes and
 * the room reacts: whoever starts working sits down and types, whoever
 * finishes stretches and says its last word, a failed agent's PC smokes and
 * the lead comes over. Click an agent to see its card.
 */
export function PixelOpenspace({
  agents,
  lead,
  title = 'PIXEL OPENSPACE',
  wall = [],
  announcements = [],
  weather = null,
  visitors = 0,
  deliveries = 0,
  celebrate = false,
  timeline = true,
  language: langueProp = 'en',
  theme: themeProp = 'geek',
  seasonal: saisonsProp = true,
  nightHours = [22, 6],
  toolbar = true,
  objectLinks = {},
  onObjectClick,
  onRun,
  now,
  className,
  style,
}: OpenSpaceProps) {
  /* Ce que le visiteur a réglé derrière la roue dentée passe avant les props ; lu après l'hydratation. */
  const [preferences, setPreferences] = useState<Preferences>({})
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- les préférences vivent dans le navigateur
    setPreferences(lirePreferences())
  }, [])
  const changerPreferences = (p: Preferences) =>
    setPreferences((avant) => {
      const apres = { ...avant, ...p }
      ecrirePreferences(apres)
      return apres
    })
  const language = preferences.language ?? langueProp
  const enseigne = preferences.title?.trim() || title
  // Un lieu choisi dans les réglages : sa vraie météo remplace celle des props, une fois trouvée.
  const etatMeteo = useMeteoDuLieu(preferences.weatherPlace, language)
  const meteo = etatMeteo.etat === 'trouve' ? etatMeteo.meteo : weather
  const nomTheme = preferences.theme ?? themeProp
  const seasonal = preferences.seasonal ?? saisonsProp
  const assombrir = preferences.night ?? true
  const mouvement = preferences.motion ?? true

  const t = TEXTS[language]
  const theme = THEMES[nomTheme] ?? THEME_GEEK
  const equipe: Equipe = {
    chef: versVue(lead ?? CHEF_DECOR(t), CHEF_ID),
    agents: agents.map((a) => versVue(a)),
  }

  const [ouverture] = useState(() => now ?? Date.now())
  /*
   * L'horloge, les comptes à rebours et la nuit dépendent de l'heure, qui n'est
   * pas la même au rendu serveur et dans le navigateur. Sans `now`, la scène ne
   * se dessine qu'une fois arrivée dans le navigateur ; un cadre vide aux bonnes
   * proportions tient sa place d'ici là.
   */
  const [pret, setPret] = useState(now !== undefined)
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- marque l'arrivée dans le navigateur, une seule fois
    setPret(true)
  }, [])
  const [maintenant, setMaintenant] = useState(ouverture)
  const [choisi, setChoisi] = useState<string | null>(null)
  const [paroles, setParoles] = useState<Record<string, string>>({})
  const [etires, setEtires] = useState<Record<string, true>>({})
  const [nouveaux, setNouveaux] = useState<Record<string, true>>({})
  const [jeu, setJeu] = useState<Jeu | null>(null)
  const [records, setRecords] = useState({ snake: 0, casse: 0 })
  const [deposes, setDeposes] = useState(0)
  const [son, setSon] = useState(false)
  const [alertes, setAlertes] = useState(false)
  const [alertesBloquees, setAlertesBloquees] = useState(false)
  const audio = useRef<AudioContext | null>(null)
  const alertesActives = useRef(false)
  const scenePleinEcran = useRef<HTMLDivElement>(null)
  /* Les invités annoncés par les props, que la boucle d'animation fait entrer. */
  const arrivees = useRef<Array<Invite>>([])
  const minuteries = useRef<Array<ReturnType<typeof setTimeout>>>([])
  const plusTard = (ms: number, faire: () => void) => minuteries.current.push(setTimeout(faire, ms))

  const jouerSon = (quoi: keyof typeof SONS) => {
    if (audio.current) jouerNotes(audio.current, SONS[quoi])
  }

  /* L'heure avance toutes les cinq secondes : horloge, comptes à rebours, nuit. */
  useEffect(() => {
    const minuterie = setInterval(() => setMaintenant(Date.now()), 5_000)
    const liste = minuteries.current
    return () => {
      clearInterval(minuterie)
      liste.forEach(clearTimeout)
    }
  }, [])

  /* Le son se rallume d'une visite à l'autre, mais le navigateur ne l'autorise qu'après un geste : le premier clic. */
  useEffect(() => {
    if (lire(CLE_SON) !== '1') return
    // eslint-disable-next-line react-hooks/set-state-in-effect -- la préférence vit dans le navigateur, lue après l'hydratation
    setSon(true)
    const reveiller = () => {
      audio.current ??= new AudioContext()
      void audio.current.resume()
    }
    window.addEventListener('pointerdown', reveiller, { once: true })
    return () => window.removeEventListener('pointerdown', reveiller)
  }, [])

  const basculerSon = () => {
    if (son) {
      void audio.current?.close()
      audio.current = null
      setSon(false)
      ecrire(CLE_SON, '0')
      return
    }
    audio.current = new AudioContext()
    jouerNotes(audio.current, SONS.travail)
    setSon(true)
    ecrire(CLE_SON, '1')
  }

  /* Les alertes restent branchées d'une visite à l'autre, tant que le navigateur les autorise. */
  useEffect(() => {
    const voulu = lire(CLE_ALERTES) === '1' && typeof Notification !== 'undefined' && Notification.permission === 'granted'
    alertesActives.current = voulu
    // eslint-disable-next-line react-hooks/set-state-in-effect -- l'état vient du navigateur, connu seulement après l'hydratation
    setAlertes(voulu)
    setAlertesBloquees(typeof Notification === 'undefined' || Notification.permission === 'denied')
  }, [])

  const basculerAlertes = async () => {
    if (alertes) {
      alertesActives.current = false
      setAlertes(false)
      ecrire(CLE_ALERTES, '0')
      return
    }
    if (typeof Notification === 'undefined') return
    const permission = Notification.permission === 'granted' ? 'granted' : await Notification.requestPermission()
    const ok = permission === 'granted'
    setAlertesBloquees(permission === 'denied')
    alertesActives.current = ok
    setAlertes(ok)
    ecrire(CLE_ALERTES, ok ? '1' : '0')
  }

  const basculerPleinEcran = () => {
    // Le navigateur peut refuser (pas de geste de l'utilisateur, iframe) : on reste alors dans la page.
    const demande = document.fullscreenElement ? document.exitFullscreen() : scenePleinEcran.current?.requestFullscreen()
    demande?.catch(() => {})
  }

  /* Les records des bornes, relus à chaque fermeture de borne. */
  useEffect(() => {
    if (jeu) return
    // eslint-disable-next-line react-hooks/set-state-in-effect -- les records vivent dans le navigateur
    setRecords({ snake: lireRecord('snake'), casse: lireRecord('casse-briques') })
  }, [jeu])

  /* Un agent cliqué dit ce qu'il fait, le temps de le lire. */
  const parler = (vue: Vue) => {
    const id = vue.fiche.id
    if (!vue.fiche.role) return
    setParoles((p) => ({ ...p, [id]: vue.fiche.role }))
    plusTard(5_000, () => setParoles((p) => sans(p, id)))
  }

  /* Un agent que ce navigateur n'a jamais vu voit son bureau se monter sous ses yeux. */
  const cle = equipe.agents.map((a) => a.fiche.id).join(',')
  useEffect(() => {
    const ids = cle ? cle.split(',') : []
    const connus = lire(CLE_CONNUS)
    ecrire(CLE_CONNUS, JSON.stringify(ids))
    // La toute première visite ne monte rien : tout le monde était déjà là.
    if (!connus) return
    let deja: Array<string> = []
    try {
      deja = JSON.parse(connus) as Array<string>
    } catch {
      return
    }
    const arrives = ids.filter((id) => !deja.includes(id))
    if (!arrives.length) return
    // eslint-disable-next-line react-hooks/set-state-in-effect -- ce que le navigateur a déjà vu n'est connu qu'après l'hydratation
    setNouveaux(Object.fromEntries(arrives.map((id) => [id, true as const])))
    const minuterie = setTimeout(() => setNouveaux({}), MONTAGE_MS)
    return () => clearTimeout(minuterie)
  }, [cle])

  /*
   * Ce qui change d'une fois sur l'autre : qui finit (il s'étire et parle),
   * qui tombe (notification, alarme), qui se met au travail (bip). Les
   * compteurs de visiteurs et de livraisons font entrer du monde.
   */
  const precedente = useRef<{ equipe: Equipe; visitors: number; deliveries: number } | null>(null)
  const empreinteEquipe = [equipe.chef, ...equipe.agents].map((v) => `${v.fiche.id}:${v.statut}:${v.brut.dernierMessage ?? ''}`).join('|')
  useEffect(() => {
    const avant = precedente.current
    precedente.current = { equipe, visitors, deliveries }
    if (!avant) return
    for (const vue of [equipe.chef, ...equipe.agents]) {
      const ancienne = [avant.equipe.chef, ...avant.equipe.agents].find((a) => a.fiche.id === vue.fiche.id)
      if (!ancienne || ancienne.statut === vue.statut) continue
      const id = vue.fiche.id
      if (ancienne.statut === 'au-travail') {
        const mot = vue.brut.dernierMessage
        if (mot) {
          // eslint-disable-next-line react-hooks/set-state-in-effect -- la scène réagit à un changement venu des props : une bulle, le temps de la lire
          setParoles((p) => ({ ...p, [id]: mot }))
          plusTard(PAROLE_MS, () => setParoles((p) => sans(p, id)))
        }
        setEtires((e) => ({ ...e, [id]: true }))
        plusTard(ETIREMENT_MS, () => setEtires((e) => sans(e, id)))
      }
      if (vue.statut === 'au-travail') jouerSon('travail')
      if (vue.statut === 'en-echec') jouerSon('echec')
      if (alertesActives.current && SOUCIS.includes(vue.statut) && typeof Notification !== 'undefined') {
        new Notification(`${vue.fiche.emoji} ${vue.fiche.nom}: ${t.statuses[vue.statut]}`, {
          body: vue.brut.dernierMessage ?? vue.fiche.role,
          tag: `pixel-openspace-${id}`,
        })
      }
    }
    if (visitors > avant.visitors) {
      for (let i = 0; i < Math.min(2, visitors - avant.visitors); i++) arrivees.current.push('visiteur')
      jouerSon('sonnette')
    }
    for (let i = 0; i < Math.min(2, deliveries - avant.deliveries); i++) arrivees.current.push('livreur')
    // eslint-disable-next-line react-hooks/exhaustive-deps -- on ne réagit qu'à ce qui se voit : états, messages, compteurs
  }, [empreinteEquipe, visitors, deliveries])

  const lePlan = plan(cle ? cle.split(',') : [], t.phrases, theme.coins)
  const [scene, setScene] = useState<Record<string, Pose>>(() => posesAuBureau(lePlan))

  /* Les états, les annonces du chef et les heures de nuit, lus par la boucle d'animation sans la relancer. */
  const statuts = useRef(new Map<string, Statut>())
  const annonces = useRef<Array<string>>([])
  const heuresNuit = useRef(nightHours)
  useEffect(() => {
    statuts.current = new Map([[CHEF_ID, equipe.chef.statut], ...equipe.agents.map((a) => [a.fiche.id, a.statut] as const)])
    annonces.current = announcements
    heuresNuit.current = nightHours
  })

  useEffect(() => {
    if (!mouvement) {
      // Les déplacements coupés : chacun retourne s'asseoir à son bureau, et la scène ne bouge plus.
      // eslint-disable-next-line react-hooks/set-state-in-effect -- un seul rendu, à l'arrêt de la boucle
      setScene(posesAuBureau(lePlan))
      return
    }
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const p = plan(cle ? cle.split(',') : [], t.phrases, theme.coins)
    // Chacun se lève à son heure, pas tous ensemble.
    let marcheurs = [...[p.chef, ...p.bureaux].map((b) => marcheur(b.id, b.siege, 2_000 + Math.random() * 60_000)), chat(p)]
    let numero = 0
    let avant: number | null = null
    let image = 0
    let attente: ReturnType<typeof setTimeout> | undefined
    let derniereScene = ''
    let calmeDepuis: number | null = null
    let enPause = false

    /* Ce qui se voit d'un marcheur : tant que rien n'en change, inutile de redessiner. */
    const empreinte = () =>
      marcheurs
        .map(
          (m) =>
            `${m.id}:${Math.round(m.pos.x)},${Math.round(m.pos.y)},${Math.round(m.angle / 90)},` +
            `${m.chemin.length ? Math.floor(m.pas / 70) : '-'},${m.lieu.nom},${m.parole ?? ''},${m.porte ? 1 : 0}`,
        )
        .join('|')

    const boucle = (instant: number) => {
      // Trente tours par seconde, pas plus : le pixel art n'en demande pas davantage.
      if (avant !== null && !enPause && instant - avant < IMAGE_MS) {
        image = requestAnimationFrame(boucle)
        return
      }
      // Les invités annoncés entrent ; ceux qui sont ressortis s'effacent.
      for (const genre of arrivees.current.splice(0)) marcheurs.push(invite(p, genre, ++numero))
      const charges = new Set(marcheurs.filter((m) => m.porte).map((m) => m.id))
      const [debutNuit, finNuit] = heuresNuit.current
      const heure = new Date().getHours()
      const nuit = debutNuit > finNuit ? heure >= debutNuit || heure < finNuit : heure >= debutNuit && heure < finNuit
      // Un onglet revenu de l'arrière-plan ne téléporte personne ; au calme, les pas sont plus espacés.
      avancer(
        p,
        marcheurs,
        statuts.current,
        Math.min(instant - (avant ?? instant), enPause ? 250 : 100),
        Math.random,
        annonces.current,
        nuit,
      )
      const livres = marcheurs.filter((m) => charges.has(m.id) && !m.porte).length
      if (livres) setDeposes((d) => Math.min(3, d + livres))
      marcheurs = marcheurs.filter((m) => !m.parti)
      avant = instant

      /*
       * Le calme : personne ne marche, personne ne travaille ni n'a planté, depuis vingt
       * secondes. Les animations du décor se figent et la boucle ralentit à quatre tours
       * par seconde ; le premier qui se lève relance tout.
       */
      const bouge = marcheurs.some((m) => m.chemin.length)
      const occupe = [...statuts.current.values()].some((s) => s === 'au-travail' || s === 'en-echec')
      calmeDepuis = bouge || occupe ? null : (calmeDepuis ?? instant)
      const calme = calmeDepuis !== null && instant - calmeDepuis > CALME_MS
      enPause = calme
      // Le décor s'anime au rythme de la boucle, et se fige avec elle au calme.
      if (!calme) animerLeDecor(instant)

      // Et on ne redessine que si quelque chose a changé à l'écran.
      const vue = empreinte()
      if (vue !== derniereScene) {
        derniereScene = vue
        const suivante = poses(p, marcheurs)
        // Qui n'a pas bougé garde sa pose d'avant : React ne redessine que ceux qui ont changé.
        setScene((precedentes) =>
          Object.fromEntries(
            Object.entries(suivante).map(([id, pose]) => {
              const ancienne = precedentes[id]
              const pareil =
                ancienne && (Object.keys(pose) as Array<keyof Pose>).every((k) => (k === 'pas' ? !pose.marche : ancienne[k] === pose[k]))
              return [id, pareil ? ancienne : pose]
            }),
          ),
        )
      }

      if (enPause) attente = setTimeout(() => (image = requestAnimationFrame(boucle)), 250)
      else image = requestAnimationFrame(boucle)
    }
    image = requestAnimationFrame(boucle)
    return () => {
      cancelAnimationFrame(image)
      clearTimeout(attente)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- la boucle ne repart que si les bureaux, la langue, le thème ou les déplacements changent
  }, [cle, language, nomTheme, mouvement])

  const tous = [equipe.chef, ...equipe.agents]
  const postes = [{ vue: equipe.chef, place: lePlan.chef }, ...equipe.agents.map((vue, i) => ({ vue, place: lePlan.bureaux[i] }))]
  const presents = postes
    .filter(({ vue }) => vue.statut !== 'absent')
    .map(({ vue, place }) => ({
      vue,
      place,
      pose:
        scene[vue.fiche.id] ??
        ({
          ...place.siege.pos,
          angle: place.siege.face,
          marche: false,
          pas: 0,
          assise: 'bureau',
          lieu: place.siege.nom,
          parole: null,
          porte: false,
        } satisfies Pose),
    }))
    // Le plus bas passe devant : c'est ce qui donne la profondeur.
    .sort((a, b) => a.pose.y - b.pose.y)
  const selection = tous.find((a) => a.fiche.id === choisi) ?? null
  const choisir = (id: string) => setChoisi((c) => (c === id ? null : id))
  const cliquerAgent = (id: string) => {
    const vue = tous.find((a) => a.fiche.id === id)
    if (vue) parler(vue)
    choisir(id)
  }
  const cafe = Boolean(theme.coinCafe) && presents.some(({ pose }) => pose.lieu === theme.coinCafe && !pose.marche)
  const invites = Object.entries(scene).filter(([id]) => estInvite(id))
  const poseChat = scene[CHAT_ID]
  // Les cinq prochains passages, pour le tableau blanc du chef.
  const prochains = equipe.agents
    .filter((a) => a.prochain && a.statut !== 'absent')
    .sort((a, b) => a.prochain!.localeCompare(b.prochain!))
    .slice(0, 5)
    .map((a) => ({ heure: heureCourte(a.prochain!, maintenant, t.locale), nom: a.fiche.nom }))
  const nuit = assombrir ? obscurite(maintenant) : 0
  const aller = (objet: SceneObject) => {
    const href = objectLinks[objet]
    if (!href) return
    if (onObjectClick) onObjectClick(objet, href)
    else window.location.href = href
  }

  // Les lumières qui percent la nuit : les écrans allumés, la lampe du chef, et celles du thème.
  const lumieres: Array<Lumiere> = [
    ...postes
      .filter(({ vue }) => vue.statut !== 'absent')
      .flatMap(({ vue, place }) =>
        place.id === CHEF_ID
          ? [{ x: place.cx, y: place.dy + 10, r: 80 }]
          : [
              {
                x: place.cx - 4,
                y: place.dy,
                r: vue.statut === 'au-travail' ? 95 : 60,
                couleur: vue.statut === 'au-travail' ? ACCENT : undefined,
              },
              ...(theme.lumierePoste?.(place.cx, place.dy, theme.tenue(vue.fiche.id).c) ?? []),
            ],
      ),
    ...theme.lumieres,
  ]

  // La carte s'accroche au-dessus de l'agent choisi, ou à son bureau s'il est absent.
  const ancre = (() => {
    if (!selection) return null
    const present = presents.find(({ vue }) => vue.fiche.id === selection.fiche.id)
    const place = postes.find(({ vue }) => vue.fiche.id === selection.fiche.id)?.place
    // Assis à son bureau, la carte passe au-dessus de l'écran pour ne pas le cacher.
    if (present && present.pose.assise === 'bureau' && place && place.id !== CHEF_ID) {
      return { x: present.pose.x, haut: place.dy - 16, bas: cadrage(present.pose).bas }
    }
    if (present) return { x: present.pose.x, ...cadrage(present.pose) }
    return place ? { x: place.cx, haut: place.dy - 14, bas: place.dy + BUREAU.hauteur } : null
  })()

  return (
    <TextesContexte.Provider value={t}>
      <ThemeContexte.Provider value={theme}>
        <div
          className={['flex flex-col gap-3', className].filter(Boolean).join(' ')}
          style={{ '--po-accent': '#e8b923', ...style } as CSSProperties}
        >
          {toolbar ? (
            <ButtonGroup className="self-end">
              <Button variant="outline" size="sm" onClick={basculerPleinEcran}>
                {t.fullscreen}
              </Button>
              <Reglages
                titre={preferences.title ?? ''}
                titreOrigine={title}
                lieu={preferences.weatherPlace ?? ''}
                lieuOrigine={weather?.place}
                etatMeteo={etatMeteo}
                theme={nomTheme}
                langue={language}
                saisons={seasonal}
                nuit={assombrir}
                mouvement={mouvement}
                son={son}
                alertes={alertes}
                alertesBloquees={alertesBloquees}
                changer={changerPreferences}
                basculerSon={basculerSon}
                basculerAlertes={() => void basculerAlertes()}
                reinitialiser={() => {
                  setPreferences({})
                  ecrirePreferences({})
                }}
              />
            </ButtonGroup>
          ) : null}

          <div
            ref={scenePleinEcran}
            style={{ background: theme.fond }}
            className="overflow-x-auto rounded-xl border [&:fullscreen]:flex [&:fullscreen]:items-center [&:fullscreen]:justify-center [&:fullscreen]:rounded-none [&:fullscreen]:border-0"
          >
            <div
              className="relative min-w-[720px] [:fullscreen>&]:w-[min(100vw,calc(100vh*var(--ratio)))]"
              style={{ '--ratio': LARGEUR / lePlan.hauteur } as CSSProperties}
            >
              {!pret ? <div style={{ aspectRatio: `${LARGEUR} / ${lePlan.hauteur}` }} /> : null}
              {pret ? (
                <svg
                  viewBox={`0 0 ${LARGEUR} ${lePlan.hauteur}`}
                  className="block w-full select-none"
                  style={{ fontFamily: "var(--font-pixel, 'Pixelify Sans'), ui-monospace, monospace" }}
                  shapeRendering="crispEdges"
                  role="img"
                  aria-label={t.sceneLabel}
                >
                  <DefsCommunes />
                  <theme.Decor hauteur={lePlan.hauteur} titre={enseigne} liens={objectLinks} aller={aller} jouer={setJeu} />
                  <EcranMural tuiles={wall} />
                  <TableauBlanc prochains={prochains} />
                  <Records snake={records.snake} casse={records.casse} />
                  <ColisDeposes nombre={deposes} bas={lePlan.hauteur - 20} />
                  {seasonal ? <Fetes quoi={fete(maintenant)} bas={lePlan.hauteur - 20} /> : null}
                  <Fenetre meteo={meteo} />
                  <Horloge maintenant={maintenant} ouverture={ouverture} />
                  {cafe && theme.CafeQuiCoule ? <theme.CafeQuiCoule /> : null}

                  {postes.map(({ vue, place }) => (
                    <Poste
                      key={vue.fiche.id}
                      vue={vue}
                      place={place}
                      occupe={vue.statut !== 'absent' && (scene[vue.fiche.id]?.assise ?? 'bureau') === 'bureau'}
                      bientot={bientot(vue, maintenant)}
                      monte={Boolean(nouveaux[vue.fiche.id])}
                      oublie={oublie(vue, maintenant)}
                      choisi={choisi === vue.fiche.id}
                      choisir={() => choisir(vue.fiche.id)}
                    />
                  ))}

                  {presents.map(({ vue, pose }) => (
                    <Personnage
                      key={vue.fiche.id}
                      id={vue.fiche.id}
                      pose={pose}
                      etire={Boolean(etires[vue.fiche.id])}
                      choisir={cliquerAgent}
                    />
                  ))}
                  {invites.map(([id, pose]) => (
                    <Personnage key={id} id={id} pose={pose} etire={false} />
                  ))}
                  {poseChat ? <Chat pose={poseChat} /> : null}

                  {/* Le dossier des chaises occupées, devant le dos de l'agent. */}
                  {presents
                    .filter(({ vue, pose }) => pose.assise === 'bureau' && vue.fiche.id !== CHEF_ID)
                    .map(({ vue, place }) => (
                      <theme.Dossier
                        key={vue.fiche.id}
                        x={place.siege.pos.x}
                        y={place.siege.pos.y + 4}
                        couleur={theme.tenue(vue.fiche.id).c}
                      />
                    ))}

                  <Nuit niveau={nuit} lumieres={lumieres} hauteur={lePlan.hauteur} voile={theme.nuit} />
                  {celebrate ? <Confettis hauteur={lePlan.hauteur} /> : null}

                  {/* Les étiquettes et les bulles, au-dessus de tout, même la nuit. */}
                  {presents.map(({ vue, pose }) => (
                    <Annonce key={vue.fiche.id} vue={vue} pose={pose} parole={paroles[vue.fiche.id] ?? pose.parole} />
                  ))}
                  {invites.map(([id, pose]) =>
                    pose.parole ? <Parole key={id} x={Math.round(pose.x)} haut={cadrage(pose).haut} texte={pose.parole} /> : null,
                  )}
                </svg>
              ) : null}

              {selection && ancre ? (
                <Carte
                  key={selection.fiche.id}
                  agent={selection}
                  ancre={ancre}
                  hauteur={lePlan.hauteur}
                  maintenant={maintenant}
                  lancer={onRun}
                  fermer={() => setChoisi(null)}
                />
              ) : null}
            </div>
          </div>
          {timeline && agents.some((a) => a.runs?.length) ? (
            <Frise agents={lead ? [lead, ...agents] : agents} maintenant={maintenant} choisir={setChoisi} />
          ) : null}
          {jeu ? <JeuArcade key={jeu} jeu={jeu} textes={t} fermer={() => setJeu(null)} /> : null}
        </div>
      </ThemeContexte.Provider>
    </TextesContexte.Provider>
  )
}

const sans = <T,>(objet: Record<string, T>, cle: string) => Object.fromEntries(Object.entries(objet).filter(([k]) => k !== cle))

/** La carte d'un agent, posée sur la scène au-dessus de lui (ou en dessous, près du haut). */
function Carte({
  agent,
  ancre,
  hauteur,
  maintenant,
  lancer,
  fermer,
}: {
  agent: Vue
  ancre: { x: number; haut: number; bas: number }
  hauteur: number
  maintenant: number
  lancer?: (agent: Agent) => void | Promise<void>
  fermer: () => void
}) {
  const t = useTextes()
  const { fiche, statut, brut, prochain } = agent
  const [enCours, setEnCours] = useState(false)
  const dessous = ancre.haut < 240
  const horizontal = ancre.x < 160 ? '0%' : ancre.x > LARGEUR - 160 ? '-100%' : '-50%'
  const travaille = statut === 'au-travail'
  return (
    <Card
      // L'attribut plutôt que la prop : la carte compacte du style Base UI, sans gêner le style Radix qui ne la connaît pas.
      data-size="sm"
      className="absolute z-10 w-72 shadow-xl"
      style={{
        left: `${(ancre.x / LARGEUR) * 100}%`,
        top: `${((dessous ? ancre.bas : ancre.haut) / hauteur) * 100}%`,
        transform: dessous ? `translate(${horizontal}, 10px)` : `translate(${horizontal}, calc(-100% - 10px))`,
      }}
    >
      <CardHeader>
        <CardTitle>
          <span aria-hidden>{fiche.emoji}</span> {fiche.nom}
        </CardTitle>
        {fiche.role ? <CardDescription>{fiche.role}</CardDescription> : null}
        <CardAction>
          <Button variant="ghost" size="icon-xs" onClick={fermer} aria-label={t.close}>
            ✕
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-col gap-2 text-xs">
        <div className="flex flex-wrap items-center gap-1.5">
          <Badge variant={statut === 'en-echec' ? 'destructive' : 'secondary'}>
            <span className="size-1.5 rounded-full" style={{ background: LAMPE_PLAN[statut] }} />
            {t.statuses[statut]}
          </Badge>
          {fiche.rythme ? <Badge variant="outline">{fiche.rythme}</Badge> : null}
        </div>
        <p className="text-muted-foreground">
          {t.lastRun} {depuis(brut.dernierPassage, maintenant, t)}
          {prochain ? ` · ${t.nextRun} ${heureCourte(prochain, maintenant, t.locale)}` : ''}
        </p>
        {brut.dernierMessage && statut !== 'absent' ? (
          <p className="line-clamp-2 rounded-md bg-muted px-2 py-1 font-mono text-[0.65rem]">{brut.dernierMessage}</p>
        ) : null}
      </CardContent>
      {lancer ? (
        <CardFooter>
          <Button
            size="sm"
            disabled={enCours || travaille}
            onClick={async () => {
              setEnCours(true)
              try {
                await lancer(agent.source)
              } finally {
                setEnCours(false)
              }
            }}
          >
            {enCours ? t.launching : travaille ? t.running : t.runNow}
          </Button>
        </CardFooter>
      ) : null}
    </Card>
  )
}

/**
 * La nuit tombe sur la salle, percée par les lumières : un voile bleu nuit,
 * avec un trou doux autour de chaque écran allumé. Les LED, les néons et les
 * écrans au travail jettent en plus une lueur de leur couleur.
 */
function Nuit({
  niveau,
  lumieres,
  hauteur,
  voile = { couleur: '#0a1033', opacite: 0.62 },
}: {
  niveau: number
  lumieres: Array<Lumiere>
  hauteur: number
  voile?: { couleur: string; opacite: number }
}) {
  if (!niveau) return null
  // L'obscurité va jusqu'à 0,62 ; le thème choisit jusqu'où son voile descend.
  const opacite = (niveau / 0.62) * voile.opacite
  return (
    <g pointerEvents="none" shapeRendering="auto">
      <defs>
        <radialGradient id="trou">
          <stop offset="0" stopColor="black" />
          <stop offset="0.45" stopColor="black" stopOpacity="0.85" />
          <stop offset="1" stopColor="black" stopOpacity="0" />
        </radialGradient>
        {lumieres.map((l, i) =>
          l.couleur ? (
            <radialGradient key={i} id={`lueur-${i}`}>
              <stop offset="0" stopColor={l.couleur} stopOpacity="0.4" />
              <stop offset="1" stopColor={l.couleur} stopOpacity="0" />
            </radialGradient>
          ) : null,
        )}
        <mask id="nuit-masque">
          <rect width={LARGEUR} height={hauteur} fill="white" />
          {lumieres.map((l, i) => (
            <circle key={i} cx={l.x} cy={l.y} r={l.r} fill="url(#trou)" />
          ))}
        </mask>
      </defs>
      <rect width={LARGEUR} height={hauteur} fill={voile.couleur} opacity={opacite} mask="url(#nuit-masque)" />
      {lumieres.map((l, i) =>
        l.couleur ? (
          <ellipse key={i} cx={l.x} cy={l.y + 16} rx={l.r * 0.85} ry={l.r * 0.65} fill={`url(#lueur-${i})`} opacity={niveau / 0.62} />
        ) : null,
      )}
    </g>
  )
}

/* La couleur d'une tuile selon son ton. */
const TONS: Record<NonNullable<WallTile['tone']>, string> = {
  neutral: '#e5e7eb',
  ok: '#4ade80',
  info: '#38bdf8',
  warn: '#fb923c',
  alert: '#ef4444',
}

/**
 * Le grand écran accroché au mur de la grande salle : jusqu'à quatre tuiles,
 * leur valeur, et une jauge pour celles qui en ont une.
 */
function EcranMural({ tuiles }: { tuiles: Array<WallTile> }) {
  const affichees = tuiles.slice(0, 4)
  if (!affichees.length) return null
  const largeur = 196 / affichees.length
  return (
    <g pointerEvents="none">
      <rect x="30" y="206" width="200" height="34" fill="#0b0d10" />
      <rect x="32" y="208" width="196" height="30" fill="#0b1220" />
      {affichees.map((tuile, i) => {
        const x = 34 + i * largeur
        const l = largeur - 2.5
        const couleur = tuile.tone ? TONS[tuile.tone] : ACCENT
        return (
          <g key={`${i}-${tuile.label}`}>
            <rect x={x} y="210" width={l} height="26" fill="#111827" />
            <text x={x + l / 2} y="217" fontSize="5.5" textAnchor="middle" fill="#94a3b8">
              {tuile.label.toUpperCase()}
            </text>
            <text x={x + l / 2} y="230" fontSize="12" textAnchor="middle" fill={couleur}>
              {tuile.value}
            </text>
            {tuile.progress !== undefined ? (
              <>
                <rect x={x + 4} y="232" width={l - 8} height="2" fill="#1f2937" />
                <rect x={x + 4} y="232" width={Math.max(0, Math.min(1, tuile.progress)) * (l - 8)} height="2" fill={couleur} />
              </>
            ) : null}
          </g>
        )
      })}
    </g>
  )
}

/* ——— Le tableau blanc, les records, la porte, les colis, les fêtes ——— */

/** Le tableau blanc du bureau du chef : les prochains passages, au feutre. */
function TableauBlanc({ prochains }: { prochains: Array<{ heure: string; nom: string }> }) {
  const t = useTextes()
  return (
    <g pointerEvents="none">
      <rect x="32" y="176" width="4" height="12" fill="#6b7280" />
      <rect x="124" y="176" width="4" height="12" fill="#6b7280" />
      <rect x="26" y="108" width="108" height="70" fill="#9ca3af" />
      <rect x="29" y="111" width="102" height="64" fill="#f8fafc" />
      <rect x="29" y="171" width="102" height="4" fill="#d1d5db" />
      <rect x="100" y="172" width="10" height="2" fill="#2563eb" />
      <rect x="112" y="172" width="10" height="2" fill="#dc2626" />
      <text x="34" y="120" fontSize="7" fill="#1d4ed8">
        {t.nextRuns}
      </text>
      {prochains.length ? (
        prochains.map((p, i) => (
          <text key={p.nom} x="34" y={130 + i * 8.5} fontSize="6.5" fill={i === 0 ? '#dc2626' : '#1f2937'}>
            {p.heure} · {p.nom}
          </text>
        ))
      ) : (
        <text x="34" y="132" fontSize="6.5" fill="#6b7280">
          {t.nothingPlanned}
        </text>
      )}
    </g>
  )
}

/** Le panneau des records, accroché au mur à côté du coin gaming. */
function Records({ snake, casse }: { snake: number; casse: number }) {
  const t = useTextes()
  const pad = (n: number) => String(n).padStart(3, '0')
  return (
    <g pointerEvents="none">
      <rect x="286" y="207" width="70" height="33" fill="#0b0d10" />
      <rect x="288" y="209" width="66" height="29" fill="#1e1b4b" />
      <text x="321" y="217" fontSize="6.5" textAnchor="middle" fill="var(--po-accent)">
        {t.hiScores}
        <Anim attributeName="opacity" values="1;0.5;1" dur="1.5s" repeatCount="indefinite" />
      </text>
      <text x="292" y="226" fontSize="6" fill="#f472b6">
        SNAKE
      </text>
      <text x="350" y="226" fontSize="6" textAnchor="end" fill="#f472b6">
        {pad(snake)}
      </text>
      <text x="292" y="234" fontSize="6" fill="#67e8f9">
        CASSE
      </text>
      <text x="350" y="234" fontSize="6" textAnchor="end" fill="#67e8f9">
        {pad(casse)}
      </text>
    </g>
  )
}

/** Les colis déposés par le livreur depuis l'ouverture de la page. */
function ColisDeposes({ nombre, bas }: { nombre: number; bas: number }) {
  return (
    <g pointerEvents="none">
      {Array.from({ length: nombre }, (_, i) => (
        <g key={i}>
          <rect x={128 + i * 6} y={bas - 22 - i * 12} width="22" height="14" fill="#b45309" />
          <rect x={128 + i * 6} y={bas - 22 - i * 12} width="22" height="3" fill="#d97706" />
          <rect x={137 + i * 6} y={bas - 22 - i * 12} width="4" height="14" fill="#fde68a" />
        </g>
      ))}
    </g>
  )
}

/** Les fêtes : Halloween tout le mois d'octobre, Noël tout le mois de décembre. */

/* Pâques : un œuf, le poussin, le lapin de profil. */
const OEUF = ['..ee..', '.eeee.', 'ebbbbe', 'eeeeee', 'ewewew', '.eeee.', '..ee..']
const POUSSIN = ['.yy...', 'yyey..', 'yyyyo.', '.yyy..', '.o.o..']
const LAPIN = ['.....gw.gw', '.....gw.gw', '....wwwwww', 'w..wwwwwep', 'wwwwwwwwww', '.wwwwwwww.', '.ww....ww.']
/* Où sont cachés les œufs, et de quelles couleurs : x, y (ou « bas », au pied du mur du fond), fond, rayure, points. */
const OEUFS: Array<[number, number | 'bas', string, string, string]> = [
  [44, 182, '#f9a8d4', '#f472b6', '#fdf2f8'],
  [318, 96, '#7c2d12', '#facc15', '#92400e'],
  [470, 182, '#a5f3fc', '#22d3ee', '#ecfeff'],
  [610, 176, '#7c2d12', '#facc15', '#92400e'],
  [846, 46, '#bbf7d0', '#4ade80', '#f0fdf4'],
  [962, 176, '#ddd6fe', '#a78bfa', '#f5f3ff'],
  [70, 300, '#fde68a', '#f59e0b', '#fffbeb'],
  [955, 470, '#7c2d12', '#facc15', '#92400e'],
  [420, 'bas', '#fecdd3', '#fb7185', '#fff1f2'],
  [690, 'bas', '#a5f3fc', '#38bdf8', '#ecfeff'],
]

const CITROUILLE = ['...g....', '.oooooo.', 'ooyooyoo', 'oooooooo', 'oyyyyyyo', '.oooooo.']
const FANTOME = ['.www.', 'wwwww', 'wewew', 'wwwww', 'wwwww', 'w.w.w']
const SAPIN = [
  '....y....',
  '...ggg...',
  '..ggrgg..',
  '...ggg...',
  '..gbgggg.',
  '.gggggyg.',
  '..ggggg..',
  '.grggggbg',
  'ggggygggg',
  '....t....',
  '...ttt...',
]

function Citrouille({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <Pixels grille={CITROUILLE} couleurs={{ o: '#ea580c', y: '#fde047', g: '#15803d' }} />
      <Anim attributeName="opacity" values="1;0.8;1" dur="2.2s" repeatCount="indefinite" />
    </g>
  )
}

/** Une toile d'araignée dans un coin de pièce, sous le mur du fond. */
function Toile({ x, y, sens = 1 }: { x: number; y: number; sens?: 1 | -1 }) {
  const d = (n: number) => x + n * sens
  return (
    <path
      d={`M${x} ${y}H${d(26)}M${x} ${y}V${y + 26}M${x} ${y}L${d(20)} ${y + 20}M${d(10)} ${y}Q${d(9)} ${y + 9} ${x} ${y + 10}M${d(20)} ${y}Q${d(17)} ${y + 17} ${x} ${y + 20}`}
      stroke="#e5e7eb"
      strokeWidth="1"
      fill="none"
      opacity="0.6"
      shapeRendering="auto"
    />
  )
}

function Fetes({ quoi, bas }: { quoi: Fete; bas: number }) {
  if (quoi === 'halloween') {
    return (
      <g pointerEvents="none">
        <Citrouille x={446} y={bas - 22} />
        <Citrouille x={532} y={bas - 22} />
        <Citrouille x={96} y={bas - 62} />
        <Citrouille x={250} y={60} />
        <Citrouille x={656} y={176} />
        <Citrouille x={830} y={118} />
        <Toile x={20} y={56} />
        <Toile x={682} y={56} sens={-1} />
        <Toile x={690} y={56} />
        <Toile x={980} y={56} sens={-1} />
        <Toile x={20} y={246} />
        <Toile x={980} y={246} sens={-1} />
        {/* Le fantôme qui flotte dans le coin gaming. */}
        <g opacity="0.85">
          <Pixels grille={FANTOME} couleurs={{ w: '#f8fafc', e: '#111827' }} />
          <Anim
            attributeName="transform"
            type="translate"
            values="600 120;620 110;600 100;580 110;600 120"
            dur="6s"
            repeatCount="indefinite"
          />
        </g>
      </g>
    )
  }
  if (quoi === 'paques') {
    const bas2 = bas - 36
    return (
      <g pointerEvents="none">
        {/* Les œufs cachés : peints en pastel, ou en chocolat dans leur papier doré. */}
        {OEUFS.map(([x, y, base, rayure, points], i) => (
          <g key={i} transform={`translate(${x} ${y === 'bas' ? bas2 : y})`}>
            <Pixels grille={OEUF} couleurs={{ e: base, b: rayure, w: points }} u={3} />
          </g>
        ))}
        {/* Le poussin perché sur le tableau blanc du chef. */}
        <g transform="translate(108 92)">
          <Pixels grille={POUSSIN} couleurs={{ y: '#fde047', e: '#111827', o: '#fb923c' }} u={3} />
        </g>
        {/* Le lapin qui traverse la grande salle, par petits bonds. */}
        <g>
          <Anim
            attributeName="transform"
            type="translate"
            values={etapes(-40, LARGEUR + 10, 48)
              .split(';')
              .map((x) => `${x} ${bas - 50}`)
              .join(';')}
            dur="18s"
            repeatCount="indefinite"
          />
          <g>
            <Anim attributeName="transform" type="translate" values="0 0;0 -7;0 -4;0 0" dur="0.6s" repeatCount="indefinite" />
            <Pixels grille={LAPIN} couleurs={{ w: '#f5f5f4', g: '#d6d3d1', e: '#111827', p: '#f9a8d4' }} />
          </g>
        </g>
      </g>
    )
  }
  if (quoi === 'noel') {
    return (
      <g pointerEvents="none">
        {/* Le sapin, ses boules qui clignotent, les cadeaux au pied. */}
        <g transform={`translate(876 ${bas - 64})`}>
          <Pixels grille={SAPIN} couleurs={{ g: '#15803d', y: '#fde047', r: '#ef4444', b: '#3b82f6', t: '#78350f' }} u={5} />
          {[
            [12, 22, '#f472b6'],
            [28, 32, '#facc15'],
            [16, 42, '#22d3ee'],
          ].map(([cx, cy, c], i) => (
            <rect key={i} x={cx as number} y={cy as number} width="4" height="4" fill={c as string}>
              <Anim attributeName="opacity" values="1;0.2;1" dur={`${0.8 + i * 0.3}s`} repeatCount="indefinite" />
            </rect>
          ))}
        </g>
        {[
          [856, '#dc2626'],
          [928, '#2563eb'],
        ].map(([x, c]) => (
          <g key={x}>
            <rect x={x as number} y={bas - 18} width="16" height="14" fill={c as string} />
            <rect x={(x as number) + 7} y={bas - 18} width="2" height="14" fill="#fde047" />
            <rect x={x as number} y={bas - 13} width="16" height="2" fill="#fde047" />
          </g>
        ))}
        {/* La guirlande le long du mur de la grande salle. */}
        {MUR_SALLE.flatMap(([de, a]) =>
          Array.from({ length: Math.floor((a - de) / 12) }, (_, i) => (
            <rect
              key={`${de}-${i}`}
              x={de + 4 + i * 12}
              y="243"
              width="3"
              height="3"
              fill={['#ef4444', '#facc15', '#22c55e', '#3b82f6'][i % 4]}
            >
              <Anim attributeName="opacity" values="1;0.25;1" dur="1.4s" begin={`${(i % 4) * 0.35}s`} repeatCount="indefinite" />
            </rect>
          )),
        )}
        {/* Un bonnet sur la baie serveur. */}
        <rect x="40" y="12" width="38" height="8" fill="#dc2626" />
        <rect x="40" y="18" width="38" height="3" fill="#f8fafc" />
        <rect x="76" y="8" width="5" height="5" fill="#f8fafc" />
      </g>
    )
  }
  return null
}

/** Un son 8 bits, joué à la volée sans fichier : quelques notes carrées. */
function jouerNotes(audio: AudioContext, notes: Array<[number, number]>) {
  let t = audio.currentTime
  for (const [frequence, duree] of notes) {
    const osc = audio.createOscillator()
    const volume = audio.createGain()
    osc.type = 'square'
    osc.frequency.value = frequence
    volume.gain.setValueAtTime(0.04, t)
    volume.gain.exponentialRampToValueAtTime(0.0001, t + duree)
    osc.connect(volume).connect(audio.destination)
    osc.start(t)
    osc.stop(t + duree)
    t += duree
  }
}

const SONS = {
  /** Un agent se met au travail : un petit bip montant. */
  travail: [
    [660, 0.07],
    [880, 0.09],
  ],
  /** Un agent tombe en échec : deux notes qui descendent. */
  echec: [
    [440, 0.18],
    [262, 0.3],
  ],
  /** Un visiteur pousse la porte : ding-dong. */
  sonnette: [
    [988, 0.2],
    [784, 0.35],
  ],
} satisfies Record<string, Array<[number, number]>>

/**
 * L'horloge du bureau du chef, à la vraie heure. Les aiguilles des heures et
 * des minutes suivent la page, rafraîchie toutes les cinq secondes ; la
 * trotteuse tourne seule, calée sur la seconde d'ouverture de la page.
 */
function Horloge({ maintenant, ouverture }: { maintenant: number; ouverture: number }) {
  const cx = 302
  const cy = 36
  const d = new Date(maintenant)
  const minutes = d.getMinutes() + d.getSeconds() / 60
  const heures = (d.getHours() % 12) + minutes / 60
  const aiguille = (angle: number, longueur: number, epaisseur: number, couleur: string) => (
    <rect
      x={cx - epaisseur / 2}
      y={cy - longueur}
      width={epaisseur}
      height={longueur}
      fill={couleur}
      transform={`rotate(${angle} ${cx} ${cy})`}
    />
  )
  return (
    <g pointerEvents="none">
      <title>{d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</title>
      <circle cx={cx} cy={cy} r="14" fill="#111827" shapeRendering="auto" />
      <circle cx={cx} cy={cy} r="12" fill="#f8fafc" shapeRendering="auto" />
      {Array.from({ length: 12 }, (_, i) => (
        <rect
          key={i}
          x={cx - 0.75}
          y={cy - 11}
          width="1.5"
          height={i % 3 ? 2 : 3}
          fill="#1f2937"
          transform={`rotate(${i * 30} ${cx} ${cy})`}
        />
      ))}
      {aiguille(heures * 30, 6, 2, '#111827')}
      {aiguille(minutes * 6, 9, 1.5, '#111827')}
      <rect
        x={cx - 0.5}
        y={cy - 10}
        width="1"
        height="12"
        fill="#dc2626"
        style={{
          transformOrigin: `${cx}px ${cy}px`,
          animation: 'trotteuse 60s steps(60) infinite',
          animationDelay: `-${new Date(ouverture).getSeconds()}s`,
        }}
      />
      <circle cx={cx} cy={cy} r="1.5" fill="#dc2626" shapeRendering="auto" />
    </g>
  )
}

/* ——— La météo, le chat, les plantes, les confettis ——— */

const CIEL: Record<Weather['sky'], 'soleil' | 'nuages' | 'brouillard' | 'pluie' | 'neige' | 'orage'> = {
  clear: 'soleil',
  clouds: 'nuages',
  fog: 'brouillard',
  rain: 'pluie',
  snow: 'neige',
  storm: 'orage',
}

/** La fenêtre du bureau du chef, ouverte sur le ciel qu'on lui donne. */
function Fenetre({ meteo: temps }: { meteo: Weather | null }) {
  const t = useTextes()
  const meteo = temps
    ? { temperature: Math.round(temps.temperature), ciel: CIEL[temps.sky], jour: temps.day, lieu: temps.place ?? '' }
    : null
  const x = 94
  const l = 56
  const ciel = !meteo
    ? '#1e293b'
    : !meteo.jour
      ? '#0f172a'
      : { soleil: '#7dd3fc', nuages: '#94a3b8', brouillard: '#cbd5e1', pluie: '#64748b', neige: '#cbd5e1', orage: '#334155' }[meteo.ciel]
  const nuage = meteo?.ciel === 'orage' ? '#475569' : '#f1f5f9'
  return (
    <g pointerEvents="none">
      <title>{meteo ? `${meteo.lieu ? `${meteo.lieu}: ` : ''}${meteo.temperature} °C` : t.noWeather}</title>
      <rect x={x - 3} y="19" width={l + 6} height="33" fill="#e5e7eb" />
      <svg x={x} y="22" width={l} height="27" overflow="hidden">
        <rect width={l} height="27" fill={ciel} />
        {meteo?.jour && meteo.ciel === 'soleil' ? (
          <g>
            <rect x="38" y="5" width="9" height="9" fill="#fde047" />
            <rect x="36" y="8" width="2" height="3" fill="#facc15" />
            <rect x="47" y="8" width="2" height="3" fill="#facc15" />
            <rect x="41" y="3" width="3" height="2" fill="#facc15" />
            <rect x="41" y="14" width="3" height="2" fill="#facc15" />
          </g>
        ) : null}
        {meteo && !meteo.jour ? (
          <g>
            <rect x="40" y="5" width="7" height="7" fill="#f1f5f9" />
            <rect x="43" y="4" width="6" height="6" fill={ciel} />
            {[
              [8, 6],
              [20, 3],
              [28, 9],
              [14, 12],
            ].map(([sx, sy]) => (
              <rect key={`${sx}-${sy}`} x={sx} y={sy} width="1" height="1" fill="#f8fafc">
                <Anim attributeName="opacity" values="1;0.2;1" dur={`${1.5 + (sx % 3)}s`} repeatCount="indefinite" />
              </rect>
            ))}
          </g>
        ) : null}
        {meteo && meteo.ciel !== 'soleil'
          ? [0, 1].map((i) => (
              <g key={i}>
                <rect x={i * 30} y={4 + i * 5} width="20" height="6" fill={nuage} />
                <rect x={i * 30 + 4} y={1 + i * 5} width="10" height="4" fill={nuage} />
                <Anim
                  attributeName="transform"
                  type="translate"
                  values={etapes(-20, l, 12)
                    .split(';')
                    .map((v) => `${v} 0`)
                    .join(';')}
                  dur={`${14 + i * 6}s`}
                  begin={`${-i * 7}s`}
                  repeatCount="indefinite"
                />
              </g>
            ))
          : null}
        {meteo?.ciel === 'pluie' || meteo?.ciel === 'orage'
          ? Array.from({ length: 9 }, (_, i) => (
              <rect key={i} x={3 + i * 6} y="0" width="1" height="4" fill="#bfdbfe">
                <Anim attributeName="y" values={etapes(8, 27, 5)} dur="0.6s" begin={`${(i % 4) * 0.15}s`} repeatCount="indefinite" />
              </rect>
            ))
          : null}
        {meteo?.ciel === 'neige'
          ? Array.from({ length: 8 }, (_, i) => (
              <rect key={i} x={4 + i * 7} y="0" width="2" height="2" fill="#f8fafc">
                <Anim
                  attributeName="y"
                  values={etapes(6, 27, 7)}
                  dur={`${2 + (i % 3) * 0.6}s`}
                  begin={`${(i % 4) * 0.4}s`}
                  repeatCount="indefinite"
                />
              </rect>
            ))
          : null}
        {meteo?.ciel === 'brouillard'
          ? [8, 15, 21].map((y) => <rect key={y} x="0" y={y} width={l} height="3" fill="#f8fafc" opacity="0.6" />)
          : null}
        {meteo?.ciel === 'orage' ? (
          <rect width={l} height="27" fill="#fef9c3" opacity="0">
            <Anim attributeName="opacity" values="0;0;0.8;0;0.5;0" keyTimes="0;0.8;0.82;0.85;0.87;1" dur="5s" repeatCount="indefinite" />
          </rect>
        ) : null}
        <rect x="0" y="20" width="22" height="7" fill="#0b0d10" opacity="0.65" />
        <text x="2" y="26" fontSize="6" fill="#f8fafc">
          {meteo ? `${meteo.temperature}°` : '—'}
        </text>
      </svg>
      <rect x={x + l / 2 - 1} y="22" width="2" height="27" fill="#e5e7eb" />
      <rect x={x} y="35" width={l} height="2" fill="#e5e7eb" />
      <text x={x + l / 2} y="58" fontSize="5" textAnchor="middle" fill="#9ca3af">
        {meteo?.lieu.toUpperCase()}
      </text>
    </g>
  )
}

/* Le chat roux tigré : debout de profil, deux temps de marche, et roulé en boule pour la sieste. */
const CHAT_DEBOUT = [
  ['.......k.k', 'k......kkk', '.K.....kek', '.kKkKkKkk.', '..kkkkkkk.', '..k.k..k.k'],
  ['.......k.k', 'k......kkk', '.K.....kek', '.kKkKkKkk.', '..kkkkkkk.', '...k.k.k.k'],
]
const CHAT_ROULE = ['..kkkk..', '.kKkKkk.', 'kkkkkKkk', 'Kkkkkkkk', '.kkkkkkK']
const PELAGE = { k: '#f59e0b', K: '#b45309', e: '#111827' }

/** Le chat d'atelier : il marche de profil, ou dort roulé en boule là où il s'est posé. */
function Chat({ pose }: { pose: Pose }) {
  const t = useTextes()
  if (!pose.marche) {
    return (
      <g pointerEvents="none">
        <title>{t.catNap}</title>
        <g transform={`translate(${Math.round(pose.x) - 12} ${Math.round(pose.y) - 15})`}>
          <Pixels grille={CHAT_ROULE} couleurs={PELAGE} />
        </g>
        {pose.parole ? (
          <text x={pose.x + 10} y={pose.y - 16} fontSize="7" fill="#e0f2fe">
            z
            <Anim attributeName="y" values={etapes(pose.y - 14, pose.y - 24, 4)} dur="2s" repeatCount="indefinite" />
            <Anim attributeName="opacity" values="1;0.75;0.5;0.25" dur="2s" repeatCount="indefinite" />
          </text>
        ) : null}
      </g>
    )
  }
  const versLaDroite = Math.sin((pose.angle * Math.PI) / 180) >= 0
  const grille = CHAT_DEBOUT[Math.floor(pose.pas / 140) % 2]
  return (
    <g pointerEvents="none">
      <ellipse cx={pose.x} cy={pose.y} rx="12" ry="2.5" fill="black" opacity="0.25" shapeRendering="auto" />
      <g transform={`translate(${Math.round(pose.x)} ${Math.round(pose.y) - 18}) scale(${versLaDroite ? 1 : -1} 1) translate(-15 0)`}>
        <Pixels grille={grille} couleurs={PELAGE} />
      </g>
    </g>
  )
}

/* La petite plante au pied de chaque bureau ; fanée quand l'agent ne passe plus. */
const PLANTE_VIVE = ['.g..g.', 'gGggGg', '.gGGg.', '..gg..', '.pppp.', '.PPPP.', '..PP..']
const PLANTE_FANEE = ['......', 'b....b', '.b..b.', '..bb..', '.pppp.', '.PPPP.', '..PP..']

function PlanteDeBureau({ x, y, fanee }: { x: number; y: number; fanee: boolean }) {
  return (
    <g transform={`translate(${x} ${y})`} pointerEvents="none">
      <Pixels
        grille={fanee ? PLANTE_FANEE : PLANTE_VIVE}
        couleurs={{ g: '#4caf50', G: '#2e7d32', b: '#92400e', p: '#d07a3e', P: '#a35a2a' }}
        u={2}
      />
    </g>
  )
}

/** Un agent oublié : plus de passage depuis plus longtemps qu'on ne l'admet (staleAfterHours). */
function oublie(vue: Vue, maintenant: number): boolean {
  if (vue.statut === 'absent' || vue.fiche.id === CHEF_ID) return false
  if (!vue.brut.dernierPassage) return vue.statut !== 'jamais' && vue.statut !== 'a-la-demande'
  const heures = (maintenant - Date.parse(vue.brut.dernierPassage)) / 3_600_000
  return heures > vue.fiche.vieillitApresH
}

/** La poussière et la toile sur l'écran d'un agent oublié. */
function Poussiere({ cx, dy }: { cx: number; dy: number }) {
  const g = cx - 4 - 27
  return (
    <g pointerEvents="none">
      {[
        [4, 2],
        [12, 8],
        [22, 4],
        [31, 12],
        [40, 6],
        [48, 14],
        [8, 15],
        [26, 17],
        [44, 2],
      ].map(([px, py]) => (
        <rect key={`${px}-${py}`} x={g + px} y={dy - 12 + py} width="3" height="2" fill="#d6d3d1" opacity="0.55" />
      ))}
      <path
        d={`M${g + 54} ${dy - 12}h-10M${g + 54} ${dy - 12}v10M${g + 54} ${dy - 12}l-8 8M${g + 49} ${dy - 12}q-1 4 5 5`}
        stroke="#e5e7eb"
        strokeWidth="0.8"
        fill="none"
        opacity="0.7"
        shapeRendering="auto"
      />
    </g>
  )
}

/** Des confettis qui tombent sur toute la salle : une machine fête son anniversaire. */
function Confettis({ hauteur }: { hauteur: number }) {
  const couleurs = ['#f472b6', '#facc15', '#22d3ee', '#4ade80', '#a855f7', '#fb923c']
  return (
    <g pointerEvents="none">
      {Array.from({ length: 36 }, (_, i) => {
        const x = (i * 137) % LARGEUR
        const duree = 4 + (i % 5)
        return (
          <rect key={i} x={x} y="-10" width="4" height="6" fill={couleurs[i % couleurs.length]}>
            <Anim
              attributeName="y"
              values={etapes(-10, hauteur, 24)}
              dur={`${duree}s`}
              begin={`${-((i * 0.7) % duree)}s`}
              repeatCount="indefinite"
            />
            <Anim attributeName="x" values={`${x};${x + 12};${x - 8};${x}`} dur="3s" repeatCount="indefinite" />
          </rect>
        )
      })}
    </g>
  )
}

/* ——— Les postes ——— */

function Poste({
  vue,
  place,
  occupe,
  bientot,
  monte,
  oublie,
  choisi,
  choisir,
}: {
  vue: Vue
  place: PlaceBureau
  occupe: boolean
  bientot: number | null
  /** Le bureau d'un agent qui arrive : il tombe du plafond et se pose. */
  monte: boolean
  /** Un agent qui ne passe plus depuis des jours : plante fanée, écran poussiéreux. */
  oublie: boolean
  choisi: boolean
  choisir: () => void
}) {
  const t = useTextes()
  const theme = useTheme()
  const { fiche, statut } = vue
  const { cx, dy } = place
  const x = cx - BUREAU.largeur / 2
  const dessus = BUREAU.hauteur - 12
  const chaise = { x: place.siege.pos.x, y: place.siege.pos.y + 4 }
  const chef = place.id === CHEF_ID
  const accent = chef ? '#e3b95a' : theme.tenue(fiche.id).c
  const allume = statut !== 'absent'
  const bureau = { cx, dy, x, dessus, statut, accent, bientot, emoji: fiche.emoji }

  return (
    <g
      role="button"
      tabIndex={0}
      aria-label={`${fiche.nom}, ${t.statuses[statut]}`}
      className="cursor-pointer outline-none"
      style={monte ? { animation: 'montage-bureau 1.4s cubic-bezier(0.2, 0.9, 0.3, 1.2) both' } : undefined}
      onClick={choisir}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          choisir()
        }
      }}
    >
      <title>{`${fiche.nom} — ${t.statuses[statut]}`}</title>
      {monte ? (
        <g>
          <rect x={cx - 34} y={dy - 36} width="68" height="14" fill="#1b1410" />
          <rect x={cx - 33} y={dy - 35} width="66" height="12" fill="var(--po-accent)" />
          <text x={cx} y={dy - 26} fontSize="8" textAnchor="middle" fill="#1b1410">
            {t.newDesk}
          </text>
          <Anim attributeName="opacity" values="1;0.4;1" dur="0.8s" repeatCount="indefinite" />
        </g>
      ) : null}
      {choisi ? (
        <rect
          x={x - 8}
          y={dy - 22}
          width={BUREAU.largeur + 16}
          height={BUREAU.hauteur + 66}
          fill="rgb(255 255 255 / 0.06)"
          stroke="var(--po-accent)"
          strokeWidth="2"
          strokeDasharray="6 4"
        />
      ) : null}

      {chef ? (
        <>
          <theme.Fauteuil x={cx} y={place.siege.pos.y} />
          <theme.BureauChef {...bureau} />
          {/* La plaque du chef, en laiton, tournée vers la pièce. */}
          <rect x={cx - 42} y={dy + dessus + 1} width="84" height="9" fill="#b8892f" />
          <rect x={cx - 41} y={dy + dessus + 2} width="82" height="7" fill="#e3b95a" />
          <Lampe x={cx - 37} y={dy + dessus + 3} statut={statut} />
          <text x={cx + 3} y={dy + dessus + 8.5} fontSize="8" textAnchor="middle" fill="#4a3412">
            {fiche.nom}
          </text>
        </>
      ) : (
        <>
          <theme.Bureau {...bureau} />
          {/* La tranche porte le nom, avec la lampe. */}
          <Lampe x={x + 6} y={dy + dessus + 3} statut={statut} />
          <text x={cx + 4} y={dy + dessus + 8.5} fontSize="9" textAnchor="middle" fill={theme.plaque} opacity={allume ? 1 : 0.5}>
            {fiche.nom}
          </text>
          {oublie ? <Poussiere cx={cx} dy={dy} /> : null}
          <PlanteDeBureau x={x - 15} y={dy + 30} fanee={oublie} />

          {/* Le siège : l'assise seule quand l'agent y est (son dossier passe devant lui), repoussé sinon. */}
          {occupe ? (
            <theme.Assise x={chaise.x} y={chaise.y} couleur={accent} />
          ) : (
            <g transform="translate(9 3)">
              <theme.Assise x={chaise.x} y={chaise.y} couleur={accent} />
              <theme.Dossier x={chaise.x} y={chaise.y} couleur={accent} />
            </g>
          )}
        </>
      )}
    </g>
  )
}

function Lampe({ x, y, statut }: { x: number; y: number; statut: Statut }) {
  return (
    <rect x={x} y={y} width="5" height="5" fill={LAMPE_PLAN[statut]}>
      {statut === 'au-travail' || statut === 'en-echec' ? (
        <Anim attributeName="opacity" values="1;0.3;1" dur="1.2s" repeatCount="indefinite" />
      ) : null}
    </rect>
  )
}

type Direction = 'haut' | 'bas' | 'gauche' | 'droite'

function direction(angle: number): Direction {
  const a = ((angle % 360) + 360) % 360
  if (a < 45 || a >= 315) return 'haut'
  if (a < 135) return 'droite'
  if (a < 225) return 'bas'
  return 'gauche'
}

/* Un bonhomme fait 8 pixels sur 12 : la tête, le sweat à capuche, les jambes. */
const TETE: Record<'haut' | 'bas' | 'droite', Array<string>> = {
  bas: ['..hhhh..', '.hhhhhh.', '.hssssh.', '.sesses.', '.cssssc.'],
  haut: ['..hhhh..', '.hhhhhh.', '.hhhhhh.', '.hhhhhh.', '.cchhcc.'],
  droite: ['..hhhh..', '.hhhhhh.', '.hhhsss.', '.hhhses.', '.ccsss..'],
}
/* La même, casque audio sur les oreilles. */
const TETE_CASQUE: Record<'haut' | 'bas' | 'droite', Array<string>> = {
  bas: ['..kkkk..', '.khhhhk.', 'khsssshk', 'ksessesk', '.cssssc.'],
  haut: ['..kkkk..', '.khhhhk.', 'khhhhhhk', 'khhhhhhk', '.cchhcc.'],
  droite: ['..kkkk..', '.hhhkhh.', '.hhkkss.', '.hhkses.', '.ccsss..'],
}
/* Le sweat : la poche ventrale et les cordons de capuche (`t`). */
const BUSTE: Record<'haut' | 'bas' | 'droite', Array<string>> = {
  bas: ['.ctcctc.', 'cctcctcc', 'sccccccs', '.cCCCCc.'],
  haut: ['.cccccc.', 'cccccccc', 'sccccccs', '.cccccc.'],
  droite: ['..cccc..', '..cccc..', '..ccsc..', '..cCCc..'],
}
/* Les jambes : debout, puis les deux temps du pas. */
const JAMBES: Record<'face' | 'cote', Array<Array<string>>> = {
  face: [
    ['.pp..pp.', '.pp..pp.', '.bb..bb.'],
    ['.pp..pp.', '.pp..bb.', '.bb.....'],
    ['.pp..pp.', '.bb..pp.', '.....bb.'],
  ],
  cote: [
    ['..pppp..', '..pp.p..', '..bb.bb.'],
    ['..pppp..', '.pp...p.', '.bb...bb'],
    ['..pppp..', '...pp...', '...bbb..'],
  ],
}

/* Les bras levés de l'agent qui s'étire, vu de dos. */
const ETIREMENT = ['s.hhhh.s', 'chhhhhhc', 'chhhhhhc', 'chhhhhhc', 'c.hhhh.c', '.cccccc.', 'cccccccc', 'cccccccc']

function grilleSprite(sens: Direction, temps: number, assise: Assise, etire: boolean, casque: boolean): Array<string> {
  if (etire && assise === 'bureau' && sens === 'haut') return ETIREMENT
  const tete = casque ? TETE_CASQUE : TETE
  // Au bureau ou sur un pouf, de dos devant l'écran ; le chef, lui, trône face à la pièce.
  if (assise) return sens === 'bas' ? [...tete.bas, ...BUSTE.bas.slice(0, 3)] : [...tete.haut, ...BUSTE.haut.slice(0, 3)]
  const miroir = sens === 'gauche'
  const s = miroir ? 'droite' : sens
  const g = [...tete[s], ...BUSTE[s], ...JAMBES[s === 'droite' ? 'cote' : 'face'][temps]]
  return miroir ? g.map((l) => [...l].reverse().join('')) : g
}

const CONTOUR = Object.fromEntries([...'hsectCkpb'].map((c) => [c, '#0b0d10']))

/** Le bonhomme, contour sombre compris. Mémorisé : il ne change qu'au pas suivant. */
const Sprite = memo(function Sprite({
  id,
  sens,
  temps,
  assise,
  etire,
}: {
  id: string
  sens: Direction
  temps: number
  assise: Assise
  etire: boolean
}) {
  const theme = useTheme()
  const grille = grilleSprite(sens, temps, assise, etire, theme.casque(id))
  return (
    <>
      {[
        [-1, 0],
        [1, 0],
        [0, -1],
        [0, 1],
      ].map(([dx, dy]) => (
        <g key={`${dx}${dy}`} transform={`translate(${dx} ${dy})`}>
          <Pixels grille={grille} couleurs={CONTOUR} />
        </g>
      ))}
      <Pixels grille={grille} couleurs={theme.tenue(id)} />
    </>
  )
})

/** La hauteur du sprite au-dessus du point où il se tient, et le haut de sa tête. */
function cadrage(pose: Pose) {
  const rangs = pose.assise ? 8 : 12
  // Assis, il s'enfonce dans son fauteuil ou son pouf : au bureau, sa tête passe sous la plaque.
  const bas = pose.assise ? pose.y + 8 : pose.y
  return { haut: bas - rangs * 3, bas }
}

function Personnage({ id, pose, etire, choisir }: { id: string; pose: Pose; etire: boolean; choisir?: (id: string) => void }) {
  const theme = useTheme()
  const temps = pose.marche ? 1 + (Math.floor(pose.pas / 170) % 2) : 0
  const { haut, bas } = cadrage(pose)
  return (
    <g className={choisir ? 'cursor-pointer' : undefined} onClick={choisir ? () => choisir(id) : undefined}>
      {pose.assise ? null : <ellipse cx={pose.x} cy={bas} rx="10" ry="3" fill="black" opacity="0.3" shapeRendering="auto" />}
      <g transform={`translate(${Math.round(pose.x) - 12} ${Math.round(haut)})`}>
        <Sprite id={id} sens={direction(pose.angle)} temps={temps} assise={pose.assise} etire={etire} />
        {/* Le colis du livreur, porté à bout de bras. */}
        {pose.porte ? (
          <g>
            <rect x="3" y="17" width="18" height="12" fill="#b45309" />
            <rect x="3" y="17" width="18" height="3" fill="#d97706" />
            <rect x="10" y="17" width="4" height="12" fill="#fde68a" />
          </g>
        ) : !pose.assise && theme.tasse?.(id) ? (
          /* La tasse, tenue à la main droite. */
          <g>
            <rect x="18" y="19" width="6" height="7" fill="#0b0d10" />
            <rect x="19" y="20" width="4" height="5" fill="#fafaf9" />
            <rect x="24" y="21" width="2" height="3" fill="#0b0d10" />
            <rect x="19" y="20" width="4" height="1" fill="#6b3a1e" />
          </g>
        ) : null}
      </g>
    </g>
  )
}

/**
 * Au-dessus de la tête, une chose à la fois : la bulle de celui qui parle,
 * l'icône de celui qui a un souci, ou l'étiquette de celui qui travaille.
 */
function Annonce({ vue, pose, parole }: { vue: Vue; pose: Pose; parole: string | null }) {
  const t = useTextes()
  const { statut, fiche } = vue
  const { haut } = cadrage(pose)
  const x = Math.round(pose.x)

  if (parole) return <Parole x={x} haut={haut} texte={parole} />

  if (pose.assise === 'bureau' && (statut === 'en-echec' || statut === 'en-retard')) {
    return (
      <g transform={`translate(${x + 10} ${haut - 14})`} pointerEvents="none">
        <rect width="16" height="14" fill="#1b1410" />
        <rect x="1" y="1" width="14" height="12" fill={statut === 'en-echec' ? '#ef4444' : '#fb923c'} />
        <text x="8" y="11" fontSize="10" textAnchor="middle" fill="white">
          {statut === 'en-echec' ? '!' : 'z'}
        </text>
        <Anim
          attributeName="transform"
          type="translate"
          values={`${x + 10} ${haut - 14};${x + 10} ${haut - 17};${x + 10} ${haut - 14}`}
          dur="1.4s"
          repeatCount="indefinite"
        />
      </g>
    )
  }

  if (statut !== 'au-travail') return null
  const libelle = t.statuses[statut]
  const largeur = Math.round(Math.max(fiche.nom.length * 5.4, libelle.length * 4.6 + 12) + 12)
  return (
    <g transform={`translate(${x - Math.round(largeur / 2)} ${haut - 30})`} pointerEvents="none">
      <rect width={largeur} height="26" fill="#1b1410" />
      <rect x="1" y="1" width={largeur - 2} height="24" fill="#2b2420" />
      <text x="6" y="11" fontSize="9" fill="#fafaf9">
        {fiche.nom}
      </text>
      <rect x="6" y="15" width="5" height="5" fill={LAMPE_PLAN[statut]} />
      <text x="14" y="21" fontSize="8" fill={LAMPE_PLAN[statut]}>
        {libelle}
      </text>
    </g>
  )
}

/** Une bulle de bande dessinée, en pixels ; « … » fait danser trois points. */
function Parole({ x, haut, texte }: { x: number; haut: number; texte: string }) {
  const points = texte === '…'
  const court = texte.length > 46 ? `${texte.slice(0, 45)}…` : texte
  const largeur = points ? 26 : Math.round(court.length * 4.5 + 12)
  const gauche = Math.min(Math.max(x - largeur / 2, 8), LARGEUR - largeur - 8)
  const y = haut - 24
  return (
    <g pointerEvents="none">
      <rect x={gauche - 1} y={y - 1} width={largeur + 2} height="18" fill="#1b1410" />
      <rect x={gauche} y={y} width={largeur} height="16" fill="#fafaf9" />
      <rect x={x - 4} y={y + 16} width="8" height="3" fill="#fafaf9" />
      <rect x={x - 1} y={y + 19} width="3" height="3" fill="#fafaf9" />
      {points ? (
        [7, 13, 19].map((dx, i) => (
          <rect key={dx} x={gauche + dx - 1} y={y + 7} width="3" height="3" fill="#44403c">
            <Anim attributeName="opacity" values="0.2;1;0.2" dur="1s" begin={`${i * 0.2}s`} repeatCount="indefinite" />
          </rect>
        ))
      ) : (
        <text x={gauche + 6} y={y + 11} fontSize="8" fill="#1c1917">
          {court}
        </text>
      )}
    </g>
  )
}
