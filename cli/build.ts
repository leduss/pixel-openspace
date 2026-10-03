/*
 * Construit le paquet npm : la page (React et le composant en un seul
 * fichier, Tailwind compilé à part) et le serveur Node, sans dépendance.
 */

import { $ } from 'bun'
import { chmod, cp, rm } from 'node:fs/promises'

const ici = import.meta.dir
await rm(`${ici}/dist`, { recursive: true, force: true })

const page = await Bun.build({
  entrypoints: [`${ici}/app/main.tsx`],
  outdir: `${ici}/dist/app`,
  naming: 'app.js',
  target: 'browser',
  minify: true,
  define: { 'process.env.NODE_ENV': '"production"' },
})
if (!page.success) throw new AggregateError(page.logs, 'page build failed')

await $`bunx @tailwindcss/cli -i ${ici}/app/app.css -o ${ici}/dist/app/app.css --minify`.quiet()
await cp(`${ici}/app/index.html`, `${ici}/dist/app/index.html`)

const serveur = await Bun.build({
  entrypoints: [`${ici}/src/cli.ts`],
  outdir: `${ici}/dist`,
  naming: 'cli.js',
  target: 'node',
  banner: '#!/usr/bin/env node',
})
if (!serveur.success) throw new AggregateError(serveur.logs, 'server build failed')
await chmod(`${ici}/dist/cli.js`, 0o755)

console.log('cli/dist built')
