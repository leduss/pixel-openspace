'use client'

/*
 * Le thème geek : un open space moderne de passionnés de matériel. Bureaux
 * blancs à bande LED, tours vitrées aux ventilateurs RGB, claviers
 * mécaniques, fauteuils gamer ; le chef derrière sa baie serveur, un coin
 * gaming avec deux bornes d'arcade et un établi de montage, une cuisine au
 * frigo plein de canettes. Les bonshommes sont en sweat à capuche.
 */

import { BUREAU, COINS_GEEK, estInvite, CHEF_ID, type Statut } from '../engine'
import { ACCENT, Anim, Cliquable, LAMPE_PLAN, MUR_SALLE, Neon, Plante, allerRetour, etapes, useTextes, type Lumiere } from '../primitives'
import type { PropsBureau, Theme } from '../theme'
import type { Jeu } from '../arcade'
import type { SceneObject } from '../types'

/** Le café qui coule dans la tasse quand quelqu'un attend devant la machine. */
export function CafeQuiCoule() {
  return (
    <g pointerEvents="none">
      <rect x="767" y="47" width="2" height="5" fill="#6b3a1e">
        <Anim attributeName="opacity" values="1;0.4;1" dur="0.5s" repeatCount="indefinite" />
      </rect>
      <rect x="764" y="52" width="8" height="3" fill="#6b3a1e">
        <Anim attributeName="height" values="1;5;5" dur="3s" repeatCount="indefinite" />
        <Anim attributeName="y" values="56;52;52" dur="3s" repeatCount="indefinite" />
      </rect>
    </g>
  )
}

/* ——— Les animations par sauts ——— */

export const MUR = { arete: '#0f1115', face: '#262a31', plinthe: '#1a1d22' }

/** Un mur vu de biais : son arête sombre, sa face, et la bande LED qui court à son pied. */
export function MurHaut({ x, largeur, led }: { x: number; largeur: number; led: string }) {
  return (
    <>
      <rect x={x} y="14" width={largeur} height="6" fill={MUR.arete} />
      <rect x={x} y="20" width={largeur} height="32" fill={MUR.face} />
      <rect x={x} y="52" width={largeur} height="4" fill={MUR.plinthe} />
      <rect x={x} y="51" width={largeur} height="2" fill={led} opacity="0.9" />
    </>
  )
}

