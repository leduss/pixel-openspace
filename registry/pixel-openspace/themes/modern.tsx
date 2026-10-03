'use client'

/*
 * Le thème moderne épuré, le seul en clair : parquet de chêne, murs blancs,
 * bureaux assis-debout et portables, beaucoup de plantes. Le chef a sa
 * bibliothèque en chêne et ses lettres noires au mur ; l'espace détente, son
 * écran de présentation, son canapé vert sauge, sa table de ping-pong et ses
 * bornes ; la cuisine ouverte, son îlot, sa machine à espresso, sa fontaine à
 * eau pétillante et son frigo inox. T-shirts pastel, chinos et baskets
 * blanches.
 */

import { BUREAU, CHEF_ID, estInvite, type CoinDePause, type Statut } from '../engine'
import { Anim, Cliquable, MUR_SALLE, Plante, etapes, useTextes, hacher, type Lumiere } from '../primitives'
import type { PropsBureau, PropsDecor, PropsSiege, Theme } from '../theme'
import { Arcade, BorneCasseBriques, Porte } from './geek'
import type { SceneObject } from '../types'

/* Les coins de pause : la même géographie que les autres thèmes. */
const COINS_MODERNE: Array<CoinDePause> = [
  { nom: 'cafe', x: 768, y: 100 },
  { nom: 'fontaine', x: 881, y: 104 },
  { nom: 'frigo', x: 950, y: 108 },
  { nom: 'arcade', x: 372, y: 112 },
  { nom: 'arcade-2', x: 415, y: 112 },
  { nom: 'ping-pong', x: 636, y: 108 },
  // Sur le canapé, face à l'écran : de dos.
  { nom: 'canape-gauche', x: 482, y: 146, assis: true },
  { nom: 'canape-droite', x: 538, y: 146, assis: true },
]

const MUR = { arete: '#a8a29e', face: '#f5f5f4', plinthe: '#e7e5e4', lame: '#c8a06a' }
const ENCRE = '#1c1917'

/** Un mur blanc, vu de biais ; des lames de chêne verticales sur une partie. */
function MurBlanc({
  x,
  largeur,
  y = 20,
  hauteur = 32,
  lames = 0,
}: {
  x: number
  largeur: number
  y?: number
  hauteur?: number
  lames?: number
}) {
  return (
    <>
      <rect x={x} y={y - 6} width={largeur} height="6" fill={MUR.arete} />
      <rect x={x} y={y} width={largeur} height={hauteur} fill={MUR.face} />
      {Array.from({ length: lames }, (_, i) => (
        <rect key={i} x={x + largeur - 6 - i * 6} y={y} width="3" height={hauteur} fill={MUR.lame} />
      ))}
      <rect x={x} y={y + hauteur} width={largeur} height="4" fill={MUR.plinthe} />
    </>
  )
}

/** Des lettres noires collées au mur : l'enseigne, sans néon. */
function Lettres({ x, y, texte, taille = 10 }: { x: number; y: number; texte: string; taille?: number }) {
  return (
    <text x={x} y={y} fontSize={taille} textAnchor="middle" fill={ENCRE} letterSpacing="1">
      {texte}
    </text>
  )
}

