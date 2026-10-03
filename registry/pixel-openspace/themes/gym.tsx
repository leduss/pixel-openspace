'use client'

/*
 * Le thème salle de sport : chaque agent a son vélo d'appartement et sa
 * console. Au travail il pédale, la roue d'inertie tourne et la console
 * affiche son effort ; au repos elle attend, READY ; en échec elle passe au
 * rouge et le moteur fume. Le coach a son bureau vitré et sa vitrine à
 * trophées ; la salle de musculation, ses miroirs, sa télé qui passe une
 * séance, ses bancs et son rack à squat ; le bar, son blender, sa fontaine
 * et ses casiers. Débardeurs, shorts, baskets et casques de sport.
 */

import { BUREAU, CHEF_ID, estInvite, type CoinDePause, type Statut } from '../engine'
import { Anim, Cliquable, MUR_SALLE, Neon, Plante, etapes, useTextes, hacher, type Lumiere } from '../primitives'
import type { PropsBureau, PropsDecor, PropsSiege, Theme } from '../theme'
import { Arcade, BorneCasseBriques, Porte } from './geek'
import type { SceneObject } from '../types'

/* Les coins de pause : la même géographie que les autres thèmes, d'autres agrès. */
const COINS_GYM: Array<CoinDePause> = [
  { nom: 'smoothie', x: 768, y: 100 },
  { nom: 'fontaine', x: 881, y: 104 },
  { nom: 'casiers', x: 950, y: 108 },
  { nom: 'arcade', x: 372, y: 112 },
  { nom: 'arcade-2', x: 415, y: 112 },
  { nom: 'rack', x: 636, y: 108 },
  // Sur les bancs de muscu, face aux miroirs : de dos.
  { nom: 'banc-gauche', x: 482, y: 146, assis: true },
  { nom: 'banc-droite', x: 538, y: 146, assis: true },
]

const MUR = { arete: '#0f172a', face: '#1e293b', bande: '#f97316', plinthe: '#0b1220' }
const CYAN = '#22d3ee'

/** Un mur peint, vu de biais, avec sa bande de couleur à hauteur d'épaule. */
function MurPeint({
  x,
  largeur,
  y = 20,
  hauteur = 32,
  bande = MUR.bande,
}: {
  x: number
  largeur: number
  y?: number
  hauteur?: number
  bande?: string
}) {
  return (
    <>
      <rect x={x} y={y - 6} width={largeur} height="6" fill={MUR.arete} />
      <rect x={x} y={y} width={largeur} height={hauteur} fill={MUR.face} />
      <rect x={x} y={y + hauteur - 12} width={largeur} height="4" fill={bande} />
      <rect x={x} y={y + hauteur} width={largeur} height="4" fill={MUR.plinthe} />
    </>
  )
}

