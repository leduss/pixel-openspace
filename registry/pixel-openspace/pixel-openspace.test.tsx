// @vitest-environment happy-dom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { PixelOpenspace } from './pixel-openspace'
import type { Agent } from './types'

afterEach(cleanup)

const MAINTENANT = new Date(2026, 5, 15, 11, 0).getTime()
const a = (minutes: number) => new Date(MAINTENANT - minutes * 60_000).toISOString()

const AGENTS: Array<Agent> = [
  {
    id: 'backup',
    name: 'Backup',
    status: 'ok',
    runs: [
      { at: a(120), ok: true },
      { at: a(60), ok: true },
    ],
  },
  { id: 'deploy', name: 'Deploy', status: 'failed', runs: [{ at: a(30), ok: false, message: 'build failed' }] },
  { id: 'inbox', name: 'Inbox', status: 'working' },
]

describe('PixelOpenspace', () => {
  it('dessine la salle et un bureau par agent, avec son état', () => {
    render(<PixelOpenspace agents={AGENTS} now={MAINTENANT} />)
    expect(screen.getByRole('img', { name: 'The agents’ open space' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Backup, up to date' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Deploy, failed' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Inbox, working' })).toBeTruthy()
  })

  it('parle français quand on le lui demande', () => {
    render(<PixelOpenspace agents={AGENTS} now={MAINTENANT} language="fr" />)
    expect(screen.getByRole('button', { name: 'Deploy, en échec' })).toBeTruthy()
  })

  it('ne plante pas sur une langue ou un statut inconnus', () => {
    const avertir = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const etrange = { id: 'x', name: 'Odd', status: 'sleeping' } as unknown as Agent
    // @ts-expect-error une langue que le composant ne connaît pas
    render(<PixelOpenspace agents={[etrange]} now={MAINTENANT} language="de" />)
    expect(screen.getByRole('button', { name: 'Odd, up to date' })).toBeTruthy()
    expect(avertir).toHaveBeenCalledWith(expect.stringContaining('unknown status "sleeping"'))
    avertir.mockRestore()
  })

  it('compte les passages du jour sur la frise, et ceux qui ont raté', () => {
    render(<PixelOpenspace agents={AGENTS} now={MAINTENANT} />)
    expect(screen.getByText('Today')).toBeTruthy()
    expect(screen.getByText('3 runs since midnight')).toBeTruthy()
    expect(screen.getByText(/1 failed/)).toBeTruthy()
  })

  it('cache la frise avec timeline={false}', () => {
    render(<PixelOpenspace agents={AGENTS} now={MAINTENANT} timeline={false} />)
    expect(screen.queryByText('Today')).toBeNull()
  })

  it('ouvre les réglages à la roue dentée, et le thème choisi s’applique', async () => {
    render(<PixelOpenspace agents={AGENTS} now={MAINTENANT} />)
    await act(async () => fireEvent.click(screen.getByRole('button', { name: 'Settings' })))
    expect(screen.getByRole('dialog')).toBeTruthy()
    // La fenêtre est modale : la salle derrière elle est masquée aux lecteurs d'écran, d'où `hidden`.
    await act(async () => fireEvent.click(screen.getByRole('button', { name: 'Français' })))
    expect(screen.getByRole('button', { name: 'Deploy, en échec', hidden: true })).toBeTruthy()
    await act(async () => fireEvent.click(screen.getByRole('button', { name: 'Réinitialiser' })))
    expect(screen.getByRole('button', { name: 'Deploy, failed', hidden: true })).toBeTruthy()
  })
})