function Decor({ hauteur, titre, liens, aller, jouer }: PropsDecor) {
  const t = useTextes()
  const bas = hauteur - 20
  const lien = (objet: SceneObject) => ({ titre: t.objects[objet], faire: () => aller(objet), actif: Boolean(liens[objet]) })
  return (
    <>
      <defs>
        <pattern id="chene-moderne" width="64" height="16" patternUnits="userSpaceOnUse">
          <rect width="64" height="16" fill="#e2c597" />
          <rect y="14" width="64" height="2" fill="#d2b282" />
          <rect x="40" width="2" height="16" fill="#d2b282" />
          <rect x="6" y="5" width="18" height="1" fill="#ead2a8" />
        </pattern>
        <pattern id="moquette-moderne" width="12" height="12" patternUnits="userSpaceOnUse">
          <rect width="12" height="12" fill="#d6d3d1" />
          <rect x="3" y="3" width="2" height="2" fill="#cfcbc8" />
        </pattern>
        <pattern id="beton-clair" width="48" height="48" patternUnits="userSpaceOnUse">
          <rect width="48" height="48" fill="#e7e5e4" />
          <rect width="48" height="1" fill="#dcd9d6" />
          <rect width="1" height="48" fill="#dcd9d6" />
        </pattern>
        <pattern id="terrazzo" width="20" height="20" patternUnits="userSpaceOnUse">
          <rect width="20" height="20" fill="#f5f5f4" />
          <rect x="3" y="4" width="2" height="2" fill="#d6d3d1" />
          <rect x="12" y="9" width="2" height="1" fill="#a8a29e" />
          <rect x="7" y="15" width="1" height="2" fill="#fca5a5" />
          <rect x="16" y="2" width="1" height="1" fill="#86efac" />
        </pattern>
      </defs>

      {/* Les sols : moquette grise chez le chef, béton clair dans l'espace détente, terrazzo en cuisine, chêne dans la grande salle. */}
      <rect x="20" y="56" width="310" height="142" fill="url(#moquette-moderne)" />
      <rect x="338" y="56" width="344" height="142" fill="url(#beton-clair)" />
      <rect x="690" y="56" width="290" height="142" fill="url(#terrazzo)" />
      <rect x="20" y="198" width="960" height={bas - 198} fill="url(#chene-moderne)" />

      {/* Les murs du fond. */}
      <MurBlanc x={20} largeur={310} />
      <MurBlanc x={338} largeur={344} lames={6} />
      <MurBlanc x={690} largeur={290} />

      {/* Le bureau du chef : la bibliothèque en chêne, les lettres au mur, les plantes. */}
      <Cliquable {...lien('server-rack')}>
        <Bibliotheque x={32} />
      </Cliquable>
      <Lettres x={222} y={40} texte={t.leadOffice} taille={11} />
      <Plante x={300} y={62} />

      {/* L'espace détente : les bornes, l'écran de présentation, le canapé vert sauge, la table de ping-pong. */}
      <Cliquable titre={t.objects.snake} faire={() => jouer('snake')}>
        <Arcade x={352} />
      </Cliquable>
      <Cliquable titre={t.objects.breakout} faire={() => jouer('casse-briques')}>
        <BorneCasseBriques x={396} />
      </Cliquable>
      <Cliquable {...lien('tv')}>
        <EcranPresentation x={452} />
      </Cliquable>
      <rect x="452" y="124" width="116" height="52" fill="#d9e4d0" />
      <CanapeSauge x={458} y={130} />
      <Cliquable {...lien('workbench')}>
        <PingPong x={598} />
      </Cliquable>
      <Plante x={346} y={160} />
      <Plante x={650} y={168} />

      {/* La cuisine ouverte : l'îlot, la machine à espresso, la corbeille de fruits, la fontaine, le frigo inox. */}
      <rect x="730" y="44" width="122" height="24" fill="#fafaf9" />
      <rect x="730" y="44" width="122" height="3" fill="#ffffff" />
      <rect x="730" y="68" width="122" height="18" fill="#c8a06a" />
      {[734, 774, 814].map((x) => (
        <rect key={x} x={x} y="71" width="34" height="12" fill="#b88f5a" />
      ))}
      <Espresso x={748} />
      <rect x="812" y="52" width="26" height="8" fill="#e7e5e4" />
      {[
        [814, '#ef4444'],
        [821, '#facc15'],
        [828, '#84cc16'],
      ].map(([x, c]) => (
        <rect key={x} x={x as number} y="46" width="6" height="6" fill={c as string} />
      ))}
      <Cliquable {...lien('vending-machine')}>
        <EauPetillante x={864} />
      </Cliquable>
      <Cliquable {...lien('fridge')}>
        <FrigoInox x={922} />
      </Cliquable>
      <rect x="818" y="132" width="6" height="34" fill={ENCRE} />
      <circle cx="821" cy="130" r="18" fill="#d2b282" shapeRendering="auto" />
      <circle cx="821" cy="128" r="18" fill="#e2c597" shapeRendering="auto" />
      {[786, 848].map((x) => (
        <g key={x}>
          <rect x={x} y="140" width="12" height="10" fill="#f5f5f4" />
          <rect x={x + 4} y="150" width="4" height="12" fill={ENCRE} />
        </g>
      ))}
      <Plante x={700} y={160} />

      {/* La grande salle : les cartons, les plantes. */}
      <CartonsKraft x={56} y={bas - 44} lien={lien} />
      <Plante x={946} y={bas - 32} />

      {/* Le mur de la grande salle, blanc à lames de chêne, percé de ses trois entrées. */}
      {MUR_SALLE.map(([de, a]) => (
        <g key={de}>
          <MurBlanc x={de} largeur={a - de} y={204} hauteur={38} lames={a - de > 90 ? 4 : 0} />
        </g>
      ))}
      <Lettres x={695} y={228} texte={titre} taille={titre.length > 14 ? 7 : 9} />
      <Porte bas={bas} />
      <rect x="330" y="14" width="8" height="190" fill="#bae6fd" opacity="0.35" />
      <rect x="330" y="14" width="2" height="190" fill="#7dd3fc" opacity="0.7" />
      <rect x="682" y="14" width="8" height="190" fill={MUR.arete} />
      <rect x="12" y="14" width="8" height={bas - 6} fill={MUR.arete} />
      <rect x="980" y="14" width="8" height={bas - 6} fill={MUR.arete} />
      <rect x="12" y="6" width="976" height="8" fill={MUR.arete} />
      <rect x="12" y={bas} width="976" height="10" fill={MUR.arete} />
    </>
  )
}