export function Decor({
  hauteur,
  titre,
  liens,
  aller,
  jouer,
}: {
  hauteur: number
  titre: string
  liens: Partial<Record<SceneObject, string>>
  aller: (objet: SceneObject) => void
  jouer: (jeu: Jeu) => void
}) {
  const t = useTextes()
  const bas = hauteur - 20
  const lien = (objet: SceneObject) => ({ titre: t.objects[objet], faire: () => aller(objet), actif: Boolean(liens[objet]) })
  return (
    <>
      <defs>
        <pattern id="beton" width="96" height="96" patternUnits="userSpaceOnUse">
          <rect width="96" height="96" fill="#565a62" />
          <rect width="96" height="1" fill="#4c5058" />
          <rect width="1" height="96" fill="#4c5058" />
          <rect x="14" y="22" width="2" height="2" fill="#5f636b" />
          <rect x="60" y="40" width="3" height="2" fill="#4f535b" />
          <rect x="38" y="74" width="2" height="2" fill="#60646c" />
          <rect x="80" y="12" width="2" height="3" fill="#51555d" />
        </pattern>
        <pattern id="moquette-chef" width="16" height="16" patternUnits="userSpaceOnUse">
          <rect width="16" height="16" fill="#3a3f4b" />
          <rect width="8" height="8" fill="#3f4451" />
          <rect x="8" y="8" width="8" height="8" fill="#3f4451" />
        </pattern>
        <pattern id="moquette-jeu" width="12" height="12" patternUnits="userSpaceOnUse">
          <rect width="12" height="12" fill="#231f36" />
          <rect x="2" y="2" width="2" height="2" fill="#2c2645" />
          <rect x="8" y="8" width="2" height="2" fill="#1d1a2e" />
        </pattern>
        <pattern id="carreaux" width="32" height="32" patternUnits="userSpaceOnUse">
          <rect width="32" height="32" fill="#d5d9df" />
          <rect width="32" height="1" fill="#c2c7ce" />
          <rect width="1" height="32" fill="#c2c7ce" />
        </pattern>
        <linearGradient id="led-jeu" x1="0" x2="1">
          <stop offset="0" stopColor="#22d3ee" />
          <stop offset="0.5" stopColor="#a855f7" />
          <stop offset="1" stopColor="#ec4899" />
        </linearGradient>
      </defs>

      {/* Les sols. */}
      <rect x="20" y="56" width="310" height="142" fill="url(#moquette-chef)" />
      <rect x="338" y="56" width="344" height="142" fill="url(#moquette-jeu)" />
      <rect x="690" y="56" width="290" height="142" fill="url(#carreaux)" />
      <rect x="20" y="198" width="960" height={bas - 198} fill="url(#beton)" />

      {/* Les murs du fond, chacun avec sa bande LED. */}
      <MurHaut x={20} largeur={310} led="var(--po-accent)" />
      <MurHaut x={338} largeur={344} led="url(#led-jeu)" />
      <MurHaut x={690} largeur={290} led="#e0f2fe" />

      {/* Le bureau du chef : baie serveur, enseigne néon, plantes. */}
      <Cliquable {...lien('server-rack')}>
        <BaieServeur x={34} />
      </Cliquable>
      <Neon x={222} y={40} texte={t.leadOffice} couleur="var(--po-accent)" taille={11} />
      <Plante x={300} y={62} />

      {/* Le coin gaming : la borne d'arcade, la grande télé et sa console, les poufs, l'établi de montage. */}
      <Cliquable titre={t.objects.snake} faire={() => jouer('snake')}>
        <Arcade x={352} />
      </Cliquable>
      <Cliquable titre={t.objects.breakout} faire={() => jouer('casse-briques')}>
        <BorneCasseBriques x={396} />
      </Cliquable>
      <Cliquable {...lien('tv')}>
        <Tele x={442} />
      </Cliquable>
      <rect x="456" y="128" width="108" height="46" fill="#3b2f63" />
      <rect x="456" y="128" width="108" height="2" fill="#a855f7" />
      <rect x="456" y="172" width="108" height="2" fill="#a855f7" />
      <Pouf x={482} y={146} couleur="#ef4444" />
      <Pouf x={538} y={146} couleur="#22d3ee" />
      <Cliquable {...lien('workbench')}>
        <Etabli x={594} />
      </Cliquable>
      <Plante x={346} y={160} />

      {/* La cuisine : machine espresso, distributeur, frigo vitré plein de canettes, mange-debout. */}
      <rect x="700" y="24" width="20" height="20" fill="#111827" />
      <Neon x={710} y={38} texte="☕" couleur="#f472b6" taille={12} />
      <rect x="730" y="44" width="122" height="24" fill="#f3f4f6" />
      <rect x="730" y="68" width="122" height="18" fill="#1f2937" />
      {[734, 774, 814].map((x) => (
        <rect key={x} x={x} y="72" width="34" height="10" fill="#273244" />
      ))}
      <rect x="748" y="22" width="40" height="38" fill="#9ca3af" />
      <rect x="750" y="24" width="36" height="12" fill="#d1d5db" />
      <rect x="752" y="38" width="32" height="6" fill="#111827" />
      <rect x="778" y="27" width="5" height="5" fill="var(--po-accent)" />
      <rect x="762" y="44" width="12" height="4" fill="#4b5563" />
      <rect x="763" y="50" width="10" height="8" fill="#fafaf9" />
      <path d="M765 47v-6M771 47v-6" stroke="#e7e5e4" strokeWidth="2" fill="none">
        <Anim attributeName="transform" type="translate" values="0 2;0 -4;0 2" dur="2.6s" repeatCount="indefinite" />
        <Anim attributeName="opacity" values="0;0.7;0" dur="2.6s" repeatCount="indefinite" />
      </path>
      <rect x="814" y="50" width="34" height="12" fill="#6b7280" />
      <rect x="818" y="53" width="26" height="6" fill="#cbd5e1" />
      <Cliquable {...lien('vending-machine')}>
        <Distributeur x={860} />
      </Cliquable>
      <Cliquable {...lien('fridge')}>
        <FrigoVitre x={922} />
      </Cliquable>
      <rect x="818" y="132" width="8" height="34" fill="#111827" />
      <rect x="802" y="126" width="40" height="10" fill="#f9fafb" />
      <rect x="802" y="136" width="40" height="3" fill="#d1d5db" />
      {[786, 850].map((x) => (
        <g key={x}>
          <rect x={x} y="140" width="10" height="10" fill="#111827" />
          <rect x={x + 3} y="150" width="4" height="12" fill="#374151" />
        </g>
      ))}
      <Plante x={700} y={160} />

      {/* La grande salle : les cartons de matériel qui attendent, les plantes. */}
      <Cartons x={56} y={bas - 44} lien={lien} />
      <Plante x={946} y={bas - 32} />

      {/* Le mur de la grande salle, percé de ses trois entrées, avec sa bande LED ; l'écran y est accroché. */}
      {MUR_SALLE.map(([de, a]) => (
        <g key={de}>
          <rect x={de} y="198" width={a - de} height="6" fill={MUR.arete} />
          <rect x={de} y="204" width={a - de} height="38" fill={MUR.face} />
          <rect x={de} y="242" width={a - de} height="4" fill={MUR.plinthe} />
          <rect x={de} y="241" width={a - de} height="2" fill="var(--po-accent)" opacity="0.8" />
        </g>
      ))}
      <Neon x={695} y={226} texte={titre} couleur="#22d3ee" taille={titre.length > 14 ? 7 : 9} />
      <Porte bas={bas} />
      <rect x="330" y="14" width="8" height="190" fill="#7dd3fc" opacity="0.18" />
      <rect x="330" y="14" width="2" height="190" fill="#bae6fd" opacity="0.6" />
      <rect x="682" y="14" width="8" height="190" fill={MUR.arete} />
      <rect x="12" y="14" width="8" height={bas - 6} fill={MUR.arete} />
      <rect x="980" y="14" width="8" height={bas - 6} fill={MUR.arete} />
      <rect x="12" y="6" width="976" height="8" fill={MUR.arete} />
      <rect x="12" y={bas} width="976" height="10" fill={MUR.arete} />
    </>
  )
}