function Decor({ hauteur, titre, liens, aller, jouer }: PropsDecor) {
  const t = useTextes()
  const bas = hauteur - 20
  const lien = (objet: SceneObject) => ({ titre: t.objects[objet], faire: () => aller(objet), actif: Boolean(liens[objet]) })
  return (
    <>
      <defs>
        <pattern id="sol-gym" width="40" height="40" patternUnits="userSpaceOnUse">
          <rect width="40" height="40" fill="#4b5059" />
          <rect width="40" height="1" fill="#41464e" />
          <rect width="1" height="40" fill="#41464e" />
          {[
            [6, 8],
            [21, 15],
            [33, 4],
            [12, 29],
            [28, 33],
            [36, 22],
          ].map(([x, y]) => (
            <rect key={`${x}-${y}`} x={x} y={y} width="1" height="1" fill={x % 2 ? '#f97316' : CYAN} opacity="0.6" />
          ))}
        </pattern>
        <pattern id="dalles-gym" width="32" height="32" patternUnits="userSpaceOnUse">
          <rect width="32" height="32" fill="#1f2937" />
          <rect width="32" height="2" fill="#111827" />
          <rect width="2" height="32" fill="#111827" />
        </pattern>
        <pattern id="parquet-coach" width="36" height="12" patternUnits="userSpaceOnUse">
          <rect width="36" height="12" fill="#c8a06a" />
          <rect y="10" width="36" height="2" fill="#a8824f" />
          <rect x="18" width="2" height="12" fill="#a8824f" />
        </pattern>
        <pattern id="carrelage-bar" width="20" height="20" patternUnits="userSpaceOnUse">
          <rect width="20" height="20" fill="#e5f6fb" />
          <rect width="20" height="1" fill="#bfe3ee" />
          <rect width="1" height="20" fill="#bfe3ee" />
        </pattern>
        <linearGradient id="miroir-gym" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stopColor="#cbd5e1" />
          <stop offset="0.5" stopColor="#94a3b8" />
          <stop offset="1" stopColor="#e2e8f0" />
        </linearGradient>
      </defs>

      {/* Les sols : parquet chez le coach, dalles de caoutchouc en musculation, carrelage au bar, sol sportif moucheté dans la grande salle. */}
      <rect x="20" y="56" width="310" height="142" fill="url(#parquet-coach)" />
      <rect x="338" y="56" width="344" height="142" fill="url(#dalles-gym)" />
      <rect x="690" y="56" width="290" height="142" fill="url(#carrelage-bar)" />
      <rect x="20" y="198" width="960" height={bas - 198} fill="url(#sol-gym)" />

      {/* Les murs du fond. */}
      <MurPeint x={20} largeur={310} />
      <MurPeint x={338} largeur={344} bande={CYAN} />
      <MurPeint x={690} largeur={290} bande="#a3e635" />

      {/* Le bureau du coach : la vitrine à trophées, l'enseigne, la plante. */}
      <Cliquable {...lien('server-rack')}>
        <VitrineTrophees x={34} />
      </Cliquable>
      <Neon x={222} y={40} texte={t.leadOffice} couleur="#f97316" taille={11} />
      <Plante x={300} y={62} />

      {/* La salle de musculation : le mur de miroirs, les bornes, la télé, les bancs, le rack à squat. */}
      <rect x="440" y="22" width="150" height="28" fill="url(#miroir-gym)" opacity="0.55" />
      <Cliquable titre={t.objects.snake} faire={() => jouer('snake')}>
        <Arcade x={352} />
      </Cliquable>
      <Cliquable titre={t.objects.breakout} faire={() => jouer('casse-briques')}>
        <BorneCasseBriques x={396} />
      </Cliquable>
      <Cliquable {...lien('tv')}>
        <TeleSeance x={466} />
      </Cliquable>
      <BancMuscu x={482} y={146} />
      <BancMuscu x={538} y={146} />
      <Cliquable {...lien('workbench')}>
        <RackSquat x={596} />
      </Cliquable>
      <Plante x={346} y={160} />
      <Halteres x={640} y={176} />

      {/* Le bar à smoothies : comptoir, blender, corbeille de fruits, fontaine, casiers, mange-debout. */}
      <rect x="730" y="44" width="122" height="24" fill="#f8fafc" />
      <rect x="730" y="44" width="122" height="3" fill="#ffffff" />
      <rect x="730" y="68" width="122" height="18" fill="#0e7490" />
      <rect x="730" y="68" width="122" height="3" fill="#a3e635" />
      <Blender x={758} />
      {[
        [812, '#f97316'],
        [820, '#facc15'],
        [828, '#ef4444'],
        [816, '#84cc16'],
        [824, '#fb923c'],
      ].map(([x, c], i) => (
        <rect key={i} x={x as number} y={i < 3 ? 48 : 43} width="7" height="6" fill={c as string} />
      ))}
      <rect x="808" y="52" width="30" height="6" fill="#a16207" />
      <Cliquable {...lien('vending-machine')}>
        <FontaineInox x={864} />
      </Cliquable>
      <Cliquable {...lien('fridge')}>
        <Casiers x={922} />
      </Cliquable>
      <rect x="818" y="132" width="8" height="34" fill="#334155" />
      <rect x="802" y="126" width="40" height="10" fill="#a3e635" />
      <rect x="802" y="136" width="40" height="3" fill="#65a30d" />
      {[786, 850].map((x) => (
        <g key={x}>
          <rect x={x} y="140" width="10" height="10" fill="#0e7490" />
          <rect x={x + 3} y="150" width="4" height="12" fill="#334155" />
        </g>
      ))}
      <Plante x={700} y={160} />

      {/* La grande salle : la pile de matériel, les plantes. */}
      <PileMateriel x={56} y={bas - 44} lien={lien} />
      <Plante x={946} y={bas - 32} />

      {/* Le mur de la grande salle, percé de ses trois entrées. */}
      {MUR_SALLE.map(([de, a]) => (
        <g key={de}>
          <MurPeint x={de} largeur={a - de} y={204} hauteur={38} />
        </g>
      ))}
      <Neon x={695} y={226} texte={titre} couleur="#a3e635" taille={titre.length > 14 ? 7 : 9} />
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

/** La vitrine à trophées : coupes dorées et argentées, médailles. */
function VitrineTrophees({ x }: { x: number }) {
  return (
    <g>
      <rect x={x} y="20" width="54" height="86" fill="#334155" />
      <rect x={x + 3} y="23" width="48" height="80" fill="#bae6fd" opacity="0.25" />
      {[44, 70, 96].map((y) => (
        <rect key={y} x={x + 3} y={y} width="48" height="3" fill="#475569" />
      ))}
      {[
        [8, 30, '#facc15'],
        [24, 28, '#e5e7eb'],
        [38, 32, '#d97706'],
        [10, 56, '#e5e7eb'],
        [30, 54, '#facc15'],
      ].map(([dx, y, c], i) => (
        <g key={i}>
          <rect x={x + (dx as number)} y={y as number} width="8" height="7" fill={c as string} />
          <rect x={x + (dx as number) + 3} y={(y as number) + 7} width="2" height="4" fill={c as string} />
          <rect x={x + (dx as number) + 1} y={(y as number) + 11} width="6" height="3" fill="#78350f" />
        </g>
      ))}
      {[10, 22, 34].map((dx, i) => (
        <g key={dx}>
          <rect x={x + dx + 3} y="76" width="2" height="8" fill={['#ef4444', '#2563eb', '#16a34a'][i]} />
          <rect x={x + dx + 1} y="84" width="6" height="6" fill={['#facc15', '#e5e7eb', '#d97706'][i]} />
        </g>
      ))}
    </g>
  )
}

/** La télé murale, qui passe une séance : un bonhomme qui fait des jumping jacks. */
function TeleSeance({ x }: { x: number }) {
  return (
    <g>
      <rect x={x} y="24" width="100" height="40" fill="#0b0d10" />
      <rect x={x + 3} y="27" width="94" height="34" fill="#7c3aed" />
      <rect x={x + 3} y="53" width="94" height="8" fill="#5b21b6" />
      <g>
        <Anim attributeName="transform" type="translate" values="0 0;0 -3" dur="0.8s" repeatCount="indefinite" />
        <rect x={x + 47} y="32" width="6" height="6" fill="#fde68a" />
        <rect x={x + 46} y="38" width="8" height="10" fill="#f472b6" />
        <rect x={x + 40} y="36" width="6" height="3" fill="#fde68a">
          <Anim attributeName="y" values="36;30" dur="0.8s" repeatCount="indefinite" />
        </rect>
        <rect x={x + 54} y="36" width="6" height="3" fill="#fde68a">
          <Anim attributeName="y" values="36;30" dur="0.8s" repeatCount="indefinite" />
        </rect>
        <rect x={x + 46} y="48" width="3" height="6" fill="#1e1b4b" />
        <rect x={x + 51} y="48" width="3" height="6" fill="#1e1b4b" />
      </g>
      <rect x={x + 8} y="30" width="22" height="5" fill="#facc15" />
      <rect x={x + 44} y="64" width="12" height="4" fill="#0b0d10" />
    </g>
  )
}

/** Un banc de musculation, vu de la salle. */
function BancMuscu({ x, y }: { x: number; y: number }) {
  return (
    <g>
      <rect x={x - 6} y={y + 8} width="4" height="10" fill="#334155" />
      <rect x={x + 2} y={y + 8} width="4" height="10" fill="#334155" />
      <rect x={x - 12} y={y - 6} width="24" height="16" fill="#0b0d10" />
      <rect x={x - 10} y={y - 4} width="20" height="12" fill="#dc2626" />
      <rect x={x - 10} y={y - 4} width="20" height="3" fill="#ef4444" />
    </g>
  )
}

/** Le rack à squat : montants d'acier, barre chargée de disques. */
function RackSquat({ x }: { x: number }) {
  return (
    <g>
      <rect x={x + 6} y="26" width="5" height="68" fill="#475569" />
      <rect x={x + 66} y="26" width="5" height="68" fill="#475569" />
      <rect x={x + 6} y="26" width="65" height="4" fill="#475569" />
      <rect x={x} y="52" width="78" height="3" fill="#cbd5e1" />
      {[x - 2, x + 72].map((dx) => (
        <g key={dx}>
          <rect x={dx} y="42" width="8" height="22" fill="#111827" />
          <rect x={dx + 1} y="44" width="6" height="18" fill="#1f2937" />
        </g>
      ))}
      <rect x={x + 2} y="92" width="74" height="4" fill="#334155" />
    </g>
  )
}

function Halteres({ x, y, paires = 2 }: { x: number; y: number; paires?: number }) {
  return (
    <g>
      {[0, 10].slice(0, paires).map((dy) => (
        <g key={dy}>
          <rect x={x} y={y + dy} width="5" height="7" fill="#111827" />
          <rect x={x + 5} y={y + dy + 2} width="12" height="3" fill="#9ca3af" />
          <rect x={x + 17} y={y + dy} width="5" height="7" fill="#111827" />
        </g>
      ))}
    </g>
  )
}

/** Le blender du bar, et son bol de smoothie. */
function Blender({ x }: { x: number }) {
  return (
    <g>
      <rect x={x} y="40" width="20" height="8" fill="#111827" />
      <rect x={x + 2} y="22" width="16" height="18" fill="#e0f2fe" opacity="0.7" />
      <rect x={x + 3} y="30" width="14" height="10" fill="#f472b6" />
      <rect x={x + 4} y="18" width="12" height="4" fill="#111827" />
    </g>
  )
}

/** Le smoothie qui tourne dans le blender, quand quelqu'un attend au bar. */
function BlenderEnMarche() {
  return (
    <g pointerEvents="none">
      <rect x="762" y="30" width="12" height="10" fill="#fb7185">
        <Anim attributeName="fill" values="#f472b6;#fb7185;#f9a8d4" dur="0.3s" repeatCount="indefinite" />
      </rect>
    </g>
  )
}

/** La fontaine à eau en inox. */
function FontaineInox({ x }: { x: number }) {
  return (
    <g>
      <rect x={x} y="40" width="34" height="54" fill="#94a3b8" />
      <rect x={x + 2} y="42" width="30" height="50" fill="#cbd5e1" />
      <rect x={x + 4} y="46" width="26" height="8" fill="#64748b" />
      <rect x={x + 15} y="44" width="4" height="4" fill="#38bdf8" />
      <rect x={x + 10} y="64" width="14" height="4" fill="#475569" />
    </g>
  )
}

/** Les casiers bleus des vestiaires, l'un entrouvert. */
function Casiers({ x }: { x: number }) {
  return (
    <g>
      <rect x={x} y="16" width="54" height="82" fill="#1e3a8a" />
      {[0, 1, 2].map((c) => (
        <g key={c}>
          <rect x={x + 2 + c * 17} y="18" width="16" height="78" fill={c === 1 ? '#1d4ed8' : '#2563eb'} />
          {[24, 30, 36].map((y) => (
            <rect key={y} x={x + 6 + c * 17} y={y} width="8" height="2" fill="#1e3a8a" />
          ))}
          <rect x={x + 14 + c * 17} y="56" width="2" height="6" fill="#e5e7eb" />
        </g>
      ))}
      <rect x={x + 19} y="18" width="3" height="78" fill="#0b1220" />
    </g>
  )
}

/** La pile de matériel : un bidon de protéines, des tapis roulés, des élastiques. */
function PileMateriel({
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
        <rect x={x} y={y + 14} width="40" height="26" fill="#111827" />
        <rect x={x} y={y + 14} width="40" height="4" fill="#a3e635" />
        <text x={x + 20} y={y + 32} fontSize="7" textAnchor="middle" fill="#a3e635">
          WHEY
        </text>
      </Cliquable>
      <Cliquable {...lien('gpu-box')}>
        <rect x={x + 6} y={y} width="30" height="16" fill="#7c3aed" />
        <rect x={x + 6} y={y + 4} width="30" height="2" fill="#5b21b6" />
        <rect x={x + 6} y={y + 10} width="30" height="2" fill="#5b21b6" />
      </Cliquable>
      <Cliquable {...lien('ram-box')}>
        <rect x={x + 44} y={y + 22} width="22" height="18" fill="#f97316" />
        <rect x={x + 48} y={y + 26} width="14" height="10" fill="#fdba74" />
      </Cliquable>
    </g>
  )
}

/* ——— Les postes : un vélo d'appartement et sa console ——— */

/** La console du vélo, qui dit l'état de son agent. */
function Console({ cx, dy, statut, bientot }: { cx: number; dy: number; statut: Statut; bientot: number | null }) {
  const t = useTextes()
  const g = cx - 22
  return (
    <g>
      <rect x={cx - 2} y={dy + 4} width="4" height="16" fill="#9ca3af" />
      <rect x={g - 3} y={dy - 18} width="50" height="24" fill="#111827" />
      {statut === 'absent' ? (
        <>
          <rect x={g} y={dy - 15} width="44" height="18" fill="#020617" />
          <g transform={`rotate(-6 ${cx} ${dy - 6})`}>
            <rect x={cx - 15} y={dy - 14} width="30" height="15" fill="#fde68a" />
            <rect x={cx - 15} y={dy - 14} width="30" height="3" fill="#fcd34d" />
            <text x={cx} y={dy - 2} fontSize="7" textAnchor="middle" fill="#78350f">
              {t.offNote}
            </text>
          </g>
        </>
      ) : statut === 'en-echec' ? (
        <>
          <rect x={g} y={dy - 15} width="44" height="18" fill="#7f1d1d" />
          <text x={cx} y={dy - 2} fontSize="9" textAnchor="middle" fill="#fecaca">
            ERR
            <Anim attributeName="opacity" values="1;0.2" dur="0.8s" repeatCount="indefinite" />
          </text>
        </>
      ) : statut === 'au-travail' ? (
        <>
          <rect x={g} y={dy - 15} width="44" height="18" fill="#082f49" />
          {/* L'effort : des barres qui montent et descendent, comme un profil d'intervalle. */}
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <rect key={i} x={g + 4 + i * 7} y={dy - 4} width="5" height="4" fill={CYAN}>
              <Anim
                attributeName="height"
                values={['4;10;6;12;4', '8;4;12;6;8', '6;12;4;10;6'][i % 3]}
                dur="1.2s"
                repeatCount="indefinite"
              />
              <Anim
                attributeName="y"
                values={['-4;-10;-6;-12;-4', '-8;-4;-12;-6;-8', '-6;-12;-4;-10;-6'][i % 3]
                  .split(';')
                  .map((v) => String(dy + Number(v) + 2))
                  .join(';')}
                dur="1.2s"
                repeatCount="indefinite"
              />
            </rect>
          ))}
        </>
      ) : (
        <>
          <rect x={g} y={dy - 15} width="44" height="18" fill="#0f172a" />
          <text x={cx} y={dy - 3} fontSize="8" textAnchor="middle" fill={CYAN}>
            READY
          </text>
        </>
      )}
      {bientot ? (
        <>
          <rect x={g} y={dy - 2} width="44" height="7" fill="#0b1220" />
          <text x={cx} y={dy + 4} fontSize="6" textAnchor="middle" fill="#a3e635">
            {t.inMinutes(bientot)}
          </text>
        </>
      ) : null}
    </g>
  )
}

