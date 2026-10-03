'use client'

/*
 * Ce qui meuble la salle autour des agents : la nuit, l'écran mural, le tableau blanc, les records, les colis, l'horloge, la fenêtre, le chat, les plantes, la poussière, les confettis et la lampe.
 */

import { LARGEUR, type Statut } from './engine'
import { ACCENT, Anim, LAMPE_PLAN, Pixels, etapes, useTextes, type Lumiere } from './primitives'
import type { WallTile, Weather } from './types'
import { type Pose } from './vue'

/**
 * La nuit tombe sur la salle, percée par les lumières : un voile bleu nuit,
 * avec un trou doux autour de chaque écran allumé. Les LED, les néons et les
 * écrans au travail jettent en plus une lueur de leur couleur.
 */
export function Nuit({
  niveau,
  lumieres,
  hauteur,
  voile = { couleur: '#0a1033', opacite: 0.62 },
}: {
  niveau: number
  lumieres: Array<Lumiere>
  hauteur: number
  voile?: { couleur: string; opacite: number }
}) {
  if (!niveau) return null
  // L'obscurité va jusqu'à 0,62 ; le thème choisit jusqu'où son voile descend.
  const opacite = (niveau / 0.62) * voile.opacite
  return (
    <g pointerEvents="none" shapeRendering="auto">
      <defs>
        <radialGradient id="trou">
          <stop offset="0" stopColor="black" />
          <stop offset="0.45" stopColor="black" stopOpacity="0.85" />
          <stop offset="1" stopColor="black" stopOpacity="0" />
        </radialGradient>
        {lumieres.map((l, i) =>
          l.couleur ? (
            <radialGradient key={i} id={`lueur-${i}`}>
              <stop offset="0" stopColor={l.couleur} stopOpacity="0.4" />
              <stop offset="1" stopColor={l.couleur} stopOpacity="0" />
            </radialGradient>
          ) : null,
        )}
        <mask id="nuit-masque">
          <rect width={LARGEUR} height={hauteur} fill="white" />
          {lumieres.map((l, i) => (
            <circle key={i} cx={l.x} cy={l.y} r={l.r} fill="url(#trou)" />
          ))}
        </mask>
      </defs>
      <rect width={LARGEUR} height={hauteur} fill={voile.couleur} opacity={opacite} mask="url(#nuit-masque)" />
      {lumieres.map((l, i) =>
        l.couleur ? (
          <ellipse key={i} cx={l.x} cy={l.y + 16} rx={l.r * 0.85} ry={l.r * 0.65} fill={`url(#lueur-${i})`} opacity={niveau / 0.62} />
        ) : null,
      )}
    </g>
  )
}

/* La couleur d'une tuile selon son ton. */
export const TONS: Record<NonNullable<WallTile['tone']>, string> = {
  neutral: '#e5e7eb',
  ok: '#4ade80',
  info: '#38bdf8',
  warn: '#fb923c',
  alert: '#ef4444',
}

/**
 * Le grand écran accroché au mur de la grande salle : jusqu'à quatre tuiles,
 * leur valeur, et une jauge pour celles qui en ont une.
 */
export function EcranMural({ tuiles }: { tuiles: Array<WallTile> }) {
  const affichees = tuiles.slice(0, 4)
  if (!affichees.length) return null
  const largeur = 196 / affichees.length
  return (
    <g pointerEvents="none">
      <rect x="30" y="206" width="200" height="34" fill="#0b0d10" />
      <rect x="32" y="208" width="196" height="30" fill="#0b1220" />
      {affichees.map((tuile, i) => {
        const x = 34 + i * largeur
        const l = largeur - 2.5
        const couleur = tuile.tone ? TONS[tuile.tone] : ACCENT
        return (
          <g key={`${i}-${tuile.label}`}>
            <rect x={x} y="210" width={l} height="26" fill="#111827" />
            <text x={x + l / 2} y="217" fontSize="5.5" textAnchor="middle" fill="#94a3b8">
              {tuile.label.toUpperCase()}
            </text>
            <text x={x + l / 2} y="230" fontSize="12" textAnchor="middle" fill={couleur}>
              {tuile.value}
            </text>
            {tuile.progress !== undefined ? (
              <>
                <rect x={x + 4} y="232" width={l - 8} height="2" fill="#1f2937" />
                <rect x={x + 4} y="232" width={Math.max(0, Math.min(1, tuile.progress)) * (l - 8)} height="2" fill={couleur} />
              </>
            ) : null}
          </g>
        )
      })}
    </g>
  )
}

