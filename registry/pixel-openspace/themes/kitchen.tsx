'use client'

/*
 * La cuisine de restaurant : damier gris, carrelage métro, pianos de
 * cuisson en inox. Au travail, la poêle grésille sur la flamme ; en échec,
 * elle brûle et fume noir. Le chef de cuisine a son bureau, sa cave à vins et
 * son ardoise ; la salle a ses bornes, l'ardoise du menu, sa banquette rouge
 * et le passe avec sa sonnette ; l'arrière-cuisine a la machine à café, la
 * plonge, le lave-vaisselle et la chambre froide. Des vestes de brigade de
 * toutes les couleurs, une toque pour la moitié, un bandana pour les autres.
 */

import { BUREAU, CHEF_ID, type CoinDePause, type Statut } from '../engine'
import { Anim, Cliquable, MUR_SALLE, etapes, hacher, useTextes, type Lumiere } from '../primitives'
import type { PropsBureau, PropsDecor, PropsSiege, Theme } from '../theme'
import { Arcade, BorneCasseBriques, Porte } from './geek'
import type { SceneObject } from '../types'

/* Les coins de pause : la même géographie que les autres thèmes. */
const COINS_CUISINE: Array<CoinDePause> = [
  { nom: 'cafe', x: 768, y: 100 },
  { nom: 'plonge', x: 881, y: 104 },
  { nom: 'chambre-froide', x: 950, y: 108 },
  { nom: 'arcade', x: 372, y: 112 },
  { nom: 'arcade-2', x: 415, y: 112 },
  { nom: 'passe', x: 636, y: 108 },
  // Sur la banquette de la salle, face au menu : de dos.
  { nom: 'banquette-gauche', x: 482, y: 146, assis: true },
  { nom: 'banquette-droite', x: 538, y: 146, assis: true },
]

const INOX = { clair: '#e2e8f0', moyen: '#cbd5e1', sombre: '#94a3b8', ombre: '#64748b' }
const CRAIE = '#f1f5f9'
const ARDOISE = '#1f2937'

/** Un mur en carrelage métro blanc, ses joints gris, et sa frise noire en haut. */
function MurCarrele({ x, largeur, y = 20, hauteur = 32 }: { x: number; largeur: number; y?: number; hauteur?: number }) {
  return (
    <>
      <rect x={x} y={y - 6} width={largeur} height="6" fill="#57534e" />
      <rect x={x} y={y} width={largeur} height={hauteur} fill="url(#carrelage-metro)" />
      <rect x={x} y={y} width={largeur} height="3" fill={ARDOISE} />
      <rect x={x} y={y + hauteur} width={largeur} height="4" fill="#d6d3d1" />
    </>
  )
}

/** Une ardoise, son cadre en bois et un texte à la craie. */
function Ardoise({
  x,
  y,
  largeur,
  hauteur,
  texte,
  taille = 9,
}: {
  x: number
  y: number
  largeur: number
  hauteur: number
  texte: string
  taille?: number
}) {
  return (
    <g>
      <rect x={x} y={y} width={largeur} height={hauteur} fill="#78350f" />
      <rect x={x + 2} y={y + 2} width={largeur - 4} height={hauteur - 4} fill={ARDOISE} />
      <text x={x + largeur / 2} y={y + hauteur / 2 + taille / 3} fontSize={taille} textAnchor="middle" fill={CRAIE} letterSpacing="1">
        {texte}
      </text>
    </g>
  )
}