/** La bibliothèque en chêne : livres aux tons doux, plantes retombantes, un vase. */
function Bibliotheque({ x }: { x: number }) {
  const livres = ['#fda4af', '#93c5fd', '#fde68a', '#a7f3d0', '#c4b5fd', '#fdba74', '#e7e5e4']
  return (
    <g>
      <rect x={x} y="20" width="56" height="86" fill="#c8a06a" />
      <rect x={x + 3} y="23" width="50" height="80" fill="#f5f0e6" />
      {[44, 66, 88].map((y) => (
        <rect key={y} x={x + 3} y={y} width="50" height="3" fill="#c8a06a" />
      ))}
      {[24, 46, 68].map((y, rang) => (
        <g key={y}>
          {Array.from({ length: 6 }, (_, i) => (
            <rect
              key={i}
              x={x + 6 + i * 7}
              y={y + 5 + ((i + rang) % 3)}
              width="5"
              height={15 - ((i + rang) % 3)}
              fill={livres[(i * 2 + rang) % livres.length]}
            />
          ))}
        </g>
      ))}
      <rect x={x + 38} y="74" width="10" height="12" fill="#e7e5e4" />
      <rect x={x + 36} y="70" width="4" height="6" fill="#4ade80" />
      <rect x={x + 44} y="68" width="4" height="8" fill="#22c55e" />
      <rect x={x + 8} y="90" width="2" height="12" fill="#22c55e" />
      <rect x={x + 12} y="90" width="2" height="9" fill="#4ade80" />
    </g>
  )
}