/** Le tapis de sol, sa tranche où s'inscrit le nom. */
function Tapis({ x, dy, dessus }: { x: number; dy: number; dessus: number }) {
  return (
    <>
      <rect x={x} y={dy} width={BUREAU.largeur} height={dessus} fill="#1f2227" />
      <rect x={x} y={dy} width={BUREAU.largeur} height="2" fill="#2f333a" />
      {[8, 16, 24, 32].map((v) => (
        <rect key={v} x={x + 2} y={dy + v} width={BUREAU.largeur - 4} height="1" fill="#26292f" />
      ))}
      <rect x={x} y={dy + dessus} width={BUREAU.largeur} height="12" fill="#15171b" />
    </>
  )
}

/** Le poste : un tapis, la console, le guidon, la roue d'inertie, une gourde, une serviette, des haltères. */
function Velo({ cx, dy, x, dessus, statut, accent, bientot, emoji }: PropsBureau) {
  const pedale = statut === 'au-travail'
  const fx = cx + 30
  const fy = dy + 16
  return (
    <g>
      <Tapis x={x} dy={dy} dessus={dessus} />
      {/* La roue d'inertie, qui tourne quand l'agent pédale. */}
      <circle cx={fx} cy={fy} r="10" fill="#111827" shapeRendering="auto" />
      <circle cx={fx} cy={fy} r="8" fill="#475569" shapeRendering="auto" />
      <rect x={fx - 1} y={fy - 8} width="2" height="16" fill="#cbd5e1">
        {pedale ? (
          <Anim
            attributeName="transform"
            type="rotate"
            values={`0 ${fx} ${fy};45 ${fx} ${fy};90 ${fx} ${fy};135 ${fx} ${fy}`}
            dur="0.3s"
            repeatCount="indefinite"
          />
        ) : null}
      </rect>
      <Console cx={cx - 4} dy={dy} statut={statut} bientot={bientot} />
      {/* Le guidon, poignées à la couleur de l'agent. */}
      <rect x={cx - 20} y={dy + 18} width="32" height="3" fill="#374151" />
      <rect x={cx - 24} y={dy + 16} width="6" height="7" fill={accent} />
      <rect x={cx + 10} y={dy + 16} width="6" height="7" fill={accent} />
      {/* La gourde et l'emoji, la serviette, les haltères. */}
      <rect x={x + 9} y={dy + 18} width="7" height="12" fill="#38bdf8" />
      <rect x={x + 10} y={dy + 15} width="5" height="3" fill="#0f172a" />
      <text x={x + 12} y={dy + 12} fontSize="10" textAnchor="middle">
        {emoji}
      </text>
      {/* La serviette pliée devant la gourde, les haltères au bout du tapis, loin de la roue. */}
      <rect x={x + 20} y={dy + 26} width="18" height="8" fill="#f8fafc" />
      <rect x={x + 20} y={dy + 31} width="18" height="2" fill={accent} />
      <Halteres x={x + 96} y={dy + 30} paires={1} />
      {/* En échec, le moteur de la roue fume. */}
      {statut === 'en-echec'
        ? [0, 0.6, 1.2].map((debut, i) => (
            <rect key={debut} x={fx - 4 + i * 3} y={fy - 8} width="6" height="6" fill="#9ca3af" opacity="0">
              <Anim attributeName="y" values={etapes(fy - 8, fy - 40, 6)} dur="1.8s" begin={`${debut}s`} repeatCount="indefinite" />
              <Anim attributeName="opacity" values={etapes(0.85, 0, 6)} dur="1.8s" begin={`${debut}s`} repeatCount="indefinite" />
            </rect>
          ))
        : null}
    </g>
  )
}