/** La baie serveur : ses tiroirs et leurs diodes qui clignotent chacune à son rythme. */
export function BaieServeur({ x }: { x: number }) {
  return (
    <g>
      <rect x={x} y="20" width="50" height="84" fill="#0b0d10" />
      <rect x={x + 2} y="22" width="46" height="80" fill="#16191e" />
      {Array.from({ length: 7 }, (_, i) => (
        <g key={i}>
          <rect x={x + 4} y={25 + i * 11} width="42" height="9" fill="#23272e" />
          <rect x={x + 6} y={28 + i * 11} width="18" height="2" fill="#3a3f48" />
          {[0, 1, 2].map((j) => (
            <rect key={j} x={x + 30 + j * 5} y={27 + i * 11} width="3" height="3" fill={['#22c55e', '#22c55e', '#38bdf8'][j]}>
              <Anim attributeName="opacity" values="1;0.15;1" dur={`${0.4 + ((i * 3 + j * 7) % 9) / 6}s`} repeatCount="indefinite" />
            </rect>
          ))}
        </g>
      ))}
    </g>
  )
}

/** La borne d'arcade : marquee néon, écran qui joue tout seul, boutons. */
export function Arcade({ x }: { x: number }) {
  // Le serpent avance par à-coups vers la puce, comme dans le jeu.
  const anneaux = ['#f472b6', '#a855f7', '#38bdf8', '#22c55e']
  return (
    <g>
      <rect x={x} y="18" width="42" height="84" fill="#4c1d95" />
      <rect x={x + 2} y="20" width="38" height="10" fill="#ec4899" />
      <text x={x + 21} y="28" fontSize="7" textAnchor="middle" fill="#fdf2f8">
        SNAKE
      </text>
      <rect x={x + 5} y="33" width="32" height="26" fill="#0b0d10" />
      <rect x={x + 8} y="36" width="26" height="20" fill="#0f172a" />
      <rect x={x + 26} y="44" width="4" height="4" fill="#e3b95a" />
      <g>
        <rect x={x + 18} y="45" width="3" height="3" fill="#f8fafc" />
        {anneaux.map((c, i) => (
          <rect key={c} x={x + 15 - i * 3} y="45" width="3" height="3" fill={c} />
        ))}
        <Anim attributeName="transform" type="translate" values="-4 0;-1 0;2 0;5 0;-4 0" dur="2s" repeatCount="indefinite" />
      </g>
      <rect x={x + 3} y="62" width="36" height="12" fill="#5b21b6" />
      <rect x={x + 9} y="65" width="3" height="6" fill="#111827" />
      <rect x={x + 8} y="63" width="5" height="3" fill="#ef4444" />
      {[20, 26, 32].map((dx, i) => (
        <rect key={dx} x={x + dx} y="66" width="4" height="4" fill={['#facc15', '#22c55e', '#38bdf8'][i]} />
      ))}
      <rect x={x + 6} y="76" width="30" height="24" fill="#3b0764" />
      <rect x={x + 16} y="84" width="10" height="4" fill="#facc15" />
    </g>
  )
}

/** La deuxième borne, cyan : son écran rejoue un casse-briques, la bille rebondit sous les puces. */
export function BorneCasseBriques({ x }: { x: number }) {
  const rangs = ['#e3b95a', '#22c55e', '#38bdf8']
  return (
    <g>
      <rect x={x} y="18" width="42" height="84" fill="#0e7490" />
      <rect x={x + 2} y="20" width="38" height="10" fill="#22d3ee" />
      <text x={x + 21} y="28" fontSize="6" textAnchor="middle" fill="#083344">
        CASSE-PUCES
      </text>
      <rect x={x + 5} y="33" width="32" height="26" fill="#0b0d10" />
      <rect x={x + 8} y="36" width="26" height="20" fill="#020617" />
      {rangs.map((c, r) =>
        [0, 1, 2, 3].map((i) => <rect key={`${r}${i}`} x={x + 9 + i * 6} y={37 + r * 3} width="5" height="2" fill={c} />),
      )}
      <rect x={x + 18} y="46" width="2" height="2" fill="#f8fafc">
        <Anim attributeName="x" values={`${x + 10};${x + 31};${x + 18};${x + 10}`} dur="2.4s" repeatCount="indefinite" />
        <Anim attributeName="y" values="53;47;53;47;53" dur="1.2s" repeatCount="indefinite" />
      </rect>
      <rect x={x + 16} y="54" width="8" height="1" fill="#e5e7eb">
        <Anim attributeName="x" values={`${x + 9};${x + 25};${x + 14};${x + 9}`} dur="2.4s" repeatCount="indefinite" />
      </rect>
      <rect x={x + 3} y="62" width="36" height="12" fill="#155e75" />
      <rect x={x + 8} y="66" width="12" height="3" fill="#111827" />
      <rect x={x + 12} y="65" width="4" height="5" fill="#e5e7eb" />
      {[26, 32].map((dx, i) => (
        <rect key={dx} x={x + dx} y="66" width="4" height="4" fill={['#ef4444', '#facc15'][i]} />
      ))}
      <rect x={x + 6} y="76" width="30" height="24" fill="#164e63" />
      <rect x={x + 16} y="84" width="10" height="4" fill="#22d3ee" />
    </g>
  )
}