/** L'écran de présentation au mur : une courbe qui monte, des barres. */
function EcranPresentation({ x }: { x: number }) {
  return (
    <g>
      <rect x={x} y="22" width="116" height="42" fill={ENCRE} />
      <rect x={x + 3} y="25" width="110" height="36" fill="#f8fafc" />
      <rect x={x + 8} y="29" width="40" height="4" fill="#cbd5e1" />
      {[0, 1, 2, 3, 4].map((i) => (
        <rect
          key={i}
          x={x + 10 + i * 9}
          y={56 - (i + 1) * 3}
          width="6"
          height={(i + 1) * 3}
          fill={['#93c5fd', '#a7f3d0', '#fde68a', '#fda4af', '#c4b5fd'][i]}
        />
      ))}
      <path
        d={`M${x + 60} 56 L${x + 72} 50 L${x + 82} 52 L${x + 94} 40 L${x + 106} 34`}
        stroke="#22c55e"
        strokeWidth="2"
        fill="none"
        shapeRendering="auto"
      />
      <rect x={x + 104} y="32" width="4" height="4" fill="#22c55e">
        <Anim attributeName="opacity" values="1;0.3;1" dur="1.6s" repeatCount="indefinite" />
      </rect>
      <rect x={x + 54} y="64" width="8" height="6" fill="#a8a29e" />
    </g>
  )
}

/** Le canapé vert sauge, vu de dos depuis la salle. */
function CanapeSauge({ x, y }: { x: number; y: number }) {
  return (
    <g>
      <rect x={x} y={y + 10} width="104" height="24" fill="#6b8f71" />
      <rect x={x + 6} y={y} width="92" height="20" fill="#86a98b" />
      <rect x={x + 50} y={y} width="2" height="20" fill="#6b8f71" />
      <rect x={x} y={y + 4} width="10" height="30" fill="#6b8f71" />
      <rect x={x + 94} y={y + 4} width="10" height="30" fill="#6b8f71" />
      <rect x={x + 4} y={y + 34} width="4" height="4" fill="#c8a06a" />
      <rect x={x + 96} y={y + 34} width="4" height="4" fill="#c8a06a" />
    </g>
  )
}

/** La table de ping-pong, son filet, ses deux raquettes et la balle qui rebondit. */
function PingPong({ x }: { x: number }) {
  return (
    <g>
      <rect x={x} y="38" width="76" height="50" fill="#1e40af" />
      <rect x={x + 2} y="40" width="72" height="46" fill="#2563eb" />
      <rect x={x + 37} y="40" width="2" height="46" fill="#f8fafc" />
      <rect x={x + 2} y="62" width="72" height="1" fill="#f8fafc" />
      <rect x={x + 36} y="36" width="4" height="54" fill="#cbd5e1" opacity="0.8" />
      <rect x={x + 6} y="88" width="4" height="8" fill={ENCRE} />
      <rect x={x + 66} y="88" width="4" height="8" fill={ENCRE} />
      <rect x={x + 10} y="46" width="7" height="7" fill="#ef4444" />
      <rect x={x + 58} y="72" width="7" height="7" fill={ENCRE} />
      <rect x={x + 20} y="58" width="3" height="3" fill="#fafaf9">
        <Anim attributeName="x" values={`${x + 20};${x + 54};${x + 20}`} dur="1.4s" repeatCount="indefinite" />
        <Anim attributeName="y" values="56;66;56" dur="0.7s" repeatCount="indefinite" />
      </rect>
    </g>
  )
}

/** La machine à espresso, chrome et noir. */
function Espresso({ x }: { x: number }) {
  return (
    <g>
      <rect x={x} y="22" width="40" height="38" fill="#a8a29e" />
      <rect x={x + 2} y="24" width="36" height="12" fill="#e7e5e4" />
      <rect x={x + 4} y="38" width="32" height="6" fill={ENCRE} />
      <rect x={x + 30} y="27" width="4" height="4" fill="#22c55e" />
      <rect x={x + 14} y="44" width="12" height="4" fill="#57534e" />
      <rect x={x + 15} y="50" width="10" height="8" fill="#fafaf9" />
    </g>
  )
}

