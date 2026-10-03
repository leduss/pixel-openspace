import { describe, expect, it } from 'vitest'
import { avancer, BUREAU, chat, CHEF_ID, invite, marcheur, plan, trajet, type Point, type Statut } from './engine'
import { TEXTS } from './i18n'

const FR = TEXTS.fr.phrases

const ids = ['a', 'b', 'c', 'd', 'e', 'f', 'g']

/** Un segment horizontal ou vertical ne traverse aucun plateau de bureau. */
function traverseUnBureau(chemin: Array<Point>, p = plan(ids, FR)) {
  return chemin.slice(1).some((b, i) => {
    const a = chemin[i]
    return p.bureaux.some(({ cx, dy }) => {
      const [x0, x1] = [cx - BUREAU.largeur / 2, cx + BUREAU.largeur / 2]
      const [y0, y1] = [dy, dy + BUREAU.hauteur]
      if (a.x === b.x) return a.x > x0 && a.x < x1 && Math.max(a.y, b.y) > y0 && Math.min(a.y, b.y) < y1
      if (a.y === b.y) return a.y > y0 && a.y < y1 && Math.max(a.x, b.x) > x0 && Math.min(a.x, b.x) < x1
      return false
    })
  })
}

describe('trajet', () => {
  const p = plan(ids, FR)

  it('va du bureau au café sans traverser de bureau, par des lignes droites', () => {
    const depart = p.bureaux[6].siege
    const chemin = [depart.pos, ...trajet(depart, p.pauses[0], p.couloirs)]
    expect(chemin.at(-1)).toEqual(p.pauses[0].pos)
    expect(chemin.slice(1).every((b, i) => b.x === chemin[i].x || b.y === chemin[i].y)).toBe(true)
    expect(traverseUnBureau(chemin)).toBe(false)
  })

  it('relie chaque bureau à chaque autre sans traverser de bureau', () => {
    for (const de of [p.chef, ...p.bureaux]) {
      for (const vers of p.bureaux) {
        const chemin = [de.siege.pos, ...trajet(de.siege, vers.visite, p.couloirs)]
        expect(traverseUnBureau(chemin)).toBe(false)
      }
    }
  })

  it('ne bouge pas pour aller où l’on est', () => {
    expect(trajet(p.pauses[1], p.pauses[1], p.couloirs)).toEqual([])
  })
})

describe('avancer', () => {
  const p = plan(['a', 'b'], FR)
  const toujours = () => 0

  it('ramène au bureau l’agent qui se met au travail', () => {
    const m = marcheur('a', p.bureaux[0].siege, 0)
    const statuts = new Map<string, Statut>([['a', 'a-jour']])
    avancer(p, [m], statuts, 16, toujours)
    expect(m.lieu).not.toBe(p.bureaux[0].siege)

    statuts.set('a', 'au-travail')
    for (let i = 0; i < 2_000; i++) avancer(p, [m], statuts, 50, toujours)
    expect(m.lieu).toBe(p.bureaux[0].siege)
    expect(m.pos).toEqual(p.bureaux[0].siege.pos)
  })

  it('envoie le chef en ronde à chaque bureau quand il travaille', () => {
    const m = marcheur(CHEF_ID, p.chef.siege, 0)
    const statuts = new Map<string, Statut>([
      [CHEF_ID, 'au-travail'],
      ['a', 'a-jour'],
      ['b', 'a-jour'],
    ])
    const visites = new Set<string>()
    for (let i = 0; i < 4_000; i++) {
      avancer(p, [m], statuts, 50, toujours)
      visites.add(m.lieu.nom)
    }
    expect(visites).toContain('visite:a')
    expect(visites).toContain('visite:b')
  })

  it('laisse l’agent absent à sa place', () => {
    const m = marcheur('a', p.bureaux[0].siege, 0)
    avancer(p, [m], new Map([['a', 'absent']]), 5_000, toujours)
    expect(m.pos).toEqual(p.bureaux[0].siege.pos)
  })
})

describe('la ronde du chef', () => {
  it('commence par celui qui a un souci, et lui dit qu’il le relance', () => {
    const p = plan(['a', 'b'], FR)
    const m = marcheur(CHEF_ID, p.chef.siege, 0)
    const statuts = new Map<string, Statut>([
      [CHEF_ID, 'au-travail'],
      ['a', 'a-jour'],
      ['b', 'en-echec'],
    ])
    let premier: string | null = null
    for (let i = 0; i < 4_000 && !premier; i++) {
      avancer(p, [m], statuts, 50, () => 0)
      if (!m.chemin.length && m.lieu.nom.startsWith('visite:')) premier = m.lieu.nom
    }
    expect(premier).toBe('visite:b')
    expect(m.parole).toBe('Je te relance !')
  })
})

