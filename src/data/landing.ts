import type { Language } from '@/registry/pixel-openspace/types'

/* Le contenu de la landing : liens, commande d'installation, exemples de code et textes, en anglais et en français. */

export const DEPOT = 'https://github.com/leduss/pixel-openspace'
export const CAFE = 'https://buymeacoffee.com/leduss'
export const INSTALL = 'npx shadcn@latest add @pixel-openspace/pixel-openspace'
export const CARTE_README = '![office](https://pixel-openspace.vercel.app/api/card?repo=owner/repo)'

/* La couleur de la lampe de chaque état, la même que dans la salle. */
export const LAMPES: Record<string, string> = {
  working: '#e8b923',
  ok: '#4ade80',
  late: '#fb923c',
  asleep: '#818cf8',
  failed: '#ef4444',
  off: '#71717a',
  never: '#a1a1aa',
  'on-demand': '#38bdf8',
}

export const ROUTE = `// app/api/jobs/route.ts
export async function GET() {
  const jobs = await db.job.findMany()
  return Response.json(
    jobs.map((job) => ({
      id: job.id,
      name: job.name,
      emoji: job.emoji,
      status: job.running ? 'working' : job.lastExitCode ? 'failed' : 'ok',
      lastRun: job.lastRunAt,
      nextRun: job.nextRunAt,
      lastMessage: job.lastLogLine,
    })),
  )
}`

export const PAGE = `// app/office/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { PixelOpenspace } from '@/components/pixel-openspace/pixel-openspace'
import type { Agent } from '@/components/pixel-openspace/types'

export default function Office() {
  const [agents, setAgents] = useState<Agent[]>([])

  useEffect(() => {
    const load = () => fetch('/api/jobs').then((r) => r.json()).then(setAgents)
    load()
    const timer = setInterval(load, 5000)
    return () => clearInterval(timer)
  }, [])

  return (
    <PixelOpenspace
      agents={agents}
      onRun={(agent) => fetch(\`/api/jobs/\${agent.id}/run\`, { method: 'POST' })}
    />
  )
}`