/** Le bureau du coach : planchette, chronomètre, shaker, petite coupe. */
function BureauCoach({ dy, x, dessus }: PropsBureau) {
  return (
    <g>
      <rect x={x} y={dy} width={BUREAU.largeur} height={dessus} fill="#e5e7eb" />
      <rect x={x} y={dy} width={BUREAU.largeur} height="3" fill="#f9fafb" />
      <rect x={x} y={dy + dessus} width={BUREAU.largeur} height="12" fill="#f97316" />
      <rect x={x + 3} y={dy + dessus + 12} width="4" height="7" fill="#111827" />
      <rect x={x + BUREAU.largeur - 7} y={dy + dessus + 12} width="4" height="7" fill="#111827" />
      <rect x={x + 10} y={dy + 6} width="22" height="28" fill="#a16207" />
      <rect x={x + 12} y={dy + 10} width="18" height="22" fill="#f8fafc" />
      {[14, 19, 24].map((v) => (
        <rect key={v} x={x + 14} y={dy + v} width="14" height="2" fill="#94a3b8" />
      ))}
      <rect x={x + 16} y={dy + 4} width="10" height="4" fill="#475569" />
      <circle cx={x + 98} cy={dy + 22} r="7" fill="#e5e7eb" stroke="#111827" strokeWidth="2" shapeRendering="auto" />
      <rect x={x + 97} y={dy + 13} width="2" height="4" fill="#111827" />
      <rect x={x + 97} y={dy + 17} width="2" height="5" fill="#ef4444" />
      <rect x={x + 78} y={dy + 4} width="9" height="18" fill="#a3e635" />
      <rect x={x + 78} y={dy + 4} width="9" height="4" fill="#111827" />
      <rect x={x + 104} y={dy + 2} width="8" height="7" fill="#facc15" />
      <rect x={x + 107} y={dy + 9} width="2" height="3" fill="#facc15" />
    </g>
  )
}

