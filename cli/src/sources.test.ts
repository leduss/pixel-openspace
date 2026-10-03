import { mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { horaireCron } from './horaire'
import { derniereLigne, emojiPour, etatAuRepos, lignesCrontab, nomCommande, nomLisible, retenue } from './sources'

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

  it('en échec, jamais lancée, ou à la demande', () => {
    expect(etatAuRepos({ horaire: quotidien, dernier: null, echec: true, maintenant })).toBe('failed')
    expect(etatAuRepos({ horaire: quotidien, dernier: null, echec: false, maintenant })).toBe('never')
    expect(etatAuRepos({ horaire: { type: 'aucun' }, dernier: null, echec: false, maintenant })).toBe('on-demand')
  })
})
