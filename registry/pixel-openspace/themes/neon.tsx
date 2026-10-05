'use client'

/*
 * La ville néon, la nuit : béton sombre, tubes roses et cyan, enseignes en
 * katakana. Le chef est un fixer, derrière sa baie de serveurs ; l'espace
 * détente a ses bornes, un panneau holographique, un banc éclairé par en
 * dessous et l'établi où l'on répare un drone ; le coin repas est un stand de
 * ramen sous ses rideaux rouges, avec un distributeur de canettes qui
 * clignote et un frigo couvert d'autocollants. Les postes sont des écrans
 * holographiques : le code y défile en vert, une panne y crache des glitchs.
 * Sweats sombres, cheveux parfois roses, cyan ou violets, un casque sur deux.
 */

import { BUREAU, CHEF_ID, estInvite, type CoinDePause, type Statut } from '../engine'
import { Anim, Cliquable, MUR_SALLE, Neon, etapes, useTextes, hacher, type Lumiere } from '../primitives'
import type { PropsBureau, PropsDecor, PropsSiege, Theme } from '../theme'
import { Arcade, BorneCasseBriques, Porte } from './geek'
import type { SceneObject } from '../types'

/* Les coins de pause : la même géographie que les autres thèmes. */
const COINS_NEON: Array<CoinDePause> = [
  { nom: 'cafe', x: 768, y: 100 },
  { nom: 'distributeur', x: 881, y: 104 },
  { nom: 'frigo', x: 950, y: 108 },
  { nom: 'arcade', x: 372, y: 112 },
  { nom: 'arcade-2', x: 415, y: 112 },
  { nom: 'etabli', x: 636, y: 108 },
  // Sur le banc, face au panneau holographique : de dos.
  { nom: 'banc-gauche', x: 482, y: 146, assis: true },
  { nom: 'banc-droite', x: 538, y: 146, assis: true },
]

const ROSE = '#f472b6'
const CYAN = '#22d3ee'
const VIOLET = '#a855f7'
const NUIT = '#0b0714'
const BETON = { arete: '#2a2238', face: '#171124', plinthe: '#0f0a1a' }

/** Un mur de béton sombre, son tube néon en haut. */
function MurNeon({
  x,
  largeur,
  y = 20,
  hauteur = 32,
  tube,
}: {
  x: number
  largeur: number
  y?: number
  hauteur?: number
  tube?: string
}) {
  return (
    <>
      <rect x={x} y={y - 6} width={largeur} height="6" fill={BETON.arete} />
      <rect x={x} y={y} width={largeur} height={hauteur} fill={BETON.face} />
      {tube ? (
        <>
          <rect x={x + 4} y={y + 2} width={largeur - 8} height="2" fill={tube} filter="url(#flou-neon)" opacity="0.8" />
          <rect x={x + 4} y={y + 2} width={largeur - 8} height="1" fill="#fdf4ff" opacity="0.9" />
        </>
      ) : null}
      <rect x={x} y={y + hauteur} width={largeur} height="4" fill={BETON.plinthe} />
    </>
  )
}

