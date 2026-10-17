# Créer un thème

Un thème tient dans un fichier de `registry/pixel-openspace/themes/`. Il dessine la salle : les murs et les sols, chaque bureau et ce que dit son écran, les tenues, les coins de pause et les lumières de la nuit. Le moteur, les bonshommes, les bulles, le tableau blanc, l'horloge, la fenêtre, l'écran mural et les saisons sont communs à tous les thèmes : tu ne les dessines pas.

Sept thèmes existent aujourd'hui : `geek`, `eighties`, `gym`, `modern`, `kitchen`, `neon` et `farm`. Commence par en lire un de bout en bout. `neon.tsx` et `farm.tsx` sont les plus récents ; `gym.tsx` montre un bureau qui n'en est pas un. Les idées de thèmes qui attendent quelqu'un sont dans les [issues étiquetées `theme`](https://github.com/leduss/pixel-openspace/issues?q=is%3Aissue+is%3Aopen+label%3Atheme).

[🇬🇧 Read in English](./THEMES.md)

## La salle où tu dessines

La scène est un SVG de 1000 unités de large. Sa hauteur grandit avec le nombre de rangées de bureaux : le bas de la salle t'arrive en `hauteur` (le mur du bas est à `hauteur - 20`). Tous les thèmes gardent la même géographie, pour que les gens empruntent les mêmes chemins quelle que soit l'allure :

| Zone | Où | Ce qui s'y trouve |
| --- | --- | --- |
| Le bureau du chef | `x` 20 → 330, `y` 14 → 198 | Le bureau du chef (dessiné pour toi en `cx` 205), l'objet `server-rack` à gauche, l'enseigne `t.leadOffice` vers (222, 42) |
| L'espace détente | `x` 338 → 682 | Les deux bornes d'arcade en `x` 352 et 396, l'objet `tv` vers `x` 452–568, deux sièges face à elle en (482, 146) et (538, 146), l'objet `workbench` vers `x` 598–674 |
| La cuisine | `x` 690 → 980 | Le coin café en (768, 100), le `vending-machine` en `x` 864, le `fridge` en `x` 922 |
| Les murs du fond | `y` 14 → 56 | Un mur par pièce, 6 unités d'arête en haut, une plinthe en `y` 52 |
| La grande salle | `y` 198 → bas | Les bureaux, les cartons (`cpu-box`, `gpu-box`, `ram-box`) en bas à gauche, la porte en bas au centre |
| Le mur de la grande salle | `y` 204 → 246, pans dans `MUR_SALLE` | Percé de ses trois entrées ; l'enseigne de la salle vers (695, 230) |

Les pièces communes se dessinent par-dessus ton décor : laisse-leur la place. Le tableau blanc (`x` 26–134, `y` 108–188), la fenêtre (`x` 94–150), l'horloge (302, 36), l'écran mural (`x` 30–230, `y` 206–240) et les records (`x` 286–356, `y` 207–240).

## De quoi un thème est fait

Un thème est un objet `Theme` (voir `registry/pixel-openspace/theme.ts`) :

| Champ | Ce que c'est |
| --- | --- |
| `Decor` | Les sols, les murs, les trois pièces du haut et leurs objets. Reçoit `hauteur`, `titre` (l'enseigne de la grande salle), `liens`/`aller` pour rendre les objets cliquables, `jouer` pour lancer une borne, et `fete` (`'halloween'`, `'noel'`, `'paques'` ou `null`) si tu veux que les saisons changent ton décor |
| `Bureau` | Le bureau d'un agent et tout ce qui est posé dessus. C'est là que chaque état se voit (voir plus bas) |
| `BureauChef` | Le bureau du chef, face à la pièce |
| `Assise`, `Dossier` | Le siège derrière l'agent, et ce qui se dessine *devant* son dos une fois assis (un dossier, le cadre d'un vélo, une clôture) |
| `Fauteuil` | Le fauteuil du chef |
| `plaque` | La couleur du nom de l'agent sur la tranche du bureau |
| `tenue(id)` | Les couleurs d'un bonhomme, d'après son identifiant (voir plus bas) |
| `casque(id)` | Porte-t-il un casque ; la couleur `k` de la tenue le dessine (ou un chapeau de paille) |
| `coins` | Les coins de pause : les mêmes huit positions dans tous les thèmes, avec tes propres noms |
| `coinCafe`, `CafeQuiCoule` | Le coin où quelque chose coule quand quelqu'un y attend, et ce qui coule |
| `lumieres`, `lumierePoste` | Les lumières qui percent la nuit, et une de plus par poste occupé si tu veux |
| `nuit` | La couleur et l'opacité du voile de la nuit (bleu nuit à 0,62 par défaut) |
| `fond` | La couleur autour de la scène |
| `tasse(id)` | Se promène-t-il une tasse à la main |
| `sieste` | L'agent `asleep` se retourne et somnole face à la salle, la couleur `k` rabattue sur les yeux comme un chapeau |

## Chaque état, d'un coup d'œil

