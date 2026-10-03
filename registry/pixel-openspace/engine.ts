/**
 * Le plan de l'open space et la vie qui s'y mène : où sont les bureaux, le
 * coin café, le bureau vitré du chef, et comment chacun s'y déplace. Sans
 * React ni DOM, pour que les trajets se testent seuls ; la page dessine ce
 * que `avancer` calcule.
 *
 * Les coordonnées sont celles du `viewBox` SVG. Un angle de 0 regarde vers le
 * haut, 90 vers la droite.
 */

import { TEXTS, type Phrases } from './i18n'

/** An agent's state, as the engine reads it. */
export type Statut = 'au-travail' | 'a-jour' | 'en-retard' | 'en-echec' | 'absent' | 'jamais' | 'a-la-demande'

export type Point = { x: number; y: number }

/**
 * Un endroit où se tenir, le chemin qui y mène depuis l'allée, où regarder
 * une fois arrivé, et si l'on s'y assoit.
 */
export type Lieu = { nom: string; pos: Point; acces: Array<Point>; face: number; assis?: boolean }

/** Où aller, combien de temps y rester, et ce qu'on y dit en arrivant. */
export type Etape = { lieu: Lieu; pause: number; dire?: string }

export const LARGEUR = 1000
const COLONNES = 5
/** Le plateau d'un bureau. */
export const BUREAU = { largeur: 120, hauteur: 50 }
const PAS = 175
const X0 = 150
const HAUT = 300
const RANGEE = 170
/** L'allée du haut, qui longe le bureau du chef et le coin café. */
const ALLEE_HAUT = 262
/** Des unités du plan par seconde : un pas tranquille. */
const VITESSE = 85

export const CHEF_ID = 'chef'

export type PlaceBureau = { id: string; cx: number; dy: number; siege: Lieu; visite: Lieu }

export type Plan = {
  hauteur: number
  bureaux: Array<PlaceBureau>
  chef: PlaceBureau
  /** Les coins où l'on va se dégourdir les jambes. */
  pauses: Array<Lieu>
  /** La porte d'entrée, en bas de la grande salle, par où passent visiteurs et livreurs. */
  entree: Lieu
  /** Le pied de la pile de cartons, où le livreur dépose son colis. */
  cartons: Lieu
  /** Devant le grand écran mural, où le chef fait son rapport. */
  ecranMural: Lieu
  /** Ce que disent les gens de la salle, dans la langue choisie. */
  phrases: Phrases
  /** Les passages verticaux entre les colonnes de bureaux. */
  couloirs: Array<number>
}

const chaiseY = (dy: number) => dy + BUREAU.hauteur + 22

export function plan(ids: Array<string>, phrases: Phrases = TEXTS.en.phrases): Plan {
  const rangees = Math.max(1, Math.ceil(ids.length / COLONNES))
  const bureaux = ids.map((id, i) => {
    const cx = X0 + (i % COLONNES) * PAS
    const dy = HAUT + Math.floor(i / COLONNES) * RANGEE
    const allee = dy + 108
    return {
      id,
      cx,
      dy,
      siege: { nom: `siege:${id}`, pos: { x: cx, y: chaiseY(dy) - 4 }, acces: [{ x: cx, y: allee }], face: 0, assis: true },
      visite: { nom: `visite:${id}`, pos: { x: cx + 76, y: chaiseY(dy) }, acces: [{ x: cx + 76, y: allee }], face: -90 },
    }
  })

  // Le chef trône derrière son bureau, face à la pièce : il en fait le tour par la droite pour s'asseoir.
  const chef: PlaceBureau = {
    id: CHEF_ID,
    cx: 205,
    dy: 110,
    siege: {
      nom: 'siege:chef',
      pos: { x: 205, y: 102 },
      acces: [
        { x: 260, y: ALLEE_HAUT },
        { x: 260, y: 182 },
        { x: 300, y: 182 },
        { x: 300, y: 96 },
        { x: 205, y: 96 },
      ],
      face: 180,
      assis: true,
    },
    visite: {
      nom: 'visite:chef',
      pos: { x: 300, y: 140 },
      acces: [
        { x: 260, y: ALLEE_HAUT },
        { x: 260, y: 182 },
        { x: 300, y: 182 },
      ],
      face: -90,
    },
  }

  const devant = (nom: string, x: number, y: number, face = 0, assis = false): Lieu => ({
    nom,
    pos: { x, y },
    acces: [{ x, y: ALLEE_HAUT }],
    face,
    assis,
  })
  // La cuisine à droite, le coin gaming au milieu : on y entre par le bas, droit devant soi.
  const pauses: Array<Lieu> = [
    devant('cafe', 768, 100),
    devant('distributeur', 881, 104),
    devant('frigo', 950, 108),
    devant('arcade', 372, 112),
    devant('arcade-2', 415, 112),
    devant('etabli', 636, 108),
    // Sur les poufs, face à la télé : de dos.
    devant('pouf-gauche', 482, 146, 0, true),
    devant('pouf-droite', 538, 146, 0, true),
  ]

  const hauteur = HAUT + rangees * RANGEE + 10
  const derniereAllee = HAUT + (rangees - 1) * RANGEE + 108
  return {
    hauteur,
    bureaux,
    chef,
    pauses,
    phrases,
    entree: { nom: 'entree', pos: { x: 500, y: hauteur - 26 }, acces: [{ x: 500, y: derniereAllee }], face: 0 },
    cartons: { nom: 'cartons', pos: { x: 140, y: hauteur - 46 }, acces: [{ x: 140, y: derniereAllee }], face: -90 },
    ecranMural: { nom: 'ecran-mural', pos: { x: 130, y: ALLEE_HAUT + 4 }, acces: [{ x: 130, y: ALLEE_HAUT }], face: 0 },
    couloirs: Array.from({ length: COLONNES + 1 }, (_, k) => X0 - PAS / 2 + k * PAS),
  }
}