/** Des katakana qui tombent sur un écran, colonne par colonne. */
function Pluie({ x, y, largeur, hauteur, couleur = '#4ade80' }: { x: number; y: number; largeur: number; hauteur: number; couleur?: string }) {
  const colonnes = Math.floor(largeur / 8)
  const signes = 'アイウエオカキクケコサシスセソ'
  return (
    <g>
      {Array.from({ length: colonnes }, (_, i) => (
        <text key={i} x={x + 4 + i * 8} y={y + 8} fontSize="7" textAnchor="middle" fill={couleur} opacity="0.85">
          {signes[(i * 5) % signes.length]}
          <Anim attributeName="y" values={etapes(y + 6, y + hauteur - 2, 6)} dur={`${1.6 + (i % 3) * 0.5}s`} begin={`${i * 0.3}s`} repeatCount="indefinite" />
        </text>
      ))}
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
        <pattern id="dalle-neon" width="40" height="40" patternUnits="userSpaceOnUse">
          <rect width="40" height="40" fill="#120d1c" />
          <rect width="40" height="1" fill="#1f1830" />
          <rect width="1" height="40" fill="#1f1830" />
          {/* Les reflets mouillés des néons sur le sol. */}
          <rect x="8" y="14" width="10" height="1" fill={CYAN} opacity="0.18" />
          <rect x="24" y="30" width="8" height="1" fill={ROSE} opacity="0.16" />
        </pattern>
        <pattern id="moquette-neon" width="10" height="10" patternUnits="userSpaceOnUse">
          <rect width="10" height="10" fill="#1d1230" />
          <rect x="2" y="2" width="2" height="2" fill="#241640" />
        </pattern>
        <pattern id="grille-neon" width="24" height="24" patternUnits="userSpaceOnUse">
          <rect width="24" height="24" fill="#0e0a17" />
          <rect width="24" height="1" fill={ROSE} opacity="0.22" />
          <rect width="1" height="24" fill={ROSE} opacity="0.22" />
        </pattern>
        <pattern id="planches-neon" width="32" height="10" patternUnits="userSpaceOnUse">
          <rect width="32" height="10" fill="#2a1a14" />
          <rect y="9" width="32" height="1" fill="#1c110d" />
          <rect x="20" width="1" height="10" fill="#1c110d" />
        </pattern>
      </defs>

      {/* Les sols : moquette violette chez le fixer, dalles quadrillées de rose à la détente, planches au stand de ramen, métal mouillé dans la grande salle. */}
      <rect x="20" y="56" width="310" height="142" fill="url(#moquette-neon)" />
      <rect x="338" y="56" width="344" height="142" fill="url(#grille-neon)" />
      <rect x="690" y="56" width="290" height="142" fill="url(#planches-neon)" />
      <rect x="20" y="198" width="960" height={bas - 198} fill="url(#dalle-neon)" />

      {/* Les murs du fond, chacun son tube. */}
      <MurNeon x={20} largeur={310} tube={VIOLET} />
      <MurNeon x={338} largeur={344} tube={ROSE} />
      <MurNeon x={690} largeur={290} tube={CYAN} />

      {/* Chez le fixer : la baie de serveurs, son enseigne au néon rose. */}
      <Cliquable {...lien('server-rack')}>
        <BaieServeurs x={34} />
      </Cliquable>
      <Neon x={222} y={42} texte={t.leadOffice} couleur={ROSE} taille={10} />

      {/* L'espace détente : les bornes, le panneau holographique, le banc, l'établi du drone. */}
      <Cliquable titre={t.objects.snake} faire={() => jouer('snake')}>
        <Arcade x={352} />
      </Cliquable>
      <Cliquable titre={t.objects.breakout} faire={() => jouer('casse-briques')}>
        <BorneCasseBriques x={396} />
      </Cliquable>
      <Cliquable {...lien('tv')}>
        <Hologramme x={452} />
      </Cliquable>
      <Banc x={458} y={130} />
      <Cliquable {...lien('workbench')}>
        <EtabliDrone x={598} />
      </Cliquable>

      {/* Le stand de ramen : le comptoir, les rideaux rouges, le bol qui fume, le distributeur, le frigo. */}
      <StandRamen />
      <Cliquable {...lien('vending-machine')}>
        <DistributeurCanettes x={864} />
      </Cliquable>
      <Cliquable {...lien('fridge')}>
        <FrigoAutocollants x={922} />
      </Cliquable>
      {[786, 848].map((x) => (
        <g key={x}>
          <rect x={x} y="140" width="12" height="4" fill="#3f2a1e" />
          <rect x={x + 5} y="144" width="2" height="18" fill="#52525b" />
          <rect x={x + 1} y="160" width="10" height="2" fill="#52525b" />
        </g>
      ))}

      {/* La grande salle : les caisses de matériel. */}
      <Caisses x={56} y={bas - 44} lien={lien} />

      {/* Le mur de la grande salle, son enseigne au néon cyan. */}
      {MUR_SALLE.map(([de, a]) => (
        <MurNeon key={de} x={de} largeur={a - de} y={204} hauteur={38} tube={a - de > 90 ? CYAN : undefined} />
      ))}
      <Neon x={695} y={230} texte={titre} couleur={CYAN} taille={titre.length > 14 ? 7 : 9} />
      <Porte bas={bas} />
      <rect x="330" y="14" width="8" height="190" fill={VIOLET} opacity="0.35" />
      <rect x="330" y="14" width="2" height="190" fill={ROSE} opacity="0.6" />
      <rect x="682" y="14" width="8" height="190" fill={BETON.arete} />
      <rect x="12" y="14" width="8" height={bas - 6} fill={BETON.arete} />
      <rect x="980" y="14" width="8" height={bas - 6} fill={BETON.arete} />
      <rect x="12" y="6" width="976" height="8" fill={BETON.arete} />
      <rect x="12" y={bas} width="976" height="10" fill={BETON.arete} />
    </>
  )
}

