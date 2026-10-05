import { mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { horaireCron } from './horaire'
import { derniereLigne, emojiPour, etatAuRepos, lignesCrontab, lireVeilles, nomCommande, nomLisible, retenue } from './sources'

describe('crontab', () => {
  it('garde les tâches, pas les commentaires ni les variables', () => {
    const texte = [
      '# sauvegardes',
      'MAILTO=moi@example.com',
      '30 2 * * * /home/moi/bin/backup.sh >> /tmp/backup.log 2>&1',
      '@daily bun run scripts/rapport.ts',
      '',
    ].join('\n')
    expect(lignesCrontab(texte)).toEqual([
      { expression: '30 2 * * *', commande: '/home/moi/bin/backup.sh >> /tmp/backup.log 2>&1' },
      { expression: '@daily', commande: 'bun run scripts/rapport.ts' },
    ])
  })

  it('nomme une commande par son script', () => {
    expect(nomCommande('/home/moi/bin/backup.sh >> /tmp/backup.log 2>&1')).toBe('/home/moi/bin/backup.sh')
    expect(nomCommande('cd /srv && python3 -u sync_orders.py')).toBe('sync_orders.py')
    expect(nomCommande('python3 -u sync_orders.py')).toBe('sync_orders.py')
  })
})

describe('noms et emojis', () => {
  it('rend un label lisible', () => {
    expect(nomLisible('fr.montematour.audit-dependances')).toBe('Audit dependances')
    expect(nomLisible('/home/moi/bin/backup.sh')).toBe('Backup')
  })

  it('devine un emoji', () => {
    expect(emojiPour('nightly-backup')).toBe('💾')
    expect(emojiPour('suivre-colis')).toBe('📦')
    expect(emojiPour('quelque-chose')).toBe('🤖')
  })

  it('filtre par morceaux de nom', () => {
    expect(retenue('fr.montematour.chef', { match: ['montematour'], exclude: [] })).toBe(true)
    expect(retenue('com.google.keystone', { match: ['montematour'], exclude: [] })).toBe(false)
    expect(retenue('com.google.keystone', { match: [], exclude: ['google'] })).toBe(false)
  })
})

describe('journal', () => {
  it('lit la dernière ligne, sans couleurs ni horodatage', () => {
    const dossier = mkdtempSync(join(tmpdir(), 'pixel-openspace-'))
    const chemin = join(dossier, 'tache.log')
    writeFileSync(chemin, 'début\n2026-10-03T16:06:31.661Z · \u001b[32mrien de nouveau\u001b[0m\n\n')
    expect(derniereLigne(chemin)).toBe('rien de nouveau')
    expect(derniereLigne(join(dossier, 'absent.log'))).toBeNull()
  })
})

describe('état au repos', () => {
  const maintenant = new Date(2026, 9, 3, 15, 40)
  const quotidien = horaireCron('30 7 * * *')

  it('à jour quand le dernier passage prévu a eu lieu', () => {
    expect(etatAuRepos({ horaire: quotidien, dernier: new Date(2026, 9, 3, 7, 31), echec: false, maintenant })).toBe('ok')
  })

  it('en retard quand il a été manqué', () => {
    expect(etatAuRepos({ horaire: quotidien, dernier: new Date(2026, 9, 2, 7, 31), echec: false, maintenant })).toBe('late')
  })

  it('endormie quand le passage manqué tombait pendant une veille de la machine', () => {
    const dernier = new Date(2026, 9, 2, 7, 31)
    const veille = { debut: new Date(2026, 9, 3, 0, 30).getTime(), fin: new Date(2026, 9, 3, 8, 15).getTime() }
    expect(etatAuRepos({ horaire: quotidien, dernier, echec: false, maintenant, veilles: [veille] })).toBe('asleep')
    // Manqué machine allumée : en retard, même si elle a dormi à un autre moment.
    const autre = { debut: new Date(2026, 9, 3, 9, 0).getTime(), fin: new Date(2026, 9, 3, 10, 0).getTime() }
    expect(etatAuRepos({ horaire: quotidien, dernier, echec: false, maintenant, veilles: [autre] })).toBe('late')
  })

  it('en échec, jamais lancée, ou à la demande', () => {
    expect(etatAuRepos({ horaire: quotidien, dernier: null, echec: true, maintenant })).toBe('failed')
    expect(etatAuRepos({ horaire: quotidien, dernier: null, echec: false, maintenant })).toBe('never')
    expect(etatAuRepos({ horaire: { type: 'aucun' }, dernier: null, echec: false, maintenant })).toBe('on-demand')
  })
})

describe('le journal de veille du Mac', () => {
  const journal = [
    '2026-10-04 00:44:12 +0200 Sleep               \tEntering Sleep state due to \'Clamshell Sleep\'',
    '2026-10-04 02:10:00 +0200 DarkWake            \tDarkWake from Deep Idle',
    '2026-10-04 02:10:03 +0200 Sleep               \tEntering Sleep state due to \'Sleep Service Back to Sleep\'',
    '2026-10-04 08:13:37 +0200 Wake                \tWake from Deep Idle : due to lid',
    '2026-10-04 08:13:38 +0200 WakeDetails         \tDriverReason:lid',
    '2026-10-05 16:31:25 +0200 Sleep               \tEntering Sleep state',
  ].join('\n')

  it('une veille va d’un Sleep au Wake suivant, les DarkWake ne la coupent pas', () => {
    const [nuit, encore] = lireVeilles(journal, new Date('2026-10-05T17:00:00+02:00'))
    expect(new Date(nuit.debut).toISOString()).toBe('2026-10-03T22:44:12.000Z')
    expect(new Date(nuit.fin).toISOString()).toBe('2026-10-04T06:13:37.000Z')
    // Pas de réveil derrière : elle court jusqu'à maintenant.
    expect(new Date(encore.fin).toISOString()).toBe('2026-10-05T15:00:00.000Z')
  })
})