/** Le fauteuil du coach, rouge et noir. */
function FauteuilCoach({ x, y }: { x: number; y: number }) {
  return (
    <g>
      <rect x={x - 16} y={y - 34} width="32" height="42" fill="#0b0d10" />
      <rect x={x - 13} y={y - 31} width="26" height="36" fill="#b91c1c" />
      <rect x={x - 3} y={y - 31} width="6" height="36" fill="#0b0d10" />
      <rect x={x - 20} y={y - 8} width="6" height="16" fill="#0b0d10" />
      <rect x={x + 14} y={y - 8} width="6" height="16" fill="#0b0d10" />
    </g>
  )
}

/** La selle du vélo. */
function Selle({ x, y }: PropsSiege) {
  return (
    <g>
      <rect x={x - 9} y={y - 12} width="18" height="8" fill="#111827" />
      <rect x={x - 7} y={y - 11} width="14" height="3" fill="#374151" />
      <rect x={x - 2} y={y - 4} width="4" height="6" fill="#6b7280" />
    </g>
  )
}

/** Le cadre arrière du vélo et son pied stabilisateur, qui passent devant le pédaleur. */
function Cadre({ x, y, couleur }: PropsSiege) {
  return (
    <g>
      <rect x={x - 3} y={y} width="6" height="12" fill="#374151" />
      <rect x={x - 3} y={y + 4} width="6" height="2" fill={couleur} />
      <rect x={x - 14} y={y + 12} width="28" height="4" fill="#1f2937" />
      <rect x={x - 16} y={y + 14} width="4" height="3" fill="#111827" />
      <rect x={x + 12} y={y + 14} width="4" height="3" fill="#111827" />
    </g>
  )
}