/* ——— Le tableau blanc, les records, la porte, les colis, les fêtes ——— */

/** Le tableau blanc du bureau du chef : les prochains passages, au feutre. */
export function TableauBlanc({ prochains }: { prochains: Array<{ heure: string; nom: string }> }) {
  const t = useTextes()
  return (
    <g pointerEvents="none">
      <rect x="32" y="176" width="4" height="12" fill="#6b7280" />
      <rect x="124" y="176" width="4" height="12" fill="#6b7280" />
      <rect x="26" y="108" width="108" height="70" fill="#9ca3af" />
      <rect x="29" y="111" width="102" height="64" fill="#f8fafc" />
      <rect x="29" y="171" width="102" height="4" fill="#d1d5db" />
      <rect x="100" y="172" width="10" height="2" fill="#2563eb" />
      <rect x="112" y="172" width="10" height="2" fill="#dc2626" />
      <text x="34" y="120" fontSize="7" fill="#1d4ed8">
        {t.nextRuns}
      </text>
      {prochains.length ? (
        prochains.map((p, i) => (
          <text key={p.nom} x="34" y={130 + i * 8.5} fontSize="6.5" fill={i === 0 ? '#dc2626' : '#1f2937'}>
            {p.heure} · {p.nom}
          </text>
        ))
      ) : (
        <text x="34" y="132" fontSize="6.5" fill="#6b7280">
          {t.nothingPlanned}
        </text>
      )}
    </g>
  )
}

/** Le panneau des records, accroché au mur à côté du coin gaming. */
export function Records({ snake, casse }: { snake: number; casse: number }) {
  const t = useTextes()
  const pad = (n: number) => String(n).padStart(3, '0')
  return (
    <g pointerEvents="none">
      <rect x="286" y="207" width="70" height="33" fill="#0b0d10" />
      <rect x="288" y="209" width="66" height="29" fill="#1e1b4b" />
      <text x="321" y="217" fontSize="6.5" textAnchor="middle" fill="var(--po-accent)">
        {t.hiScores}
        <Anim attributeName="opacity" values="1;0.5;1" dur="1.5s" repeatCount="indefinite" />
      </text>
      <text x="292" y="226" fontSize="6" fill="#f472b6">
        SNAKE
      </text>
      <text x="350" y="226" fontSize="6" textAnchor="end" fill="#f472b6">
        {pad(snake)}
      </text>
      <text x="292" y="234" fontSize="6" fill="#67e8f9">
        CASSE
      </text>
      <text x="350" y="234" fontSize="6" textAnchor="end" fill="#67e8f9">
        {pad(casse)}
      </text>
    </g>
  )
}

/** Les colis déposés par le livreur depuis l'ouverture de la page. */
export function ColisDeposes({ nombre, bas }: { nombre: number; bas: number }) {
  return (
    <g pointerEvents="none">
      {Array.from({ length: nombre }, (_, i) => (
        <g key={i}>
          <rect x={128 + i * 6} y={bas - 22 - i * 12} width="22" height="14" fill="#b45309" />
          <rect x={128 + i * 6} y={bas - 22 - i * 12} width="22" height="3" fill="#d97706" />
          <rect x={137 + i * 6} y={bas - 22 - i * 12} width="4" height="14" fill="#fde68a" />
        </g>
      ))}
    </g>
  )
}

/**
 * L'horloge du bureau du chef, à la vraie heure. Les aiguilles des heures et
 * des minutes suivent la page, rafraîchie toutes les cinq secondes ; la
 * trotteuse tourne seule, calée sur la seconde d'ouverture de la page.
 */
