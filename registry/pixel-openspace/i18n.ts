import type { Language, ThemeName } from './types'

/** Every word the open space writes or says, in English and in French. */
export type Texts = {
  locale: string
  statuses: Record<'au-travail' | 'a-jour' | 'en-retard' | 'en-echec' | 'absent' | 'jamais' | 'a-la-demande', string>
  leadName: string
  leadRole: string
  leadOffice: string
  nextRuns: string
  nothingPlanned: string
  hiScores: string
  welcome: string
  newDesk: string
  inMinutes: (n: number) => string
  offNote: string
  justNow: string
  minutesAgo: (n: number) => string
  hoursAgo: (n: number) => string
  daysAgo: (n: number) => string
  never: string
  lastRun: string
  nextRun: string
  runNow: string
  running: string
  launching: string
  close: string
  fullscreen: string
  /** La frise de la journée, sous la salle. */
  timeline: {
    title: string
    run: string
    runs: (n: number) => string
    failed: (n: number) => string
    hour: (h: number) => string
  }
  /** La fenêtre des réglages, derrière la roue dentée. */
  settings: {
    open: string
    title: string
    description: string
    sign: string
    weather: string
    weatherPlaceholder: string
    weatherSearching: string
    weatherNotFound: string
    weatherFound: (place: string, temperature: number) => string
    theme: string
    themes: Record<ThemeName, string>
    language: string
    sound: string
    soundHint: string
    alerts: string
    alertsHint: string
    alertsBlocked: string
    seasonal: string
    seasonalHint: string
    night: string
    nightHint: string
    motion: string
    motionHint: string
    timeline: string
    timelineHint: string
    reset: string
    done: string
  }
  sceneLabel: string
  /** Les tuiles de l'écran mural quand on ne lui en donne pas. */
  wall: { jobs: string; running: string; failed: string; late: string }
  phrases: Phrases
  objects: Record<
    'workbench' | 'tv' | 'server-rack' | 'vending-machine' | 'fridge' | 'cpu-box' | 'gpu-box' | 'ram-box' | 'snake' | 'breakout',
    string
  >
  arcade: {
    play: string
    score: string
    record: string
    gameOver: string
    pressPlay: string
    replay: string
    help: Record<'snake' | 'breakout', string>
    keys: string
    toPlay: string
    toClose: string
    title: Record<'snake' | 'breakout', string>
  }
  catNap: string
  noWeather: string
}

/** What the people in the room say. */
export type Phrases = {
  relaunch: string
  anyTrouble: string
  stayingHere: string
  report: (upToDate: number, relaunched: number) => string
  visitor: string
  courier: string
}

