'use client'

import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import { Button } from '@/components/ui/button'
import { ButtonGroup } from '@/components/ui/button-group'
import { JeuArcade, lireRecord, type Jeu } from './arcade'
import { BUREAU, CHAT_ID, CHEF_ID, LARGEUR, avancer, chat, estInvite, invite, marcheur, plan, type Invite, type Statut } from './engine'
import { TEXTS, type Texts } from './i18n'
import { ACCENT, DefsCommunes, TextesContexte, animerLeDecor, type Lumiere } from './primitives'
import { THEME_GEEK } from './themes/geek'
import { Frise } from './timeline'
import { changerPreferences } from './preferences'
import { useDansLeNavigateur, usePreferences } from './navigateur'
import { Reglages, useMeteoDuLieu } from './settings'
import { fete } from './seasons'
import type { Agent, OpenSpaceProps, SceneObject, WallTile } from './types'
import { type Equipe, type Pose, type Vue, bientot, heureCourte, obscurite, oublie, poses, posesAuBureau, versVue } from './vue'
import { THEMES, ThemeContexte } from './contexte'
import { Carte } from './card'
import { Chat, ColisDeposes, Confettis, EcranMural, Fenetre, Horloge, Nuit, Records, TableauBlanc } from './decor'
import { Fetes } from './festivities'
import { SONS, jouerNotes } from './sound'
import { Annonce, Parole, Personnage, Poste, cadrage } from './people'

/*
 * pixel-openspace — an open space in pixel art where your scheduled jobs and
 * AI agents come to work. The code speaks French inside (it was born in a
 * French workshop); everything it shows follows the `language` prop.
 */

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

const CHEF_DECOR = (t: Texts): Agent => ({ id: CHEF_ID, name: t.leadName, emoji: '🧑‍💼', role: t.leadRole, status: 'ok' })