/* ——— Les tenues ——— */

const MAILLOTS = ['#ef4444', '#f97316', '#facc15', '#a3e635', '#22d3ee', '#3b82f6', '#a855f7', '#ec4899', '#f8fafc', '#111827']
const CHEVEUX = ['#2a1d14', '#5a3a22', '#c8a165', '#111111', '#8a4b2a', '#e5e5e5', '#b45309']
const PEAUX = ['#f1c9a5', '#d9a57a', '#a86f48', '#7a4a2c', '#f5d6bf']
const SHORTS = ['#111827', '#1e293b', '#374151', '#1e3a8a', '#7f1d1d']

/** Le nombre de cet agent dans ce thème : chaque thème a sa graine, pour des tenues qui changent d'un thème à l'autre. */
const hachage = (id: string) => hacher(id, 13, 37)

/** Débardeurs et t-shirts de couleur vive, shorts, baskets blanches ; le coach en survêtement rouge à bandes. */
function tenueGym(id: string): Record<string, string> {
  if (id === CHEF_ID) {
    return { h: '#4b5563', s: '#d9a57a', e: '#1c1917', c: '#dc2626', C: '#991b1b', t: '#f8fafc', k: '#111827', p: '#dc2626', b: '#f8fafc' }
  }
  if (id.startsWith('livreur:')) {
    return { h: '#5b3a1a', s: '#d9a57a', e: '#1c1917', c: '#7c4a1e', C: '#5b3a1a', t: '#facc15', k: '#111827', p: '#5b3a1a', b: '#111827' }
  }
  const h = hachage(id)
  const maillot = MAILLOTS[h % MAILLOTS.length]
  return {
    h: CHEVEUX[(h >>> 4) % CHEVEUX.length],
    s: PEAUX[(h >>> 8) % PEAUX.length],
    e: '#1c1917',
    c: maillot,
    C: `color-mix(in oklab, ${maillot} 75%, black)`,
    t: maillot,
    k: '#111827',
    p: SHORTS[(h >>> 12) % SHORTS.length],
    b: '#f8fafc',
  }
}