const EN: Texts = {
  locale: 'en-GB',
  statuses: {
    'au-travail': 'working',
    'a-jour': 'up to date',
    'en-retard': 'late',
    'en-echec': 'failed',
    absent: 'off',
    jamais: 'never ran',
    'a-la-demande': 'on demand',
  },
  leadName: 'The lead',
  leadRole: 'Walks around the desks and relaunches whoever missed their run',
  leadOffice: 'LEAD OFFICE',
  nextRuns: 'NEXT RUNS',
  nothingPlanned: 'nothing planned',
  hiScores: 'HI-SCORES',
  welcome: 'WELCOME',
  newDesk: 'New desk!',
  inMinutes: (n) => `in ${n} min`,
  offNote: 'away',
  justNow: 'just now',
  minutesAgo: (n) => `${n} min ago`,
  hoursAgo: (n) => `${n} h ago`,
  daysAgo: (n) => `${n} d ago`,
  never: 'never',
  lastRun: 'last',
  nextRun: 'next',
  runNow: 'Run now',
  running: 'Running',
  launching: 'Launching…',
  close: 'Close',
  fullscreen: '⛶ Fullscreen',
  timeline: {
    title: 'Today',
    run: 'run',
    runs: (n) => `${n} run${n === 1 ? '' : 's'} since midnight`,
    failed: (n) => `${n} failed`,
    hour: (h) => (h === 0 || h === 24 ? '12am' : h === 12 ? '12pm' : h < 12 ? `${h}am` : `${h - 12}pm`),
  },
  settings: {
    open: 'Settings',
    title: 'Settings',
    description: 'Saved in this browser only.',
    sign: 'Sign on the wall',
    weather: 'Weather at the window',
    weatherPlaceholder: 'A city, or latitude,longitude',
    weatherSearching: 'Looking for it…',
    weatherNotFound: 'Place not found.',
    weatherFound: (place, temperature) => `${place}: ${temperature} °C right now, from Open-Meteo.`,
    theme: 'Theme',
    themes: { geek: 'Geek', eighties: '1980s', gym: 'Gym', modern: 'Modern', kitchen: 'Kitchen' },
    language: 'Language',
    sound: '8-bit sound',
    soundHint: 'A jingle when a job starts, fails, or a visitor comes in.',
    alerts: 'Browser alerts',
    alertsHint: 'A notification when a job fails or falls behind.',
    alertsBlocked: 'Notifications are blocked for this site in your browser settings.',
    seasonal: 'Seasonal decorations',
    seasonalHint: 'Halloween in October, Christmas in December, Easter in spring.',
    night: 'Darken at night',
    nightHint: 'The room dims in the evening and the screens glow.',
    motion: 'People walk around',
    motionHint: 'Off: everybody stays at their desk, which saves CPU.',
    timeline: 'Day timeline',
    timelineHint: 'Under the room, one dot per run since midnight.',
    reset: 'Reset',
    done: 'Done',
  },
  sceneLabel: 'The agents’ open space',
  wall: { jobs: 'Jobs', running: 'Running', failed: 'Failed', late: 'Late' },
  phrases: {
    relaunch: 'Relaunching you!',
    anyTrouble: 'Any trouble?',
    stayingHere: 'I’m staying here.',
    report: (ok, n) => (n ? `Report: ${ok} up to date, ${n} relaunched.` : 'Report: everybody is up to date.'),
    visitor: 'Hello! I have a request.',
    courier: 'Parcel delivered!',
  },
  objects: {
    workbench: 'The workbench',
    tv: 'The TV',
    'server-rack': 'The server rack',
    'vending-machine': 'The vending machine',
    fridge: 'The fridge',
    'cpu-box': 'The CPU box',
    'gpu-box': 'The GPU box',
    'ram-box': 'The RAM box',
    snake: 'The Snake cabinet: a game?',
    breakout: 'The Chip Breaker cabinet: a game?',
  },
  arcade: {
    play: 'PLAY',
    score: 'SCORE',
    record: 'RECORD',
    gameOver: 'GAME OVER',
    pressPlay: 'Press PLAY',
    replay: 'Press PLAY to replay',
    help: { snake: 'Arrows or W A S D', breakout: 'Arrows, A D or the mouse' },
    keys: 'Enter to play · Esc to close',
    toPlay: 'to play',
    toClose: 'to close',
    title: { snake: 'COMPONENT SNAKE', breakout: 'CHIP BREAKER' },
  },
  catNap: 'The office cat is napping',
  noWeather: 'No weather',
}

