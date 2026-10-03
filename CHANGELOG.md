# Changelog

What changed in pixel-openspace, newest first. Each version is also a [GitHub release](https://github.com/leduss/pixel-openspace/releases): watch the repository (Watch → Custom → Releases) to hear about new ones.

[🇫🇷 Lire en français](./CHANGELOG.fr.md)

## Updating

The component is copied into your project, so updating means copying it again:

```bash
npx shadcn@latest add leduss/pixel-openspace/pixel-openspace --overwrite
```

`--overwrite` replaces the files in `components/pixel-openspace/` (your own edits there are lost) and the shadcn/ui components it uses, if yours differ from the official ones. New dependencies are installed along the way.

## 0.1.3 · 2026-10-03

### Fixed

- The “New desk” sign fits its text, in any language and even in a fallback font wider than Pixelify Sans.

### Changed

- Shorter install command: `npx shadcn@latest add leduss/pixel-openspace/pixel-openspace`.

## 0.1.2 · 2026-10-03

### Added

- Without a `wall` prop, the wall screen counts your agents: total, running, failed, late. Pass `wall={[]}` to leave it dark.

## 0.1.1 · 2026-10-03

### Fixed

- Some agents showed black hair, skin or clothes in every theme: the colour was picked with a signed shift on a hash above 2³¹. They get their colours back.
- In the `eighties` theme, the computer under each CRT is centred.
- The local server only answers requests addressed to `127.0.0.1` or `localhost`, which blocks DNS rebinding: another website could otherwise read your jobs and, with `--allow-run`, start them.
- The local server stops with a clear message on an unknown `--theme` or `--lang`, instead of a broken page.
- An unknown `language` falls back to English, and an unknown `status` shows as `ok` with a warning in development, instead of crashing the room.
- Settings saved in the browser are checked field by field: a damaged or outdated value is ignored.
- The lead’s clock tooltip follows the room’s language.
- Two runs at the same moment no longer clash on the day timeline.

### Added

- The local server is on npm: `npx pixel-openspace`, no clone needed.
- A fifth theme, `kitchen`: a restaurant kitchen with stainless ranges, where a working job cooks over a blue flame and a failed one burns its pan in black smoke. The lead is the head chef.
- Settings follow you across tabs: change the theme in one, every open room follows.
- Continuous integration on GitHub: lint, types, tests, the local server build, and a check that the published registry matches the sources.
- Render tests for the component, the day timeline and the settings.

### Changed

- The component is split into smaller files (`card`, `decor`, `people`, `festivities`, `vue`…): updating adds them to `components/pixel-openspace/`. Nothing changes on screen.

## 0.1.0 · 2026-10-03

The first release.

### The room

- A pixel-art open space drawn in SVG: one desk per agent, a lead in a glass office, a break room with two arcade cabinets, a kitchen, a big wall screen and a whiteboard with the next five runs.
- Agents react to their `status`: `working` sits and types, `ok` wanders to the coffee machine or the sofa, `late` dozes, `failed` gets a smoking PC and a visit from the lead, `off` leaves a post-it on a dark screen.
- Speech bubbles with each agent’s `lastMessage`, an agent card with a “Run now” button (`onRun`), countdowns on screens for the last ten minutes before a run.
- Visitors, couriers dropping parcels, confetti, the office cat, a real-time clock, the weather behind the lead’s window.
- Two playable games: Component Snake and Chip Breaker, with high scores on the wall.
- Four themes: `geek`, `eighties`, `gym` and `modern`.
- Seasons: Halloween all October, Christmas all December, Easter for the two weeks before Easter Monday.
- Day and night, with lights that glow in the dark; a lighter night for the `modern` theme.
- English and French.

### Around the room

- The day timeline under the room: one dot per run since midnight, red when it failed. Give agents `runs` to show it.
- A settings gear: whoever watches the room can rename the sign on the wall, pick the city whose real weather shows at the window (Open-Meteo, no key), the theme and the language, turn on 8-bit sounds and browser alerts, and turn off the seasons, the night, the walking around or the timeline. Saved in their browser.
- Fullscreen.

### Under the hood

- A shadcn/ui registry item that works with both the Radix (`new-york`) and Base UI (`base-*`) styles.
- Light on the CPU: 30 fps cap, only what moved is redrawn, the scene freezes after 20 calm seconds, and everybody stays at their desk at night.
- `prefers-reduced-motion` is respected.

### Without writing code

- A local server in `cli/` that reads launchd agents (macOS), the crontab and systemd user timers (Linux), with `--match`, `--exclude`, `--theme`, `--lang`, `--weather`, a settings file and an opt-in `--allow-run`. Not on npm yet: run it from a clone with `bun run cli`.