/** La baie de serveurs du fixer : ses tiroirs, ses diodes qui clignotent. */
function BaieServeurs({ x }: { x: number }) {
  return (
    <g>
      <rect x={x} y="18" width="52" height="88" fill="#05040a" />
      <rect x={x + 3} y="21" width="46" height="82" fill="#111020" />
      {Array.from({ length: 7 }, (_, i) => (
        <g key={i}>
          <rect x={x + 5} y={24 + i * 11} width="42" height="8" fill="#1c1a30" />
          {[0, 1, 2].map((d) => (
            <rect key={d} x={x + 9 + d * 5} y={27 + i * 11} width="2" height="2" fill={[CYAN, ROSE, '#4ade80'][(i + d) % 3]}>
              <Anim attributeName="opacity" values="1;0.2;1" dur={`${0.7 + ((i + d) % 4) * 0.3}s`} repeatCount="indefinite" />
            </rect>
          ))}
          <rect x={x + 30} y={27 + i * 11} width="14" height="2" fill="#2e2a48" />
        </g>
      ))}
    </g>
  )
}

/** Le panneau holographique : un visage en lignes cyan, des katakana qui tombent. */
function Hologramme({ x }: { x: number }) {
  return (
    <g>
      <rect x={x} y="22" width="116" height="42" fill="#05040a" />
      <rect x={x + 3} y="25" width="110" height="36" fill="#0b1324" />
      <Pluie x={x + 4} y={25} largeur={52} hauteur={36} couleur={CYAN} />
      <g opacity="0.9">
        <rect x={x + 70} y="30" width="22" height="26" fill="none" stroke={ROSE} strokeWidth="2" />
        <rect x={x + 75} y="38" width="4" height="3" fill={ROSE} />
        <rect x={x + 83} y="38" width="4" height="3" fill={ROSE} />
        <rect x={x + 77} y="47" width="8" height="2" fill={ROSE}>
          <Anim attributeName="width" values="8;4;8" dur="1.2s" repeatCount="indefinite" />
        </rect>
        <Anim attributeName="opacity" values="0.9;0.5;0.9;0.9" dur="2.6s" repeatCount="indefinite" />
      </g>
      <rect x={x + 3} y="25" width="110" height="2" fill={CYAN} opacity="0.4">
        <Anim attributeName="y" values={etapes(25, 59, 8)} dur="2s" repeatCount="indefinite" />
      </rect>
      <rect x={x + 54} y="64" width="8" height="6" fill="#2a2238" />
    </g>
  )
}

/** Le banc, vu de dos depuis la salle, éclairé par un tube rose en dessous. */
function Banc({ x, y }: { x: number; y: number }) {
  return (
    <g>
      <rect x={x} y={y + 10} width="104" height="22" fill="#241b33" />
      <rect x={x + 4} y={y} width="96" height="16" fill="#2f2442" />
      <rect x={x + 4} y={y} width="96" height="2" fill={VIOLET} opacity="0.7" />
      <rect x={x + 2} y={y + 33} width="100" height="2" fill={ROSE} filter="url(#flou-neon)" />
      <rect x={x + 2} y={y + 33} width="100" height="1" fill="#fdf2f8" opacity="0.8" />
    </g>
  )
}