export function Horloge({ maintenant, ouverture }: { maintenant: number; ouverture: number }) {
  const t = useTextes()
  const cx = 302
  const cy = 36
  const d = new Date(maintenant)
  const minutes = d.getMinutes() + d.getSeconds() / 60
  const heures = (d.getHours() % 12) + minutes / 60
  const aiguille = (angle: number, longueur: number, epaisseur: number, couleur: string) => (
    <rect
      x={cx - epaisseur / 2}
      y={cy - longueur}
      width={epaisseur}
      height={longueur}
      fill={couleur}
      transform={`rotate(${angle} ${cx} ${cy})`}
    />
  )
  return (
    <g pointerEvents="none">
      <title>{d.toLocaleTimeString(t.locale, { hour: '2-digit', minute: '2-digit' })}</title>
      <circle cx={cx} cy={cy} r="14" fill="#111827" shapeRendering="auto" />
      <circle cx={cx} cy={cy} r="12" fill="#f8fafc" shapeRendering="auto" />
      {Array.from({ length: 12 }, (_, i) => (
        <rect
          key={i}
          x={cx - 0.75}
          y={cy - 11}
          width="1.5"
          height={i % 3 ? 2 : 3}
          fill="#1f2937"
          transform={`rotate(${i * 30} ${cx} ${cy})`}
        />
      ))}
      {aiguille(heures * 30, 6, 2, '#111827')}
      {aiguille(minutes * 6, 9, 1.5, '#111827')}
      <rect
        x={cx - 0.5}
        y={cy - 10}
        width="1"
        height="12"
        fill="#dc2626"
        style={{
          transformOrigin: `${cx}px ${cy}px`,
          animation: 'trotteuse 60s steps(60) infinite',
          animationDelay: `-${new Date(ouverture).getSeconds()}s`,
        }}
      />
      <circle cx={cx} cy={cy} r="1.5" fill="#dc2626" shapeRendering="auto" />
    </g>
  )
}

/* ——— La météo, le chat, les plantes, les confettis ——— */

export const CIEL: Record<Weather['sky'], 'soleil' | 'nuages' | 'brouillard' | 'pluie' | 'neige' | 'orage'> = {
  clear: 'soleil',
  clouds: 'nuages',
  fog: 'brouillard',
  rain: 'pluie',
  snow: 'neige',
  storm: 'orage',
}

