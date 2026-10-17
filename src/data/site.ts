/*
 * Ce qui entoure la landing : les pages (nouveautés, FAQ, contact), l'en-tête
 * et le pied de page, en anglais et en français.
 */

import type { Language } from '@/registry/pixel-openspace/types'
import { CAFE, DEPOT } from './landing'

export type Page = 'accueil' | 'changelog' | 'faq' | 'contact'

/** L'adresse d'une page dans une langue : l'anglais à la racine, le français sous /fr. */
export function chemin(langue: Language, page: Page): string {
  const racine = langue === 'fr' ? '/fr' : ''
  return page === 'accueil' ? racine || '/' : `${racine}/${page}`
}

export const NPM = 'https://www.npmjs.com/package/pixel-openspace'
export const ANNUAIRE = 'https://ui.shadcn.com/docs/directory'
export const RELEASES = `${DEPOT}/releases`
export const ISSUES = `${DEPOT}/issues`
export const DISCUSSIONS = `${DEPOT}/discussions`
export const BUG = `${DEPOT}/issues/new?labels=bug`
export const IDEE = `${DEPOT}/issues/new?labels=idea`
export const EMAIL = 'julien.dussart59@gmail.com'
export const GUIDE_THEME = `${DEPOT}/blob/main/THEMES.md`
export const GUIDE_THEME_FR = `${DEPOT}/blob/main/THEMES.fr.md`
export const ATELIER = 'https://montematour.fr'
export { CAFE, DEPOT }

type Question = { q: string; r: string; lien?: { texte: string; href: string } }

