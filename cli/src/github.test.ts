import { describe, expect, it } from 'vitest'
import {
  cronsDuWorkflow,
  depotDuRemote,
  githubSansValeur,
  etatDuWorkflow,
  horaireDuWorkflow,
  lireDepot,
  runsQuiComptent,
  versTache,
  type Run,
  type Workflow,
} from './github'
import { decrire, prochainPassage } from './horaire'

const workflow: Workflow = {
  id: 7,
  name: 'Nightly backup',
  path: '.github/workflows/backup.yml',
  state: 'active',
  updated_at: '2026-10-01T00:00:00Z',
}
const run = (debut: string, status = 'completed', conclusion: string | null = 'success', titre = 'Nightly backup'): Run => ({
  workflow_id: 7,
  status,
  conclusion,
  display_title: titre,
  event: 'schedule',
  head_branch: 'main',
  created_at: debut,
  run_started_at: debut,
})
const depot = { proprietaire: 'acme', nom: 'ops' }

describe('lireDepot', () => {
  it('lit owner/repo et les adresses github.com', () => {
    expect(lireDepot('acme/ops')).toEqual(depot)
    expect(lireDepot('https://github.com/acme/ops.git')).toEqual(depot)
    expect(() => lireDepot('acme')).toThrow(/owner\/repo/)
  })
})

describe('cronsDuWorkflow', () => {
  it('trouve chaque cron du schedule, avec ou sans guillemets, sans les commentaires', () => {
    const yaml = [
      'on:',
      '  push:',
      '  schedule:',
      "    - cron: '30 2 * * *'",
      '    - cron: "0 12 * * 1-5" # midi en semaine',
      '    - cron: 15 * * * *',
      'jobs: {}',
    ].join('\n')
    expect(cronsDuWorkflow(yaml)).toEqual(['30 2 * * *', '0 12 * * 1-5', '15 * * * *'])
    expect(cronsDuWorkflow('on: push')).toEqual([])
  })
})

describe('horaireDuWorkflow', () => {
  it('lit les crons en temps universel, et le dit', () => {
    const horaire = horaireDuWorkflow(['30 2 * * *'])
    expect(prochainPassage(horaire, new Date('2026-10-17T12:00:00Z'))?.toISOString()).toBe('2026-10-18T02:30:00.000Z')
    expect(decrire(horaire, 'en')).toBe('daily at 2:30 UTC')
    expect(horaireDuWorkflow([])).toEqual({ type: 'aucun' })
  })
})

describe('etatDuWorkflow', () => {
  const maintenant = new Date('2026-10-17T12:00:00Z')
  const quotidien = horaireDuWorkflow(['30 2 * * *'])
  const aucun = horaireDuWorkflow([])

  it('travaille pendant un run, plante après un échec, se repose après un succès', () => {
    expect(etatDuWorkflow(workflow, [run('2026-10-17T11:58:00Z', 'in_progress', null)], aucun, maintenant)).toBe('working')
    expect(etatDuWorkflow(workflow, [run('2026-10-17T11:00:00Z', 'completed', 'failure')], aucun, maintenant)).toBe('failed')
    expect(etatDuWorkflow(workflow, [run('2026-10-17T11:00:00Z')], aucun, maintenant)).toBe('ok')
  })

  it('est éteint s’il est désactivé, à la demande ou jamais lancé sans run', () => {
    expect(etatDuWorkflow({ ...workflow, state: 'disabled_manually' }, [run('2026-10-17T02:31:00Z')], quotidien, maintenant)).toBe('off')
    expect(etatDuWorkflow(workflow, [], aucun, maintenant)).toBe('on-demand')
    expect(etatDuWorkflow(workflow, [], quotidien, maintenant)).toBe('never')
  })

  it('est en retard quand le passage de la nuit manque, mais laisse à GitHub ses trois quarts d’heure', () => {
    expect(etatDuWorkflow(workflow, [run('2026-10-17T02:41:00Z')], quotidien, maintenant)).toBe('ok')
    expect(etatDuWorkflow(workflow, [run('2026-10-16T02:35:00Z')], quotidien, maintenant)).toBe('late')
    expect(etatDuWorkflow(workflow, [run('2026-10-16T02:35:00Z')], quotidien, new Date('2026-10-17T03:00:00Z'))).toBe('ok')
  })
})

describe('versTache', () => {
  it('fait du workflow un agent, et de ses runs du jour la frise', () => {
    const maintenant = new Date('2026-10-17T23:00:00')
    const runs = [
      run(new Date('2026-10-17T22:00:00').toISOString(), 'completed', 'failure', 'Fix the dump'),
      run(new Date('2026-10-17T09:00:00').toISOString()),
      run(new Date('2026-10-16T09:00:00').toISOString()),
    ]
    const tache = versTache(depot, workflow, runs, [], 'en', maintenant)
    expect(tache).toMatchObject({
      id: 'github:acme/ops/.github/workflows/backup.yml',
      name: 'Nightly backup',
      emoji: '💾',
      role: 'acme/ops · .github/workflows/backup.yml',
      status: 'failed',
      lastMessage: 'Fix the dump · failure',
      schedule: 'on schedule',
      source: 'github',
      cible: '7',
    })
    expect(tache.runs?.map((r) => r.ok)).toEqual([true, false])
  })
})

describe('runsQuiComptent', () => {
  it('écoute la branche par défaut, et toutes les branches pour un workflow de pull requests', () => {
    const principal = run('2026-10-17T09:00:00Z')
    const pr = { ...run('2026-10-17T10:00:00Z', 'completed', 'failure'), head_branch: 'feature/x', event: 'pull_request' }
    expect(runsQuiComptent([pr, principal], 'main')).toEqual([principal])
    expect(runsQuiComptent([pr], 'main')).toEqual([pr])
    // Une release porte le nom de son tag : elle compte quand même.
    const release = { ...run('2026-10-17T11:00:00Z'), head_branch: 'v1.2.0', event: 'release' }
    expect(runsQuiComptent([release, pr, principal], 'main')).toEqual([release, principal])
  })
})

describe('le dépôt d’ici', () => {
  it('lit les remotes GitHub en SSH, en HTTPS et en ssh://', () => {
    expect(depotDuRemote('git@github.com:acme/ops.git\n')).toEqual(depot)
    expect(depotDuRemote('https://github.com/acme/ops')).toEqual(depot)
    expect(depotDuRemote('https://x-access-token@github.com/acme/ops.git')).toEqual(depot)
    expect(depotDuRemote('ssh://git@github.com/acme/ops.git')).toEqual(depot)
    expect(depotDuRemote('git@gitlab.com:acme/ops.git')).toBeNull()
  })

  it('fait d’un --github nu le dépôt courant, sans toucher à celui qui a une valeur', () => {
    expect(githubSansValeur(['--github'])).toEqual(['--github=.'])
    expect(githubSansValeur(['-g', '--theme', 'farm'])).toEqual(['--github=.', '--theme', 'farm'])
    expect(githubSansValeur(['--github', 'acme/ops', '-g'])).toEqual(['--github', 'acme/ops', '--github=.'])
  })

  it('trouve le dépôt de ce dossier', () => {
    expect(lireDepot('.')).toEqual({ proprietaire: 'leduss', nom: 'pixel-openspace' })
  })
})