/** L'établi du drone : le drone ouvert, ses hélices, le fer à souder qui fume. */
function EtabliDrone({ x }: { x: number }) {
  return (
    <g>
      <rect x={x} y="44" width="76" height="40" fill="#1f1a2b" />
      <rect x={x} y="44" width="76" height="3" fill={CYAN} opacity="0.5" />
      <rect x={x + 4} y="84" width="4" height="12" fill="#3a3150" />
      <rect x={x + 68} y="84" width="4" height="12" fill="#3a3150" />
      {/* Le drone : son corps, ses quatre bras, ses hélices qui tournent à vide. */}
      <rect x={x + 26} y="56" width="20" height="12" fill="#3f3f46" />
      <rect x={x + 32} y="59" width="8" height="5" fill={ROSE} />
      {[
        [x + 16, 50],
        [x + 50, 50],
        [x + 16, 72],
        [x + 50, 72],
      ].map(([hx, hy], i) => (
        <g key={i}>
          <rect x={hx + 2} y={hy + 1} width="6" height="2" fill="#71717a" />
          <rect x={hx} y={hy} width="10" height="2" fill="#a1a1aa">
            <Anim attributeName="width" values="10;3;10" dur="0.3s" begin={`${i * 0.07}s`} repeatCount="indefinite" />
          </rect>
        </g>
      ))}
      <rect x={x + 60} y="58" width="2" height="12" fill="#d4d4d8" />
      <rect x={x + 60} y="56" width="2" height="2" fill="#f97316" />
      <rect x={x + 59} y="50" width="3" height="3" fill="#a1a1aa" opacity="0">
        <Anim attributeName="y" values={etapes(54, 40, 5)} dur="1.6s" repeatCount="indefinite" />
        <Anim attributeName="opacity" values={etapes(0.7, 0, 5)} dur="1.6s" repeatCount="indefinite" />
      </rect>
    </g>
  )
}

/** Le stand de ramen : le comptoir, les rideaux rouges (noren), la lanterne, le bol qui fume. */
function StandRamen() {
  return (
    <g>
      <rect x="730" y="24" width="122" height="10" fill="#7f1d1d" />
      {[0, 1, 2, 3].map((i) => (
        <g key={i}>
          <rect x={732 + i * 30} y="34" width="28" height="16" fill="#b91c1c" />
          <rect x={732 + i * 30} y="34" width="28" height="2" fill="#991b1b" />
        </g>
      ))}
      <text x="791" y="46" fontSize="9" textAnchor="middle" fill="#fef2f2" letterSpacing="6">
        ラーメン
      </text>
      <rect x="730" y="50" width="122" height="20" fill="#3f2a1e" />
      <rect x="730" y="50" width="122" height="3" fill="#57392a" />
      <rect x="730" y="70" width="122" height="16" fill="#2a1a14" />
      {/* La lanterne rouge. */}
      <rect x="716" y="30" width="10" height="16" fill="#dc2626" />
      <rect x="716" y="34" width="10" height="1" fill="#7f1d1d" />
      <rect x="716" y="40" width="10" height="1" fill="#7f1d1d" />
      {/* Le bol, ses baguettes. */}
      <rect x="760" y="52" width="16" height="6" fill="#f5f5f4" />
      <rect x="762" y="51" width="12" height="2" fill="#fbbf24" />
      <rect x="778" y="46" width="1" height="10" fill="#d6a76c" />
      <rect x="780" y="46" width="1" height="10" fill="#d6a76c" />
      <rect x="812" y="52" width="16" height="6" fill="#f5f5f4" />
      <rect x="814" y="51" width="12" height="2" fill="#fbbf24" />
    </g>
  )
}

/** La vapeur du bol, quand quelqu'un attend au comptoir. */
function VapeurRamen() {
  return (
    <g pointerEvents="none">
      {[0, 0.5, 1].map((debut, i) => (
        <rect key={debut} x={764 + i * 4} y="48" width="2" height="4" fill="#e5e7eb" opacity="0">
          <Anim attributeName="y" values={etapes(48, 36, 4)} dur="1.5s" begin={`${debut}s`} repeatCount="indefinite" />
          <Anim attributeName="opacity" values={etapes(0.8, 0, 4)} dur="1.5s" begin={`${debut}s`} repeatCount="indefinite" />
        </rect>
      ))}
    </g>
  )
}