/**
 * Le chemin d'un lieu à un autre : sortir par son accès jusqu'à l'allée,
 * changer d'allée par le couloir le plus proche, puis entrer par l'accès du
 * lieu visé. On ne traverse jamais un bureau.
 */
export function trajet(de: Lieu, vers: Lieu, couloirs: Array<number>): Array<Point> {
  if (de === vers) return []
  const points = [...de.acces].reverse()
  const a = points.at(-1) ?? de.pos
  const b = vers.acces[0] ?? vers.pos
  if (Math.abs(a.y - b.y) > 1) {
    const milieu = (a.x + b.x) / 2
    const x = couloirs.reduce((p, c) => (Math.abs(c - milieu) < Math.abs(p - milieu) ? c : p))
    points.push({ x, y: a.y }, { x, y: b.y })
  }
  points.push(...vers.acces, vers.pos)
  return points
}

export type Marcheur = {
  id: string
  pos: Point
  angle: number
  lieu: Lieu
  chemin: Array<Point>
  /** Le temps à rester où l'on est, en ms. */
  attente: number
  programme: Array<Etape>
  /** Le temps passé à marcher, qui balance les pieds. */
  pas: number
  /** Ce qu'il dira en arrivant, puis ce qu'il dit une fois arrivé. */
  dire: string | null
  parole: string | null
  /** Le livreur porte son colis jusqu'aux cartons. */
  porte: boolean
  /** Un visiteur ressorti par la porte : la page peut l'oublier. */
  parti: boolean
}

export function marcheur(id: string, siege: Lieu, attente: number): Marcheur {
  return {
    id,
    pos: { ...siege.pos },
    angle: siege.face,
    lieu: siege,
    chemin: [],
    attente,
    programme: [],
    pas: 0,
    dire: null,
    parole: null,
    porte: false,
    parti: false,
  }
}

/** Ceux qui ne font que passer : le client qui apporte sa demande, le livreur et son colis. */
export type Invite = 'visiteur' | 'livreur'

export const estInvite = (id: string) => id.startsWith('visiteur:') || id.startsWith('livreur:')

export const CHAT_ID = 'chat'

/** Le chat d'atelier, qui commence sa journée roulé sur un pouf. */
export function chat(p: Plan): Marcheur {
  const pouf = p.pauses.find((l) => l.nom === 'pouf-droite') ?? p.pauses[0]
  return marcheur(CHAT_ID, pouf, 6_000)
}

/** Le dessus d'un bureau, où le chat saute faire la sieste. */
const bureauDuChat = (b: PlaceBureau): Lieu => {
  const allee = b.siege.acces[0].y
  return { nom: `bureau-chat:${b.id}`, pos: { x: b.cx + 32, y: b.dy + 38 }, acces: [{ x: b.cx + 32, y: allee }], face: 90, assis: true }
}

/**
 * Le chat va où il veut : faire la sieste sur un bureau dont l'agent s'est
 * levé (ou est absent), traîner au coin café ou sur les poufs, longtemps.
 */
function programmeChat(p: Plan, marcheurs: Array<Marcheur>, statuts: Map<string, Statut>, hasard: () => number): Array<Etape> {
  const libres = p.bureaux.filter((b) => {
    const agent = marcheurs.find((m) => m.id === b.id)
    return statuts.get(b.id) === 'absent' || (agent && agent.lieu !== b.siege)
  })
  if (libres.length && hasard() < 0.6) {
    const b = libres[Math.floor(hasard() * libres.length)]
    return [{ lieu: bureauDuChat(b), pause: entre(180_000, 360_000, hasard), dire: 'z' }]
  }
  const coin = p.pauses[Math.floor(hasard() * p.pauses.length)]
  return [{ lieu: coin, pause: entre(60_000, 180_000, hasard) }]
}

