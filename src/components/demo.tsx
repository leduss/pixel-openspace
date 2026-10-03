'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { PixelOpenspace } from '@/registry/pixel-openspace/pixel-openspace'
import type { Agent, AgentStatus, Language } from '@/registry/pixel-openspace/types'

const dans = (minutes: number) => new Date(Date.now() + minutes * 60_000).toISOString()
const ilYa = (minutes: number) => new Date(Date.now() - minutes * 60_000).toISOString()

/* Une équipe de démonstration : des tâches planifiées comme on en a tous. */
const EQUIPE: Array<Agent> = [
  {
    id: 'backup',
    name: 'Backup',
    emoji: '💾',
    role: 'Encrypts the database and ships it offsite',
    status: 'ok',
    schedule: 'daily at 2:30',
    lastRun: ilYa(400),
    nextRun: dans(600),
    lastMessage: '3.2 GB encrypted, uploaded in 41 s',
  },
  {
    id: 'invoices',
    name: 'Invoices',
    emoji: '🧾',
    role: 'Sends the monthly invoices',
    status: 'ok',
    schedule: 'every hour',
    lastRun: ilYa(20),
    nextRun: dans(8),
    lastMessage: '2 invoices sent',
  },
  {
    id: 'scraper',
    name: 'Prices',
    emoji: '💶',
    role: 'Reads competitors’ prices',
    status: 'working',
    schedule: 'every 30 min',
    lastRun: ilYa(1),
    nextRun: dans(29),
    lastMessage: '128 prices read, 3 changed',
  },
  {
    id: 'emails',
    name: 'Inbox',
    emoji: '📨',
    role: 'Triages the support inbox with an LLM',
    status: 'ok',
    schedule: 'every 5 min',
    lastRun: ilYa(3),
    nextRun: dans(2),
    lastMessage: '4 emails sorted, 1 urgent',
  },
  {
    id: 'deploy',
    name: 'Deploy',
    emoji: '🚀',
    role: 'Deploys main to production',
    status: 'failed',
    schedule: 'on push',
    lastRun: ilYa(12),
    lastMessage: 'build failed: type error in checkout.ts',
  },
  {
    id: 'reports',
    name: 'Reports',
    emoji: '📊',
    role: 'Builds the weekly KPI report',
    status: 'late',
    schedule: 'Mondays at 9:00',
    lastRun: ilYa(60 * 24 * 8),
    nextRun: dans(60 * 24 * 2),
    lastMessage: 'report sent to the team',
  },
  {
    id: 'social',
    name: 'Social',
    emoji: '🎵',
    role: 'Reads views and followers',
    status: 'ok',
    schedule: 'daily at 9:30',
    lastRun: ilYa(90),
    nextRun: dans(60 * 22),
  },
  {
    id: 'audit',
    name: 'Audit',
    emoji: '🛡️',
    role: 'Looks for vulnerable packages',
    status: 'ok',
    schedule: 'weekly',
    lastRun: ilYa(60 * 24 * 5),
    nextRun: dans(60 * 24 * 2),
    staleAfterHours: 24 * 9,
    lastMessage: '0 vulnerabilities',
  },
  { id: 'photos', name: 'Photos', emoji: '📸', role: 'Resizes uploaded photos', status: 'on-demand', lastRun: ilYa(300) },
  { id: 'legacy', name: 'Legacy', emoji: '🗄️', role: 'The old cron nobody dares to delete', status: 'off', lastRun: ilYa(60 * 24 * 40) },
]

const MESSAGES = ['done in 3.4 s', '12 items processed', 'nothing new', '2 warnings, all good', 'synced 340 rows']

export function Demo() {
  const [agents, setAgents] = useState(EQUIPE)
  const [langue, setLangue] = useState<Language>('en')
  const [visiteurs, setVisiteurs] = useState(0)
  const [livraisons, setLivraisons] = useState(0)
  const [fete, setFete] = useState(false)

  const changer = (id: string, status: AgentStatus, lastMessage?: string) =>
    setAgents((liste) =>
      liste.map((a) => (a.id === id ? { ...a, status, ...(lastMessage ? { lastMessage, lastRun: new Date().toISOString() } : {}) } : a)),
    )

  /* La démo vit toute seule : toutes les 12 secondes, un agent se met au travail, puis finit. */
  useEffect(() => {
    const t = setInterval(() => {
      const libres = EQUIPE.filter((a) => a.status === 'ok')
      const a = libres[Math.floor(Math.random() * libres.length)]
      changer(a.id, 'working')
      setTimeout(() => changer(a.id, 'ok', MESSAGES[Math.floor(Math.random() * MESSAGES.length)]), 6_000)
    }, 12_000)
    return () => clearInterval(t)
  }, [])

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-2">
        <Button size="sm" onClick={() => changer('invoices', 'working')}>
          ▶ Start “Invoices”
        </Button>
        <Button size="sm" variant="secondary" onClick={() => changer('invoices', 'ok', '3 invoices sent')}>
          ✓ Finish it
        </Button>
        <Button size="sm" variant="destructive" onClick={() => changer('emails', 'failed', 'LLM quota exceeded')}>
          ✕ Make “Inbox” fail
        </Button>
        <Button size="sm" variant="secondary" onClick={() => changer('emails', 'ok', 'back to normal')}>
          ↺ Recover it
        </Button>
        <Button size="sm" variant="outline" onClick={() => setVisiteurs((n) => n + 1)}>
          🚪 A visitor
        </Button>
        <Button size="sm" variant="outline" onClick={() => setLivraisons((n) => n + 1)}>
          📦 A delivery
        </Button>
        <Button size="sm" variant={fete ? 'secondary' : 'outline'} onClick={() => setFete((f) => !f)}>
          🎉 Confetti
        </Button>
        <Button size="sm" variant="ghost" onClick={() => setLangue((l) => (l === 'en' ? 'fr' : 'en'))}>
          {langue === 'en' ? '🇫🇷 Français' : '🇬🇧 English'}
        </Button>
      </div>

      <PixelOpenspace
        agents={agents}
        language={langue}
        title="ACME OPS"
        visitors={visiteurs}
        deliveries={livraisons}
        celebrate={fete}
        wall={[
          { label: 'Jobs today', value: 128, tone: 'info' },
          { label: 'Failed', value: agents.filter((a) => a.status === 'failed').length, tone: 'alert' },
          { label: 'Late', value: agents.filter((a) => a.status === 'late').length, tone: 'warn' },
          { label: 'Budget', value: '62 %', progress: 0.62 },
        ]}
        announcements={['Release freeze on Friday!']}
        weather={{ temperature: 19, sky: 'clouds', day: true, place: 'Bordeaux' }}
        onRun={(agent) => {
          changer(agent.id, 'working')
          setTimeout(() => changer(agent.id, 'ok', 'run by hand, all good'), 5_000)
        }}
      />
    </div>
  )
}