/** La fenêtre du bureau du chef, ouverte sur le ciel qu'on lui donne. */
export function Fenetre({ meteo: temps }: { meteo: Weather | null }) {
  const t = useTextes()
  const meteo = temps
    ? { temperature: Math.round(temps.temperature), ciel: CIEL[temps.sky], jour: temps.day, lieu: temps.place ?? '' }
    : null
  const x = 94
  const l = 56
  const ciel = !meteo
    ? '#1e293b'
    : !meteo.jour
      ? '#0f172a'
      : { soleil: '#7dd3fc', nuages: '#94a3b8', brouillard: '#cbd5e1', pluie: '#64748b', neige: '#cbd5e1', orage: '#334155' }[meteo.ciel]
  const nuage = meteo?.ciel === 'orage' ? '#475569' : '#f1f5f9'
  return (
    <g pointerEvents="none">
      <title>{meteo ? `${meteo.lieu ? `${meteo.lieu}: ` : ''}${meteo.temperature} °C` : t.noWeather}</title>
      <rect x={x - 3} y="19" width={l + 6} height="33" fill="#e5e7eb" />
      <svg x={x} y="22" width={l} height="27" overflow="hidden">
        <rect width={l} height="27" fill={ciel} />
        {meteo?.jour && meteo.ciel === 'soleil' ? (
          <g>
            <rect x="38" y="5" width="9" height="9" fill="#fde047" />
            <rect x="36" y="8" width="2" height="3" fill="#facc15" />
            <rect x="47" y="8" width="2" height="3" fill="#facc15" />
            <rect x="41" y="3" width="3" height="2" fill="#facc15" />
            <rect x="41" y="14" width="3" height="2" fill="#facc15" />
          </g>
        ) : null}
        {meteo && !meteo.jour ? (
          <g>
            <rect x="40" y="5" width="7" height="7" fill="#f1f5f9" />
            <rect x="43" y="4" width="6" height="6" fill={ciel} />
            {[
              [8, 6],
              [20, 3],
              [28, 9],
              [14, 12],
            ].map(([sx, sy]) => (
              <rect key={`${sx}-${sy}`} x={sx} y={sy} width="1" height="1" fill="#f8fafc">
                <Anim attributeName="opacity" values="1;0.2;1" dur={`${1.5 + (sx % 3)}s`} repeatCount="indefinite" />
              </rect>
            ))}
          </g>
        ) : null}
        {meteo && meteo.ciel !== 'soleil'
          ? [0, 1].map((i) => (
              <g key={i}>
                <rect x={i * 30} y={4 + i * 5} width="20" height="6" fill={nuage} />
                <rect x={i * 30 + 4} y={1 + i * 5} width="10" height="4" fill={nuage} />
                <Anim
                  attributeName="transform"
                  type="translate"
                  values={etapes(-20, l, 12)
                    .split(';')
                    .map((v) => `${v} 0`)
                    .join(';')}
                  dur={`${14 + i * 6}s`}
                  begin={`${-i * 7}s`}
                  repeatCount="indefinite"
                />
              </g>
            ))
          : null}
        {meteo?.ciel === 'pluie' || meteo?.ciel === 'orage'
          ? Array.from({ length: 9 }, (_, i) => (
              <rect key={i} x={3 + i * 6} y="0" width="1" height="4" fill="#bfdbfe">
                <Anim attributeName="y" values={etapes(8, 27, 5)} dur="0.6s" begin={`${(i % 4) * 0.15}s`} repeatCount="indefinite" />
              </rect>
            ))
          : null}
        {meteo?.ciel === 'neige'
          ? Array.from({ length: 8 }, (_, i) => (
              <rect key={i} x={4 + i * 7} y="0" width="2" height="2" fill="#f8fafc">
                <Anim
                  attributeName="y"
                  values={etapes(6, 27, 7)}
                  dur={`${2 + (i % 3) * 0.6}s`}
                  begin={`${(i % 4) * 0.4}s`}
                  repeatCount="indefinite"
                />
              </rect>
            ))
          : null}
        {meteo?.ciel === 'brouillard'
          ? [8, 15, 21].map((y) => <rect key={y} x="0" y={y} width={l} height="3" fill="#f8fafc" opacity="0.6" />)
          : null}
        {meteo?.ciel === 'orage' ? (
          <rect width={l} height="27" fill="#fef9c3" opacity="0">
            <Anim attributeName="opacity" values="0;0;0.8;0;0.5;0" keyTimes="0;0.8;0.82;0.85;0.87;1" dur="5s" repeatCount="indefinite" />
          </rect>
        ) : null}
        <rect x="0" y="20" width="22" height="7" fill="#0b0d10" opacity="0.65" />
        <text x="2" y="26" fontSize="6" fill="#f8fafc">
          {meteo ? `${meteo.temperature}°` : '—'}
        </text>
      </svg>
      <rect x={x + l / 2 - 1} y="22" width="2" height="27" fill="#e5e7eb" />
      <rect x={x} y="35" width={l} height="2" fill="#e5e7eb" />
      <text x={x + l / 2} y="58" fontSize="5" textAnchor="middle" fill="#9ca3af">
        {meteo?.lieu.toUpperCase()}
      </text>
    </g>
  )
}

/* Le chat roux tigré : debout de profil, deux temps de marche, et roulé en boule pour la sieste. */
export const CHAT_DEBOUT = [
  ['.......k.k', 'k......kkk', '.K.....kek', '.kKkKkKkk.', '..kkkkkkk.', '..k.k..k.k'],
  ['.......k.k', 'k......kkk', '.K.....kek', '.kKkKkKkk.', '..kkkkkkk.', '...k.k.k.k'],
]
export const CHAT_ROULE = ['..kkkk..', '.kKkKkk.', 'kkkkkKkk', 'Kkkkkkkk', '.kkkkkkK']
export const PELAGE = { k: '#f59e0b', K: '#b45309', e: '#111827' }