function Decor({ hauteur, titre, liens, aller, jouer }: PropsDecor) {
  const t = useTextes()
  const bas = hauteur - 20
  const lien = (objet: SceneObject) => ({ titre: t.objects[objet], faire: () => aller(objet), actif: Boolean(liens[objet]) })
  return (
    <>
      <defs>
        {/* Un damier adouci : en noir et blanc francs, les postes et les vestes blanches s'y perdaient. */}
        <pattern id="damier" width="32" height="32" patternUnits="userSpaceOnUse">
          <rect width="32" height="32" fill="#a8a29e" />
          <rect width="16" height="16" fill="#78716c" />
          <rect x="16" y="16" width="16" height="16" fill="#78716c" />
        </pattern>
        <pattern id="carrelage-metro" width="16" height="8" patternUnits="userSpaceOnUse">
          <rect width="16" height="8" fill="#f8fafc" />
          <rect y="7" width="16" height="1" fill="#cbd5e1" />
          <rect x="15" width="1" height="4" fill="#cbd5e1" />
          <rect x="7" y="4" width="1" height="4" fill="#cbd5e1" />
        </pattern>
        <pattern id="parquet-fonce" width="48" height="12" patternUnits="userSpaceOnUse">
          <rect width="48" height="12" fill="#6b3f22" />
          <rect y="11" width="48" height="1" fill="#4a2a16" />
          <rect x="30" width="1" height="12" fill="#4a2a16" />
        </pattern>
        <pattern id="tomettes" width="16" height="16" patternUnits="userSpaceOnUse">
          <rect width="16" height="16" fill="#b45309" />
          <rect width="16" height="1" fill="#92400e" />
          <rect width="1" height="16" fill="#92400e" />
        </pattern>
        <pattern id="sol-plonge" width="20" height="20" patternUnits="userSpaceOnUse">
          <rect width="20" height="20" fill="#d6d3d1" />
          <rect width="20" height="1" fill="#a8a29e" />
          <rect width="1" height="20" fill="#a8a29e" />
        </pattern>
      </defs>

      {/* Les sols : parquet foncé chez le chef, tomettes en salle, carreaux gris en arrière-cuisine, damier en cuisine. */}
      <rect x="20" y="56" width="310" height="142" fill="url(#parquet-fonce)" />
      <rect x="338" y="56" width="344" height="142" fill="url(#tomettes)" />
      <rect x="690" y="56" width="290" height="142" fill="url(#sol-plonge)" />
      <rect x="20" y="198" width="960" height={bas - 198} fill="url(#damier)" />

      {/* Les murs du fond. */}
      <MurCarrele x={20} largeur={310} />
      <MurCarrele x={338} largeur={344} />
      <MurCarrele x={690} largeur={290} />

      {/* Le bureau du chef de cuisine : la cave à vins, l'ardoise, le pot d'herbes. */}
      <Cliquable {...lien('server-rack')}>
        <CaveAVins x={32} />
      </Cliquable>
      <Ardoise x={160} y={22} largeur={124} hauteur={24} texte={t.leadOffice} taille={9} />
      <PotDHerbes x={300} y={66} />

      {/* La salle : les bornes, l'ardoise du menu, la banquette rouge et sa table, le passe. */}
      <Cliquable titre={t.objects.snake} faire={() => jouer('snake')}>
        <Arcade x={352} />
      </Cliquable>
      <Cliquable titre={t.objects.breakout} faire={() => jouer('casse-briques')}>
        <BorneCasseBriques x={396} />
      </Cliquable>
      <Cliquable {...lien('tv')}>
        <ArdoiseMenu x={452} />
      </Cliquable>
      <TableNappe x={478} y={98} />
      <Banquette x={458} y={130} />
      <Cliquable {...lien('workbench')}>
        <Passe x={598} />
      </Cliquable>
      <PotDHerbes x={346} y={164} />

      {/* L'arrière-cuisine : la machine à café, la plonge, le lave-vaisselle, la chambre froide. */}
      <rect x="720" y="44" width="134" height="40" fill={INOX.sombre} />
      <rect x="720" y="44" width="134" height="4" fill={INOX.clair} />
      <MachineACafe x={748} />
      <Plonge x={800} />
      <Cliquable {...lien('vending-machine')}>
        <LaveVaisselle x={862} />
      </Cliquable>
      <Cliquable {...lien('fridge')}>
        <ChambreFroide x={914} />
      </Cliquable>
      <rect x="760" y="140" width="80" height="10" fill={INOX.moyen} />
      <rect x="764" y="150" width="4" height="16" fill={INOX.ombre} />
      <rect x="832" y="150" width="4" height="16" fill={INOX.ombre} />
      <PotDHerbes x={704} y={164} />

      {/* La cuisine : les cagettes de légumes livrées. */}
      <Cagettes x={56} y={bas - 44} lien={lien} />

      {/* Le mur de la cuisine, carrelé, percé de ses trois entrées ; l'enseigne à la craie. */}
      {MUR_SALLE.map(([de, a]) => (
        <g key={de}>
          <MurCarrele x={de} largeur={a - de} y={204} hauteur={38} />
        </g>
      ))}
      <Ardoise x={655} y={210} largeur={80} hauteur={26} texte={titre} taille={titre.length > 14 ? 6 : 8} />
      <Porte bas={bas} />
      <rect x="330" y="14" width="8" height="190" fill="#57534e" />
      <rect x="682" y="14" width="8" height="190" fill="#57534e" />
      <rect x="12" y="14" width="8" height={bas - 6} fill="#44403c" />
      <rect x="980" y="14" width="8" height={bas - 6} fill="#44403c" />
      <rect x="12" y="6" width="976" height="8" fill="#44403c" />
      <rect x="12" y={bas} width="976" height="10" fill="#44403c" />
    </>
  )
}

