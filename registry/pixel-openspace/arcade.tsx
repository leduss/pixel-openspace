'use client'

import { useEffect, useRef, useState } from 'react'
import type { Texts } from './i18n'

/** Les jeux des deux bornes du coin gaming. */
export type Jeu = 'snake' | 'casse-briques'

/** La toile, carrée, en pixels. */
const COTE = 320

type Partie = {
  /** Appelé à chaque point marqué, avec le total. */
  marquer: (points: number) => void
  /** Appelé quand la partie est perdue. */
  perdre: () => void
}

/** Ce qu'une borne sait de son jeu : son nom, ses couleurs, ses commandes, et comment le lancer. */
const BORNES: Record<
  Jeu,
  { cadre: string; fond: string; accent: string; lancer: (ctx: CanvasRenderingContext2D, p: Partie) => () => void }
> = {
  snake: {
    cadre: 'border-violet-700',
    fond: 'bg-violet-950',
    accent: 'text-pink-400',
    lancer: lancerSnake,
  },
  'casse-briques': {
    cadre: 'border-cyan-600',
    fond: 'bg-slate-950',
    accent: 'text-cyan-300',
    lancer: lancerCasseBriques,
  },
}

const cleRecord = (jeu: Jeu) => `pixel-openspace:record-${jeu}`

/** Le meilleur score de ce jeu dans ce navigateur. */
export function lireRecord(jeu: Jeu): number {
  try {
    return Number(localStorage.getItem(cleRecord(jeu)) ?? 0)
  } catch {
    return 0
  }
}

/** L'écran d'une borne au repos, ou après une partie perdue. */
function ecranTitre(ctx: CanvasRenderingContext2D, jeu: Jeu, perdu: boolean, textes: Texts) {
  ctx.fillStyle = '#0b0d10'
  ctx.fillRect(0, 0, COTE, COTE)
  ctx.textAlign = 'center'
  if (perdu) {
    ctx.fillStyle = '#ef4444'
    ctx.font = '22px monospace'
    ctx.fillText(textes.arcade.gameOver, COTE / 2, COTE / 2 - 16)
  } else {
    ctx.fillStyle = jeu === 'snake' ? '#f472b6' : '#67e8f9'
    ctx.font = '18px monospace'
    ctx.fillText(textes.arcade.title[jeu === 'snake' ? 'snake' : 'breakout'], COTE / 2, COTE / 2 - 16)
  }
  ctx.fillStyle = '#e5e7eb'
  ctx.font = '12px monospace'
  ctx.fillText(perdu ? textes.arcade.replay : textes.arcade.pressPlay, COTE / 2, COTE / 2 + 14)
}

/**
 * Une borne d'arcade du coin gaming. Elle s'allume sur son écran titre et
 * attend qu'on appuie sur JOUER (ou Entrée, ou Espace) ; Échap la ferme. Le
 * record de chaque jeu reste dans ce navigateur.
 */