/** Le distributeur de canettes : sa façade qui clignote, ses rangées de canettes. */
function DistributeurCanettes({ x }: { x: number }) {
  const canettes = [ROSE, CYAN, '#facc15', VIOLET, '#4ade80']
  return (
    <g>
      <rect x={x} y="22" width="40" height="72" fill="#1e1b2e" />
      <rect x={x + 3} y="25" width="34" height="10" fill={CYAN}>
        <Anim attributeName="opacity" values="1;0.55;1;1" dur="1.8s" repeatCount="indefinite" />
      </rect>
      <rect x={x + 3} y="38" width="24" height="44" fill="#0b0714" />
      {[0, 1, 2, 3].map((rang) =>
        [0, 1, 2].map((col) => (
          <rect key={`${rang}-${col}`} x={x + 6 + col * 7} y={41 + rang * 10} width="5" height="8" fill={canettes[(rang + col) % canettes.length]} />
        )),
      )}
      <rect x={x + 29} y="40" width="6" height="16" fill="#27272a" />
      <rect x={x + 30} y="42" width="4" height="2" fill="#4ade80" />
      <rect x={x + 6} y="84" width="22" height="6" fill="#0b0714" />
    </g>
  )
}

/** Le frigo couvert d'autocollants. */
function FrigoAutocollants({ x }: { x: number }) {
  return (
    <g>
      <rect x={x} y="16" width="54" height="82" fill="#27272a" />
      <rect x={x + 2} y="18" width="50" height="30" fill="#3f3f46" />
      <rect x={x + 2} y="50" width="50" height="46" fill="#3f3f46" />
      <rect x={x + 44} y="24" width="2" height="18" fill="#71717a" />
      <rect x={x + 44} y="56" width="2" height="24" fill="#71717a" />
      <rect x={x + 8} y="24" width="10" height="8" fill={ROSE} transform={`rotate(-8 ${x + 13} 28)`} />
      <rect x={x + 22} y="60" width="12" height="10" fill={CYAN} />
      <rect x={x + 8} y="74" width="8" height="8" fill="#facc15" />
      <text x={x + 28} y="38" fontSize="7" textAnchor="middle" fill="#fdf4ff">
        ⚡
      </text>
    </g>
  )
}

/** Des caisses de matériel, marquées au pochoir. */
function Caisses({
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
        <rect x={x} y={y + 14} width="40" height="26" fill="#3f3f46" />
        <rect x={x} y={y + 14} width="40" height="3" fill="#52525b" />
        <rect x={x + 6} y={y + 24} width="28" height="6" fill={ROSE} opacity="0.8" />
      </Cliquable>
      <Cliquable {...lien('gpu-box')}>
        <rect x={x + 6} y={y} width="30" height="16" fill="#27272a" />
        <rect x={x + 10} y={y + 6} width="22" height="3" fill={CYAN} opacity="0.8" />
      </Cliquable>
      <Cliquable {...lien('ram-box')}>
        <rect x={x + 44} y={y + 22} width="22" height="18" fill="#3f3f46" />
        <rect x={x + 48} y={y + 28} width="14" height="4" fill="#facc15" opacity="0.8" />
      </Cliquable>
    </g>
  )
}

/* ——— Les postes ——— */