/** Le café qui coule dans la tasse, quand quelqu'un attend devant. */
function CafeModerne() {
  return (
    <g pointerEvents="none">
      <rect x="767" y="47" width="2" height="5" fill="#6b3a1e">
        <Anim attributeName="opacity" values="1;0.4;1" dur="0.5s" repeatCount="indefinite" />
      </rect>
    </g>
  )
}

/** La fontaine à eau pétillante, encastrée, avec ses carafes en verre. */
function EauPetillante({ x }: { x: number }) {
  return (
    <g>
      <rect x={x} y="40" width="38" height="54" fill="#d6d3d1" />
      <rect x={x + 2} y="42" width="34" height="50" fill="#fafaf9" />
      <rect x={x + 8} y="46" width="22" height="10" fill={ENCRE} />
      <rect x={x + 11} y="48" width="4" height="2" fill="#38bdf8" />
      <rect x={x + 23} y="48" width="4" height="2" fill="#a3e635" />
      <rect x={x + 6} y="66" width="8" height="14" fill="#bae6fd" opacity="0.7" />
      <rect x={x + 22} y="66" width="8" height="14" fill="#bae6fd" opacity="0.7" />
    </g>
  )
}

/** Le grand frigo inox à deux portes. */
function FrigoInox({ x }: { x: number }) {
  return (
    <g>
      <rect x={x} y="16" width="54" height="82" fill="#a8a29e" />
      <rect x={x + 2} y="18" width="24" height="78" fill="#d6d3d1" />
      <rect x={x + 28} y="18" width="24" height="78" fill="#e7e5e4" />
      <rect x={x + 22} y="40" width="2" height="24" fill="#78716c" />
      <rect x={x + 30} y="40" width="2" height="24" fill="#78716c" />
      <rect x={x + 6} y="24" width="10" height="6" fill={ENCRE} />
    </g>
  )
}

/** Des cartons en kraft, juste livrés. */
function CartonsKraft({
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
        <rect x={x} y={y + 14} width="40" height="26" fill="#c8a06a" />
        <rect x={x + 17} y={y + 14} width="6" height="26" fill="#e7d3ad" />
      </Cliquable>
      <Cliquable {...lien('gpu-box')}>
        <rect x={x + 6} y={y} width="30" height="16" fill="#d2b282" />
        <rect x={x + 6} y={y + 6} width="30" height="3" fill="#e7d3ad" />
      </Cliquable>
      <Cliquable {...lien('ram-box')}>
        <rect x={x + 44} y={y + 22} width="22" height="18" fill="#b88f5a" />
        <rect x={x + 53} y={y + 22} width="4" height="18" fill="#e7d3ad" />
      </Cliquable>
    </g>
  )
}

/* ——— Les postes ——— */

