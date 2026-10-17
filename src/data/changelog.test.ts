import { describe, expect, it } from 'vitest'
import { journal, lireJournal } from './changelog'

describe('lireJournal', () => {
  it('découpe les versions, leurs rubriques et leurs puces, et saute « Mettre à jour »', () => {
    const versions = lireJournal(
      [
        '# Journal',
        '',
        '## Mettre à jour',
        '',
        'Copie-le.',
        '',
        '## 0.2.0 · 2026-10-04',
        '',
        '### Ajouté',
        '',
        '- Un `thème`.',
        '  suite',
        '',
        '## 0.1.0 · 2026-10-03',
        '',
        'La première.',
        '',
        '### Le reste',
        '',
        '- Tout.',
      ].join('\n'),
    )
    expect(versions).toEqual([
      { numero: '0.2.0', date: '2026-10-04', intro: [], rubriques: [{ titre: 'Ajouté', lignes: ['Un `thème`. suite'] }] },
      { numero: '0.1.0', date: '2026-10-03', intro: ['La première.'], rubriques: [{ titre: 'Le reste', lignes: ['Tout.'] }] },
    ])
  })

  it('lit les vrais journaux, dans les deux langues, à la même version', () => {
    const [en] = journal('en')
    const [fr] = journal('fr')
    expect(en.numero).toBe(fr.numero)
    expect(en.rubriques.length).toBeGreaterThan(0)
  })
})