/** La cave à vins du chef : des casiers en bois, des bouteilles couchées. */
function CaveAVins({ x }: { x: number }) {
  const vins = ['#7f1d1d', '#14532d', '#7f1d1d', '#fde68a', '#7f1d1d', '#14532d']
  return (
    <g>
      <rect x={x} y="20" width="60" height="86" fill="#5b3412" />
      <rect x={x + 3} y="23" width="54" height="80" fill="#2a170a" />
      {[0, 1, 2, 3].map((rang) =>
        [0, 1, 2, 3, 4].map((col) => (
          <g key={`${rang}-${col}`}>
            <rect x={x + 5 + col * 10} y={26 + rang * 19} width="8" height="16" fill="#5b3412" />
            <circle cx={x + 9 + col * 10} cy={34 + rang * 19} r="3" fill={vins[(rang * 5 + col) % vins.length]} shapeRendering="auto" />
          </g>
        )),
      )}
    </g>
  )
}

/** Un pot de terre cuite et ses herbes : basilic, thym, romarin. */
function PotDHerbes({ x, y }: { x: number; y: number }) {
  return (
    <g>
      <rect x={x - 2} y={y - 12} width="4" height="10" fill="#16a34a" />
      <rect x={x - 8} y={y - 10} width="5" height="7" fill="#22c55e" />
      <rect x={x + 3} y={y - 11} width="5" height="8" fill="#15803d" />
      <rect x={x - 9} y={y - 3} width="18" height="12" fill="#c2410c" />
      <rect x={x - 10} y={y - 4} width="20" height="3" fill="#9a3412" />
    </g>
  )
}

/** L'ardoise du menu, au mur de la salle : le plat du jour, à la craie. */
function ArdoiseMenu({ x }: { x: number }) {
  return (
    <g>
      <rect x={x} y="20" width="116" height="46" fill="#78350f" />
      <rect x={x + 3} y="23" width="110" height="40" fill={ARDOISE} />
      <text x={x + 58} y="34" fontSize="8" textAnchor="middle" fill="#fde68a" letterSpacing="1">
        MENU
      </text>
      {[40, 46, 52, 58].map((y, i) => (
        <g key={y}>
          <rect x={x + 12} y={y} width={[52, 40, 60, 34][i]} height="2" fill={CRAIE} opacity="0.8" />
          <rect x={x + 92} y={y} width="10" height="2" fill="#fde68a" opacity="0.9" />
        </g>
      ))}
    </g>
  )
}

/** La table de la salle, sa nappe à carreaux rouges, deux assiettes, une bougie. */
function TableNappe({ x, y }: { x: number; y: number }) {
  return (
    <g>
      <rect x={x} y={y} width="64" height="22" fill="#fafaf9" />
      {Array.from({ length: 8 }, (_, i) => (
        <rect key={i} x={x + i * 8} y={y} width="4" height="22" fill="#dc2626" opacity="0.55" />
      ))}
      {[0, 1].map((i) => (
        <rect key={i} x={x} y={y + 4 + i * 10} width="64" height="4" fill="#dc2626" opacity="0.45" />
      ))}
      <circle cx={x + 16} cy={y + 11} r="6" fill="#f8fafc" shapeRendering="auto" />
      <circle cx={x + 48} cy={y + 11} r="6" fill="#f8fafc" shapeRendering="auto" />
      <rect x={x + 31} y={y + 4} width="3" height="8" fill="#fef3c7" />
      <rect x={x + 31} y={y + 1} width="3" height="3" fill="#f59e0b">
        <Anim attributeName="opacity" values="1;0.6;1" dur="0.9s" repeatCount="indefinite" />
      </rect>
    </g>
  )
}