describe('le chef au chevet', () => {
  it('reste auprès de l’agent en échec, et regagne son bureau une fois l’agent relancé', () => {
    const p = plan(['a', 'b'], FR)
    const m = marcheur(CHEF_ID, p.chef.siege, 0)
    const statuts = new Map<string, Statut>([
      [CHEF_ID, 'a-jour'],
      ['a', 'a-jour'],
      ['b', 'en-echec'],
    ])
    for (let i = 0; i < 2_000; i++) avancer(p, [m], statuts, 50, () => 0)
    expect(m.lieu.nom).toBe('visite:b')
    expect(m.chemin).toEqual([])

    statuts.set('b', 'a-jour')
    for (let i = 0; i < 2_000; i++) avancer(p, [m], statuts, 50, () => 0)
    expect(m.lieu.nom).not.toBe('visite:b')
  })
})

describe('les invités', () => {
  const p = plan(ids, FR)
  const jouer = (m: ReturnType<typeof invite>) => {
    const vus = new Set<string>()
    const paroles = new Set<string>()
    for (let i = 0; i < 6_000 && !m.parti; i++) {
      avancer(p, [m], new Map(), 50, () => 0)
      vus.add(m.lieu.nom)
      if (m.parole) paroles.add(m.parole)
    }
    return { vus, paroles }
  }

  it('le visiteur entre, salue le chef dans son bureau, et ressort', () => {
    const m = invite(p, 'visiteur', 1)
    const { vus, paroles } = jouer(m)
    expect(vus).toContain('visite:chef')
    expect(paroles).toContain(FR.visitor)
    expect(m.parti).toBe(true)
    expect(m.pos).toEqual(p.entree.pos)
  })

  it('le livreur pose son colis aux cartons, les mains vides au retour', () => {
    const m = invite(p, 'livreur', 1)
    expect(m.porte).toBe(true)
    const { vus } = jouer(m)
    expect(vus).toContain('cartons')
    expect(m.porte).toBe(false)
    expect(m.parti).toBe(true)
  })

  it('ne traverse aucun bureau pour venir', () => {
    expect(traverseUnBureau([p.entree.pos, ...trajet(p.entree, p.chef.visite, p.couloirs)], p)).toBe(false)
    expect(traverseUnBureau([p.entree.pos, ...trajet(p.entree, p.cartons, p.couloirs)], p)).toBe(false)
  })
})

describe('le rapport du chef', () => {
  it('passe devant le grand écran après sa ronde, et dit qui il a relancé', () => {
    const p = plan(['a', 'b'], FR)
    const m = marcheur(CHEF_ID, p.chef.siege, 0)
    const statuts = new Map<string, Statut>([
      [CHEF_ID, 'au-travail'],
      ['a', 'a-jour'],
      ['b', 'en-retard'],
    ])
    let rapport: string | null = null
    for (let i = 0; i < 6_000 && !rapport; i++) {
      avancer(p, [m], statuts, 50, () => 0)
      if (m.lieu.nom === 'ecran-mural' && m.parole) rapport = m.parole
    }
    expect(rapport).toBe('Rapport : 1 à jour, 1 relancé.')
  })
})

describe('le chat', () => {
  it('fait la sieste sur le bureau d’un agent parti au café', () => {
    const p = plan(['a', 'b'], FR)
    // a reste assis, b est au café : seul le bureau de b est libre.
    const a = marcheur('a', p.bureaux[0].siege, 1e9)
    const b = marcheur('b', p.bureaux[1].siege, 1e9)
    b.lieu = p.pauses[0]
    b.pos = { ...p.pauses[0].pos }
    const m = chat(p)
    m.attente = 0
    const statuts = new Map<string, Statut>([
      ['a', 'a-jour'],
      ['b', 'a-jour'],
    ])
    for (let i = 0; i < 3_000 && (m.chemin.length || !m.lieu.nom.startsWith('bureau-chat:')); i++) {
      avancer(p, [m, a, b], statuts, 50, () => 0)
    }
    expect(m.lieu.nom).toBe('bureau-chat:b')
    expect(m.parole).toBe('z')
  })
})

describe('les annonces du chef', () => {
  it('les dit devant le grand écran après son rapport', () => {
    const p = plan(['a'], FR)
    const m = marcheur(CHEF_ID, p.chef.siege, 0)
    const statuts = new Map<string, Statut>([
      [CHEF_ID, 'au-travail'],
      ['a', 'a-jour'],
    ])
    const dites = new Set<string>()
    for (let i = 0; i < 6_000; i++) {
      avancer(p, [m], statuts, 50, () => 0, ['Sauvegarde ce soir !'])
      if (m.lieu.nom === 'ecran-mural' && m.parole) dites.add(m.parole)
    }
    expect(dites).toContain('Rapport : tout le monde est à jour.')
    expect(dites).toContain('Sauvegarde ce soir !')
  })
})

describe('la nuit', () => {
  it('ramène chacun à son bureau et l’y laisse', () => {
    const p = plan(['a'], FR)
    const m = marcheur('a', p.bureaux[0].siege, 0)
    const statuts = new Map<string, Statut>([['a', 'a-jour']])
    avancer(p, [m], statuts, 16, () => 0)
    expect(m.lieu).not.toBe(p.bureaux[0].siege)
    for (let i = 0; i < 2_000; i++) avancer(p, [m], statuts, 50, () => 0, [], true)
    expect(m.lieu).toBe(p.bureaux[0].siege)
    expect(m.chemin).toEqual([])
  })
})