/** Un sportif sur deux s'entraîne casque sur les oreilles. */
const casqueSport = (id: string) => id !== CHEF_ID && !estInvite(id) && hachage(id) % 2 === 0

/* Les lumières dans la nuit : l'enseigne du coach, la vitrine, les bornes, la télé, le bar, l'enseigne de la salle. */
const LUMIERES_GYM: Array<Lumiere> = [
  { x: 222, y: 36, r: 60, couleur: '#f97316' },
  { x: 61, y: 60, r: 40, couleur: '#facc15' },
  { x: 373, y: 50, r: 50, couleur: '#a855f7' },
  { x: 417, y: 50, r: 45, couleur: '#22d3ee' },
  { x: 516, y: 44, r: 70, couleur: '#a855f7' },
  { x: 790, y: 56, r: 60, couleur: '#a3e635' },
  { x: 695, y: 226, r: 60, couleur: '#a3e635' },
]

export const THEME_GYM: Theme = {
  coins: COINS_GYM,
  coinCafe: 'smoothie',
  fond: '#0b1220',
  Decor,
  Bureau: Velo,
  BureauChef: BureauCoach,
  plaque: '#e5e7eb',
  Assise: Selle,
  Dossier: Cadre,
  Fauteuil: FauteuilCoach,
  tenue: tenueGym,
  casque: casqueSport,
  CafeQuiCoule: BlenderEnMarche,
  lumieres: LUMIERES_GYM,
  // La console de chaque vélo éclaire en cyan.
  lumierePoste: (cx, dy) => [{ x: cx - 4, y: dy - 6, r: 40, couleur: CYAN }],
}