/** La banquette en skaï rouge, capitonnée, vue de dos. */
function Banquette({ x, y }: { x: number; y: number }) {
  return (
    <g>
      <rect x={x} y={y + 10} width="104" height="24" fill="#991b1b" />
      <rect x={x + 4} y={y} width="96" height="20" fill="#b91c1c" />
      {[16, 36, 56, 76].map((dx) => (
        <rect key={dx} x={x + dx} y={y + 8} width="2" height="2" fill="#7f1d1d" />
      ))}
      <rect x={x + 4} y={y + 34} width="4" height="4" fill="#44403c" />
      <rect x={x + 96} y={y + 34} width="4" height="4" fill="#44403c" />
    </g>
  )
}

/** Le passe : le comptoir inox, les lampes chauffantes, les assiettes qui attendent, la sonnette. */
function Passe({ x }: { x: number }) {
  return (
    <g>
      <rect x={x} y="20" width="76" height="4" fill={INOX.ombre} />
      {[x + 8, x + 34, x + 60].map((lx) => (
        <g key={lx}>
          <rect x={lx} y="24" width="8" height="8" fill={INOX.sombre} />
          <rect x={lx + 1} y="32" width="6" height="2" fill="#f97316">
            <Anim attributeName="opacity" values="1;0.7;1" dur="1.2s" repeatCount="indefinite" />
          </rect>
        </g>
      ))}
      <rect x={x} y="60" width="76" height="10" fill={INOX.clair} />
      <rect x={x} y="70" width="76" height="20" fill={INOX.sombre} />
      {[x + 8, x + 30, x + 52].map((px) => (
        <g key={px}>
          <circle cx={px + 8} cy="58" r="8" fill="#f8fafc" shapeRendering="auto" />
          <rect x={px + 4} y="54" width="8" height="5" fill="#ea580c" />
          <rect x={px + 6} y="53" width="3" height="2" fill="#16a34a" />
        </g>
      ))}
      <rect x={x + 66} y="48" width="6" height="4" fill="#fbbf24" />
      <rect x={x + 68} y="46" width="2" height="2" fill="#fbbf24" />
    </g>
  )
}

/** La machine à café du personnel, inox et noir. */
function MachineACafe({ x }: { x: number }) {
  return (
    <g>
      <rect x={x} y="18" width="40" height="30" fill={INOX.ombre} />
      <rect x={x + 2} y="20" width="36" height="10" fill={INOX.moyen} />
      <rect x={x + 30} y="23" width="4" height="4" fill="#22c55e" />
      <rect x={x + 14} y="34" width="12" height="4" fill="#1f2937" />
      <rect x={x + 15} y="38" width="10" height="8" fill="#fafaf9" />
    </g>
  )
}

/** Le café qui coule dans la tasse, quand quelqu'un attend devant. */
function CafeCuisine() {
  return (
    <g pointerEvents="none">
      <rect x="767" y="36" width="2" height="5" fill="#6b3a1e">
        <Anim attributeName="opacity" values="1;0.4;1" dur="0.5s" repeatCount="indefinite" />
      </rect>
    </g>
  )
}

/** La plonge : le bac inox, le robinet col de cygne, la pile d'assiettes. */
function Plonge({ x }: { x: number }) {
  return (
    <g>
      <rect x={x} y="50" width="50" height="10" fill="#475569" />
      <rect x={x + 22} y="28" width="3" height="22" fill={INOX.clair} />
      <rect x={x + 22} y="28" width="12" height="3" fill={INOX.clair} />
      <rect x={x + 32} y="31" width="2" height="5" fill={INOX.clair} />
      {[0, 1, 2, 3].map((i) => (
        <rect key={i} x={x + 4} y={46 - i * 3} width="14" height="2" fill="#f8fafc" />
      ))}
    </g>
  )
}