/**
 * Un invité entre par la porte : le visiteur va saluer le chef dans son
 * bureau, le livreur dépose son colis au pied des cartons ; puis chacun
 * ressort par où il est venu.
 */
export function invite(p: Plan, genre: Invite, numero: number): Marcheur {
  const m = marcheur(`${genre}:${numero}`, p.entree, 0)
  m.programme =
    genre === 'visiteur'
      ? [
          { lieu: p.chef.visite, pause: 5_000, dire: p.phrases.visitor },
          { lieu: p.entree, pause: 0 },
        ]
      : [
          { lieu: p.cartons, pause: 3_000, dire: p.phrases.courier },
          { lieu: p.entree, pause: 0 },
        ]
  m.porte = genre === 'livreur'
  return m
}

/** Ceux que leur état cloue au bureau : le travail, ou le souci qui les y retient. */
export const auBureau = (s: Statut | undefined) => s === 'au-travail' || s === 'en-echec' || s === 'en-retard'

function partir(m: Marcheur, etape: Etape, couloirs: Array<number>) {
  m.chemin = trajet(m.lieu, etape.lieu, couloirs)
  m.lieu = etape.lieu
  m.attente = etape.pause
  m.dire = etape.dire ?? null
  m.parole = null
  if (!m.chemin.length) arriver(m)
}

function arriver(m: Marcheur) {
  m.angle = m.lieu.face
  m.parole = m.dire
  if (m.lieu.nom === 'cartons') m.porte = false
}

function marcher(m: Marcheur, dt: number) {
  let reste = (VITESSE * dt) / 1000
  while (reste > 0 && m.chemin.length) {
    const cible = m.chemin[0]
    const dx = cible.x - m.pos.x
    const dy = cible.y - m.pos.y
    const d = Math.hypot(dx, dy)
    if (d > 0.01) m.angle = (Math.atan2(dx, -dy) * 180) / Math.PI
    if (d <= reste) {
      m.pos = { ...cible }
      m.chemin.shift()
      reste -= d
    } else {
      m.pos = { x: m.pos.x + (dx / d) * reste, y: m.pos.y + (dy / d) * reste }
      reste = 0
    }
  }
  m.pas += dt
  if (!m.chemin.length) arriver(m)
}

const entre = (min: number, max: number, hasard: () => number) => min + hasard() * (max - min)

/** Un agent désœuvré : un tour au café, à la fontaine ou chez un collègue, puis retour au bureau. */
function programmeAgent(p: Plan, place: PlaceBureau, presents: Array<PlaceBureau>, hasard: () => number): Array<Etape> {
  const collegues = presents.filter((b) => b.id !== place.id).map((b) => b.visite)
  const collegue = collegues[Math.floor(hasard() * collegues.length)]
  // Le café et la fontaine comptent double, et l'on passe parfois voir un collègue.
  const choix = [...p.pauses, ...p.pauses.slice(0, 2), ...(collegue ? [collegue, collegue] : [])]
  const lieu = choix[Math.floor(hasard() * choix.length)] ?? p.pauses[0]
  return [
    // Chez un collègue, on bavarde. Les sorties sont rares et longues : moins de pas, moins à redessiner.
    { lieu, pause: entre(30_000, 90_000, hasard), dire: lieu === collegue ? '…' : undefined },
    { lieu: place.siege, pause: entre(180_000, 480_000, hasard) },
  ]
}

/**
 * Le chef en ronde commence par ceux qui ont un souci, qu'il relance, puis
 * passe aux autres bureaux. Hors de sa ronde, il reste au chevet d'un agent
 * en échec jusqu'à ce qu'il soit relancé ; sinon il va voir qui est en
 * retard, ou se sert un café.
 */