/** L'écran holographique : ce qu'il affiche dit l'état de son agent. */
function EcranHolo({ cx, dy, statut, bientot }: { cx: number; dy: number; statut: Statut; bientot: number | null }) {
  const t = useTextes()
  const l = 52
  const g = cx - l / 2
  return (
    <g>
      {/* Le projecteur posé sur le plateau, puis le cadre de lumière de l'écran. */}
      <rect x={cx - 10} y={dy + 12} width="20" height="5" fill="#27272a" />
      <rect x={cx - 6} y={dy + 10} width="12" height="2" fill={CYAN} opacity="0.7" />
      <rect x={g - 2} y={dy - 16} width={l + 4} height="26" fill="#0b0714" stroke={CYAN} strokeOpacity="0.5" strokeWidth="1" />
      {statut === 'endormi' ? (
        // En veille : l'écran noir, sans le post-it de l'absent.
        <rect x={g} y={dy - 14} width={l} height="22" fill="#05040a" />
      ) : statut === 'absent' ? (
        <>
          <rect x={g} y={dy - 14} width={l} height="22" fill="#05040a" />
          <g transform={`rotate(-6 ${cx} ${dy - 4})`}>
            <rect x={cx - 15} y={dy - 12} width="30" height="15" fill="#fde68a" />
            <rect x={cx - 15} y={dy - 12} width="30" height="3" fill="#fcd34d" />
            <text x={cx} y={dy} fontSize="7" textAnchor="middle" fill="#78350f">
              {t.offNote}
            </text>
          </g>
        </>
      ) : statut === 'en-echec' ? (
        // Le glitch : des bandes roses et cyan décalées, qui sautent.
        <>
          <rect x={g} y={dy - 14} width={l} height="22" fill="#2a0a1a" />
          {[0, 1, 2, 3, 4].map((i) => (
            <rect key={i} x={g + (i % 2 ? 6 : 0)} y={dy - 13 + i * 4} width={l - 10} height="2" fill={i % 2 ? CYAN : ROSE}>
              <Anim attributeName="x" values={`${g};${g + 8};${g + 2};${g + 6}`} dur="0.4s" begin={`${i * 0.08}s`} repeatCount="indefinite" />
            </rect>
          ))}
          <text x={cx} y={dy + 2} fontSize="8" textAnchor="middle" fill="#fdf2f8">
            ERR
          </text>
        </>
      ) : statut === 'au-travail' ? (
        <>
          <rect x={g} y={dy - 14} width={l} height="22" fill="#020a06" />
          {[0, 1, 2, 3].map((i) => {
            const w = [30, 18, 36, 14][i]
            return (
              <rect key={i} x={g + 3 + (i % 2) * 5} y={dy - 12 + i * 5} width={w} height="2" fill={i % 2 ? CYAN : '#4ade80'}>
                <Anim attributeName="width" values={`${etapes(2, w, 5)};${w}`} dur="1.6s" begin={`${i * 0.4}s`} repeatCount="indefinite" />
              </rect>
            )
          })}
        </>
      ) : (
        // Au repos : le bureau néon, une fenêtre rose, une fenêtre cyan.
        <>
          <rect x={g} y={dy - 14} width={l} height="22" fill="#1a1033" />
          <rect x={g + 4} y={dy - 11} width="20" height="12" fill="none" stroke={ROSE} strokeWidth="1" />
          <rect x={g + 28} y={dy - 9} width="18" height="9" fill="none" stroke={CYAN} strokeWidth="1" />
        </>
      )}
      {bientot ? (
        <>
          <rect x={g} y={dy} width={l} height="7" fill="#05040a" />
          <text x={cx} y={dy + 6} fontSize="6" textAnchor="middle" fill={ROSE}>
            {t.inMinutes(bientot)}
          </text>
        </>
      ) : null}
      {statut === 'en-echec'
        ? [0, 0.6, 1.2].map((debut, i) => (
            <rect key={debut} x={cx + 18 + i * 3} y={dy + 6} width="6" height="6" fill="#52525b" opacity="0">
              <Anim attributeName="y" values={etapes(dy + 6, dy - 26, 6)} dur="1.8s" begin={`${debut}s`} repeatCount="indefinite" />
              <Anim attributeName="opacity" values={etapes(0.8, 0, 6)} dur="1.8s" begin={`${debut}s`} repeatCount="indefinite" />
            </rect>
          ))
        : null}
    </g>
  )
}