/** Le lave-vaisselle à capot, qui fume à chaque cycle. */
function LaveVaisselle({ x }: { x: number }) {
  return (
    <g>
      <rect x={x} y="22" width="44" height="72" fill={INOX.sombre} />
      <rect x={x + 2} y="24" width="40" height="40" fill={INOX.moyen} />
      <rect x={x + 6} y="70" width="32" height="6" fill={INOX.ombre} />
      <rect x={x + 30} y="80" width="6" height="4" fill="#22c55e" />
      {[0, 0.8].map((debut) => (
        <rect key={debut} x={x + 18} y="18" width="8" height="6" fill="#f8fafc" opacity="0">
          <Anim attributeName="y" values={etapes(18, 0, 5)} dur="1.6s" begin={`${debut}s`} repeatCount="indefinite" />
          <Anim attributeName="opacity" values={etapes(0.7, 0, 5)} dur="1.6s" begin={`${debut}s`} repeatCount="indefinite" />
        </rect>
      ))}
    </g>
  )
}

/** La chambre froide : sa porte inox épaisse, sa poignée, son givre. */
function ChambreFroide({ x }: { x: number }) {
  return (
    <g>
      <rect x={x} y="14" width="60" height="84" fill={INOX.ombre} />
      <rect x={x + 3} y="17" width="54" height="78" fill={INOX.moyen} />
      <rect x={x + 44} y="44" width="8" height="20" fill="#334155" />
      <rect x={x + 8} y="22" width="22" height="8" fill="#0f172a" />
      <text x={x + 19} y="28" fontSize="5" textAnchor="middle" fill="#38bdf8">
        -2°
      </text>
      {[24, 40, 56].map((y) => (
        <rect key={y} x={x + 3} y={y} width="54" height="1" fill="#e0f2fe" opacity="0.6" />
      ))}
    </g>
  )
}

/** Les cagettes de légumes livrées : tomates, carottes, salades. */
function Cagettes({
  x,
  y,
  lien,
}: {
  x: number
  y: number
  lien: (objet: SceneObject) => { titre: string; faire: () => void; actif: boolean }
}) {
  const cagette = (cx: number, cy: number, largeur: number, legume: string) => (
    <>
      <rect x={cx} y={cy} width={largeur} height="16" fill="#d4a373" />
      <rect x={cx} y={cy + 6} width={largeur} height="2" fill="#a47148" />
      {Array.from({ length: Math.floor(largeur / 7) }, (_, i) => (
        <rect key={i} x={cx + 2 + i * 7} y={cy - 4} width="6" height="6" fill={legume} />
      ))}
    </>
  )
  return (
    <g>
      <Cliquable {...lien('cpu-box')}>{cagette(x, y + 24, 40, '#dc2626')}</Cliquable>
      <Cliquable {...lien('gpu-box')}>{cagette(x + 6, y + 4, 30, '#f97316')}</Cliquable>
      <Cliquable {...lien('ram-box')}>{cagette(x + 46, y + 24, 22, '#22c55e')}</Cliquable>
    </g>
  )
}

/* ——— Les postes ——— */

/** La barre à bons au-dessus du piano : le bon en cours, ou le post-it d'un poste fermé. */
function BarreABons({ cx, dy, statut, bientot }: { cx: number; dy: number; statut: Statut; bientot: number | null }) {
  const t = useTextes()
  return (
    <g>
      <rect x={cx - 30} y={dy - 18} width="60" height="3" fill={INOX.ombre} />
      {statut === 'absent' ? (
        <g transform={`rotate(-5 ${cx} ${dy - 8})`}>
          <rect x={cx - 15} y={dy - 16} width="30" height="14" fill="#fde68a" />
          <text x={cx} y={dy - 6} fontSize="7" textAnchor="middle" fill="#78350f">
            {t.offNote}
          </text>
        </g>
      ) : (
        [-20, -4, 12].map((dx, i) => (
          <g key={dx}>
            <rect
              x={cx + dx}
              y={dy - 15}
              width="12"
              height={i === 1 && statut === 'en-echec' ? 12 : 10}
              fill={i === 1 && statut === 'en-echec' ? '#fecaca' : '#fafaf9'}
            />
            <rect x={cx + dx + 2} y={dy - 12} width="8" height="1" fill="#94a3b8" />
            <rect x={cx + dx + 2} y={dy - 9} width="6" height="1" fill="#94a3b8" />
          </g>
        ))
      )}
      {bientot ? (
        <>
          <rect x={cx - 24} y={dy - 6} width="48" height="8" fill="#fafaf9" />
          <text x={cx} y={dy} fontSize="6" textAnchor="middle" fill="#b91c1c">
            {t.inMinutes(bientot)}
          </text>
        </>
      ) : null}
    </g>
  )
}