function programmeChef(
  p: Plan,
  statut: Statut | undefined,
  presents: Array<PlaceBureau>,
  soucis: Array<PlaceBureau>,
  echecs: Set<string>,
  annonces: Array<string>,
  hasard: () => number,
): Array<Etape> {
  const annoncer = annonces.map((a) => ({ lieu: p.ecranMural, pause: 6_000, dire: a }))
  if (statut === 'au-travail') {
    const autres = presents.filter((b) => !soucis.includes(b))
    const rapport = p.phrases.report(autres.length, soucis.length)
    return [
      ...soucis.map((b) => ({ lieu: b.visite, pause: 3_500, dire: p.phrases.relaunch })),
      ...autres.map((b) => ({ lieu: b.visite, pause: 1_500 })),
      // La ronde finie, il fait son rapport devant le grand écran.
      { lieu: p.ecranMural, pause: 6_000, dire: rapport },
      // Puis ce qui ne doit pas être oublié : les annonces qu'on lui a confiées.
      ...annoncer,
      { lieu: p.chef.siege, pause: 3_000 },
    ]
  }
  const enEchec = soucis.find((b) => echecs.has(b.id))
  if (enEchec) return [{ lieu: enEchec.visite, pause: 60_000, dire: p.phrases.stayingHere }]
  // Une annonce en attente : de temps en temps, il va la redire devant l'écran.
  if (annoncer.length && hasard() < 0.5) return [...annoncer, { lieu: p.chef.siege, pause: entre(240_000, 600_000, hasard) }]
  const souci = soucis.length ? soucis[Math.floor(hasard() * soucis.length)] : null
  return [
    souci
      ? { lieu: souci.visite, pause: entre(3_000, 5_000, hasard), dire: p.phrases.anyTrouble }
      : { lieu: p.pauses[0], pause: entre(3_000, 5_000, hasard) },
    { lieu: p.chef.siege, pause: entre(240_000, 600_000, hasard) },
  ]
}

/** Fait vivre l'open space pendant `dt` millisecondes. */
export function avancer(
  p: Plan,
  marcheurs: Array<Marcheur>,
  statuts: Map<string, Statut>,
  dt: number,
  hasard: () => number = Math.random,
  annonces: Array<string> = [],
  /** La nuit, les désœuvrés regagnent leur bureau et n'en bougent plus ; le chat dort où il est. */
  nuit = false,
) {
  const presents = p.bureaux.filter((b) => statuts.get(b.id) !== 'absent')
  const soucis = presents.filter((b) => ['en-echec', 'en-retard'].includes(statuts.get(b.id) ?? ''))
  const echecs = new Set(soucis.filter((b) => statuts.get(b.id) === 'en-echec').map((b) => b.id))

  for (const m of marcheurs) {
    if (m.id === CHAT_ID) {
      if (m.chemin.length) marcher(m, dt)
      else if (!nuit && (m.attente -= dt) <= 0) partir(m, programmeChat(p, marcheurs, statuts, hasard)[0], p.couloirs)
      continue
    }
    if (estInvite(m.id)) {
      if (m.chemin.length) marcher(m, dt)
      else if ((m.attente -= dt) > 0) continue
      else if (m.programme.length) partir(m, m.programme.shift()!, p.couloirs)
      else m.parti = true
      continue
    }
    const chef = m.id === CHEF_ID
    const place = chef ? p.chef : p.bureaux.find((b) => b.id === m.id)
    if (!place) continue
    const statut = statuts.get(m.id)

    if (m.chemin.length) {
      marcher(m, dt)
      continue
    }
    if (statut === 'absent') {
      Object.assign(m, marcheur(m.id, place.siege, 0))
      continue
    }
    const cloue = chef ? statut === 'en-echec' || statut === 'en-retard' : auBureau(statut)
    if (cloue) {
      m.programme = []
      if (m.lieu !== place.siege) partir(m, { lieu: place.siege, pause: 1_000 }, p.couloirs)
      continue
    }
    // Le chef lancé pendant qu'il est assis part en ronde sans finir son café.
    if (chef && statut === 'au-travail' && m.lieu === place.siege && !m.programme.length) m.attente = Math.min(m.attente, 1_500)
    // Au chevet d'un agent qui n'est plus en échec, il s'en va ; et un nouvel échec le fait se lever.
    if (chef && !m.programme.length) {
      const veille = m.lieu.nom.startsWith('visite:') ? m.lieu.nom.slice('visite:'.length) : null
      if (veille && m.dire === p.phrases.stayingHere && !echecs.has(veille)) m.attente = Math.min(m.attente, 1_000)
      if (m.lieu === place.siege && echecs.size && statut !== 'au-travail') m.attente = Math.min(m.attente, 2_000)
    }

    // La nuit, hors de la ronde du chef, chacun reste ou rentre à son bureau.
    if (nuit && !(chef && statut === 'au-travail')) {
      m.programme = []
      if (m.lieu !== place.siege) partir(m, { lieu: place.siege, pause: 1_000 }, p.couloirs)
      continue
    }
    m.attente -= dt
    if (m.attente > 0) continue
    if (!m.programme.length) {
      m.programme = chef ? programmeChef(p, statut, presents, soucis, echecs, annonces, hasard) : programmeAgent(p, place, presents, hasard)
    }
    partir(m, m.programme.shift()!, p.couloirs)
  }
}
