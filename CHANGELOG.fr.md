# Journal des versions

Ce qui a changé dans pixel-openspace, le plus récent en haut. Chaque version est aussi une [release GitHub](https://github.com/leduss/pixel-openspace/releases) : suis le dépôt (Watch → Custom → Releases) pour être prévenu des suivantes.

[🇬🇧 Read in English](./CHANGELOG.md)

## Mettre à jour

Le composant est copié dans ton projet : mettre à jour, c'est le copier à nouveau.

```bash
npx shadcn@latest add https://raw.githubusercontent.com/leduss/pixel-openspace/main/public/r/pixel-openspace.json --overwrite
```

`--overwrite` remplace les fichiers de `components/pixel-openspace/` (tes retouches y sont perdues) et les composants shadcn/ui dont il se sert, si les tiens diffèrent des officiels. Les nouvelles dépendances s'installent au passage.

## 0.1.1 · 2026-10-03

### Corrigé

- Le serveur local ne répond plus qu'aux requêtes adressées à `127.0.0.1` ou `localhost`, ce qui bloque le rebinding DNS : un autre site aurait sinon pu lire tes tâches et, avec `--allow-run`, les lancer.
- Le serveur local s'arrête avec un message clair sur un `--theme` ou une `--lang` inconnus, au lieu d'une page cassée.
- Une `language` inconnue retombe sur l'anglais, et un `status` inconnu s'affiche comme `ok` avec un avertissement en développement, au lieu de faire planter la salle.
- Les réglages gardés dans le navigateur sont vérifiés champ par champ : une valeur abîmée ou d'une ancienne version est ignorée.
- L'infobulle de l'horloge du chef suit la langue de la salle.
- Deux passages au même instant ne se télescopent plus sur la frise de la journée.

### Ajouté

- L'intégration continue sur GitHub : lint, types, tests, construction du serveur local, et vérification que le registre publié correspond aux sources.

## 0.1.0 · 2026-10-03

La première version.

### La salle

- Un open space en pixel art dessiné en SVG : un bureau par agent, un chef dans son bureau vitré, un espace détente avec deux bornes d'arcade, une cuisine, un grand écran mural et un tableau blanc avec les cinq prochains passages.
- Les agents suivent leur `status` : `working` s'assoit et tape, `ok` va au café ou sur le canapé, `late` somnole, `failed` voit son PC fumer et le chef venir le voir, `off` laisse un post-it sur un écran éteint.
- Des bulles avec le `lastMessage` de chaque agent, une fiche d'agent avec un bouton « Lancer » (`onRun`), et un compte à rebours à l'écran dans les dix dernières minutes avant un passage.
- Des visiteurs, des livreurs qui déposent des colis, des confettis, le chat de l'atelier, une horloge à l'heure, la météo derrière la fenêtre du chef.
- Deux jeux jouables : Snake des composants et Casse-puces, avec leurs records au mur.
- Quatre thèmes : `geek`, `eighties`, `gym` et `modern`.
- Les saisons : Halloween tout octobre, Noël tout décembre, Pâques les deux semaines avant le lundi de Pâques.
- Le jour et la nuit, avec des lumières qui s'allument dans le noir ; une nuit plus claire pour le thème `modern`.
- En anglais et en français.

### Autour de la salle

- La frise de la journée sous la salle : un point par passage depuis minuit, rouge s'il a raté. Passe des `runs` aux agents pour l'afficher.
- Une roue dentée de réglages : qui regarde la salle peut renommer l'enseigne au mur, choisir la ville dont la vraie météo s'affiche à la fenêtre (Open-Meteo, sans clé), le thème et la langue, activer le son 8 bits et les alertes du navigateur, et couper les saisons, la nuit, les allées et venues ou la frise. Gardé dans son navigateur.
- Le plein écran.

### Sous le capot

- Un élément de registre shadcn/ui qui marche avec les styles Radix (`new-york`) comme Base UI (`base-*`).
- Léger pour le processeur : 30 images par seconde au plus, seul ce qui bouge est redessiné, la scène se fige après 20 secondes de calme, et chacun reste à son bureau la nuit.
- `prefers-reduced-motion` est respecté.

### Sans écrire de code

- Un serveur local dans `cli/` qui lit les agents launchd (macOS), la crontab et les timers systemd de l'utilisateur (Linux), avec `--match`, `--exclude`, `--theme`, `--lang`, `--weather`, un fichier de réglages et `--allow-run`, désactivé par défaut. Pas encore sur npm : lance-le depuis un clone avec `bun run cli`.