/** Le portable, coque alu, ouvert sur le bureau ; ce que son écran affiche dit l'état de son agent. */
function Portable({ cx, dy, statut, bientot }: { cx: number; dy: number; statut: Statut; bientot: number | null }) {
  const t = useTextes()
  const l = 52
  const g = cx - l / 2
  return (
    <g>
      {/* Le clavier du portable, puis la coque de l'écran. */}
      <rect x={g - 6} y={dy + 10} width={l + 12} height="9" fill="#a8a29e" />
      <rect x={g - 5} y={dy + 10} width={l + 10} height="7" fill="#d6d3d1" />
      {[0, 1].map((rang) => (
        <rect key={rang} x={g} y={dy + 11 + rang * 3} width={l} height="2" fill="#a8a29e" />
      ))}
      <rect x={cx - 7} y={dy + 17} width="14" height="2" fill="#c4c0bc" />
      <rect x={g - 2} y={dy - 16} width={l + 4} height="26" fill="#d6d3d1" />
      {statut === 'absent' ? (
        <>
          <rect x={g} y={dy - 14} width={l} height="20" fill={ENCRE} />
          <g transform={`rotate(-6 ${cx} ${dy - 4})`}>
            <rect x={cx - 15} y={dy - 12} width="30" height="15" fill="#fde68a" />
            <rect x={cx - 15} y={dy - 12} width="30" height="3" fill="#fcd34d" />
            <text x={cx} y={dy} fontSize="7" textAnchor="middle" fill="#78350f">
              {t.offNote}
            </text>
          </g>
        </>
      ) : statut === 'en-echec' ? (
        <>
          <rect x={g} y={dy - 14} width={l} height="20" fill="#fecaca" />
          <rect x={cx - 2} y={dy - 11} width="4" height="9" fill="#dc2626" />
          <rect x={cx - 2} y={dy} width="4" height="3" fill="#dc2626" />
        </>
      ) : statut === 'au-travail' ? (
        <>
          <rect x={g} y={dy - 14} width={l} height="20" fill="#f8fafc" />
          {[0, 1, 2, 3].map((i) => {
            const w = [30, 18, 36, 14][i]
            return (
              <rect
                key={i}
                x={g + 3 + (i % 2) * 5}
                y={dy - 12 + i * 4.5}
                width={w}
                height="2"
                fill={['#a78bfa', '#34d399', '#60a5fa', '#f472b6'][i]}
              >
                <Anim attributeName="width" values={`${etapes(2, w, 5)};${w}`} dur="1.6s" begin={`${i * 0.4}s`} repeatCount="indefinite" />
              </rect>
            )
          })}
        </>
      ) : (
        <>
          <rect x={g} y={dy - 14} width={l} height="20" fill="#bfdbfe" />
          <rect x={g} y={dy - 4} width={l} height="10" fill="#c7d2fe" />
          <rect x={g + 4} y={dy - 11} width="20" height="12" fill="#f8fafc" />
          <rect x={g + 28} y={dy - 9} width="18" height="9" fill="#e0e7ff" />
        </>
      )}
      {bientot ? (
        <>
          <rect x={g} y={dy - 1} width={l} height="7" fill="#f8fafc" />
          <text x={cx} y={dy + 5} fontSize="6" textAnchor="middle" fill="#7c3aed">
            {t.inMinutes(bientot)}
          </text>
        </>
      ) : null}
      {statut === 'en-echec'
        ? [0, 0.6, 1.2].map((debut, i) => (
            <rect key={debut} x={cx + 18 + i * 3} y={dy + 6} width="6" height="6" fill="#a8a29e" opacity="0">
              <Anim attributeName="y" values={etapes(dy + 6, dy - 26, 6)} dur="1.8s" begin={`${debut}s`} repeatCount="indefinite" />
              <Anim attributeName="opacity" values={etapes(0.8, 0, 6)} dur="1.8s" begin={`${debut}s`} repeatCount="indefinite" />
            </rect>
          ))
        : null}
    </g>
  )
}

/** Le plateau de chêne, sa tranche, ses pieds blancs de bureau assis-debout. */
function PlateauChene({ x, dy, dessus }: { x: number; dy: number; dessus: number }) {
  return (
    <>
      <rect x={x} y={dy} width={BUREAU.largeur} height={dessus} fill="#e2c597" />
      <rect x={x} y={dy} width={BUREAU.largeur} height="3" fill="#ecd5ad" />
      <rect x={x} y={dy + dessus} width={BUREAU.largeur} height="12" fill="#c8a06a" />
      <rect x={x + 6} y={dy + dessus + 12} width="5" height="7" fill="#f5f5f4" />
      <rect x={x + BUREAU.largeur - 11} y={dy + dessus + 12} width="5" height="7" fill="#f5f5f4" />
      <rect x={x + 2} y={dy + dessus + 18} width="13" height="2" fill="#d6d3d1" />
      <rect x={x + BUREAU.largeur - 15} y={dy + dessus + 18} width="13" height="2" fill="#d6d3d1" />
    </>
  )
}