`Bureau` reçoit l'état de l'agent dans `statut`. Chacun doit se lire depuis l'autre bout de la salle, sans étiquette :

| État public | `statut` | Ce qu'il doit montrer |
| --- | --- | --- |
| `working` | `au-travail` | Quelque chose bouge : le code défile, la poêle grésille, la roue du vélo tourne, l'arrosoir verse |
| `ok` | `a-jour` | Calme et prêt : un écran au repos, des cultures mûres |
| `late` | `en-retard` | Comme `ok` sur le bureau ; le moteur ajoute la pastille orange au-dessus de l'agent |
| `asleep` | `endormi` | Sombre et tranquille : un écran éteint, des plants endormis, une lune peinte. **Jamais de rouge, jamais de fumée, rien qui ressemble à une alerte** : le portable dormait, rien n'est cassé |
| `failed` | `en-echec` | Impossible à rater : du rouge, de la fumée, des glitchs, un corbeau, des cultures qui fanent. Le moteur ajoute le `!` rouge et le chef vient voir |
| `off` | `absent` | L'écran éteint avec le post-it `t.offNote`, la chaise vide |
| `never`, `on-demand` | `jamais`, `a-la-demande` | Comme `ok` |

Deux choses de plus ont leur place sur le bureau : `bientot` (les minutes avant le prochain passage, à afficher avec `t.inMinutes(bientot)` quand il est là) et l'`emoji` de l'agent. Le moteur dessine déjà le nom, la lampe d'état et une plante de bureau.

## Les tenues