/** La poêle sur son feu : ce qui s'y passe dit l'état de l'agent. */
function Feu({ cx, dy, statut }: { cx: number; dy: number; statut: Statut }) {
  const flamme = statut === 'au-travail' || statut === 'en-echec'
  const echec = statut === 'en-echec'
  return (
    <g>
      {/* Le brûleur, puis ses flammes. */}
      <rect x={cx - 14} y={dy + 14} width="28" height="4" fill="#1f2937" />
      {flamme
        ? [-10, -4, 2, 8].map((dx, i) => (
            <rect key={dx} x={cx + dx} y={dy + (echec ? 6 : 10)} width="4" height={echec ? 10 : 5} fill={echec ? '#f97316' : '#3b82f6'}>
              <Anim attributeName="height" values={echec ? `10;14;8;10` : `5;7;4;5`} dur={`${0.4 + i * 0.1}s`} repeatCount="indefinite" />
            </rect>
          ))
        : null}
      {statut === 'absent' ? (
        // Feux éteints, le couvercle posé sur la marmite.
        <>
          <rect x={cx - 12} y={dy + 2} width="24" height="12" fill={INOX.ombre} />
          <rect x={cx - 13} y={dy} width="26" height="3" fill={INOX.sombre} />
          <rect x={cx - 2} y={dy - 2} width="4" height="2" fill="#1f2937" />
        </>
      ) : statut === 'au-travail' || statut === 'en-echec' ? (
        // La poêle et son manche ; dedans, ce qui saute, ou ce qui brûle.
        <>
          <rect x={cx - 14} y={dy + 4} width="28" height="8" fill="#1f2937" />
          <rect x={cx + 14} y={dy + 6} width="14" height="3" fill="#44403c" />
          <rect x={cx - 10} y={dy + 4} width="20" height="3" fill={echec ? '#1c1917' : '#ea580c'} />
          {echec ? null : (
            <>
              <rect x={cx - 6} y={dy} width="4" height="3" fill="#16a34a">
                <Anim attributeName="y" values={`${dy};${dy - 8};${dy}`} dur="0.8s" repeatCount="indefinite" />
              </rect>
              <rect x={cx + 3} y={dy + 1} width="3" height="3" fill="#facc15">
                <Anim attributeName="y" values={`${dy + 1};${dy - 6};${dy + 1}`} dur="0.8s" begin="0.4s" repeatCount="indefinite" />
              </rect>
            </>
          )}
        </>
      ) : (
        // Au repos, la marmite mijote.
        <>
          <rect x={cx - 11} y={dy + 1} width="22" height="13" fill={INOX.sombre} />
          <rect x={cx - 12} y={dy} width="24" height="3" fill={INOX.clair} />
          <rect x={cx - 9} y={dy + 1} width="18" height="2" fill="#b45309" />
        </>
      )}
      {/* La vapeur de ce qui cuit, ou la fumée noire de ce qui brûle. */}
      {statut === 'absent'
        ? null
        : [0, 0.6, 1.2].map((debut, i) => (
            <rect
              key={debut}
              x={cx - 6 + i * 5}
              y={dy}
              width={echec ? 8 : 4}
              height={echec ? 8 : 4}
              fill={echec ? '#1c1917' : '#f8fafc'}
              opacity="0"
            >
              <Anim
                attributeName="y"
                values={etapes(dy, dy - (echec ? 30 : 18), 6)}
                dur="1.8s"
                begin={`${debut}s`}
                repeatCount="indefinite"
              />
              <Anim
                attributeName="opacity"
                values={etapes(echec ? 0.85 : 0.5, 0, 6)}
                dur="1.8s"
                begin={`${debut}s`}
                repeatCount="indefinite"
              />
            </rect>
          ))}
    </g>
  )
}