/** La grande télé, la console dessous, et un jeu de plateforme qui tourne en boucle. */
export function Tele({ x }: { x: number }) {
  return (
    <g>
      <rect x={x} y="22" width="148" height="40" fill="#0b0d10" />
      <rect x={x + 3} y="25" width="142" height="34" fill="#38bdf8" />
      <rect x={x + 3} y="49" width="142" height="10" fill="#16a34a" />
      <rect x={x + 3} y="49" width="142" height="2" fill="#4ade80" />
      <rect x={x + 30} y="40" width="18" height="9" fill="#a16207" />
      <rect x={x + 90} y="36" width="14" height="13" fill="#15803d" />
      <rect x={x + 120} y="30" width="10" height="6" fill="#f8fafc" opacity="0.9" />
      <rect x={x + 60} y="28" width="14" height="5" fill="#f8fafc" opacity="0.8" />
      {/* Le héros qui court et saute. */}
      <rect x={x + 10} y="43" width="5" height="6" fill="#ef4444">
        <Anim attributeName="x" values={allerRetour(x + 8, x + 134, 18)} dur="7s" repeatCount="indefinite" />
        <Anim attributeName="y" values="43;43;35;43;43" keyTimes="0;0.4;0.47;0.54;1" dur="3.5s" repeatCount="indefinite" />
      </rect>
      <rect x={x + 62} y="64" width="24" height="10" fill="#111827" />
      <rect x={x + 30} y="66" width="88" height="10" fill="#1f2937" />
      <rect x={x + 66} y="68" width="16" height="5" fill="#f8fafc" />
      <rect x={x + 80} y="69" width="2" height="2" fill="#38bdf8" />
    </g>
  )
}

export function Pouf({ x, y, couleur }: { x: number; y: number; couleur: string }) {
  return (
    <g>
      <rect x={x - 14} y={y - 6} width="28" height="20" fill="#0b0d10" />
      <rect x={x - 13} y={y - 5} width="26" height="18" fill={couleur} />
      <rect x={x - 10} y={y - 4} width="20" height="4" fill="white" opacity="0.25" />
      <rect x={x - 13} y={y + 9} width="26" height="4" fill="black" opacity="0.25" />
    </g>
  )
}

/** L'établi de montage : panneau à outils, tapis antistatique, PC ouvert, barrettes, tournevis. */
export function Etabli({ x }: { x: number }) {
  return (
    <g>
      <rect x={x} y="20" width="82" height="28" fill="#a3825a" />
      {Array.from({ length: 4 }, (_, i) =>
        Array.from({ length: 10 }, (_, j) => (
          <rect key={`${i}-${j}`} x={x + 4 + j * 8} y={23 + i * 7} width="1" height="1" fill="#6b5236" />
        )),
      )}
      <rect x={x + 8} y="25" width="3" height="16" fill="#ef4444" />
      <rect x={x + 16} y="24" width="10" height="4" fill="#9ca3af" />
      <rect x={x + 20} y="28" width="2" height="12" fill="#9ca3af" />
      <rect x={x + 32} y="26" width="12" height="12" fill="#facc15" />
      <rect x={x + 56} y="25" width="18" height="6" fill="#374151" />
      <rect x={x} y="48" width="82" height="22" fill="#9ca3af" />
      <rect x={x + 4} y="50" width="74" height="18" fill="#0e7490" />
      <rect x={x} y="70" width="82" height="14" fill="#4b5563" />
      <rect x={x + 3} y="84" width="5" height="10" fill="#1f2937" />
      <rect x={x + 74} y="84" width="5" height="10" fill="#1f2937" />
      {/* Le boîtier ouvert : carte mère verte, carte graphique, ventilateur RGB. */}
      <rect x={x + 8} y="30" width="30" height="34" fill="#111827" />
      <rect x={x + 11} y="33" width="24" height="28" fill="#14532d" />
      <rect x={x + 13} y="36" width="8" height="8" fill="#9ca3af" />
      <rect x={x + 23} y="36" width="2" height="9" fill="#e5e7eb" />
      <rect x={x + 26} y="36" width="2" height="9" fill="#e5e7eb" />
      <rect x={x + 12} y="49" width="22" height="6" fill="#1f2937" />
      <rect x={x + 12} y="54" width="22" height="1" fill="#22d3ee">
        <Anim attributeName="fill" values="#22d3ee;#a855f7;#ec4899;#22d3ee" dur="3s" repeatCount="indefinite" />
      </rect>
      {/* Barrettes, tournevis, carton de GPU. */}
      <rect x={x + 44} y="56" width="14" height="3" fill="#166534" />
      <rect x={x + 44} y="61" width="14" height="3" fill="#166534" />
      <rect x={x + 62} y="58" width="12" height="2" fill="#f59e0b" />
      <rect x={x + 58} y="58" width="4" height="2" fill="#9ca3af" />
      <rect x={x + 46} y="38" width="28" height="14" fill="#16a34a" />
      <text x={x + 60} y="48" fontSize="6" textAnchor="middle" fill="#f0fdf4">
        GPU
      </text>
    </g>
  )
}