/** Le poste : le portable, une souris, carnet, tasse en céramique, une petite plante grasse. */
function BureauModerne({ cx, dy, x, dessus, statut, bientot, emoji }: PropsBureau) {
  return (
    <g>
      <PlateauChene x={x} dy={dy} dessus={dessus} />
      <Portable cx={cx - 4} dy={dy} statut={statut} bientot={bientot} />
      <rect x={cx + 20} y={dy + 23} width="5" height="7" fill="#fafaf9" />
      <rect x={x + 90} y={dy + 6} width="18" height="14" fill="#44403c" />
      <rect x={x + 92} y={dy + 6} width="2" height="14" fill="#f97316" />
      <rect x={x + 96} y={dy + 22} width="10" height="10" fill="#e7e5e4" />
      <rect x={x + 98} y={dy + 17} width="2" height="6" fill="#22c55e" />
      <rect x={x + 102} y={dy + 15} width="2" height="8" fill="#16a34a" />
      <rect x={x + 8} y={dy + 22} width="8" height="9" fill="#fef3c7" />
      <rect x={x + 16} y={dy + 24} width="3" height="4" fill="#fef3c7" />
      <rect x={x + 9} y={dy + 23} width="6" height="2" fill="#6b3a1e" />
      <text x={x + 12} y={dy + 13} fontSize="10" textAnchor="middle">
        {emoji}
      </text>
    </g>
  )
}

/** Le bureau du chef : un grand écran fin vu de dos, un portable, un carnet, une plante. */
function BureauChefModerne({ dy, x, dessus }: PropsBureau) {
  return (
    <g>
      <PlateauChene x={x} dy={dy} dessus={dessus} />
      <rect x={x + 6} y={dy - 12} width="34" height="22" fill="#e7e5e4" />
      <rect x={x + 8} y={dy - 10} width="30" height="18" fill="#d6d3d1" />
      <rect x={x + 20} y={dy + 10} width="6" height="5" fill="#a8a29e" />
      <rect x={x + 84} y={dy + 6} width="26" height="18" fill="#d6d3d1" />
      <rect x={x + 86} y={dy + 8} width="22" height="13" fill="#e7e5e4" />
      <rect x={x + 96} y={dy + 13} width="3" height="3" fill="#a8a29e" />
      <rect x={x + 48} y={dy + 16} width="20" height="14" fill="#44403c" />
      <rect x={x + 66} y={dy + 16} width="2" height="14" fill="#f97316" />
    </g>
  )
}

/** Le fauteuil blanc du chef, coque moulée. */
function FauteuilModerne({ x, y }: { x: number; y: number }) {
  return (
    <g>
      <rect x={x - 16} y={y - 30} width="32" height="38" fill="#d6d3d1" />
      <rect x={x - 13} y={y - 27} width="26" height="32" fill="#fafaf9" />
      <rect x={x - 18} y={y - 6} width="5" height="14" fill="#d6d3d1" />
      <rect x={x + 13} y={y - 6} width="5" height="14" fill="#d6d3d1" />
    </g>
  )
}

/** La chaise en maille graphite ; un liseré de la couleur de l'agent. */
function AssiseMaille({ x, y, couleur }: PropsSiege) {
  return (
    <g>
      <rect x={x - 11} y={y - 12} width="22" height="12" fill="#57534e" />
      <rect x={x - 11} y={y - 12} width="22" height="2" fill={couleur} />
    </g>
  )
}

function DossierMaille({ x, y, couleur }: PropsSiege) {
  return (
    <g>
      <rect x={x - 12} y={y + 2} width="24" height="10" fill="#44403c" />
      <rect x={x - 10} y={y + 4} width="20" height="6" fill="#57534e" />
      <rect x={x - 12} y={y + 2} width="24" height="1" fill={couleur} />
      <rect x={x - 2} y={y + 12} width="4" height="3" fill="#a8a29e" />
      <rect x={x - 10} y={y + 15} width="20" height="3" fill="#d6d3d1" />
    </g>
  )
}

/* ——— Les tenues ——— */