export function JeuArcade({ jeu, textes, fermer }: { jeu: Jeu; textes: Texts; fermer: () => void }) {
  const titre = textes.arcade.title[jeu === 'snake' ? 'snake' : 'breakout']
  const aide = textes.arcade.help[jeu === 'snake' ? 'snake' : 'breakout']
  const borne = BORNES[jeu]
  const toile = useRef<HTMLCanvasElement>(null)
  const [score, setScore] = useState(0)
  const [record, setRecord] = useState(0)
  const [phase, setPhase] = useState<'titre' | 'jeu' | 'perdu'>('titre')
  const [partie, setPartie] = useState(0)

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- le record vit dans le navigateur, lu après l'ouverture
    setRecord(lireRecord(jeu))
  }, [jeu])

  /* Hors partie, l'écran titre ; en partie, le jeu tourne jusqu'à la défaite. */
  useEffect(() => {
    const ctx = toile.current?.getContext('2d')
    if (!ctx) return
    if (phase !== 'jeu') {
      ecranTitre(ctx, jeu, phase === 'perdu', textes)
      return
    }
    let total = 0
    return borne.lancer(ctx, {
      marquer: (points) => {
        total = points
        setScore(points)
      },
      perdre: () => {
        if (total > lireRecord(jeu)) {
          try {
            localStorage.setItem(cleRecord(jeu), String(total))
          } catch {
            /* Pas de stockage : le record ne survivra pas, tant pis. */
          }
          setRecord(total)
        }
        setPhase('perdu')
      },
    })
  }, [phase, partie, jeu, borne, textes])

  const jouer = () => {
    setScore(0)
    setPartie((p) => p + 1)
    setPhase('jeu')
  }

  useEffect(() => {
    const touche = (e: KeyboardEvent) => {
      if (e.key === 'Escape') fermer()
      if ((e.key === 'Enter' || e.key === ' ') && phase !== 'jeu') {
        e.preventDefault()
        jouer()
      }
    }
    window.addEventListener('keydown', touche)
    return () => window.removeEventListener('keydown', touche)
  })

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={fermer}>
      <div
        role="dialog"
        aria-label={titre}
        className={`rounded-2xl border-4 p-4 shadow-2xl ${borne.cadre} ${borne.fond}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-between gap-6 font-mono text-xs">
          <span className={`font-bold tracking-widest ${borne.accent}`}>{titre}</span>
          <button type="button" onClick={fermer} className="text-zinc-400 hover:text-white" aria-label={textes.close}>
            ✕
          </button>
        </div>
        <canvas ref={toile} width={COTE} height={COTE} className="block rounded border-2 border-black [image-rendering:pixelated]" />
        <div className="mt-3 flex items-center justify-between gap-4 font-mono text-xs text-zinc-300">
          <span>
            {textes.arcade.score} {String(score).padStart(3, '0')}
          </span>
          <button
            type="button"
            onClick={jouer}
            disabled={phase === 'jeu'}
            className="rounded border-b-4 border-red-900 bg-red-600 px-4 py-1 font-bold tracking-widest text-white transition-transform active:translate-y-0.5 active:border-b-2 disabled:opacity-40"
          >
            {textes.arcade.play}
          </button>
          <span>
            {textes.arcade.record} {String(record).padStart(3, '0')}
          </span>
        </div>
        <p className="mt-2 text-center font-mono text-[0.65rem] text-zinc-500">
          {aide} · {textes.arcade.keys}
        </p>
      </div>
    </div>
  )
}

/* ——— Le Snake des composants ——— */

const CASES = 20
const CASE = COTE / CASES

type Case = { x: number; y: number }

/* Ce que le serpent mange : des composants, chacun sa couleur. */
const COMPOSANTS = ['#22c55e', '#e3b95a', '#38bdf8', '#a855f7']

const DIRECTIONS: Record<string, Case> = {
  ArrowUp: { x: 0, y: -1 },
  ArrowDown: { x: 0, y: 1 },
  ArrowLeft: { x: -1, y: 0 },
  ArrowRight: { x: 1, y: 0 },
  z: { x: 0, y: -1 },
  s: { x: 0, y: 1 },
  q: { x: -1, y: 0 },
  d: { x: 1, y: 0 },
}

/** Un serpent en nappe de câbles RGB, qui avale des composants et grandit d'autant. */
function lancerSnake(ctx: CanvasRenderingContext2D, { marquer, perdre }: Partie) {
  let serpent: Array<Case> = [
    { x: 9, y: 10 },
    { x: 8, y: 10 },
    { x: 7, y: 10 },
  ]
  let direction: Case = { x: 1, y: 0 }
  let prochaine = direction
  let points = 0
  const poser = () => {
    let c: Case
    do c = { x: Math.floor(Math.random() * CASES), y: Math.floor(Math.random() * CASES) }
    while (serpent.some((s) => s.x === c.x && s.y === c.y))
    return { ...c, couleur: COMPOSANTS[Math.floor(Math.random() * COMPOSANTS.length)] }
  }
  let miam = poser()

  const dessiner = () => {
    ctx.fillStyle = '#0b0d10'
    ctx.fillRect(0, 0, COTE, COTE)
    ctx.fillStyle = '#111827'
    for (let i = 0; i < CASES; i++) for (let j = i % 2; j < CASES; j += 2) ctx.fillRect(i * CASE, j * CASE, CASE, CASE)
    // Le composant à avaler, avec ses pattes de puce.
    ctx.fillStyle = miam.couleur
    ctx.fillRect(miam.x * CASE + 3, miam.y * CASE + 3, CASE - 6, CASE - 6)
    ctx.fillStyle = '#9ca3af'
    for (let k = 0; k < 3; k++) {
      ctx.fillRect(miam.x * CASE + 4 + k * 3, miam.y * CASE + 1, 1, 2)
      ctx.fillRect(miam.x * CASE + 4 + k * 3, miam.y * CASE + CASE - 3, 1, 2)
    }
    serpent.forEach((s, i) => {
      ctx.fillStyle = i === 0 ? '#f8fafc' : `hsl(${(i * 24 + points * 10) % 360} 85% 60%)`
      ctx.fillRect(s.x * CASE + 1, s.y * CASE + 1, CASE - 2, CASE - 2)
    })
  }

  const avancer = () => {
    direction = prochaine
    const tete = { x: serpent[0].x + direction.x, y: serpent[0].y + direction.y }
    const mur = tete.x < 0 || tete.y < 0 || tete.x >= CASES || tete.y >= CASES
    if (mur || serpent.some((s) => s.x === tete.x && s.y === tete.y)) {
      clearInterval(t)
      perdre()
      return
    }
    serpent = [tete, ...serpent]
    if (tete.x === miam.x && tete.y === miam.y) {
      points += 1
      marquer(points)
      miam = poser()
    } else {
      serpent.pop()
    }
    dessiner()
  }

  const touche = (e: KeyboardEvent) => {
    const d = DIRECTIONS[e.key]
    if (!d) return
    e.preventDefault()
    // Pas de demi-tour sur soi-même.
    if (d.x !== -direction.x || d.y !== -direction.y) prochaine = d
  }
  window.addEventListener('keydown', touche)
  dessiner()
  const t = setInterval(avancer, 120)
  return () => {
    clearInterval(t)
    window.removeEventListener('keydown', touche)
  }
}

/* ——— Le Casse-puces ——— */

const COLONNES = 8
const RANGEES = 5
const BRIQUE = { largeur: 36, hauteur: 12, marge: 3, haut: 36 }
const RAQUETTE = { largeur: 56, hauteur: 6, y: COTE - 22 }
/* Une rangée par famille de puces : GPU, CPU, RAM, SSD, carte mère. */
const RANGS = ['#e3b95a', '#22c55e', '#38bdf8', '#a855f7', '#ef4444']

/**
 * Un casse-briques où les briques sont des puces : la raquette renvoie la
 * bille, chaque puce cassée rapporte dix points, et un tableau vidé en remet
 * un, plus rapide. Trois billes par partie.
 */
function lancerCasseBriques(ctx: CanvasRenderingContext2D, { marquer, perdre }: Partie) {
  const gauche = (COTE - COLONNES * (BRIQUE.largeur + BRIQUE.marge) + BRIQUE.marge) / 2
  const nouveauTableau = () =>
    Array.from({ length: RANGEES * COLONNES }, (_, i) => ({
      x: gauche + (i % COLONNES) * (BRIQUE.largeur + BRIQUE.marge),
      y: BRIQUE.haut + Math.floor(i / COLONNES) * (BRIQUE.hauteur + BRIQUE.marge),
      couleur: RANGS[Math.floor(i / COLONNES)],
      vivante: true,
    }))
  let briques = nouveauTableau()
  let raquette = (COTE - RAQUETTE.largeur) / 2
  let vitesse = 3.2
  let bille = { x: COTE / 2, y: RAQUETTE.y - 10, vx: 2, vy: -vitesse }
  let billes = 3
  let points = 0
  const appuyees = new Set<string>()

  const relancer = () => {
    bille = { x: raquette + RAQUETTE.largeur / 2, y: RAQUETTE.y - 10, vx: (Math.random() < 0.5 ? -1 : 1) * 2, vy: -vitesse }
  }

  const dessiner = () => {
    ctx.fillStyle = '#020617'
    ctx.fillRect(0, 0, COTE, COTE)
    for (const b of briques) {
      if (!b.vivante) continue
      ctx.fillStyle = b.couleur
      ctx.fillRect(b.x, b.y, BRIQUE.largeur, BRIQUE.hauteur)
      // Les pattes dorées de la puce.
      ctx.fillStyle = 'rgb(0 0 0 / 0.35)'
      ctx.fillRect(b.x + 4, b.y + 3, BRIQUE.largeur - 8, BRIQUE.hauteur - 6)
    }
    ctx.fillStyle = '#e5e7eb'
    ctx.fillRect(raquette, RAQUETTE.y, RAQUETTE.largeur, RAQUETTE.hauteur)
    ctx.fillStyle = '#22d3ee'
    ctx.fillRect(raquette, RAQUETTE.y + RAQUETTE.hauteur - 2, RAQUETTE.largeur, 2)
    ctx.fillStyle = '#f8fafc'
    ctx.fillRect(bille.x - 3, bille.y - 3, 6, 6)
    for (let i = 0; i < billes; i++) {
      ctx.fillStyle = '#f472b6'
      ctx.fillRect(8 + i * 10, 10, 6, 6)
    }
  }

  let image = 0
  const tour = () => {
    if (appuyees.has('ArrowLeft') || appuyees.has('q')) raquette -= 6
    if (appuyees.has('ArrowRight') || appuyees.has('d')) raquette += 6
    raquette = Math.max(0, Math.min(COTE - RAQUETTE.largeur, raquette))

    bille.x += bille.vx
    bille.y += bille.vy
    if (bille.x < 3 || bille.x > COTE - 3) bille.vx *= -1
    if (bille.y < 3) bille.vy = Math.abs(bille.vy)

    // La raquette renvoie la bille, d'autant plus en biais qu'elle frappe au bord.
    if (
      bille.vy > 0 &&
      bille.y >= RAQUETTE.y - 3 &&
      bille.y <= RAQUETTE.y + 4 &&
      bille.x >= raquette &&
      bille.x <= raquette + RAQUETTE.largeur
    ) {
      const decalage = (bille.x - (raquette + RAQUETTE.largeur / 2)) / (RAQUETTE.largeur / 2)
      bille.vx = decalage * 4
      bille.vy = -vitesse
    }

    for (const b of briques) {
      if (!b.vivante) continue
      if (bille.x > b.x && bille.x < b.x + BRIQUE.largeur && bille.y > b.y && bille.y < b.y + BRIQUE.hauteur) {
        b.vivante = false
        bille.vy *= -1
        points += 10
        marquer(points)
        break
      }
    }

    if (briques.every((b) => !b.vivante)) {
      vitesse += 0.6
      briques = nouveauTableau()
      relancer()
    }

    if (bille.y > COTE) {
      billes -= 1
      if (billes === 0) {
        dessiner()
        perdre()
        return
      }
      relancer()
    }

    dessiner()
    image = requestAnimationFrame(tour)
  }

  const bas = (e: KeyboardEvent) => {
    if (['ArrowLeft', 'ArrowRight', 'q', 'd'].includes(e.key)) {
      e.preventDefault()
      appuyees.add(e.key)
    }
  }
  const haut = (e: KeyboardEvent) => appuyees.delete(e.key)
  const souris = (e: MouseEvent) => {
    const r = ctx.canvas.getBoundingClientRect()
    raquette = ((e.clientX - r.left) / r.width) * COTE - RAQUETTE.largeur / 2
  }
  window.addEventListener('keydown', bas)
  window.addEventListener('keyup', haut)
  ctx.canvas.addEventListener('mousemove', souris)
  image = requestAnimationFrame(tour)
  return () => {
    cancelAnimationFrame(image)
    window.removeEventListener('keydown', bas)
    window.removeEventListener('keyup', haut)
    ctx.canvas.removeEventListener('mousemove', souris)
  }
}