/** Le distributeur : vitrine de snacks et canettes, monnayeur. */
export function Distributeur({ x }: { x: number }) {
  const snacks = ['#f59e0b', '#ef4444', '#22c55e', '#3b82f6', '#a855f7', '#f472b6']
  return (
    <g>
      <rect x={x} y="16" width="44" height="80" fill="#b91c1c" />
      <rect x={x + 3} y="20" width="28" height="64" fill="#0f172a" />
      {[0, 1, 2, 3].map((r) =>
        [0, 1, 2].map((c) => (
          <rect key={`${r}${c}`} x={x + 6 + c * 8} y={24 + r * 15} width="6" height="9" fill={snacks[(r * 3 + c) % snacks.length]} />
        )),
      )}
      {[0, 1, 2, 3].map((r) => (
        <rect key={r} x={x + 3} y={34 + r * 15} width="28" height="2" fill="#94a3b8" />
      ))}
      <rect x={x + 34} y="24" width="7" height="14" fill="#111827" />
      <rect x={x + 35} y="26" width="5" height="3" fill="#22c55e" />
      {[0, 1, 2].map((r) => (
        <rect key={r} x={x + 35} y={42 + r * 5} width="5" height="3" fill="#e5e7eb" />
      ))}
      <rect x={x + 6} y="87" width="22" height="6" fill="#111827" />
    </g>
  )
}

/** Le frigo vitré, éclairé, rempli de canettes de boisson énergisante. */
export function FrigoVitre({ x }: { x: number }) {
  const canettes = ['#22c55e', '#0ea5e9', '#f43f5e', '#facc15']
  return (
    <g>
      <rect x={x} y="16" width="54" height="82" fill="#111827" />
      <rect x={x + 3} y="19" width="48" height="72" fill="#e0f2fe" />
      {[0, 1, 2, 3].map((r) => (
        <g key={r}>
          {Array.from({ length: 7 }, (_, i) => (
            <rect key={i} x={x + 6 + i * 6} y={22 + r * 17} width="4" height="10" fill={canettes[(i + r) % canettes.length]} />
          ))}
          <rect x={x + 3} y={33 + r * 17} width="48" height="2" fill="#94a3b8" />
        </g>
      ))}
      <rect x={x + 44} y="40" width="3" height="20" fill="#9ca3af" />
      <rect x={x + 6} y="92" width="42" height="4" fill="#0ea5e9" />
    </g>
  )
}

/** Des cartons de composants empilés, en attente de montage ; chacun ouvre sa table de référence. */
export function Cartons({
  x,
  y,
  lien,
}: {
  x: number
  y: number
  lien: (objet: SceneObject) => { titre: string; faire: () => void; actif: boolean }
}) {
  return (
    <g>
      <Cliquable {...lien('cpu-box')}>
        <rect x={x} y={y + 14} width="40" height="26" fill="#a16207" />
        <rect x={x} y={y + 14} width="40" height="4" fill="#ca8a04" />
        <text x={x + 20} y={y + 32} fontSize="7" textAnchor="middle" fill="#fef3c7">
          CPU
        </text>
      </Cliquable>
      <Cliquable {...lien('gpu-box')}>
        <rect x={x + 6} y={y} width="30" height="16" fill="#15803d" />
        <rect x={x + 6} y={y} width="30" height="3" fill="#16a34a" />
        <text x={x + 21} y={y + 12} fontSize="6" textAnchor="middle" fill="#f0fdf4">
          RTX
        </text>
      </Cliquable>
      <Cliquable {...lien('ram-box')}>
        <rect x={x + 44} y={y + 22} width="22" height="18" fill="#1d4ed8" />
        <text x={x + 55} y={y + 34} fontSize="6" textAnchor="middle" fill="#eff6ff">
          RAM
        </text>
      </Cliquable>
    </g>
  )
}

/** La porte vitrée d'entrée, au bas de la grande salle, et son paillasson. */
export function Porte({ bas }: { bas: number }) {
  const t = useTextes()
  return (
    <g pointerEvents="none">
      <rect x="472" y={bas - 14} width="56" height="12" fill="#3f3f46" />
      <rect x="476" y={bas - 12} width="48" height="8" fill="#52525b" />
      <text x="500" y={bas - 6} fontSize="5.5" textAnchor="middle" fill="#a1a1aa">
        {t.welcome}
      </text>
      <rect x="470" y={bas} width="60" height="10" fill="#7dd3fc" opacity="0.35" />
      <rect x="499" y={bas} width="2" height="10" fill="#bae6fd" />
    </g>
  )
}

