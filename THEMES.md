# Create a theme

A theme is one file in `registry/pixel-openspace/themes/`. It draws the room: the walls and floors, every desk and what its screen says, the outfits, the break corners and the lights at night. The engine, the people, the speech bubbles, the whiteboard, the clock, the window, the wall screen and the seasons are shared by every theme: you don't draw them.

Seven themes exist today: `geek`, `eighties`, `gym`, `modern`, `kitchen`, `neon` and `farm`. Start by reading one end to end. `neon.tsx` and `farm.tsx` are the most recent; `gym.tsx` shows a desk that isn't a desk at all. Theme ideas waiting for someone are in the [issues labelled `theme`](https://github.com/leduss/pixel-openspace/issues?q=is%3Aissue+is%3Aopen+label%3Atheme).

[🇫🇷 Lire en français](./THEMES.fr.md)

## The room you draw in

The scene is an SVG 1000 units wide. Its height grows with the number of desk rows, so the bottom of the room comes to you as `hauteur` (the bottom wall sits at `hauteur - 20`). Every theme keeps the same geography, so that people walk the same paths whatever the look:

| Area | Where | What goes there |
| --- | --- | --- |
| The lead's office | `x` 20 → 330, `y` 14 → 198 | The lead's desk (drawn for you at `cx` 205), the `server-rack` object on the left, the sign with `t.leadOffice` around (222, 42) |
| The break room | `x` 338 → 682 | The two arcade cabinets at `x` 352 and 396, the `tv` object around `x` 452–568, two seats facing it at (482, 146) and (538, 146), the `workbench` object around `x` 598–674 |
| The kitchen | `x` 690 → 980 | The coffee corner at (768, 100), the `vending-machine` at `x` 864, the `fridge` at `x` 922 |
| The back walls | `y` 14 → 56 | One wall per room, 6 units of top edge, a skirting at `y` 52 |
| The main room | `y` 198 → bottom | The desks, the boxes (`cpu-box`, `gpu-box`, `ram-box`) at the bottom left, the door at the bottom centre |
| The main room's wall | `y` 204 → 246, spans in `MUR_SALLE` | Broken by the three openings; the room's title sign sits around (695, 230) |

The shared pieces are drawn on top of your decor, so leave them room: the whiteboard (`x` 26–134, `y` 108–188), the window (`x` 94–150), the clock (302, 36), the wall screen (`x` 30–230, `y` 206–240) and the high scores (`x` 286–356, `y` 207–240).

## What a theme is made of

A theme is a `Theme` object (see `registry/pixel-openspace/theme.ts`):

| Field | What it is |
| --- | --- |
| `Decor` | Floors, walls, the three top rooms and their objects. Receives `hauteur`, `titre` (the sign of the main room), `liens`/`aller` to make objects clickable, `jouer` to start an arcade game, and `fete` (`'halloween'`, `'noel'`, `'paques'` or `null`) if you want the seasons to change your decor |
| `Bureau` | An agent's desk and everything on it. This is where each status shows (see below) |
| `BureauChef` | The lead's desk, facing the room |
| `Assise`, `Dossier` | The seat behind the agent, and the part drawn *in front of* their back once they sit (a chair back, a bike frame, a fence) |
| `Fauteuil` | The lead's chair |
| `plaque` | The colour of the agent's name on the front edge of the desk |
| `tenue(id)` | The colours of a person, from their id (see below) |
| `casque(id)` | Whether they wear headphones; the `k` colour of the outfit draws them (or a straw hat) |
| `coins` | The break corners: same eight positions in every theme, your own names |
| `coinCafe`, `CafeQuiCoule` | The corner where something pours while someone waits, and what pours |
| `lumieres`, `lumierePoste` | The lights that pierce the night, and one more per occupied desk if you want |
| `nuit` | The colour and opacity of the night veil (dark blue at 0.62 by default) |
| `fond` | The colour around the scene |
| `tasse(id)` | Whether they walk around with a mug |
| `sieste` | An `asleep` agent turns around and dozes facing the room, the `k` colour pulled over their eyes like a hat |

## Each status, at a glance

`Bureau` gets the agent's status as `statut`. Each one must read from across the room, without a label:

| Public status | `statut` | What it must look like |
| --- | --- | --- |
| `working` | `au-travail` | Something moves: code scrolls, a pan sizzles, a bike wheel turns, a watering can pours |
| `ok` | `a-jour` | Calm and ready: an idle screen, ripe crops |
| `late` | `en-retard` | Like `ok` on the desk; the engine adds the orange badge above the agent |
| `asleep` | `endormi` | Dark and quiet: a screen off, plants asleep, a painted moon. **Never red, never smoke, never anything that looks like an alert**: the laptop was asleep, nothing is broken |
| `failed` | `en-echec` | Unmistakable: red, smoke, glitches, a crow, crops withering. The engine adds the red `!` and the lead walks over |
| `off` | `absent` | The screen off with the post-it `t.offNote`, an empty chair |
| `never`, `on-demand` | `jamais`, `a-la-demande` | Like `ok` |

Two more things belong on the desk: `bientot` (minutes before the next run, shown with `t.inMinutes(bientot)` when it is set) and the agent's `emoji`. The engine already draws the name, the status lamp and a desk plant.

## The outfits

`tenue(id)` returns the colour of each letter of the 8×12 sprite: `h` hair, `s` skin, `e` eyes, `c` top, `C` the bottom of the top, `t` the hoodie strings (or overall straps), `k` headphones or hat, `p` trousers, `b` shoes.

- Draw them from a hash of the id with `hacher(id, seed, factor)`, and pick **your own seed**: the same person then wears something different in each theme, but always the same thing in yours.
- `CHEF_ID` is the lead; ids starting with `livreur:` are couriers. Give both their own outfit.
- `estInvite(id)` tells visitors apart: keep their headphones off.

## Animation

Don't use `<animate>`: Chrome recomputes every SVG animation on every frame, even when nothing changes. Use `<Anim>` from `primitives.tsx` instead, with the same `attributeName`, `values`, `dur` and `begin`. The room moves it in steps, like an old game, and freezes it when all is quiet. `etapes(from, to, n)` builds the steps of a movement. In the README card, the same `<Anim>` becomes a native SVG `<animate>`, so your theme moves there too, without JavaScript.

Other helpers in `primitives.tsx`: `Pixels` draws a grid of characters, one per pixel; `Cliquable` makes an object clickable; `Neon` draws a glowing sign; `Plante` a potted plant; `MUR_SALLE` lists the spans of the main room's wall. `Arcade`, `BorneCasseBriques` and `Porte` can be borrowed from `themes/geek.tsx`.

## A skeleton

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

## Register it

1. Add its public name to `ThemeName` in `types.ts`, and to `THEMES` in `preferences.ts`.
2. Map the name to your object in `THEMES` in `contexte.ts`.
3. Give it a label in English and in French: `themes` in `i18n.ts`.
4. Add the file to `registry.json`, then run `bun run registry:build` (the CI checks that `public/r/` matches the sources).
5. List it in the help of the local server (`cli/src/cli.ts`), in both READMEs, in both changelogs and in the landing page (`src/data/landing.ts`).

## Try it

```bash
bun install
bun dev
```

Open http://localhost:3000, click the gear above the room and pick your theme. The demo buttons under the room switch a job to working or failed, bring in a visitor or a courier, and the sky buttons change the weather and the night. To see the seasons, change the date of your computer (October, December, or the two weeks before Easter).

The local server shows your real jobs in it: `bun run cli --theme <name>`.

Before opening a pull request: `bun run lint`, `bun run typecheck` and `bun run test`.

## The rules

- **Same geography.** The corners, the objects and the openings stay where they are; only their look changes. People must walk the same paths in every theme.
- **Statuses readable at a glance.** Working moves, failed alarms, everything else is calm. Someone glancing at a side screen must see what broke.
- **`asleep` is never an alert.** No red, no smoke, no flashing: dark, quiet, asleep.
- **Light on the CPU.** `<Anim>`, never `<animate>`; a few moving things per desk at most.
- **Pixel art.** Rectangles on whole units, `shapeRendering` crisp (the default), few colours per object.
- **Comments in French**, like the rest of the component, and one paragraph at the top of the file that tells the room.