/** Le piano de cuisson : le dessus inox, la façade et ses boutons. */
function Piano({ x, dy, dessus }: { x: number; dy: number; dessus: number }) {
  return (
    <>
      <rect x={x} y={dy} width={BUREAU.largeur} height={dessus} fill={INOX.moyen} />
      <rect x={x} y={dy} width={BUREAU.largeur} height="3" fill={INOX.clair} />
      <rect x={x} y={dy + dessus} width={BUREAU.largeur} height="12" fill={INOX.sombre} />
      {[0.18, 0.82].map((k) => (
        <rect key={k} x={x + BUREAU.largeur * k - 3} y={dy + dessus + 12} width="6" height="7" fill={INOX.ombre} />
      ))}
    </>
  )
}

/** Le poste : le piano, le feu, la barre à bons, la planche à découper et le sel. */
function PosteCuisson({ cx, dy, x, dessus, statut, bientot, emoji }: PropsBureau) {
  return (
    <g>
      <Piano x={x} dy={dy} dessus={dessus} />
      <BarreABons cx={cx - 4} dy={dy} statut={statut} bientot={bientot} />
      {/* Le feu, grossi de moitié : c'est lui qui dit l'état du poste, il doit se lire de loin. */}
      <g transform={`translate(${cx - 4} ${dy + 14}) scale(1.5) translate(${-(cx - 4)} ${-(dy + 14)})`}>
        <Feu cx={cx - 4} dy={dy + 4} statut={statut} />
      </g>
      {/* La planche à découper et ses légumes, le sel, le torchon. */}
      <rect x={x + 86} y={dy + 6} width="22" height="14" fill="#d4a373" />
      <rect x={x + 90} y={dy + 9} width="5" height="5" fill="#dc2626" />
      <rect x={x + 98} y={dy + 10} width="6" height="3" fill="#f97316" />
      <rect x={x + 96} y={dy + 24} width="6" height="8" fill="#f8fafc" />
      <rect x={x + 6} y={dy + 22} width="14" height="8" fill="#f8fafc" />
      <rect x={x + 6} y={dy + 25} width="14" height="1" fill="#3b82f6" />
      <text x={x + 12} y={dy + 13} fontSize="10" textAnchor="middle">
        {emoji}
      </text>
    </g>
  )
}

/** Le bureau du chef de cuisine : le livre de recettes, le portable, un verre de vin. */
function BureauChefCuisine({ dy, x, dessus }: PropsBureau) {
  return (
    <g>
      <rect x={x} y={dy} width={BUREAU.largeur} height={dessus} fill="#8b5a2b" />
      <rect x={x} y={dy} width={BUREAU.largeur} height="3" fill="#a16207" />
      <rect x={x} y={dy + dessus} width={BUREAU.largeur} height="12" fill="#5b3412" />
      <rect x={x + 8} y={dy + 6} width="30" height="20" fill="#7f1d1d" />
      <rect x={x + 22} y={dy + 6} width="2" height="20" fill="#fde68a" />
      <rect x={x + 84} y={dy + 6} width="26" height="18" fill={INOX.sombre} />
      <rect x={x + 86} y={dy + 8} width="22" height="13" fill={INOX.moyen} />
      <rect x={x + 56} y={dy + 10} width="6" height="8" fill="#7f1d1d" opacity="0.85" />
      <rect x={x + 58} y={dy + 18} width="2" height="6" fill="#e5e7eb" />
    </g>
  )
}

/** Le fauteuil en cuir du chef de cuisine. */
function FauteuilCuir({ x, y }: { x: number; y: number }) {
  return (
    <g>
      <rect x={x - 16} y={y - 30} width="32" height="38" fill="#5b3412" />
      <rect x={x - 13} y={y - 27} width="26" height="32" fill="#7c4a1e" />
      <rect x={x - 18} y={y - 6} width="5" height="14" fill="#5b3412" />
      <rect x={x + 13} y={y - 6} width="5" height="14" fill="#5b3412" />
    </g>
  )
}

/** Le tabouret inox des postes, un liseré de la couleur de l'agent. */
function AssiseTabouret({ x, y, couleur }: PropsSiege) {
  return (
    <g>
      <rect x={x - 10} y={y - 11} width="20" height="10" fill={INOX.sombre} />
      <rect x={x - 10} y={y - 11} width="20" height="2" fill={couleur} />
    </g>
  )
}