/** L'écran ultra-large ; `bientot` affiche les minutes avant le prochain passage. */
export function Ecran({ cx, dy, statut, bientot }: { cx: number; dy: number; statut: Statut; bientot: number | null }) {
  const t = useTextes()
  const travaille = statut === 'au-travail'
  const l = 54
  const g = cx - l / 2
  return (
    <g>
      <rect x={cx - 4} y={dy + 10} width="8" height="7" fill="#111827" />
      <rect x={cx - 12} y={dy + 16} width="24" height="3" fill="#111827" />
      <rect x={g - 3} y={dy - 15} width={l + 6} height="27" fill="#0b0d10" />
      {statut === 'absent' ? (
        <>
          <rect x={g} y={dy - 12} width={l} height="21" fill="#020617" />
          {/* Le post-it laissé en partant. */}
          <g transform={`rotate(-6 ${cx} ${dy})`}>
            <rect x={cx - 15} y={dy - 10} width="30" height="15" fill="#fde68a" />
            <rect x={cx - 15} y={dy - 10} width="30" height="3" fill="#fcd34d" />
            <text x={cx} y={dy + 2} fontSize="7" textAnchor="middle" fill="#78350f">
              {t.offNote}
            </text>
          </g>
        </>
      ) : statut === 'en-echec' ? (
        <>
          <rect x={g} y={dy - 12} width={l} height="21" fill="#991b1b">
            <Anim attributeName="opacity" values="1;0.6;1" dur="1s" repeatCount="indefinite" />
          </rect>
          <rect x={cx - 2} y={dy - 9} width="4" height="10" fill="#fef2f2" />
          <rect x={cx - 2} y={dy + 3} width="4" height="4" fill="#fef2f2" />
        </>
      ) : travaille ? (
        <>
          <rect x={g} y={dy - 12} width={l} height="21" fill="#0b0d10" />
          {[0, 1, 2, 3].map((i) => {
            const w = [30, 18, 36, 14][i]
            return (
              <rect key={i} x={g + 3 + (i % 2) * 5} y={dy - 9 + i * 5} width={w} height="2" fill={i % 2 ? '#22d3ee' : 'var(--po-accent)'}>
                <Anim attributeName="width" values={`${etapes(2, w, 5)};${w}`} dur="1.6s" begin={`${i * 0.4}s`} repeatCount="indefinite" />
              </rect>
            )
          })}
        </>
      ) : (
        <>
          {/* Le bureau du système : un fond dégradé, deux fenêtres. */}
          <rect x={g} y={dy - 12} width={l} height="21" fill="#312e81" />
          <rect x={g} y={dy - 2} width={l} height="11" fill="#4338ca" />
          <rect x={g + 4} y={dy - 9} width="22" height="13" fill="#e0e7ff" />
          <rect x={g + 4} y={dy - 9} width="22" height="3" fill="#818cf8" />
          <rect x={g + 30} y={dy - 7} width="20" height="10" fill="#c7d2fe" />
          <rect x={g} y={dy + 7} width={l} height="2" fill="#1e1b4b" />
        </>
      )}
      {bientot ? (
        <g>
          <rect x={g} y={dy + 1} width={l} height="9" fill="#0b1220" />
          <text x={cx} y={dy + 8} fontSize="7" textAnchor="middle" fill="var(--po-accent)">
            {t.inMinutes(bientot)}
          </text>
          <Anim attributeName="opacity" values="1;0.55;1" dur="2s" repeatCount="indefinite" />
        </g>
      ) : null}
    </g>
  )
}

/**
 * La tour sur le bureau, vitrée, avec deux ventilateurs RGB qui tournent tant
 * que l'agent est là. En échec, elle vire au rouge et fume.
 */
export function Tour({
  x,
  y,
  couleur,
  allumee,
  fume,
  tourne,
}: {
  x: number
  y: number
  couleur: string
  allumee: boolean
  fume: boolean
  /** Les ventilateurs ne tournent que sous la charge : au repos, la tour reste immobile (et ne coûte rien). */
  tourne: boolean
}) {
  return (
    <g>
      {fume
        ? [0, 0.6, 1.2].map((debut, i) => (
            <rect key={debut} x={x + 6 + i * 3} y={y - 2} width="6" height="6" fill="#9ca3af" opacity="0">
              <Anim attributeName="y" values={etapes(y - 2, y - 34, 6)} dur="1.8s" begin={`${debut}s`} repeatCount="indefinite" />
              <Anim attributeName="opacity" values={etapes(0.85, 0, 6)} dur="1.8s" begin={`${debut}s`} repeatCount="indefinite" />
              <Anim attributeName="width" values={etapes(5, 11, 6)} dur="1.8s" begin={`${debut}s`} repeatCount="indefinite" />
              <Anim attributeName="height" values={etapes(5, 11, 6)} dur="1.8s" begin={`${debut}s`} repeatCount="indefinite" />
            </rect>
          ))
        : null}
      <rect x={x} y={y} width="22" height="40" fill="#0b0d10" />
      <rect x={x + 2} y={y + 2} width="18" height="36" fill="#1e293b" />
      {[8, 22].map((dy) => (
        <g key={dy}>
          <rect x={x + 4} y={y + dy - 5} width="14" height="12" fill={allumee ? couleur : '#334155'} opacity={allumee ? 0.9 : 1} />
          <rect x={x + 6} y={y + dy - 3} width="10" height="8" fill="#0f172a" />
          <g transform={`translate(${x + 11} ${y + dy + 1})`}>
            <rect x="-4" y="-1" width="8" height="2" fill="#64748b">
              {tourne ? <Anim attributeName="transform" type="rotate" values="0;45;90;135" dur="0.4s" repeatCount="indefinite" /> : null}
            </rect>
          </g>
        </g>
      ))}
      {allumee ? (
        <rect x={x + 2} y={y + 35} width="18" height="2" fill={couleur}>
          {tourne ? <Anim attributeName="opacity" values="1;0.5;1" dur="2.5s" repeatCount="indefinite" /> : null}
        </rect>
      ) : null}
    </g>
  )
}