/* Tous les mots de la page, en anglais et en français. */
export const TEXTES = {
  en: {
    copier: 'Copy',
    copie: 'Copied',
    titre: 'Your cron jobs, at their desks.',
    intro:
      'pixel-openspace shows your scheduled jobs, CI pipelines and AI agents as a pixel-art office. Running jobs sit down and type, idle ones go get coffee, and when one fails its PC starts to smoke and the lead walks over.',
    etoile: 'Star it on GitHub',
    surveille: ['cron', 'launchd', 'systemd timers', 'GitHub Actions', 'AI agents', 'queues', 'deploys'],
    readmeTitre: 'In your README too',
    readmeTexte:
      'Paste one line into any repository’s README: its GitHub Actions workflows at their desks, up to date, animated. The image refreshes every five minutes.',
    readmeOptions: 'Add &theme=farm, &lang=fr, &cols=6 or &title=ACME to the address.',
    readmeLegende: 'This repository’s own room, live.',
    sourcesTitre: 'What it watches',
    sourcesTexte:
      'Anything that runs on a schedule or on demand, and can succeed or fail. Some of it comes in without a line of code; the rest takes one API route.',
    sources: [
      {
        emoji: '⏰',
        titre: 'Cron jobs and system timers',
        texte:
          'Your crontab, launchd agents on macOS, systemd timers on Linux: running or not, last exit code, last log line. A run missed while the laptop slept shows as asleep, not late.',
        comment: 'No code',
        code: 'npx pixel-openspace',
      },
      {
        emoji: '🧪',
        titre: 'GitHub Actions',
        texte:
          'Every workflow of your repository: it types while a run is in progress, smokes when the build breaks, and, with the local server, dozes when a scheduled run is missing. A broken pull request does not count.',
        comment: 'In your app, or no code',
        code: 'githubAgents()',
      },
      {
        emoji: '🤖',
        titre: 'AI agents',
        texte:
          'An LLM triaging the inbox, a scraper, a nightly digest: it sits down while it works and says its last log line in a speech bubble when it is done.',
        comment: 'Your API route',
        code: "{ status: 'working' }",
      },
      {
        emoji: '📬',
        titre: 'Queues, workers and deploys',
        texte:
          'A BullMQ worker, a Postgres job table, a deploy, a backup: if it runs and can fail, it gets a desk. The wall screen shows your own numbers, like the queue size.',
        comment: 'Your API route',
        code: "{ status: 'failed' }",
      },
    ],
    cafe: 'Buy me a coffee',
    licence: 'A shadcn/ui component for Next.js and React. Free and open source under the MIT license.',
    lireTitre: 'Read the room',
    lireTexte:
      'Each job gets a desk and a status. You set the status from whatever you already track: an exit code, a queue, a last run date. The room does the rest, so one glance tells you what is running, what is stuck and what broke.',
    etats: {
      working: 'Sits at its desk and types. Code scrolls on its screen, its keyboard and fans light up.',
      ok: 'Up to date. Gets up now and then for a coffee, a round of arcade or a chat with a colleague.',
      late: 'Missed its run. Dozes at its desk until it catches up.',
      asleep:
        'Missed its run while the laptop was asleep. Sleeps at its desk, screen off, and the lead leaves it alone: nothing is broken.',
      failed: 'Red screen, smoking PC. The lead walks over and stays until it recovers.',
      off: 'Not loaded. An empty chair and a post-it on a dark screen.',
      never: 'Hired, but has not run yet.',
      'on-demand': 'Only works when asked. Lives its life in between.',
    },
    etapesTitre: 'Set it up in three steps',
    etape1: 'Add the component',
    etape1Texte: [
      'The shadcn CLI copies the component’s files into your ',
      'components',
      ' folder, yours to read and change. The labels in the room use Pixelify Sans: load it with ',
      'next/font',
      ' into a ',
      '--font-pixel',
      ' variable.',
    ],
    etape2: 'Feed it your jobs',
    etape2Texte:
      'Expose your jobs’ state, poll it every few seconds and pass it down. When a status changes, the room reacts: the job sits down to work, or stands up, stretches and says its last log line in a speech bubble. For your GitHub Actions CI, githubAgents() writes this route for you: it finds your repository and gives each workflow a desk.',
    route: 'Your API route',
    page: 'Your page',
    etape3: 'Leave it on a screen',
    etape3Texte:
      'It is made to stay open all day on a side screen, in fullscreen. The room runs at 30 frames per second and only redraws what moved. After twenty quiet seconds everything freezes until someone gets up, and at night everybody stays at their desk.',
    aussiTitre: 'Also in the room',
    aussiTexte: 'None of this is needed to watch your jobs. It is there because an office you look at every day should be a nice place.',
    details: [
      [
        'Seven themes',
        'Geek, 1980s office, gym, modern office, restaurant kitchen, neon city, cozy farm: each tells the statuses its own way.',
      ],
      ['Two arcade cabinets', 'Component Snake and Chip Breaker, both playable. High scores hang on the wall.'],
      ['A wall screen', 'Up to four numbers of your own: jobs today, errors, queue size, budget.'],
      ['The lead', 'Does its rounds while it runs, then reports in front of the wall screen and reads your announcements.'],
      ['A window on the weather', 'Sun, rain, snow or storm, day or night, with the temperature you pass it.'],
      ['Visitors and couriers', 'Bump a counter and someone walks in: a visitor greets the lead, a courier drops a parcel.'],
      [
        'Seasons',
        'Pumpkins and a ghost all October, a Christmas tree and garlands all December, hidden eggs and a hopping bunny at Easter.',
      ],
      ['The office cat', 'Naps on whichever desk was left empty.'],
      ['Reduced motion', 'If your system asks for less motion, everybody stays at their desk.'],
      [
        'The day timeline',
        'Under the room, one dot per run since midnight, red when it failed. Click a job’s name for its runs of the day, and since when it has been failing.',
      ],
      [
        'A settings gear',
        'Whoever watches the room renames the sign, picks the weather city, the theme and the language, and turns things on or off. Saved in their browser.',
      ],
      ['Alerts and sound', 'Browser notifications when a job fails, 8-bit beeps for starts and failures. Both off until you turn them on.'],
    ],
    nouveautesTitre: 'What’s new',
    nouveautesTexte:
      'The latest versions, straight from the changelog. Each one is also a GitHub release: watch the repository to hear about the next ones.',
    journalComplet: 'Full changelog',
  },
  fr: {
    copier: 'Copier',
    copie: 'Copié',
    titre: 'Tes tâches cron, à leur bureau.',
    intro:
      'pixel-openspace montre tes tâches planifiées, ta CI et tes agents IA comme un bureau en pixel art. Ceux qui tournent s’assoient et tapent, les désœuvrés vont au café, et quand l’un plante, son PC se met à fumer et le chef vient le voir.',
    etoile: 'Une étoile sur GitHub',
    surveille: ['cron', 'launchd', 'timers systemd', 'GitHub Actions', 'agents IA', 'files d’attente', 'déploiements'],
    readmeTitre: 'Dans ton README aussi',
    readmeTexte:
      'Colle une ligne dans le README de n’importe quel dépôt : ses workflows GitHub Actions à leur bureau, à jour, animés. L’image se rafraîchit toutes les cinq minutes.',
    readmeOptions: 'Ajoute &theme=farm, &lang=fr, &cols=6 ou &title=ACME à l’adresse.',
    readmeLegende: 'La salle de ce dépôt-ci, en direct.',
    sourcesTitre: 'Ce que la salle surveille',
    sourcesTexte:
      'Tout ce qui tourne selon un horaire ou à la demande, et peut réussir ou échouer. Une partie entre sans une ligne de code ; le reste demande une route d’API.',
    sources: [
      {
        emoji: '⏰',
        titre: 'Les tâches cron et les timers système',
        texte:
          'Ta crontab, tes agents launchd sur macOS, tes timers systemd sur Linux : en cours ou non, dernier code de sortie, dernière ligne de journal. Un passage manqué pendant que le portable dormait s’affiche endormi, pas en retard.',
        comment: 'Sans code',
        code: 'npx pixel-openspace',
      },
      {
        emoji: '🧪',
        titre: 'GitHub Actions',
        texte:
          'Chaque workflow de ton dépôt : il tape pendant un run, fume quand le build casse, et, avec le serveur local, somnole quand un passage planifié manque. Une pull request cassée ne compte pas.',
        comment: 'Dans ton appli, ou sans code',
        code: 'githubAgents()',
      },
      {
        emoji: '🤖',
        titre: 'Les agents IA',
        texte:
          'Un LLM qui trie la boîte de support, un scraper, un résumé de la nuit : il s’assoit pendant qu’il travaille et dit sa dernière ligne de journal dans une bulle quand il a fini.',
        comment: 'Ta route d’API',
        code: "{ status: 'working' }",
      },
      {
        emoji: '📬',
        titre: 'Les files d’attente, les workers et les déploiements',
        texte:
          'Un worker BullMQ, une table de tâches Postgres, un déploiement, une sauvegarde : si ça tourne et que ça peut échouer, ça a son bureau. L’écran mural affiche tes propres chiffres, comme la taille de la file.',
        comment: 'Ta route d’API',
        code: "{ status: 'failed' }",
      },
    ],
    cafe: 'M’offrir un café',
    licence: 'Un composant shadcn/ui pour Next.js et React. Gratuit et open source, sous licence MIT.',
    lireTitre: 'Lire la salle',
    lireTexte:
      'Chaque tâche a un bureau et un état. Tu fixes l’état à partir de ce que tu suis déjà : un code de sortie, une file d’attente, une date de dernier passage. La salle fait le reste : un coup d’œil suffit pour voir ce qui tourne, ce qui coince et ce qui a planté.',
    etats: {
      working: 'Assis à son bureau, il tape. Du code défile sur son écran, son clavier et ses ventilateurs s’allument.',
      ok: 'À jour. Se lève de temps en temps pour un café, une partie d’arcade ou un mot à un collègue.',
      late: 'A manqué son passage. Somnole à son bureau en attendant de rattraper.',
      asleep:
        'A manqué son passage pendant que le portable dormait. Dort à son bureau, écran éteint, et le chef le laisse tranquille : rien n’est cassé.',
      failed: 'Écran rouge, PC qui fume. Le chef vient le voir et reste à côté jusqu’à ce qu’il reparte.',
      off: 'Pas chargé. Une chaise vide et un post-it sur un écran noir.',
      never: 'Embauché, mais pas encore passé.',
      'on-demand': 'Ne travaille que quand on le lui demande. Vit sa vie entre-temps.',
    },
    etapesTitre: 'L’installer en trois étapes',
    etape1: 'Ajouter le composant',
    etape1Texte: [
      'Le CLI de shadcn copie les fichiers du composant dans ton dossier ',
      'components',
      ', à toi de les lire et de les modifier. Les étiquettes de la salle utilisent Pixelify Sans : charge-la avec ',
      'next/font',
      ' dans une variable ',
      '--font-pixel',
      '.',
    ],
    etape2: 'Lui donner tes tâches',
    etape2Texte:
      'Expose l’état de tes tâches, relis-le toutes les quelques secondes et passe-le au composant. Quand un état change, la salle réagit : la tâche s’assoit pour travailler, ou se lève, s’étire et dit sa dernière ligne de journal dans une bulle. Pour ta CI GitHub Actions, githubAgents() écrit cette route à ta place : elle trouve ton dépôt et donne un bureau à chaque workflow.',
    route: 'Ta route d’API',
    page: 'Ta page',
    etape3: 'Le laisser sur un écran',
    etape3Texte:
      'Il est fait pour rester ouvert toute la journée sur un écran à côté, en plein écran. La salle tourne à 30 images par seconde et ne redessine que ce qui a bougé. Après vingt secondes de calme, tout se fige jusqu’à ce que quelqu’un se lève, et la nuit, chacun reste à son bureau.',
    aussiTitre: 'Aussi dans la salle',
    aussiTexte:
      'Rien de tout ça n’est nécessaire pour surveiller tes tâches. C’est là parce qu’un bureau qu’on regarde tous les jours doit être un endroit agréable.',
    details: [
      [
        'Sept thèmes',
        'Geek, bureau des années 80, salle de sport, bureau moderne, cuisine de restaurant, ville néon, ferme douillette : chacun raconte les états à sa façon.',
      ],
      ['Deux bornes d’arcade', 'Snake des composants et Casse-puces, jouables toutes les deux. Les records sont affichés au mur.'],
      ['Un écran mural', 'Jusqu’à quatre chiffres à toi : tâches du jour, erreurs, file d’attente, budget.'],
      ['Le chef', 'Fait sa ronde quand il tourne, puis son rapport devant l’écran mural, et lit tes annonces.'],
      ['Une fenêtre sur la météo', 'Soleil, pluie, neige ou orage, de jour comme de nuit, avec la température que tu lui donnes.'],
      ['Visiteurs et livreurs', 'Augmente un compteur et quelqu’un entre : un visiteur salue le chef, un livreur dépose un colis.'],
      ['Les saisons', 'Citrouilles et fantôme tout octobre, sapin et guirlandes tout décembre, œufs cachés et lapin qui bondit à Pâques.'],
      ['Le chat de l’atelier', 'Fait la sieste sur le bureau resté vide.'],
      ['Moins d’animations', 'Si ton système demande moins de mouvement, chacun reste à son bureau.'],
      [
        'La frise de la journée',
        'Sous la salle, un point par passage depuis minuit, rouge s’il a raté. Un clic sur le nom d’une tâche liste ses passages du jour, et depuis quand elle échoue.',
      ],
      [
        'Une roue dentée de réglages',
        'Qui regarde la salle renomme l’enseigne, choisit la ville de la météo, le thème et la langue, et allume ou coupe le reste. Gardé dans son navigateur.',
      ],
      [
        'Alertes et son',
        'Une notification du navigateur quand une tâche plante, des bips 8 bits aux départs et aux échecs. Les deux coupés tant que tu ne les allumes pas.',
      ],
    ],
    nouveautesTitre: 'Quoi de neuf',
    nouveautesTexte:
      'Les dernières versions, tirées du journal. Chacune est aussi une release GitHub : suis le dépôt pour être prévenu des suivantes.',
    journalComplet: 'Tout le journal',
  },
} satisfies Record<Language, unknown>