/** Le chat d'atelier : il marche de profil, ou dort roulé en boule là où il s'est posé. */
export function Chat({ pose }: { pose: Pose }) {
  const t = useTextes()
  if (!pose.marche) {
    return (
      <g pointerEvents="none">
        <title>{t.catNap}</title>
        <g transform={`translate(${Math.round(pose.x) - 12} ${Math.round(pose.y) - 15})`}>
          <Pixels grille={CHAT_ROULE} couleurs={PELAGE} />
        </g>
        {pose.parole ? (
          <text x={pose.x + 10} y={pose.y - 16} fontSize="7" fill="#e0f2fe">
            z
            <Anim attributeName="y" values={etapes(pose.y - 14, pose.y - 24, 4)} dur="2s" repeatCount="indefinite" />
            <Anim attributeName="opacity" values="1;0.75;0.5;0.25" dur="2s" repeatCount="indefinite" />
          </text>
        ) : null}
      </g>
    )
  }
  const versLaDroite = Math.sin((pose.angle * Math.PI) / 180) >= 0
  const grille = CHAT_DEBOUT[Math.floor(pose.pas / 140) % 2]
  return (
    <g pointerEvents="none">
      <ellipse cx={pose.x} cy={pose.y} rx="12" ry="2.5" fill="black" opacity="0.25" shapeRendering="auto" />
      <g transform={`translate(${Math.round(pose.x)} ${Math.round(pose.y) - 18}) scale(${versLaDroite ? 1 : -1} 1) translate(-15 0)`}>
        <Pixels grille={grille} couleurs={PELAGE} />
      </g>
    </g>
  )
}

/* La petite plante au pied de chaque bureau ; fanée quand l'agent ne passe plus. */
export const PLANTE_VIVE = ['.g..g.', 'gGggGg', '.gGGg.', '..gg..', '.pppp.', '.PPPP.', '..PP..']
export const PLANTE_FANEE = ['......', 'b....b', '.b..b.', '..bb..', '.pppp.', '.PPPP.', '..PP..']

export function PlanteDeBureau({ x, y, fanee }: { x: number; y: number; fanee: boolean }) {
  return (
    <g transform={`translate(${x} ${y})`} pointerEvents="none">
      <Pixels
        grille={fanee ? PLANTE_FANEE : PLANTE_VIVE}
        couleurs={{ g: '#4caf50', G: '#2e7d32', b: '#92400e', p: '#d07a3e', P: '#a35a2a' }}
        u={2}
      />
    </g>
  )
}

/** La poussière et la toile sur l'écran d'un agent oublié. */
export function Poussiere({ cx, dy }: { cx: number; dy: number }) {
  const g = cx - 4 - 27
  return (
    <g pointerEvents="none">
      {[
        [4, 2],
        [12, 8],
        [22, 4],
        [31, 12],
        [40, 6],
        [48, 14],
        [8, 15],
        [26, 17],
        [44, 2],
      ].map(([px, py]) => (
        <rect key={`${px}-${py}`} x={g + px} y={dy - 12 + py} width="3" height="2" fill="#d6d3d1" opacity="0.55" />
      ))}
      <path
        d={`M${g + 54} ${dy - 12}h-10M${g + 54} ${dy - 12}v10M${g + 54} ${dy - 12}l-8 8M${g + 49} ${dy - 12}q-1 4 5 5`}
        stroke="#e5e7eb"
        strokeWidth="0.8"
        fill="none"
        opacity="0.7"
        shapeRendering="auto"
      />
    </g>
  )
}

/** Des confettis qui tombent sur toute la salle : une machine fête son anniversaire. */
export function Confettis({ hauteur }: { hauteur: number }) {
  const couleurs = ['#f472b6', '#facc15', '#22d3ee', '#4ade80', '#a855f7', '#fb923c']
  return (
    <g pointerEvents="none">
      {Array.from({ length: 36 }, (_, i) => {
        const x = (i * 137) % LARGEUR
        const duree = 4 + (i % 5)
        return (
          <rect key={i} x={x} y="-10" width="4" height="6" fill={couleurs[i % couleurs.length]}>
            <Anim
              attributeName="y"
              values={etapes(-10, hauteur, 24)}
              dur={`${duree}s`}
              begin={`${-((i * 0.7) % duree)}s`}
              repeatCount="indefinite"
            />
            <Anim attributeName="x" values={`${x};${x + 12};${x - 8};${x}`} dur="3s" repeatCount="indefinite" />
          </rect>
        )
      })}
    </g>
  )
}

export function Lampe({ x, y, statut }: { x: number; y: number; statut: Statut }) {
  return (
    <rect x={x} y={y} width="5" height="5" fill={LAMPE_PLAN[statut]}>
      {statut === 'au-travail' || statut === 'en-echec' ? (
        <Anim attributeName="opacity" values="1;0.3;1" dur="1.2s" repeatCount="indefinite" />
      ) : null}
    </rect>
  )
}