`tenue(id)` renvoie la couleur de chaque lettre du sprite de 8×12 : `h` les cheveux, `s` la peau, `e` les yeux, `c` le haut, `C` le bas du haut, `t` les cordons du sweat (ou les bretelles d'une salopette), `k` le casque ou le chapeau, `p` le pantalon, `b` les chaussures.

- Tire-les d'un hachage de l'identifiant avec `hacher(id, graine, facteur)`, et choisis **ta propre graine** : la même personne s'habille alors autrement dans chaque thème, mais toujours pareil dans le tien.
- `CHEF_ID` est le chef ; les identifiants qui commencent par `livreur:` sont les livreurs. Donne-leur à chacun leur tenue.
- `estInvite(id)` reconnaît les visiteurs : laisse-leur les oreilles libres.

## L'animation

N'utilise pas `<animate>` : Chrome recalcule toutes les animations SVG à chaque image, même quand rien ne change. Prends `<Anim>` de `primitives.tsx`, avec les mêmes `attributeName`, `values`, `dur` et `begin`. La salle le fait avancer par sauts, comme dans un vieux jeu, et le fige au calme. `etapes(de, a, n)` découpe un mouvement en étapes.

Les autres aides de `primitives.tsx` : `Pixels` dessine une grille de caractères, un par pixel ; `Cliquable` rend un objet cliquable ; `Neon` dessine une enseigne lumineuse ; `Plante` une plante en pot ; `MUR_SALLE` liste les pans du mur de la grande salle. `Arcade`, `BorneCasseBriques` et `Porte` s'empruntent à `themes/geek.tsx`.

## Un squelette

```tsx
'use client'

/*
 * Un paragraphe qui raconte la salle : son allure, un poste au travail et
 * un poste en panne, qui est le chef, où l'on fait la pause.
 */

import { BUREAU, CHEF_ID, estInvite, type CoinDePause, type Statut } from '../engine'
import { Cliquable, MUR_SALLE, hacher, useTextes, type Lumiere } from '../primitives'
import type { PropsBureau, PropsDecor, PropsSiege, Theme } from '../theme'
import { Arcade, BorneCasseBriques, Porte } from './geek'
import type { SceneObject } from '../types'

const COINS: Array<CoinDePause> = [
  { nom: 'cafe', x: 768, y: 100 },
  { nom: 'distributeur', x: 881, y: 104 },
  { nom: 'frigo', x: 950, y: 108 },
  { nom: 'arcade', x: 372, y: 112 },
  { nom: 'arcade-2', x: 415, y: 112 },
  { nom: 'etabli', x: 636, y: 108 },
  { nom: 'banc-gauche', x: 482, y: 146, assis: true },
  { nom: 'banc-droite', x: 538, y: 146, assis: true },
]

function Decor({ hauteur, titre, liens, aller, jouer }: PropsDecor) {
  const t = useTextes()
  const bas = hauteur - 20
  const lien = (objet: SceneObject) => ({ titre: t.objects[objet], faire: () => aller(objet), actif: Boolean(liens[objet]) })
  return (
    <>
      {/* Les sols, les murs du fond, les trois pièces, le mur de la grande salle, le cadre. */}
      <Cliquable titre={t.objects.snake} faire={() => jouer('snake')}>
        <Arcade x={352} />
      </Cliquable>
      <Cliquable titre={t.objects.breakout} faire={() => jouer('casse-briques')}>
        <BorneCasseBriques x={396} />
      </Cliquable>
      <Cliquable {...lien('tv')}>
        <rect x={470} y={22} width={80} height={44} fill="#222" />
      </Cliquable>
      {MUR_SALLE.map(([de, a]) => (
        <rect key={de} x={de} y={204} width={a - de} height={42} fill="#555" />
      ))}
      <text x={695} y={230} fontSize="9" textAnchor="middle" fill="#fff">
        {titre}
      </text>
      <Porte bas={bas} />
    </>
  )
}

/* L'écran dit l'état : remplace ces couleurs par des dessins qui bougent. */
const ECRAN: Record<Statut, string> = {
  'au-travail': '#22c55e',
  'a-jour': '#1e293b',
  'en-retard': '#1e293b',
  endormi: '#020617',
  'en-echec': '#dc2626',
  absent: '#020617',
  jamais: '#1e293b',
  'a-la-demande': '#1e293b',
}

function MonBureau({ cx, dy, x, dessus, statut, bientot, emoji }: PropsBureau) {
  const t = useTextes()
  return (
    <g>
      <rect x={x} y={dy} width={BUREAU.largeur} height={dessus} fill="#888" />
      <rect x={cx - 26} y={dy - 16} width={52} height={26} fill={ECRAN[statut]} />
      {bientot ? (
        <text x={cx} y={dy + 6} fontSize="6" textAnchor="middle" fill="#fff">
          {t.inMinutes(bientot)}
        </text>
      ) : null}
      <text x={x + 12} y={dy + 13} fontSize="10" textAnchor="middle">
        {emoji}
      </text>
    </g>
  )
}

const hachage = (id: string) => hacher(id, 41, 53)

export const THEME_MON_THEME: Theme = {
  coins: COINS,
  coinCafe: 'cafe',
  fond: '#111',
  Decor,
  Bureau: MonBureau,
  BureauChef: MonBureau,
  plaque: '#fff',
  Assise: ({ x, y, couleur }: PropsSiege) => <rect x={x - 10} y={y - 12} width="20" height="10" fill={couleur} />,
  Dossier: ({ x, y }: PropsSiege) => <rect x={x - 10} y={y} width="20" height="12" fill="#333" />,
  Fauteuil: ({ x, y }) => <rect x={x - 15} y={y - 30} width="30" height="38" fill="#333" />,
  tenue: (id) => {
    const h = hachage(id)
    return {
      h: '#2a1d14',
      s: '#d9a57a',
      e: '#1c1917',
      c: ['#dc2626', '#2563eb'][h % 2],
      C: '#333',
      t: '#fff',
      k: '#111',
      p: '#333',
      b: '#111',
    }
  },
  casque: (id) => id !== CHEF_ID && !estInvite(id) && hachage(id) % 2 === 0,
  lumieres: [] satisfies Array<Lumiere>,
}
```

## L'enregistrer

1. Ajoute son nom public à `ThemeName` dans `types.ts`, et à `THEMES` dans `preferences.ts`.
2. Relie ce nom à ton objet dans `THEMES` de `contexte.ts`.
3. Donne-lui un libellé en anglais et en français : `themes` dans `i18n.ts`.
4. Ajoute le fichier à `registry.json`, puis lance `bun run registry:build` (la CI vérifie que `public/r/` suit les sources).
5. Cite-le dans l'aide du serveur local (`cli/src/cli.ts`), dans les deux README, dans les deux changelogs et sur la landing (`src/data/landing.ts`).

## L'essayer

```bash
bun install
bun dev
```

Ouvre http://localhost:3000, clique sur la roue dentée au-dessus de la salle et choisis ton thème. Les boutons de démo sous la salle font passer une tâche au travail ou en panne, font entrer un visiteur ou un livreur, et les boutons du ciel changent la météo et la nuit. Pour voir les saisons, change la date de ton ordinateur (octobre, décembre, ou les deux semaines avant Pâques).

Le serveur local y montre tes vraies tâches : `bun run cli --theme <nom>`.

Avant d'ouvrir une pull request : `bun run lint`, `bun run typecheck` et `bun run test`.

## Les règles

- **La même géographie.** Les coins, les objets et les entrées restent où ils sont ; seule leur allure change. Les gens doivent emprunter les mêmes chemins dans tous les thèmes.
- **Des états lisibles d'un coup d'œil.** Le travail bouge, la panne alerte, tout le reste est calme. Qui jette un œil à l'écran d'à côté doit voir ce qui a cassé.
- **`asleep` n'est jamais une alerte.** Pas de rouge, pas de fumée, pas de clignotement : sombre, tranquille, endormi.
- **Léger pour le processeur.** `<Anim>`, jamais `<animate>` ; quelques éléments qui bougent par bureau, pas plus.
- **Du pixel art.** Des rectangles en unités entières, le rendu net (`shapeRendering` crisp, par défaut), peu de couleurs par objet.
- **Des commentaires en français**, comme dans le reste du composant, et un paragraphe en haut du fichier qui raconte la salle.