const FR: Texts = {
  locale: 'fr-FR',
  statuses: {
    'au-travail': 'au travail',
    'a-jour': 'à jour',
    'en-retard': 'en retard',
    'en-echec': 'en échec',
    absent: 'absent',
    jamais: 'jamais passé',
    'a-la-demande': 'à la demande',
  },
  leadName: 'Le chef',
  leadRole: 'Fait le tour des bureaux et relance qui a manqué son passage',
  leadOffice: 'BUREAU DU CHEF',
  nextRuns: 'PROCHAINS PASSAGES',
  nothingPlanned: 'rien de prévu',
  hiScores: 'HI-SCORES',
  welcome: 'BIENVENUE',
  newDesk: 'Nouveau poste !',
  inMinutes: (n) => `dans ${n} min`,
  offNote: 'absent',
  justNow: 'à l’instant',
  minutesAgo: (n) => `il y a ${n} min`,
  hoursAgo: (n) => `il y a ${n} h`,
  daysAgo: (n) => `il y a ${n} j`,
  never: 'jamais',
  lastRun: 'passé',
  nextRun: 'prochain',
  runNow: 'Lancer maintenant',
  running: 'Au travail',
  launching: 'Lancement…',
  close: 'Fermer',
  fullscreen: '⛶ Plein écran',
  timeline: {
    title: 'La journée',
    run: 'passage',
    runs: (n) => `${n} passage${n > 1 ? 's' : ''} depuis minuit`,
    failed: (n) => `${n} raté${n > 1 ? 's' : ''}`,
    hour: (h) => `${h} h`,
  },
  settings: {
    open: 'Réglages',
    title: 'Réglages',
    description: 'Enregistrés dans ce navigateur seulement.',
    sign: 'Enseigne au mur',
    weather: 'Météo à la fenêtre',
    weatherPlaceholder: 'Une ville, ou latitude,longitude',
    weatherSearching: 'Recherche…',
    weatherNotFound: 'Lieu introuvable.',
    weatherFound: (place, temperature) => `${place} : ${temperature} °C en ce moment, d’après Open-Meteo.`,
    theme: 'Thème',
    themes: { geek: 'Geek', eighties: 'Années 80', gym: 'Salle de sport', modern: 'Moderne', kitchen: 'Cuisine' },
    language: 'Langue',
    sound: 'Son 8 bits',
    soundHint: 'Une ritournelle quand une tâche démarre, plante, ou qu’un visiteur entre.',
    alerts: 'Alertes du navigateur',
    alertsHint: 'Une notification quand une tâche plante ou prend du retard.',
    alertsBlocked: 'Les notifications sont bloquées pour ce site dans les réglages du navigateur.',
    seasonal: 'Décorations de saison',
    seasonalHint: 'Halloween en octobre, Noël en décembre, Pâques au printemps.',
    night: 'Assombrir la nuit',
    nightHint: 'La salle s’assombrit le soir et les écrans s’allument.',
    motion: 'Les bonshommes circulent',
    motionHint: 'Désactivé : chacun reste à son bureau, et le processeur se repose.',
    timeline: 'Frise de la journée',
    timelineHint: 'Sous la salle, un point par passage depuis minuit.',
    reset: 'Réinitialiser',
    done: 'Terminé',
  },
  sceneLabel: 'L’open space des agents',
  wall: { jobs: 'Tâches', running: 'En cours', failed: 'En échec', late: 'En retard' },
  phrases: {
    relaunch: 'Je te relance !',
    anyTrouble: 'Un souci ?',
    stayingHere: 'Je reste là.',
    report: (ok, n) => (n ? `Rapport : ${ok} à jour, ${n} relancé${n > 1 ? 's' : ''}.` : 'Rapport : tout le monde est à jour.'),
    visitor: 'Bonjour ! J’ai une demande.',
    courier: 'Colis livré !',
  },
  objects: {
    workbench: 'L’établi',
    tv: 'La télé',
    'server-rack': 'La baie serveur',
    'vending-machine': 'Le distributeur',
    fridge: 'Le frigo',
    'cpu-box': 'Le carton de processeurs',
    'gpu-box': 'Le carton de cartes graphiques',
    'ram-box': 'Le carton de mémoire',
    snake: 'La borne Snake : une partie ?',
    breakout: 'La borne Casse-puces : une partie ?',
  },
  arcade: {
    play: 'JOUER',
    score: 'SCORE',
    record: 'RECORD',
    gameOver: 'GAME OVER',
    pressPlay: 'Appuie sur JOUER',
    replay: 'Appuie sur JOUER pour rejouer',
    help: { snake: 'Flèches ou Z Q S D', breakout: 'Flèches, Q D ou la souris' },
    keys: 'Entrée pour jouer · Échap pour fermer',
    toPlay: 'pour jouer',
    toClose: 'pour fermer',
    title: { snake: 'SNAKE DES COMPOSANTS', breakout: 'CASSE-PUCES' },
  },
  catNap: 'Le chat de l’atelier fait la sieste',
  noWeather: 'Pas de météo',
}

export const TEXTS: Record<Language, Texts> = { en: EN, fr: FR }