function PiedsTabouret({ x, y, couleur }: PropsSiege) {
  return (
    <g>
      <rect x={x - 10} y={y + 4} width="20" height="3" fill={INOX.ombre} />
      <rect x={x - 10} y={y + 4} width="20" height="1" fill={couleur} />
      <rect x={x - 8} y={y + 7} width="2" height="10" fill={INOX.ombre} />
      <rect x={x + 6} y={y + 7} width="2" height="10" fill={INOX.ombre} />
      <rect x={x - 8} y={y + 13} width="16" height="1" fill={INOX.ombre} />
    </g>
  )
}

/* ——— Les tenues ——— */

const TABLIERS = ['#f8fafc', '#1e3a8a', '#1f2937', '#7f1d1d', '#f8fafc', '#334155']
/* Des vestes de toutes les brigades : tout en blanc, de dos, les cuisiniers ne se distinguaient plus. */
const VESTES = ['#f8fafc', '#1f2937', '#f8fafc', '#334155', '#1e3a8a', '#7f1d1d', '#e2e8f0']
const BANDANAS = ['#dc2626', '#2563eb', '#16a34a', '#f59e0b', '#9333ea']
const PEAUX = ['#f1c9a5', '#d9a57a', '#a86f48', '#7a4a2c', '#f5d6bf']
const PANTALONS = ['#1f2937', '#374151', '#111827']

/** Le nombre de cet agent dans ce thème : chaque thème a sa graine, pour des tenues qui changent d'un thème à l'autre. */
const hachage = (id: string) => hacher(id, 19, 43)

/** Vestes de brigade de toutes les couleurs, toque ou bandana ; le chef de cuisine en veste noire et toque. */
function tenueCuisine(id: string): Record<string, string> {
  if (id === CHEF_ID) {
    return { h: '#ffffff', s: '#f1c9a5', e: '#1c1917', c: '#111827', C: '#030712', t: '#f8fafc', k: '#e5e7eb', p: '#1f2937', b: '#111827' }
  }
  if (id.startsWith('livreur:')) {
    return { h: '#5b3a1a', s: '#d9a57a', e: '#1c1917', c: '#16a34a', C: '#14532d', t: '#facc15', k: '#111827', p: '#1f2937', b: '#111827' }
  }
  const h = hachage(id)
  const veste = VESTES[(h >>> 15) % VESTES.length]
  return {
    // Une toque blanche pour la moitié, un bandana de couleur pour les autres.
    h: h % 2 === 0 ? BANDANAS[(h >>> 3) % BANDANAS.length] : '#ffffff',
    s: PEAUX[(h >>> 6) % PEAUX.length],
    e: '#1c1917',
    c: veste,
    C: `color-mix(in oklab, ${veste} 75%, black)`,
    t: TABLIERS[(h >>> 9) % TABLIERS.length],
    k: '#e5e7eb',
    p: PANTALONS[(h >>> 12) % PANTALONS.length],
    b: '#111827',
  }
}

/* La nuit : les hottes au-dessus des pièces, les lampes chauffantes du passe, la bougie de la salle. */
const LUMIERES_CUISINE: Array<Lumiere> = [
  { x: 175, y: 110, r: 85, couleur: '#fbbf24' },
  { x: 510, y: 120, r: 80, couleur: '#fdba74' },
  { x: 835, y: 110, r: 85, couleur: '#e2e8f0' },
  { x: 636, y: 34, r: 50, couleur: '#f97316' },
  { x: 510, y: 104, r: 30, couleur: '#f59e0b' },
  { x: 373, y: 50, r: 45, couleur: '#a855f7' },
  { x: 417, y: 50, r: 40, couleur: '#22d3ee' },
]

export const THEME_CUISINE: Theme = {
  coins: COINS_CUISINE,
  coinCafe: 'cafe',
  fond: '#1c1917',
  Decor,
  Bureau: PosteCuisson,
  BureauChef: BureauChefCuisine,
  plaque: '#0f172a',
  Assise: AssiseTabouret,
  Dossier: PiedsTabouret,
  Fauteuil: FauteuilCuir,
  tenue: tenueCuisine,
  // Des toques et des bandanas, pas de casque.
  casque: () => false,
  CafeQuiCoule: CafeCuisine,
  lumieres: LUMIERES_CUISINE,
  // La hotte de chaque poste, et la flamme quand elle est allumée.
  lumierePoste: (cx, dy) => [{ x: cx, y: dy + 8, r: 55, couleur: '#fdba74' }],
}
