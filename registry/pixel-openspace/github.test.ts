import { afterEach, describe, expect, it, vi } from 'vitest'
import { agentDuWorkflow, depotDuRemote, githubAgents, type Run, type Workflow } from './github'

const workflow: Workflow = {
  id: 7,
  name: 'Deploy',
  path: '.github/workflows/deploy.yml',
  state: 'active',
  updated_at: '2026-10-01T00:00:00Z',
}
const run = (debut: string, status = 'completed', conclusion: string | null = 'success', branche = 'main'): Run => ({
  workflow_id: 7,
  status,
  conclusion,
  display_title: 'Ship it',
  event: 'push',
  head_branch: branche,
  created_at: debut,
  run_started_at: debut,
})
const depot = { proprietaire: 'acme', nom: 'app' }

describe('depotDuRemote', () => {
  it('lit owner/repo et les adresses GitHub', () => {
    expect(depotDuRemote('acme/app')).toEqual(depot)
    expect(depotDuRemote('git@github.com:acme/app.git')).toEqual(depot)
    expect(depotDuRemote('https://github.com/acme/app')).toEqual(depot)
    expect(depotDuRemote('git@gitlab.com:acme/app.git')).toBeNull()
  })
})

describe('agentDuWorkflow', () => {
  const maintenant = new Date('2026-10-17T23:00:00')
  it('travaille, plante, se repose, ou reste éteint', () => {
    expect(agentDuWorkflow(depot, workflow, [run('2026-10-17T22:00:00Z', 'in_progress', null)], 'en', maintenant).status).toBe('working')
    expect(agentDuWorkflow(depot, workflow, [run('2026-10-17T22:00:00Z', 'completed', 'failure')], 'en', maintenant).status).toBe('failed')
    expect(agentDuWorkflow(depot, workflow, [run('2026-10-17T22:00:00Z')], 'en', maintenant).status).toBe('ok')
    expect(agentDuWorkflow(depot, workflow, [], 'en', maintenant).status).toBe('never')
    expect(agentDuWorkflow(depot, { ...workflow, state: 'disabled_manually' }, [], 'en', maintenant).status).toBe('off')
  })

  it('se présente, et met ses passages du jour sur la frise', () => {
    const agent = agentDuWorkflow(
      depot,
      workflow,
      [
        run(new Date('2026-10-17T22:00:00').toISOString(), 'completed', 'failure'),
        run(new Date('2026-10-17T09:00:00').toISOString()),
        run(new Date('2026-10-16T09:00:00').toISOString()),
      ],
      'fr',
      maintenant,
    )
    expect(agent).toMatchObject({
      id: 'github:acme/app/.github/workflows/deploy.yml',
      emoji: '🚀',
      schedule: 'sur push',
      lastMessage: 'Ship it · failure',
    })
    expect(agent.runs?.map((r) => r.ok)).toEqual([true, false])
  })
})

describe('githubAgents', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.unstubAllEnvs()
  })

  const repondre = (corps: unknown) => new Response(JSON.stringify(corps), { status: 200, headers: { 'content-type': 'application/json' } })

  it('trouve le dépôt dans l’environnement et fait un agent par workflow, la branche par défaut d’abord', async () => {
    vi.stubEnv('GITHUB_REPOSITORY', 'acme/app')
    vi.stubEnv('GITHUB_TOKEN', '')
    vi.stubEnv('GH_TOKEN', '')
    const appels: Array<string> = []
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string) => {
        appels.push(url)
        if (url.endsWith('/repos/acme/app')) return repondre({ default_branch: 'main' })
        if (url.includes('/workflows?')) return repondre({ workflows: [workflow] })
        return repondre({
          workflow_runs: [run('2026-10-17T10:00:00Z', 'completed', 'failure', 'feature/x'), run('2026-10-17T09:00:00Z')],
        })
      }),
    )
    const agents = await githubAgents({ cacheSeconds: 0 })
    expect(appels[0]).toBe('https://api.github.com/repos/acme/app')
    expect(agents).toHaveLength(1)
    // La pull request cassée sur feature/x ne met pas le bureau en échec.
    expect(agents[0].status).toBe('ok')
  })

  it('dit quoi faire quand il ne trouve pas le dépôt', async () => {
    await expect(githubAgents({ repo: 'pas-un-depot' })).rejects.toThrow(/owner\/repo/)
  })
})