/** Le plateau en métal noir, son liseré néon de la couleur de l'agent. */
function PlateauNoir({ x, dy, dessus, accent }: { x: number; dy: number; dessus: number; accent: string }) {
  return (
    <>
      <rect x={x} y={dy} width={BUREAU.largeur} height={dessus} fill="#1c1828" />
      <rect x={x} y={dy} width={BUREAU.largeur} height="2" fill="#2e2742" />
      <rect x={x} y={dy + dessus} width={BUREAU.largeur} height="12" fill="#0f0c18" />
      <rect x={x} y={dy + dessus + 10} width={BUREAU.largeur} height="2" fill={accent} opacity="0.85" />
      <rect x={x + 6} y={dy + dessus + 12} width="5" height="7" fill="#27272a" />
      <rect x={x + BUREAU.largeur - 11} y={dy + dessus + 12} width="5" height="7" fill="#27272a" />
    </>
  )
}

/** Le poste : l'écran holographique, un clavier qui luit, une canette, l'emoji de l'agent en autocollant. */
function BureauNeon({ cx, dy, x, dessus, statut, accent, bientot, emoji }: PropsBureau) {
  const allume = statut !== 'absent' && statut !== 'endormi'
  return (
    <g>
      <PlateauNoir x={x} dy={dy} dessus={dessus} accent={accent} />
      <EcranHolo cx={cx - 4} dy={dy} statut={statut} bientot={bientot} />
      <rect x={cx - 24} y={dy + 22} width="40" height="7" fill="#0b0714" />
      <rect x={cx - 23} y={dy + 23} width="38" height="5" fill={allume ? VIOLET : '#27272a'} opacity="0.75" />
      <rect x={cx + 20} y={dy + 22} width="5" height="7" fill="#3f3f46" />
      <rect x={x + 96} y={dy + 18} width="7" height="12" fill={ROSE} />
      <rect x={x + 96} y={dy + 18} width="7" height="2" fill="#d4d4d8" />
      <text x={x + 12} y={dy + 13} fontSize="10" textAnchor="middle">
        {emoji}
      </text>
    </g>
  )
}

/** Le bureau du fixer : deux écrans vus de dos, une mallette, une canette. */
function BureauChefNeon({ dy, x, dessus }: PropsBureau) {
  return (
    <g>
      <PlateauNoir x={x} dy={dy} dessus={dessus} accent={ROSE} />
      {[6, 42].map((dx) => (
        <g key={dx}>
          <rect x={x + dx} y={dy - 12} width="32" height="22" fill="#0b0714" stroke={CYAN} strokeOpacity="0.4" />
          <rect x={x + dx + 14} y={dy + 10} width="4" height="4" fill="#27272a" />
        </g>
      ))}
      <rect x={x + 84} y={dy + 10} width="26" height="16" fill="#3f2a1e" />
      <rect x={x + 94} y={dy + 7} width="6" height="3" fill="#57392a" />
      <rect x={x + 112} y={dy + 18} width="5" height="10" fill={CYAN} />
    </g>
  )
}

/** Le fauteuil du fixer, cuir noir et liseré rose. */
function FauteuilNeon({ x, y }: { x: number; y: number }) {
  return (
    <g>
      <rect x={x - 16} y={y - 30} width="32" height="38" fill="#18181b" />
      <rect x={x - 13} y={y - 27} width="26" height="32" fill="#27272a" />
      <rect x={x - 13} y={y - 27} width="26" height="2" fill={ROSE} />
      <rect x={x - 18} y={y - 6} width="5" height="14" fill="#18181b" />
      <rect x={x + 13} y={y - 6} width="5" height="14" fill="#18181b" />
    </g>
  )
}

/** Le siège baquet noir, un liseré de la couleur de l'agent. */
function AssiseBaquet({ x, y, couleur }: PropsSiege) {
  return (
    <g>
      <rect x={x - 11} y={y - 12} width="22" height="12" fill="#18181b" />
      <rect x={x - 11} y={y - 12} width="22" height="2" fill={couleur} />
    </g>
  )
}

function DossierBaquet({ x, y, couleur }: PropsSiege) {
  return (
    <g>
      <rect x={x - 12} y={y + 2} width="24" height="10" fill="#18181b" />
      <rect x={x - 10} y={y + 4} width="20" height="6" fill="#27272a" />
      <rect x={x - 2} y={y + 4} width="4" height="6" fill={couleur} />
      <rect x={x - 2} y={y + 12} width="4" height="3" fill="#3f3f46" />
      <rect x={x - 10} y={y + 15} width="20" height="3" fill="#27272a" />
    </g>
  )
}

