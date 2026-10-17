# Changelog

What changed in pixel-openspace, newest first. Each version is also a [GitHub release](https://github.com/leduss/pixel-openspace/releases): watch the repository (Watch → Custom → Releases) to hear about new ones.

[🇫🇷 Lire en français](./CHANGELOG.fr.md)

## Updating

The component is copied into your project, so updating means copying it again:

```bash
npx shadcn@latest add @pixel-openspace/pixel-openspace --overwrite
```

`--overwrite` replaces the files in `components/pixel-openspace/` (your own edits there are lost) and the shadcn/ui components it uses, if yours differ from the official ones. New dependencies are installed along the way.

## 0.10.0 · 2026-10-17

### Added

- `asleep` on Linux: the local server reads the sleep windows from `journalctl -t systemd-sleep`, whatever the systemd version writes ("Entering sleep state", "Performing sleep operation", "Suspending system"). (#8)

### Fixed

- A cron job whose run fell while the machine was asleep showed as up to date: cron keeps no history, so the run was assumed to have happened. cron simply skips those runs; the job now shows as `asleep`, on macOS and Linux, and its last run is the last one due while the machine was awake.

## 0.9.0 · 2026-10-17

### Added

- `githubAgents()`, in `components/pixel-openspace/github.ts`: your project's CI in the room with two lines in an API route. It finds the GitHub repository on its own (on Vercel, in GitHub Actions, or from the `origin` remote in development) and turns each workflow into an agent, with its runs of the day on the timeline. `GITHUB_TOKEN` is optional for a public repository; the answer is cached a minute with it, five without.

### Fixed

- With `--github`, runs started by a release, a schedule or by hand counted only if their branch was the default one, and a release carries the name of its tag: a release workflow showed an old manual run and no run of the day. Now only pull requests and pushes to other branches are left out.

## 0.8.0 · 2026-10-17

### Added

- `--github` without a repository shows the one of the current folder, read from its `origin` remote: from a project's folder, `npx pixel-openspace --github` is all it takes. `"github": ["."]` does the same in the settings file.

## 0.7.0 · 2026-10-17

### Added

- The local server reads GitHub Actions: `npx pixel-openspace --github owner/repo`, repeatable. Each workflow gets a desk: working while a run is in progress, failed after a failure, off when disabled, late when a `schedule:` run is missing (GitHub's crons are read in UTC, with 45 minutes of grace for its delays). Its runs of the day fill the timeline. The default branch's runs count first, so a broken pull request does not turn a desk red. A token is optional for public repositories: `GITHUB_TOKEN`, `GH_TOKEN` or `gh auth token` raises the refresh from every 5 minutes to every minute and opens private repositories. `--local` shows this machine's jobs alongside. (#1)

## 0.6.0 · 2026-10-17

### Added

- Click a job's name on the day timeline to see its runs of the day under its line, newest first: time, success or failure, and message. When its last runs failed, a red line says since when it has been failing. Click again to close it.

## 0.5.0 · 2026-10-17

### Added

- A seventh theme, `farm`: a cozy farm. Every desk is a plot: a working job waters it and its sprouts grow, a failed one's crops wither and a crow lands on its sign, an asleep one turns around and dozes against its fence, straw hat over the eyes. The farmer rocks on the log-cabin porch; breaks happen at the well, under the apple tree, by the henhouse or on the hay bales facing the red barn. The seasons count twice: snow on the roofs and fields in December, pumpkin patches and a pumpkin-headed scarecrow in October.

### Fixed

- In the settings, the theme buttons no longer leave one orphan on its own line: past four choices, they line up in a grid.

## 0.4.0 · 2026-10-05

### Added

- A sixth theme, `neon`: a neon city at night. Dark concrete walls with pink and cyan tubes, a ramen stand under its red curtains, a holographic billboard with falling katakana, a blinking can vending machine. Desks get holographic screens: code scrolls in green, a failed job's screen glitches. The lead is a fixer, behind a server rack.

### Fixed

- The local server (`npx pixel-openspace`) ignored `?theme=kitchen`: it now follows the component's theme list. Its help lists every theme.

## 0.3.0 · 2026-10-05

### Added

- A new status, `asleep`: the job missed its run while the machine was asleep. The worker sleeps at its desk, screen off, z's above its head, and the lead leaves it alone. After opening the lid, genuinely broken jobs stay `late` and no longer get lost in a room full of dozing desks.
- The local server (`npx pixel-openspace`) reads the Mac's sleep history (`pmset -g log`): a launchd run missed during sleep shows as `asleep`, not `late`.

## 0.2.0 · 2026-10-04

### Added

- Desks per row: 4, 5 or 6, through the `columns` prop (default `5`) or in the settings, under “Desks per row”. Rows stay centered in the room and the aisles follow: nobody walks through a desk.

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