export const SITE = {
  en: {
    nav: { installer: 'Set it up', changelog: 'Changelog', faq: 'FAQ', contact: 'Contact' },
    pied: {
      accroche: 'Your cron jobs, at their desks. A pixel-art office for your scheduled jobs, CI pipelines and AI agents.',
      produit: 'Product',
      demo: 'Live demo',
      installer: 'Set it up',
      changelog: 'Changelog',
      faq: 'FAQ',
      projet: 'Project',
      github: 'Source on GitHub',
      npm: 'Local server on npm',
      releases: 'Releases',
      annuaire: 'shadcn/ui directory',
      guide: 'Create a theme',
      aide: 'Help',
      contact: 'Contact',
      discussions: 'Ask a question',
      bug: 'Report a bug',
      idee: 'Suggest an idea',
      licence: 'MIT license',
      faitA: 'Made at ',
      atelier: ', a custom PC workshop on the Bassin d’Arcachon.',
    },
    changelog: {
      titre: 'Changelog',
      intro:
        'What changed in pixel-openspace, newest first. Each version is also a GitHub release: watch the repository (Watch → Custom → Releases) to hear about the next ones.',
      mettreAJour: 'To update, copy the component again:',
      avertissement: '--overwrite replaces the files in components/pixel-openspace/: your own edits there are lost.',
      releases: 'Releases on GitHub',
      meta: 'Every version of pixel-openspace: new themes, new features, fixes.',
    },
    faq: {
      titre: 'Frequently asked questions',
      intro: 'Something missing? Ask in the GitHub Discussions, or from the contact page.',
      meta: 'Questions about pixel-openspace: setup, data, performance, themes, updates.',
      questions: [
        {
          q: 'What do I need to use it?',
          r: 'React 19 and Tailwind CSS v4, in a project set up for shadcn/ui. The examples use Next.js, but the component itself is plain React.',
        },
        {
          q: 'Where does the room get its data from?',
          r: 'From you: pass an array of agents with a name and a status (working, ok, late, failed…). Read it from whatever you already track: an exit code, a queue, a CI API. For GitHub Actions, githubAgents() finds your project’s workflows on its own. Or run npx pixel-openspace, which reads your launchd or systemd jobs on your own machine, or the GitHub Actions workflows of a repository with --github owner/repo.',
        },
        {
          q: 'Does it send my data anywhere?',
          r: 'No. The room runs in the browser and only shows what you pass it. The only outside call is the weather behind the lead’s window, from Open-Meteo, and only if you choose a place.',
        },
        {
          q: 'Can it stay open all day on a screen?',
          r: 'That is what it is made for. It runs at 30 frames per second and only redraws what moved; after twenty quiet seconds everything freezes until someone gets up.',
        },
        {
          q: 'What is the difference between late and asleep?',
          r: 'Late means a run was missed. Asleep means it was missed while the laptop was asleep: nothing is broken, so the lead leaves it alone. The local server tells the two apart on its own, on macOS and Linux.',
        },
        {
          q: 'Can I start a job from the room?',
          r: 'Yes: pass onRun and each agent’s card gets a “Run now” button. With the local server, add --allow-run; it is off by default.',
        },
        {
          q: 'How do I update it?',
          r: 'Run the shadcn command again with --overwrite. The files in components/pixel-openspace/ are replaced, so keep your own changes somewhere else. The changelog says what changed.',
        },
        {
          q: 'Can I make my own theme?',
          r: 'Yes. A theme is one file in components/pixel-openspace/themes/: the decor, the desks, the outfits, the break corners and the night lights. Start from an existing one; theme ideas are welcome as GitHub issues.',
          lien: { texte: 'Read the guide: Create a theme', href: GUIDE_THEME },
        },
        {
          q: 'Which languages are there?',
          r: 'English and French, for everything written and said in the room.',
        },
        {
          q: 'Is it free?',
          r: 'Yes, under the MIT license: use it, change it, ship it. If it makes your day nicer, a coffee is welcome.',
        },
      ] satisfies Array<Question>,
    },
    contact: {
      titre: 'Contact',
      intro: 'A bug, an idea, a question, or just a screenshot of your room: here is where to send it.',
      meta: 'How to reach the author of pixel-openspace: bugs, ideas, questions.',
      canaux: [
        {
          titre: 'Ask a question',
          texte: 'How to plug in your CI, read a queue, set up a theme: ask in the Discussions, the answer helps the next person too.',
          lien: 'Open the Discussions',
          href: DISCUSSIONS,
        },
        {
          titre: 'Report a bug',
          texte: 'Something looks or behaves wrong. Say what you expected, what you got, and your theme if it matters.',
          lien: 'Open a bug',
          href: BUG,
        },
        {
          titre: 'Suggest an idea',
          texte: 'A theme, a data source, a feature. Ideas live in the issues, where everyone can follow them.',
          lien: 'Suggest an idea',
          href: IDEE,
        },
        {
          titre: 'Write to me',
          texte: 'A question, a thank-you, or something that does not belong in public.',
          lien: EMAIL,
          href: `mailto:${EMAIL}`,
        },
        {
          titre: 'Monte Ma Tour',
          texte: 'The custom PC workshop on the Bassin d’Arcachon where pixel-openspace was made.',
          lien: 'montematour.fr',
          href: ATELIER,
        },
      ],
    },
  },
  fr: {
    nav: { installer: 'Installer', changelog: 'Nouveautés', faq: 'FAQ', contact: 'Contact' },
    pied: {
      accroche: 'Tes tâches cron, à leur bureau. Un bureau en pixel art pour tes tâches planifiées, ta CI et tes agents IA.',
      produit: 'Produit',
      demo: 'Démo en ligne',
      installer: 'Installer',
      changelog: 'Nouveautés',
      faq: 'FAQ',
      projet: 'Projet',
      github: 'Le code sur GitHub',
      npm: 'Le serveur local sur npm',
      releases: 'Les releases',
      annuaire: 'L’annuaire shadcn/ui',
      guide: 'Créer un thème',
      aide: 'Aide',
      contact: 'Contact',
      discussions: 'Poser une question',
      bug: 'Signaler un bug',
      idee: 'Proposer une idée',
      licence: 'Licence MIT',
      faitA: 'Fait à l’atelier ',
      atelier: ', montage de PC sur mesure sur le Bassin d’Arcachon.',
    },
    changelog: {
      titre: 'Nouveautés',
      intro:
        'Ce qui a changé dans pixel-openspace, le plus récent en haut. Chaque version est aussi une release GitHub : suis le dépôt (Watch → Custom → Releases) pour être prévenu des suivantes.',
      mettreAJour: 'Pour mettre à jour, copie à nouveau le composant :',
      avertissement: '--overwrite remplace les fichiers de components/pixel-openspace/ : tes retouches y sont perdues.',
      releases: 'Les releases sur GitHub',
      meta: 'Toutes les versions de pixel-openspace : nouveaux thèmes, nouveautés, corrections.',
    },
    faq: {
      titre: 'Questions fréquentes',
      intro: 'Il manque quelque chose ? Demande-le dans les Discussions GitHub, ou depuis la page contact.',
      meta: 'Les questions sur pixel-openspace : installation, données, performances, thèmes, mises à jour.',
      questions: [
        {
          q: 'De quoi ai-je besoin pour l’utiliser ?',
          r: 'React 19 et Tailwind CSS v4, dans un projet configuré pour shadcn/ui. Les exemples utilisent Next.js, mais le composant lui-même est du React tout simple.',
        },
        {
          q: 'D’où la salle tire-t-elle ses données ?',
          r: 'De toi : passe-lui une liste d’agents avec un nom et un état (working, ok, late, failed…). Tire-le de ce que tu suis déjà : un code de sortie, une file d’attente, l’API de ta CI. Pour GitHub Actions, githubAgents() trouve seule les workflows de ton projet. Ou lance npx pixel-openspace, qui lit tes tâches launchd ou systemd sur ta propre machine, ou les workflows GitHub Actions d’un dépôt avec --github owner/repo.',
        },
        {
          q: 'Est-ce que mes données partent quelque part ?',
          r: 'Non. La salle tourne dans le navigateur et n’affiche que ce que tu lui passes. Le seul appel extérieur est la météo derrière la fenêtre du chef, chez Open-Meteo, et seulement si tu choisis un lieu.',
        },
        {
          q: 'Peut-elle rester ouverte toute la journée sur un écran ?',
          r: 'C’est fait pour. Elle tourne à 30 images par seconde et ne redessine que ce qui bouge ; après vingt secondes de calme, tout se fige jusqu’à ce que quelqu’un se lève.',
        },
        {
          q: 'Quelle différence entre late et asleep ?',
          r: 'Late, un passage a été manqué. Asleep, il l’a été pendant que le portable dormait : rien n’est cassé, alors le chef le laisse tranquille. Sur macOS et sur Linux, le serveur local fait la différence tout seul.',
        },
        {
          q: 'Puis-je lancer une tâche depuis la salle ?',
          r: 'Oui : passe onRun et la fiche de chaque agent gagne un bouton « Lancer ». Avec le serveur local, ajoute --allow-run ; c’est désactivé par défaut.',
        },
        {
          q: 'Comment le mettre à jour ?',
          r: 'Relance la commande shadcn avec --overwrite. Les fichiers de components/pixel-openspace/ sont remplacés : garde tes retouches ailleurs. La page des nouveautés dit ce qui a changé.',
        },
        {
          q: 'Puis-je créer mon propre thème ?',
          r: 'Oui. Un thème tient dans un fichier de components/pixel-openspace/themes/ : le décor, les bureaux, les tenues, les coins de pause et les lumières de nuit. Pars d’un thème existant ; les idées de thème sont les bienvenues en issue GitHub.',
          lien: { texte: 'Lire le guide : Créer un thème', href: GUIDE_THEME_FR },
        },
        {
          q: 'Quelles langues ?',
          r: 'L’anglais et le français, pour tout ce qui s’écrit et se dit dans la salle.',
        },
        {
          q: 'C’est gratuit ?',
          r: 'Oui, sous licence MIT : utilise-le, modifie-le, publie-le. S’il égaye tes journées, un café fait plaisir.',
        },
      ] satisfies Array<Question>,
    },
    contact: {
      titre: 'Contact',
      intro: 'Un bug, une idée, une question, ou juste une capture de ta salle : voilà où l’envoyer.',
      meta: 'Comment joindre l’auteur de pixel-openspace : bugs, idées, questions.',
      canaux: [
        {
          titre: 'Poser une question',
          texte: 'Brancher ta CI, lire une file d’attente, régler un thème : demande dans les Discussions, la réponse servira au suivant.',
          lien: 'Ouvrir les Discussions',
          href: DISCUSSIONS,
        },
        {
          titre: 'Signaler un bug',
          texte: 'Quelque chose s’affiche ou se comporte mal. Dis ce que tu attendais, ce que tu as eu, et ton thème si ça compte.',
          lien: 'Ouvrir un bug',
          href: BUG,
        },
        {
          titre: 'Proposer une idée',
          texte: 'Un thème, une source de données, une fonctionnalité. Les idées vivent dans les issues, où chacun peut les suivre.',
          lien: 'Proposer une idée',
          href: IDEE,
        },
        {
          titre: 'M’écrire',
          texte: 'Une question, un merci, ou ce qui n’a pas sa place en public.',
          lien: EMAIL,
          href: `mailto:${EMAIL}`,
        },
        {
          titre: 'Monte Ma Tour',
          texte: 'L’atelier de montage de PC sur mesure du Bassin d’Arcachon où pixel-openspace est né.',
          lien: 'montematour.fr',
          href: ATELIER,
        },
      ],
    },
  },
}