const HAUTS = ['#fda4af', '#93c5fd', '#fde68a', '#a7f3d0', '#c4b5fd', '#fdba74', '#f5f5f4', '#cbd5e1', '#99f6e4', '#1c1917']
const CHEVEUX = ['#2a1d14', '#5a3a22', '#c8a165', '#111111', '#8a4b2a', '#e5e5e5', '#b45309']
const PEAUX = ['#f1c9a5', '#d9a57a', '#a86f48', '#7a4a2c', '#f5d6bf']
const BAS = ['#d6c4a1', '#a8a29e', '#1e3a8a', '#44403c', '#e7e5e4']

/** Le nombre de cet agent dans ce thème : chaque thème a sa graine, pour des tenues qui changent d'un thème à l'autre. */
const hachage = (id: string) => hacher(id, 17, 41)

/** T-shirts pastel, chinos, baskets blanches ; le chef en surchemise bleu marine. */
function tenueModerne(id: string): Record<string, string> {
  if (id === CHEF_ID) {
    return { h: '#78716c', s: '#f1c9a5', e: '#1c1917', c: '#1e3a8a', C: '#172554', t: '#f5f5f4', k: '#1c1917', p: '#d6c4a1', b: '#fafaf9' }
  }
  if (id.startsWith('livreur:')) {
    return { h: '#5b3a1a', s: '#d9a57a', e: '#1c1917', c: '#7c4a1e', C: '#5b3a1a', t: '#facc15', k: '#111827', p: '#5b3a1a', b: '#111827' }
  }
  const h = hachage(id)
  const haut = HAUTS[h % HAUTS.length]
  return {
    h: CHEVEUX[(h >>> 4) % CHEVEUX.length],
    s: PEAUX[(h >>> 8) % PEAUX.length],
    e: '#1c1917',
    c: haut,
    C: `color-mix(in oklab, ${haut} 80%, black)`,
    t: haut,
    k: '#f5f5f4',
    p: BAS[(h >>> 12) % BAS.length],
    b: '#fafaf9',
  }
}

/** Un sur trois écoute de la musique, casque blanc. */
const casqueBlanc = (id: string) => id !== CHEF_ID && !estInvite(id) && hachage(id) % 3 === 0

/* La nuit : de grosses suspensions chaudes au-dessus des pièces, l'écran de présentation, le frigo. */
const LUMIERES_MODERNE: Array<Lumiere> = [
  { x: 175, y: 110, r: 90, couleur: '#fde68a' },
  { x: 510, y: 120, r: 90, couleur: '#fde68a' },
  { x: 835, y: 110, r: 90, couleur: '#fde68a' },
  { x: 510, y: 44, r: 60, couleur: '#e0f2fe' },
  { x: 373, y: 50, r: 45, couleur: '#a855f7' },
  { x: 417, y: 50, r: 40, couleur: '#22d3ee' },
]

export const THEME_MODERNE: Theme = {
  coins: COINS_MODERNE,
  coinCafe: 'cafe',
  fond: '#e7e5e4',
  Decor,
  Bureau: BureauModerne,
  BureauChef: BureauChefModerne,
  plaque: '#44403c',
  Assise: AssiseMaille,
  Dossier: DossierMaille,
  Fauteuil: FauteuilModerne,
  tenue: tenueModerne,
  casque: casqueBlanc,
  CafeQuiCoule: CafeModerne,
  lumieres: LUMIERES_MODERNE,
  // La nuit claire : un crépuscule bleu ardoise, plus léger que les autres thèmes.
  nuit: { couleur: '#1e293b', opacite: 0.42 },
  // Le chef, sans cravate, sa tasse à la main.
  tasse: (id) => id === CHEF_ID,
  // Une lampe de bureau chaude au-dessus de chaque poste.
  lumierePoste: (cx, dy) => [{ x: cx, y: dy + 10, r: 55, couleur: '#fde68a' }],
}