/** Le clavier mécanique : ses touches arc-en-ciel n'ondulent que quand l'agent tape. */
export function Clavier({ x, y, allume, ondule }: { x: number; y: number; allume: boolean; ondule: boolean }) {
  const arc = ['#ef4444', '#f59e0b', '#22c55e', '#22d3ee', '#a855f7']
  return (
    <g>
      <rect x={x} y={y} width="36" height="9" fill="#111827" />
      {arc.map((c, i) => (
        <rect key={c} x={x + 2 + i * 7} y={y + 2} width="6" height="5" fill={allume ? c : '#374151'} opacity="0.85">
          {ondule ? (
            <Anim
              attributeName="fill"
              values={[...arc.slice(i), ...arc.slice(0, i), arc[i]].join(';')}
              dur="2.5s"
              repeatCount="indefinite"
            />
          ) : null}
        </rect>
      ))}
    </g>
  )
}

/** Le fauteuil gamer du chef, derrière son bureau : noir et laiton, le dossier haut au-dessus de sa tête. */
export function Fauteuil({ x, y }: { x: number; y: number }) {
  return (
    <g>
      <rect x={x - 16} y={y - 34} width="32" height="42" fill="#0b0d10" />
      <rect x={x - 13} y={y - 31} width="26" height="36" fill="#1f2937" />
      <rect x={x - 11} y={y - 31} width="4" height="36" fill="#e3b95a" />
      <rect x={x + 7} y={y - 31} width="4" height="36" fill="#e3b95a" />
      <rect x={x - 6} y={y - 28} width="12" height="5" fill="#111827" />
      <rect x={x - 20} y={y - 8} width="6" height="16" fill="#0b0d10" />
      <rect x={x + 14} y={y - 8} width="6" height="16" fill="#0b0d10" />
    </g>
  )
}

/** Le dossier du fauteuil gamer, vu de dos : noir, deux bandes de couleur, l'appui-tête. */
export function Dossier({ x, y, couleur }: { x: number; y: number; couleur: string }) {
  return (
    <g>
      <rect x={x - 13} y={y + 2} width="26" height="10" fill="#0b0d10" />
      <rect x={x - 11} y={y + 4} width="22" height="7" fill="#1f2937" />
      <rect x={x - 9} y={y + 4} width="3" height="7" fill={couleur} />
      <rect x={x + 6} y={y + 4} width="3" height="7" fill={couleur} />
      <rect x={x - 2} y={y + 12} width="4" height="3" fill="#111827" />
      <rect x={x - 10} y={y + 15} width="20" height="3" fill="#0b0d10" />
    </g>
  )
}

/* ——— Les bonshommes ——— */

export const CHEMISES = [
  '#3b82f6',
  '#10b981',
  '#e11d48',
  '#8b5cf6',
  '#f59e0b',
  '#0ea5e9',
  '#14b8a6',
  '#f97316',
  '#6366f1',
  '#84cc16',
  '#ec4899',
  '#475569',
]
export const CHEVEUX = ['#2a1d14', '#5a3a22', '#c8a165', '#111111', '#8a4b2a', '#e5e5e5', '#b45309']
export const PEAUX = ['#f1c9a5', '#d9a57a', '#a86f48', '#7a4a2c', '#f5d6bf']
export const PANTALONS = ['#334155', '#1e3a8a', '#44403c', '#3f3f46', '#365314']

export function hachage(id: string) {
  let h = 7
  for (const c of id) h = (h * 31 + c.charCodeAt(0)) >>> 0
  return h
}

/** Un agent sur deux travaille casque sur les oreilles ; le chef, jamais. */
export const porteCasque = (id: string) => id !== CHEF_ID && !estInvite(id) && ((hachage(id) >> 16) & 1) === 1

/** Chacun garde son sweat et sa coupe d'une visite à l'autre. */
export function teint(id: string): Record<string, string> {
  if (id === CHEF_ID) {
    return { h: '#9ca3af', s: '#f1c9a5', e: '#1c1917', c: '#111827', C: '#1f2937', t: '#e3b95a', k: '#111827', p: '#1f2937', b: '#e5e7eb' }
  }
  // Le livreur, en uniforme marron et casquette.
  if (id.startsWith('livreur:')) {
    return { h: '#5b3a1a', s: '#d9a57a', e: '#1c1917', c: '#7c4a1e', C: '#5b3a1a', t: '#facc15', k: '#111827', p: '#5b3a1a', b: '#111827' }
  }
  const h = hachage(id)
  const sweat = CHEMISES[h % CHEMISES.length]
  return {
    h: CHEVEUX[(h >> 4) % CHEVEUX.length],
    s: PEAUX[(h >> 8) % PEAUX.length],
    e: '#1c1917',
    c: sweat,
    C: `color-mix(in oklab, ${sweat} 70%, black)`,
    t: '#f8fafc',
    k: '#111827',
    p: PANTALONS[(h >> 12) % PANTALONS.length],
    b: '#f8fafc',
  }
}

export function Assise({ x, y, couleur }: { x: number; y: number; couleur: string }) {
  return (
    <g>
      <rect x={x - 11} y={y - 12} width="22" height="12" fill="#1f2937" />
      <rect x={x - 11} y={y - 12} width="3" height="12" fill={couleur} />
      <rect x={x + 8} y={y - 12} width="3" height="12" fill={couleur} />
    </g>
  )
}

