# pixel-openspace

**Un open space en pixel art où tes tâches planifiées et tes agents IA viennent travailler.**

Chaque agent a son bureau. Celui qui tourne s'assoit et tape, l'écran allumé. Les désœuvrés vont au café, aux bornes d'arcade ou chez un collègue. Le PC d'une tâche en échec se met à fumer, et le chef vient s'asseoir à côté jusqu'à ce qu'elle reparte. Les retardataires somnolent ; les oubliés voient leur plante faner et la poussière couvrir leur écran.

[🇬🇧 Read in English](./README.md)

![La démo de pixel-openspace](./public/docs/screenshot.png)

C'est un composant [shadcn/ui](https://ui.shadcn.com) pour Next.js et React : le code est copié dans ton projet, habillé par tes propres `Button` et `Card`.

## Installer

Dans un projet où shadcn/ui est en place :

```bash
npx shadcn@latest add https://raw.githubusercontent.com/leduss/pixel-openspace/main/public/r/pixel-openspace.json
```

Les fichiers arrivent dans `components/pixel-openspace/`. Les étiquettes de la scène utilisent [Pixelify Sans](https://fonts.google.com/specimen/Pixelify+Sans) par la variable CSS `--font-pixel` ; avec Next.js :

```tsx
// app/layout.tsx
import { Pixelify_Sans } from 'next/font/google'
const pixel = Pixelify_Sans({ variable: '--font-pixel', subsets: ['latin'] })
// …et ajoute pixel.variable au className de <html>
```

## Utiliser

```tsx
'use client'

import { PixelOpenspace } from '@/components/pixel-openspace/pixel-openspace'

export function Bureau() {
  return (
    <PixelOpenspace
      language="fr"
      agents={[
        { id: 'sauvegarde', name: 'Sauvegarde', emoji: '💾', status: 'ok', schedule: 'chaque jour à 2 h 30' },
        { id: 'deploiement', name: 'Déploiement', emoji: '🚀', status: 'failed', lastMessage: 'échec de la compilation' },
        { id: 'boite', name: 'Boîte mail', emoji: '📨', status: 'working', role: 'Trie les mails du support avec un LLM' },
      ]}
      wall={[{ label: 'Tâches du jour', value: 128, tone: 'info' }]}
      weather={{ temperature: 19, sky: 'clouds', day: true, place: 'Lanton' }}
      onRun={(agent) => fetch(`/api/taches/${agent.id}/lancer`, { method: 'POST' })}
    />
  )
}
```

Le composant suit ses props : relis l'état de tes tâches (toutes les quelques secondes, c'est assez) et passe-le-lui. La scène réagit aux changements : qui se met au travail s'assoit, qui finit s'étire et dit son `lastMessage` dans une bulle.

Les états (`working`, `ok`, `late`, `failed`, `off`, `never`, `on-demand`) et toutes les props sont décrits dans le [README anglais](./README.md#props).

## Ce qu'il y a d'autre dans la salle

- Deux bornes d'arcade jouables, **Snake des composants** et **Casse-puces**, avec leurs records au mur.
- Un tableau blanc avec les cinq prochains passages, une horloge à l'heure, le chat de l'atelier qui dort sur les bureaux vides.
- Les saisons : Halloween tout octobre, Noël tout décembre, et Pâques les deux semaines avant le lundi de Pâques, avec ses œufs cachés et son lapin.
- Le jour et la nuit : la salle s'assombrit le soir, et les tours RGB, les néons et les écrans s'allument.
- Une notification du navigateur quand un agent tombe en échec, et un son 8 bits pour les départs, les échecs et les visiteurs (à activer).
- `prefers-reduced-motion` est respecté : tout le monde reste à sa place.

## Léger pour le processeur

La page est faite pour rester ouverte toute la journée sur un écran à côté. La boucle tourne à 30 images par seconde et ne redessine que ce qui a changé. Les animations du décor sont pilotées par cette boucle, pas par les animations SVG du navigateur. Au bout de 20 secondes de calme, la scène se fige ; la nuit, chacun reste à son bureau.

## Développer

```bash
bun install
bun dev                  # la démo, sur http://localhost:3000
bun run test             # le moteur des déplacements
bun run registry:build   # reconstruit public/r/pixel-openspace.json
```

Le composant vit dans `registry/pixel-openspace/`, la démo dans `src/`.

## D'où ça vient

Né dans l'atelier de [Monte Ma Tour](https://montematour.fr), montage de PC sur mesure sur le Bassin d'Arcachon, pour garder un œil sur les tâches qui font tourner l'activité.

## Licence

[MIT](./LICENSE)