/** L'écran mural quand on ne lui donne rien : combien de tâches, combien au travail, en échec, en retard. */
function ecranParDefaut(agents: Array<Agent>, t: Texts): Array<WallTile> {
  const compte = (statut: Agent['status']) => agents.filter((a) => a.status === statut).length
  const echecs = compte('failed')
  const retards = compte('late')
  return [
    { label: t.wall.jobs, value: agents.length, tone: 'info' },
    { label: t.wall.running, value: compte('working'), tone: 'ok' },
    { label: t.wall.failed, value: echecs, tone: echecs ? 'alert' : 'neutral' },
    { label: t.wall.late, value: retards, tone: retards ? 'warn' : 'neutral' },
  ]
}

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
  wall,
  announcements = [],
  weather = null,
  visitors = 0,
  deliveries = 0,
  celebrate = false,
  timeline: friseProp = true,
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
  /* Ce que le visiteur a réglé derrière la roue dentée passe avant les props. */
  const preferences = usePreferences()
  const dansLeNavigateur = useDansLeNavigateur()
  const language = preferences.language ?? langueProp
  const enseigne = preferences.title?.trim() || title
  // Un lieu choisi dans les réglages : sa vraie météo remplace celle des props, une fois trouvée.
  const etatMeteo = useMeteoDuLieu(preferences.weatherPlace, language)
  const meteo = etatMeteo.etat === 'trouve' ? etatMeteo.meteo : weather
  const nomTheme = preferences.theme ?? themeProp
  const seasonal = preferences.seasonal ?? saisonsProp
  const assombrir = preferences.night ?? true
  const mouvement = preferences.motion ?? true
  const timeline = preferences.timeline ?? friseProp

  // Une langue inconnue (une faute de frappe, un projet en JavaScript) retombe sur l'anglais.
  const t = TEXTS[language] ?? TEXTS.en
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
  const pret = now !== undefined || dansLeNavigateur
  const [maintenant, setMaintenant] = useState(ouverture)
  const [choisi, setChoisi] = useState<string | null>(null)
  const [paroles, setParoles] = useState<Record<string, string>>({})
  const [etires, setEtires] = useState<Record<string, true>>({})
  const [nouveaux, setNouveaux] = useState<Record<string, true>>({})
  const [jeu, setJeu] = useState<Jeu | null>(null)
  const [deposes, setDeposes] = useState(0)
  /* Le son et les alertes : le choix fait dans cette visite, sinon celui gardé par le navigateur. */
  const [sonChoisi, setSonChoisi] = useState<boolean | null>(null)
  const [alertesChoisies, setAlertesChoisies] = useState<boolean | null>(null)
  const son = sonChoisi ?? (dansLeNavigateur && lire(CLE_SON) === '1')
  const permission = dansLeNavigateur && typeof Notification !== 'undefined' ? Notification.permission : 'default'
  const alertes = alertesChoisies ?? (dansLeNavigateur && lire(CLE_ALERTES) === '1' && permission === 'granted')
  const alertesBloquees = dansLeNavigateur && (typeof Notification === 'undefined' || permission === 'denied')
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
    if (!son || audio.current) return
    const reveiller = () => {
      audio.current ??= new AudioContext()
      void audio.current.resume()
    }
    window.addEventListener('pointerdown', reveiller, { once: true })
    return () => window.removeEventListener('pointerdown', reveiller)
  }, [son])

  const basculerSon = () => {
    if (son) {
      void audio.current?.close()
      audio.current = null
      setSonChoisi(false)
      ecrire(CLE_SON, '0')
      return
    }
    audio.current = new AudioContext()
    jouerNotes(audio.current, SONS.travail)
    setSonChoisi(true)
    ecrire(CLE_SON, '1')
  }

  /* Les alertes restent branchées d'une visite à l'autre, tant que le navigateur les autorise ; la boucle les lit ici. */
  useEffect(() => {
    alertesActives.current = alertes
  })

  const basculerAlertes = async () => {
    if (alertes) {
      setAlertesChoisies(false)
      ecrire(CLE_ALERTES, '0')
      return
    }
    if (typeof Notification === 'undefined') return
    const reponse = Notification.permission === 'granted' ? 'granted' : await Notification.requestPermission()
    const ok = reponse === 'granted'
    setAlertesChoisies(ok)
    ecrire(CLE_ALERTES, ok ? '1' : '0')
  }

  const basculerPleinEcran = () => {
    // Le navigateur peut refuser (pas de geste de l'utilisateur, iframe) : on reste alors dans la page.
    const demande = document.fullscreenElement ? document.exitFullscreen() : scenePleinEcran.current?.requestFullscreen()
    demande?.catch(() => {})
  }

  /* Les records des bornes, relus à chaque fermeture de borne. */
  const records = useMemo(
    () => (dansLeNavigateur && !jeu ? { snake: lireRecord('snake'), casse: lireRecord('casse-briques') } : { snake: 0, casse: 0 }),
    [dansLeNavigateur, jeu],
  )

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
  const [sceneAnimee, setScene] = useState<Record<string, Pose>>(() => posesAuBureau(lePlan))
  // Les déplacements coupés, chacun reste assis à son bureau.
  const scene = mouvement ? sceneAnimee : posesAuBureau(lePlan)

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
    if (!mouvement || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
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
                frise={timeline}
                son={son}
                alertes={alertes}
                alertesBloquees={alertesBloquees}
                changer={changerPreferences}
                basculerSon={basculerSon}
                basculerAlertes={() => void basculerAlertes()}
                reinitialiser={() => changerPreferences(null)}
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
                  <EcranMural tuiles={wall ?? ecranParDefaut(agents, t)} />
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
          {/* Comme la scène, la frise attend le navigateur : ses points dépendent de l'heure. */}
          {pret && timeline && agents.some((a) => a.runs?.length) ? (
            <Frise agents={lead ? [lead, ...agents] : agents} maintenant={maintenant} choisir={setChoisi} />
          ) : null}
          {jeu ? <JeuArcade key={jeu} jeu={jeu} textes={t} fermer={() => setJeu(null)} /> : null}
        </div>
      </ThemeContexte.Provider>
    </TextesContexte.Provider>
  )
}

const sans = <T,>(objet: Record<string, T>, cle: string) => Object.fromEntries(Object.entries(objet).filter(([k]) => k !== cle))