/** Le bureau d'un agent : plateau blanc, bande LED à la couleur de l'état, écran ultra-large, tour, clavier, tasse. */
function BureauGeek({ cx, dy, x, dessus, statut, accent, bientot, emoji }: PropsBureau) {
  const allume = statut !== 'absent'
  return (
    <g>
      <PlateauGeek x={x} dy={dy} dessus={dessus} statut={statut} />
      <Ecran cx={cx - 4} dy={dy} statut={statut} bientot={bientot} />
      <Tour
        x={x + 94}
        y={dy - 18}
        couleur={statut === 'en-echec' ? '#ef4444' : accent}
        allumee={allume}
        fume={statut === 'en-echec'}
        tourne={statut === 'au-travail'}
      />
      <Clavier x={cx - 22} y={dy + 22} allume={allume} ondule={statut === 'au-travail'} />
      <rect x={cx + 18} y={dy + 20} width="12" height="13" fill="#111827" />
      <rect x={cx + 22} y={dy + 23} width="4" height="6" fill="#e5e7eb" />
      {/* La tasse et l'emoji de l'agent, en sticker sur le plateau. */}
      <rect x={x + 8} y={dy + 22} width="8" height="9" fill="#111827" />
      <rect x={x + 16} y={dy + 24} width="3" height="4" fill="#111827" />
      <rect x={x + 9} y={dy + 23} width="6" height="2" fill="#6b3a1e" />
      <text x={x + 12} y={dy + 13} fontSize="10" textAnchor="middle">
        {emoji}
      </text>
    </g>
  )
}

/** Le bureau du chef : deux écrans vus de dos sur le côté, le portable, le téléphone. */
function BureauChefGeek({ dy, x, dessus, statut }: PropsBureau) {
  return (
    <g>
      <PlateauGeek x={x} dy={dy} dessus={dessus} statut={statut} />
      <rect x={x + 6} y={dy - 12} width="30" height="22" fill="#1f2937" />
      <rect x={x + 8} y={dy - 10} width="26" height="18" fill="#374151" />
      <rect x={x + 18} y={dy + 10} width="6" height="5" fill="#111827" />
      <rect x={x + 84} y={dy + 4} width="26" height="18" fill="#d1d5db" />
      <rect x={x + 86} y={dy + 6} width="22" height="13" fill="#9ca3af" />
      <rect x={x + 95} y={dy + 11} width="4" height="3" fill="#f9fafb" />
      <rect x={x + 88} y={dy + 26} width="10" height="7" fill="#111827" />
    </g>
  )
}

/** Le plateau blanc, sa tranche, et la bande LED dessous, à la couleur de l'état. */
function PlateauGeek({ x, dy, dessus, statut }: { x: number; dy: number; dessus: number; statut: Statut }) {
  return (
    <>
      <rect x={x} y={dy} width={BUREAU.largeur} height={dessus} fill="#e5e7eb" />
      <rect x={x} y={dy} width={BUREAU.largeur} height="3" fill="#f9fafb" />
      <rect x={x} y={dy + dessus} width={BUREAU.largeur} height="12" fill="#c4c8cf" />
      <rect x={x} y={dy + dessus + 10} width={BUREAU.largeur} height="2" fill={LAMPE_PLAN[statut]}>
        {statut === 'au-travail' || statut === 'en-echec' ? (
          <Anim attributeName="opacity" values="1;0.4;1" dur="1.2s" repeatCount="indefinite" />
        ) : null}
      </rect>
      <rect x={x + 3} y={dy + dessus + 12} width="4" height="7" fill="#111827" />
      <rect x={x + BUREAU.largeur - 7} y={dy + dessus + 12} width="4" height="7" fill="#111827" />
    </>
  )
}

/* Les lumières du décor dans la nuit : l'enseigne, la baie serveur, les bornes, la télé, la cuisine. */
const LUMIERES_GEEK: Array<Lumiere> = [
  { x: 222, y: 36, r: 60, couleur: ACCENT },
  { x: 59, y: 60, r: 40, couleur: '#22c55e' },
  { x: 373, y: 50, r: 50, couleur: '#a855f7' },
  { x: 417, y: 50, r: 45, couleur: '#22d3ee' },
  { x: 516, y: 44, r: 80, couleur: '#38bdf8' },
  { x: 768, y: 40, r: 40 },
  { x: 882, y: 56, r: 45, couleur: '#f87171' },
  { x: 949, y: 56, r: 55, couleur: '#e0f2fe' },
]

export const THEME_GEEK: Theme = {
  coins: COINS_GEEK,
  coinCafe: 'cafe',
  fond: '#120e0b',
  Decor,
  Bureau: BureauGeek,
  BureauChef: BureauChefGeek,
  plaque: '#1f2937',
  Assise,
  Dossier,
  Fauteuil,
  tenue: teint,
  casque: porteCasque,
  CafeQuiCoule,
  lumieres: LUMIERES_GEEK,
  // La tour RGB de chaque poste éclaire de la couleur de son agent.
  lumierePoste: (cx, dy, accent) => [{ x: cx + 45, y: dy + 2, r: 34, couleur: accent }],
}