/* ——— Les tenues ——— */

const SWEATS = ['#18181b', '#1e1b4b', '#3b0764', '#0f172a', '#27272a', '#111827', '#4c0519', '#164e63']
const CORDONS = [ROSE, CYAN, VIOLET, '#facc15', '#4ade80']
const CHEVEUX = ['#111111', '#2a1d14', ROSE, CYAN, VIOLET, '#e5e5e5', '#5a3a22', '#111111']
const PEAUX = ['#f1c9a5', '#d9a57a', '#a86f48', '#7a4a2c', '#f5d6bf']
const BAS = ['#18181b', '#27272a', '#1e293b', '#0f172a']

/** Le nombre de cet agent dans ce thème : chaque thème a sa graine, pour des tenues qui changent d'un thème à l'autre. */
const hachage = (id: string) => hacher(id, 29, 43)

/** Sweats sombres aux cordons fluo, cheveux parfois teints ; le fixer en manteau long. */
function tenueNeon(id: string): Record<string, string> {
  if (id === CHEF_ID) {
    return { h: '#111111', s: '#d9a57a', e: '#f472b6', c: '#09090b', C: '#18181b', t: ROSE, k: CYAN, p: '#18181b', b: '#09090b' }
  }
  if (id.startsWith('livreur:')) {
    return { h: '#111111', s: '#d9a57a', e: '#1c1917', c: '#facc15', C: '#ca8a04', t: '#18181b', k: '#18181b', p: '#18181b', b: '#09090b' }
  }
  const h = hachage(id)
  const sweat = SWEATS[h % SWEATS.length]
  const cordon = CORDONS[(h >>> 3) % CORDONS.length]
  return {
    h: CHEVEUX[(h >>> 6) % CHEVEUX.length],
    s: PEAUX[(h >>> 9) % PEAUX.length],
    e: '#0b0714',
    c: sweat,
    C: cordon,
    t: cordon,
    k: cordon,
    p: BAS[(h >>> 12) % BAS.length],
    b: '#09090b',
  }
}

/** Un sur deux a son casque sur les oreilles, cerclé de néon. */
const casqueNeon = (id: string) => id !== CHEF_ID && !estInvite(id) && hachage(id) % 2 === 0

/* La nuit : les tubes des murs, les enseignes, le panneau holographique, le distributeur, la lanterne. */
const LUMIERES_NEON: Array<Lumiere> = [
  { x: 175, y: 40, r: 80, couleur: VIOLET },
  { x: 222, y: 42, r: 60, couleur: ROSE },
  { x: 510, y: 40, r: 90, couleur: ROSE },
  { x: 510, y: 44, r: 60, couleur: CYAN },
  { x: 835, y: 40, r: 80, couleur: CYAN },
  { x: 884, y: 30, r: 45, couleur: CYAN },
  { x: 721, y: 38, r: 30, couleur: '#ef4444' },
  { x: 373, y: 50, r: 45, couleur: VIOLET },
  { x: 417, y: 50, r: 40, couleur: CYAN },
  { x: 510, y: 165, r: 60, couleur: ROSE },
  { x: 695, y: 228, r: 70, couleur: CYAN },
]

export const THEME_NEON: Theme = {
  coins: COINS_NEON,
  coinCafe: 'cafe',
  fond: NUIT,
  Decor,
  Bureau: BureauNeon,
  BureauChef: BureauChefNeon,
  plaque: CYAN,
  Assise: AssiseBaquet,
  Dossier: DossierBaquet,
  Fauteuil: FauteuilNeon,
  tenue: tenueNeon,
  casque: casqueNeon,
  CafeQuiCoule: VapeurRamen,
  lumieres: LUMIERES_NEON,
  // Il fait déjà nuit dans la salle : un voile violet plus léger, que les néons percent.
  nuit: { couleur: '#0b0620', opacite: 0.45 },
  // Le halo de l'écran holographique au-dessus de chaque poste occupé.
  lumierePoste: (cx, dy, accent) => [{ x: cx, y: dy, r: 45, couleur: accent }],
}
