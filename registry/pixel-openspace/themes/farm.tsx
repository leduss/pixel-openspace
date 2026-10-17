'use client'

/*
 * La ferme douillette : la véranda en rondins où le fermier se balance dans
 * son rocking-chair, la cour avec la grange rouge, les bottes de foin et le
 * poulailler, le puits et le grand pommier au fond. Chaque poste est une
 * parcelle : au travail, l'arrosoir verse et les pousses montent ; en échec,
 * tout fane et un corbeau se pose sur l'écriteau ; endormi, on somnole
 * adossé à la clôture, le chapeau de paille sur les yeux. La palissade de planches
 * ferme le champ, l'épouvantail veille. Les saisons comptent double : la
 * neige sur les toits en décembre, le champ de citrouilles en octobre.
 * Chemises de toutes les couleurs, salopettes, chapeaux de paille.
 */

import { BUREAU, CHEF_ID, estInvite, type CoinDePause, type Statut } from '../engine'
import { Citrouille } from '../festivities'
import { Anim, Cliquable, MUR_SALLE, Pixels, Plante, etapes, hacher, useTextes, type Lumiere } from '../primitives'
import type { PropsBureau, PropsDecor, PropsSiege, Theme } from '../theme'
import { Arcade, BorneCasseBriques } from './geek'
import type { SceneObject } from '../types'

/* Les coins de pause : la même géographie que les autres thèmes. */
const COINS_FERME: Array<CoinDePause> = [
  { nom: 'puits', x: 768, y: 100 },
  { nom: 'caisse', x: 881, y: 104 },
  { nom: 'pommier', x: 950, y: 108 },
  { nom: 'arcade', x: 372, y: 112 },
  { nom: 'arcade-2', x: 415, y: 112 },
  { nom: 'poulailler', x: 636, y: 108 },
  // Sur les bottes de foin, face à la grange : de dos.
  { nom: 'foin-gauche', x: 482, y: 146, assis: true },
  { nom: 'foin-droite', x: 538, y: 146, assis: true },
]

const BOIS = { clair: '#c9a26b', moyen: '#a0693a', fonce: '#7a4e2a', ombre: '#5b3a1e' }
const PAILLE = '#e9c46a'
const ROUGE_GRANGE = '#b23a2e'
const NEIGE = '#f1f5f9'
const LANTERNE = '#fbbf24'

/** Le mur de rondins de la maison, ses bûches couchées. */
function MurRondins({ x, largeur }: { x: number; largeur: number }) {
  return (
    <>
      <rect x={x} y="14" width={largeur} height="6" fill={BOIS.ombre} />
      {[0, 1, 2, 3, 4].map((i) => (
        <g key={i}>
          <rect x={x} y={20 + i * 6.4} width={largeur} height="6.4" fill={i % 2 ? BOIS.moyen : '#8b5a2b'} />
          <rect x={x} y={25 + i * 6.4} width={largeur} height="1.4" fill={BOIS.ombre} />
        </g>
      ))}
      <rect x={x} y="52" width={largeur} height="4" fill={BOIS.ombre} />
    </>
  )
}

/** Le fond de la cour : une haie sombre, une clôture blanche devant. */
function Haie({ x, largeur, neige }: { x: number; largeur: number; neige: boolean }) {
  return (
    <>
      <rect x={x} y="14" width={largeur} height="42" fill="#2f6b2a" />
      {Array.from({ length: Math.ceil(largeur / 16) }, (_, i) => (
        <rect key={i} x={x + i * 16} y="10" width="12" height="8" fill={neige ? NEIGE : '#3a7d33'} />
      ))}
      {Array.from({ length: Math.ceil(largeur / 20) }, (_, i) => (
        <rect key={i} x={x + 4 + i * 20} y="24" width="6" height="4" fill="#25561f" />
      ))}
      <rect x={x} y="38" width={largeur} height="3" fill="#e7d3a8" />
      <rect x={x} y="47" width={largeur} height="3" fill="#e7d3a8" />
      {Array.from({ length: Math.floor(largeur / 14) }, (_, i) => (
        <g key={i}>
          <rect x={x + 4 + i * 14} y="34" width="4" height="22" fill="#f0e2bf" />
          <rect x={x + 4 + i * 14} y="34" width="4" height="2" fill={neige ? NEIGE : '#d6c095'} />
        </g>
      ))}
    </>
  )
}

/** Une pancarte de bois peinte, à la largeur de son texte. */
function Pancarte({ x, y, texte, taille = 9, neige = false }: { x: number; y: number; texte: string; taille?: number; neige?: boolean }) {
  const l = Math.round(texte.length * taille * 0.62 + 14)
  return (
    <g>
      <rect x={x - l / 2} y={y - taille - 4} width={l} height={taille + 9} fill={BOIS.ombre} />
      <rect x={x - l / 2 + 2} y={y - taille - 2} width={l - 4} height={taille + 5} fill={BOIS.moyen} />
      {neige ? <rect x={x - l / 2} y={y - taille - 6} width={l} height="3" fill={NEIGE} /> : null}
      <text x={x} y={y} fontSize={taille} textAnchor="middle" fill="#fef3c7">
        {texte}
      </text>
    </g>
  )
}

function Decor({ hauteur, titre, liens, aller, jouer, fete }: PropsDecor) {
  const t = useTextes()
  const bas = hauteur - 20
  const neige = fete === 'noel'
  const citrouilles = fete === 'halloween'
  const lien = (objet: SceneObject) => ({ titre: t.objects[objet], faire: () => aller(objet), actif: Boolean(liens[objet]) })
  const sol = neige ? 'url(#neige-ferme)' : 'url(#herbe-ferme)'
  return (
    <>
      <defs>
        <pattern id="herbe-ferme" width="24" height="24" patternUnits="userSpaceOnUse">
          <rect width="24" height="24" fill="#5a9e3a" />
          <rect x="3" y="5" width="2" height="2" fill="#4a8a2e" />
          <rect x="15" y="11" width="2" height="2" fill="#4a8a2e" />
          <rect x="8" y="19" width="2" height="2" fill="#4a8a2e" />
          <rect x="19" y="2" width="1" height="1" fill="#fde68a" />
        </pattern>
        <pattern id="pre-ferme" width="40" height="40" patternUnits="userSpaceOnUse">
          <rect width="40" height="40" fill="#6aab45" />
          <rect x="4" y="6" width="2" height="3" fill="#589a37" />
          <rect x="22" y="14" width="2" height="3" fill="#589a37" />
          <rect x="12" y="28" width="2" height="3" fill="#589a37" />
          <rect x="32" y="34" width="2" height="3" fill="#589a37" />
          <rect x="30" y="8" width="2" height="2" fill="#f9a8d4" />
          <rect x="8" y="36" width="2" height="2" fill="#fef9c3" />
        </pattern>
        <pattern id="neige-ferme" width="24" height="24" patternUnits="userSpaceOnUse">
          <rect width="24" height="24" fill="#e8eef4" />
          <rect x="4" y="6" width="2" height="1" fill="#cbd5e1" />
          <rect x="16" y="14" width="3" height="1" fill="#cbd5e1" />
          <rect x="9" y="20" width="2" height="1" fill="#cbd5e1" />
        </pattern>
        <pattern id="planches-veranda" width="36" height="10" patternUnits="userSpaceOnUse">
          <rect width="36" height="10" fill="#b07a45" />
          <rect y="9" width="36" height="1" fill="#8a5a30" />
          <rect x="22" width="1" height="10" fill="#8a5a30" />
        </pattern>
      </defs>

      {/* Les sols : les planches de la véranda, l'herbe de la cour, le pré du grand champ ; la neige en décembre. */}
      <rect x="20" y="56" width="310" height="142" fill="url(#planches-veranda)" />
      <rect x="338" y="56" width="344" height="142" fill={sol} />
      <rect x="690" y="56" width="290" height="142" fill={sol} />
      <rect x="20" y="198" width="960" height={bas - 198} fill={neige ? 'url(#neige-ferme)' : 'url(#pre-ferme)'} />
      {/* Le chemin de terre qui mène au puits. */}
      <rect x="752" y="100" width="34" height="98" fill={neige ? '#d5dde6' : '#a47a4c'} opacity="0.7" />

      {/* Le fond : le mur de rondins de la maison, la haie et sa clôture dans la cour. */}
      <MurRondins x={20} largeur={310} />
      <Haie x={338} largeur={344} neige={neige} />
      <Haie x={690} largeur={290} neige={neige} />

      {/* La véranda : l'étagère de bocaux, la pancarte du fermier, la plante. */}
      <Cliquable {...lien('server-rack')}>
        <EtagereBocaux x={34} />
      </Cliquable>
      <Pancarte x={222} y={44} texte={t.leadOffice} taille={9} />
      <Plante x={300} y={62} />

      {/* La cour : les bornes sous leur auvent, la grange, les bottes de foin, le poulailler et ses poules. */}
      <Cliquable titre={t.objects.snake} faire={() => jouer('snake')}>
        <Arcade x={352} />
      </Cliquable>
      <Cliquable titre={t.objects.breakout} faire={() => jouer('casse-briques')}>
        <BorneCasseBriques x={396} />
      </Cliquable>
      <Cliquable {...lien('tv')}>
        <Grange x={452} neige={neige} />
      </Cliquable>
      <BottesDeFoin x={458} y={130} neige={neige} />
      <Cliquable {...lien('workbench')}>
        <Poulailler x={598} neige={neige} />
      </Cliquable>
      <Poule x={604} y={168} debut={0} />
      <Poule x={644} y={180} debut={0.7} sens={-1} />
      <Poule x={662} y={160} debut={1.3} />

      {/* Le fond de la cour : le puits, la caisse d'expédition, le pommier et ses cagettes, l'épouvantail. */}
      <Puits neige={neige} />
      <Cliquable {...lien('vending-machine')}>
        <CaisseExpedition x={864} neige={neige} />
      </Cliquable>
      <Pommier neige={neige} />
      <Cliquable {...lien('fridge')}>
        <CagettesPommes x={918} />
      </Cliquable>
      <Epouvantail x={720} y={120} citrouille={citrouilles} neige={neige} />

      {/* En octobre, les champs de citrouilles. */}
      {citrouilles ? (
        <g pointerEvents="none">
          <ChampCitrouilles x={352} y={164} />
          <ChampCitrouilles x={700} y={172} />
        </g>
      ) : null}

      {/* Le grand champ : la botte, le sac de graines, la cagette. */}
      <Reserve x={56} y={bas - 44} lien={lien} />

      {/* La palissade du grand champ, et la pancarte du titre. */}
      {MUR_SALLE.map(([de, a]) => (
        <Palissade key={de} x={de} largeur={a - de} neige={neige} />
      ))}
      <Pancarte x={695} y={232} texte={titre} taille={titre.length > 14 ? 7 : 9} neige={neige} />
      <Portail bas={bas} />

      {/* Les poteaux qui séparent la véranda, la cour et le fond, et le cadre en bois. */}
      <rect x="330" y="14" width="8" height="190" fill={BOIS.moyen} />
      <rect x="330" y="14" width="2" height="190" fill={BOIS.clair} />
      <rect x="682" y="14" width="8" height="190" fill={BOIS.moyen} />
      <rect x="682" y="14" width="2" height="190" fill={BOIS.clair} />
      <rect x="12" y="14" width="8" height={bas - 6} fill={BOIS.ombre} />
      <rect x="980" y="14" width="8" height={bas - 6} fill={BOIS.ombre} />
      <rect x="12" y="6" width="976" height="8" fill={BOIS.ombre} />
      <rect x="12" y={bas} width="976" height="10" fill={BOIS.ombre} />
    </>
  )
}

/** L'étagère de bocaux : confitures, miel, cornichons. */
function EtagereBocaux({ x }: { x: number }) {
  const bocaux = ['#dc2626', '#f59e0b', '#65a30d', '#7c3aed', '#ea580c']
  return (
    <g>
      <rect x={x} y="18" width="52" height="88" fill={BOIS.ombre} />
      <rect x={x + 3} y="21" width="46" height="82" fill="#4a2f17" />
      {[0, 1, 2, 3].map((rang) => (
        <g key={rang}>
          <rect x={x + 3} y={40 + rang * 20} width="46" height="3" fill={BOIS.moyen} />
          {[0, 1, 2, 3].map((i) => (
            <g key={i}>
              <rect x={x + 6 + i * 11} y={28 + rang * 20} width="8" height="12" fill={bocaux[(rang + i) % bocaux.length]} />
              <rect x={x + 6 + i * 11} y={26 + rang * 20} width="8" height="3" fill={rang % 2 ? '#f8fafc' : '#dc2626'} />
              <rect x={x + 7 + i * 11} y={30 + rang * 20} width="2" height="6" fill="#fff" opacity="0.4" />
            </g>
          ))}
        </g>
      ))}
    </g>
  )
}

/** La grange rouge : son toit en escalier, ses traverses blanches, la lucarne du fenil, sa lanterne. */
function Grange({ x, neige }: { x: number; neige: boolean }) {
  return (
    <g>
      {/* Le toit, en marches de pixels. */}
      {[0, 1, 2, 3].map((i) => (
        <rect key={i} x={x + 8 + i * 10} y={20 - i * 5} width={100 - i * 20} height="6" fill="#7f1d1d" />
      ))}
      {neige ? (
        <>
          <rect x={x + 8} y="18" width="100" height="3" fill={NEIGE} />
          <rect x={x + 38} y="3" width="40" height="3" fill={NEIGE} />
        </>
      ) : null}
      <rect x={x + 6} y="26" width="104" height="60" fill={ROUGE_GRANGE} />
      {[14, 30, 46].map((v) => (
        <rect key={v} x={x + 6} y={26 + v} width="104" height="1" fill="#8f2d23" />
      ))}
      <rect x={x + 6} y="26" width="104" height="3" fill="#f8fafc" />
      <rect x={x + 6} y="26" width="3" height="60" fill="#f8fafc" />
      <rect x={x + 107} y="26" width="3" height="60" fill="#f8fafc" />
      {/* La lucarne du fenil, du foin qui dépasse. */}
      <rect x={x + 48} y="32" width="20" height="14" fill="#f8fafc" />
      <rect x={x + 50} y="34" width="16" height="10" fill="#3b2410" />
      <rect x={x + 51} y="40" width="14" height="4" fill={PAILLE} />
      {/* La grande porte, son X blanc. */}
      <rect x={x + 36} y="52" width="44" height="34" fill="#f8fafc" />
      <rect x={x + 38} y="54" width="40" height="32" fill="#9b2f25" />
      <path d={`M${x + 38} 54L${x + 78} 86M${x + 78} 54L${x + 38} 86`} stroke="#f8fafc" strokeWidth="3" />
      <rect x={x + 57} y="54" width="2" height="32" fill="#f8fafc" />
      {/* La lanterne au-dessus de la porte. */}
      <rect x={x + 55} y="47" width="6" height="5" fill={LANTERNE} />
      <rect x={x + 55} y="46" width="6" height="1" fill="#1c1917" />
    </g>
  )
}

/** Deux bottes de foin, face à la grange. */
function BottesDeFoin({ x, y, neige }: { x: number; y: number; neige: boolean }) {
  return (
    <g>
      {[0, 56].map((dx) => (
        <g key={dx}>
          <rect x={x + dx} y={y + 6} width="48" height="26" fill="#d4a93e" />
          <rect x={x + dx} y={y + 6} width="48" height="4" fill={neige ? NEIGE : PAILLE} />
          <rect x={x + dx + 10} y={y + 6} width="2" height="26" fill="#8a6a1c" />
          <rect x={x + dx + 36} y={y + 6} width="2" height="26" fill="#8a6a1c" />
          {[4, 18, 28].map((v) => (
            <rect key={v} x={x + dx + v} y={y + 14} width="4" height="1" fill="#b8902f" />
          ))}
        </g>
      ))}
    </g>
  )
}

/** Le poulailler : sa cabane, son toit rouge, sa rampe, la lucarne éclairée. */
function Poulailler({ x, neige }: { x: number; neige: boolean }) {
  return (
    <g>
      <rect x={x + 2} y="26" width="72" height="8" fill="#7f1d1d" />
      <rect x={x + 8} y="20" width="60" height="6" fill="#7f1d1d" />
      {neige ? <rect x={x + 2} y="18" width="72" height="4" fill={NEIGE} /> : null}
      <rect x={x + 6} y="34" width="64" height="44" fill="#f0e2bf" />
      {[42, 50, 58, 66].map((v) => (
        <rect key={v} x={x + 6} y={v} width="64" height="1" fill="#d6c095" />
      ))}
      <rect x={x + 14} y="40" width="12" height="10" fill={LANTERNE} opacity="0.85" />
      <rect x={x + 19} y="40" width="2" height="10" fill={BOIS.fonce} />
      <rect x={x + 42} y="56" width="16" height="22" fill="#3b2410" />
      <rect x={x + 42} y="56" width="16" height="2" fill={BOIS.fonce} />
      {/* La rampe, ses barreaux. */}
      <path d={`M${x + 50} 78L${x + 62} 96`} stroke={BOIS.moyen} strokeWidth="5" />
      <rect x={x + 6} y="78" width="4" height="12" fill={BOIS.fonce} />
      <rect x={x + 66} y="78" width="4" height="12" fill={BOIS.fonce} />
      {/* Une poule qui passe la tête par la porte. */}
      <rect x={x + 46} y="62" width="7" height="6" fill="#f8fafc" />
      <rect x={x + 47} y="60" width="3" height="2" fill="#dc2626" />
      <rect x={x + 53} y="64" width="2" height="2" fill="#f59e0b" />
    </g>
  )
}

const POULE = ['..r...', '.ww...', '.wew.o', 'wwwww.', 'wwwww.', '.y.y..']

/** Une poule qui picore. */
function Poule({ x, y, debut, sens = 1 }: { x: number; y: number; debut: number; sens?: 1 | -1 }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${sens} 1)`} pointerEvents="none">
      <g>
        <Pixels grille={POULE} couleurs={{ w: '#f8fafc', r: '#dc2626', e: '#111827', o: '#f59e0b', y: '#f59e0b' }} u={2} />
        <Anim attributeName="transform" type="translate" values="0 0;0 0;2 2;0 0" dur="1.6s" begin={`${debut}s`} repeatCount="indefinite" />
      </g>
    </g>
  )
}

/** Le puits de pierre, son toit, sa manivelle, son seau. */
function Puits({ neige }: { neige: boolean }) {
  return (
    <g>
      <rect x="750" y="38" width="4" height="34" fill={BOIS.fonce} />
      <rect x="784" y="38" width="4" height="34" fill={BOIS.fonce} />
      <rect x="742" y="32" width="54" height="6" fill={ROUGE_GRANGE} />
      <rect x="748" y="26" width="42" height="6" fill={ROUGE_GRANGE} />
      {neige ? <rect x="742" y="24" width="54" height="4" fill={NEIGE} /> : null}
      <rect x="754" y="44" width="30" height="3" fill={BOIS.ombre} />
      <rect x="788" y="42" width="6" height="2" fill="#52525b" />
      <rect x="792" y="42" width="2" height="7" fill="#52525b" />
      <rect x="768" y="47" width="1" height="8" fill="#d6c095" />
      <rect x="764" y="55" width="9" height="7" fill={BOIS.moyen} />
      <rect x="764" y="55" width="9" height="2" fill="#52525b" />
      {/* La margelle de pierre. */}
      <rect x="746" y="66" width="46" height="30" fill="#78716c" />
      <rect x="746" y="66" width="46" height="4" fill={neige ? NEIGE : '#a8a29e'} />
      {[74, 82, 90].map((v, i) => (
        <g key={v}>
          <rect x="746" y={v} width="46" height="1" fill="#57534e" />
          <rect x={754 + (i % 2) * 10} y={v - 8} width="1" height="8" fill="#57534e" />
          <rect x={774 + (i % 2) * 10} y={v - 8} width="1" height="8" fill="#57534e" />
        </g>
      ))}
      {/* La lanterne pendue au poteau. */}
      <rect x="790" y="50" width="5" height="6" fill={LANTERNE} />
    </g>
  )
}

/** L'eau qui goutte du seau, quand quelqu'un attend au puits. */
function SeauQuiGoutte() {
  return (
    <g pointerEvents="none">
      {[0, 0.4, 0.8].map((debut, i) => (
        <rect key={debut} x={766 + i * 2} y="62" width="2" height="3" fill="#7dd3fc" opacity="0">
          <Anim attributeName="y" values={etapes(62, 70, 4)} dur="1.2s" begin={`${debut}s`} repeatCount="indefinite" />
          <Anim attributeName="opacity" values={etapes(0.9, 0, 4)} dur="1.2s" begin={`${debut}s`} repeatCount="indefinite" />
        </rect>
      ))}
    </g>
  )
}

/** La caisse d'expédition : on y dépose la récolte, un panais sur le couvercle. */
function CaisseExpedition({ x, neige }: { x: number; neige: boolean }) {
  return (
    <g>
      <rect x={x} y="62" width="40" height="34" fill={BOIS.fonce} />
      {[70, 78, 86].map((v) => (
        <rect key={v} x={x} y={v} width="40" height="1" fill={BOIS.ombre} />
      ))}
      <rect x={x - 2} y="56" width="44" height="8" fill={BOIS.moyen} />
      <rect x={x - 2} y="56" width="44" height="2" fill={neige ? NEIGE : BOIS.clair} />
      <rect x={x + 17} y="64" width="6" height="5" fill="#a1a1aa" />
      <rect x={x + 8} y="51" width="12" height="5" fill="#fef3c7" />
      <rect x={x + 6} y="49" width="4" height="4" fill="#65a30d" />
    </g>
  )
}

/** Le grand pommier du fond, ses pommes rouges, sa feuillée qui déborde du mur. */
function Pommier({ neige }: { neige: boolean }) {
  const feuilles = neige ? '#4b6b43' : '#2f7d32'
  return (
    <g pointerEvents="none">
      <rect x="938" y="40" width="14" height="62" fill={BOIS.fonce} />
      <rect x="938" y="40" width="4" height="62" fill={BOIS.ombre} />
      <rect x="932" y="96" width="26" height="6" fill={BOIS.fonce} />
      <rect x="906" y="14" width="70" height="34" fill={feuilles} />
      <rect x="914" y="4" width="54" height="12" fill={feuilles} />
      <rect x="898" y="24" width="12" height="18" fill={feuilles} />
      <rect x="926" y="48" width="40" height="6" fill={feuilles} />
      {neige ? (
        <>
          <rect x="914" y="2" width="54" height="4" fill={NEIGE} />
          <rect x="906" y="12" width="12" height="3" fill={NEIGE} />
          <rect x="964" y="12" width="12" height="3" fill={NEIGE} />
        </>
      ) : (
        [
          [918, 22],
          [944, 12],
          [962, 30],
          [930, 38],
          [952, 44],
          [908, 34],
        ].map(([x, y]) => <rect key={`${x}-${y}`} x={x} y={y} width="4" height="4" fill="#dc2626" />)
      )}
    </g>
  )
}

/** Les cagettes de pommes, au pied de l'arbre. */
function CagettesPommes({ x }: { x: number }) {
  return (
    <g>
      {[0, 30].map((dx) => (
        <g key={dx}>
          <rect x={x + dx} y="80" width="26" height="16" fill={BOIS.clair} />
          <rect x={x + dx} y="86" width="26" height="2" fill={BOIS.moyen} />
          {[3, 9, 15, 21].map((v) => (
            <rect key={v} x={x + dx + v - 1} y="76" width="5" height="5" fill={(v + dx) % 2 ? '#dc2626' : '#65a30d'} />
          ))}
        </g>
      ))}
    </g>
  )
}

/** L'épouvantail : chapeau de paille, chemise rapiécée ; une tête de citrouille en octobre. */
function Epouvantail({ x, y, citrouille, neige }: { x: number; y: number; citrouille: boolean; neige: boolean }) {
  return (
    <g pointerEvents="none">
      <rect x={x - 1} y={y + 10} width="3" height="44" fill={BOIS.fonce} />
      <rect x={x - 16} y={y + 18} width="33" height="3" fill={BOIS.fonce} />
      <rect x={x - 9} y={y + 16} width="19" height="18" fill="#2563eb" />
      <rect x={x - 4} y={y + 22} width="5" height="5" fill="#dc2626" />
      <rect x={x - 16} y={y + 16} width="8" height="7" fill="#2563eb" />
      <rect x={x + 9} y={y + 16} width="8" height="7" fill="#2563eb" />
      <rect x={x - 18} y={y + 20} width="3" height="4" fill={PAILLE} />
      <rect x={x + 16} y={y + 20} width="3" height="4" fill={PAILLE} />
      {citrouille ? (
        <>
          <rect x={x - 7} y={y + 3} width="15" height="13" fill="#ea580c" />
          <rect x={x - 4} y={y + 6} width="3" height="3" fill="#fde047" />
          <rect x={x + 2} y={y + 6} width="3" height="3" fill="#fde047" />
          <rect x={x - 4} y={y + 11} width="9" height="2" fill="#fde047" />
          <rect x={x} y={y} width="2" height="3" fill="#15803d" />
        </>
      ) : (
        <>
          <rect x={x - 6} y={y + 4} width="13" height="12" fill="#d6b88a" />
          <rect x={x - 3} y={y + 8} width="2" height="2" fill="#1c1917" />
          <rect x={x + 2} y={y + 8} width="2" height="2" fill="#1c1917" />
          <rect x={x - 11} y={y + 2} width="23" height="3" fill={neige ? NEIGE : PAILLE} />
          <rect x={x - 6} y={y - 3} width="13" height="5" fill={PAILLE} />
          {neige ? <rect x={x - 6} y={y - 4} width="13" height="2" fill={NEIGE} /> : null}
        </>
      )}
    </g>
  )
}

/** Un carré de citrouilles et leurs vrilles. */
function ChampCitrouilles({ x, y }: { x: number; y: number }) {
  return (
    <g>
      <rect x={x} y={y + 14} width="84" height="2" fill="#15803d" />
      <rect x={x + 6} y={y + 4} width="2" height="12" fill="#15803d" />
      <rect x={x + 60} y={y + 2} width="2" height="14" fill="#15803d" />
      <Citrouille x={x} y={y} />
      <Citrouille x={x + 30} y={y + 8} />
      <Citrouille x={x + 58} y={y + 2} />
    </g>
  )
}

/** Une palissade de planches debout, leurs têtes en pointe. */
function Palissade({ x, largeur, neige }: { x: number; largeur: number; neige: boolean }) {
  return (
    <>
      <rect x={x} y="204" width={largeur} height="42" fill={BOIS.fonce} />
      {Array.from({ length: Math.ceil(largeur / 9) }, (_, i) => (
        <g key={i}>
          <rect x={x + i * 9} y="202" width="8" height="44" fill={i % 2 ? BOIS.moyen : '#97633a'} />
          <rect x={x + i * 9 + 2} y="199" width="4" height="3" fill={neige ? NEIGE : i % 2 ? BOIS.moyen : '#97633a'} />
        </g>
      ))}
      <rect x={x} y="212" width={largeur} height="3" fill={BOIS.ombre} />
      <rect x={x} y="234" width={largeur} height="3" fill={BOIS.ombre} />
      <rect x={x} y="246" width={largeur} height="4" fill={BOIS.ombre} />
    </>
  )
}

/** Le portail du champ, sa pancarte de bienvenue. */
function Portail({ bas }: { bas: number }) {
  const t = useTextes()
  return (
    <g pointerEvents="none">
      <rect x="472" y={bas - 14} width="56" height="12" fill={BOIS.fonce} />
      <rect x="476" y={bas - 12} width="48" height="8" fill={BOIS.moyen} />
      <text x="500" y={bas - 6} fontSize="5.5" textAnchor="middle" fill="#fef3c7">
        {t.welcome}
      </text>
      <rect x="470" y={bas} width="60" height="10" fill={BOIS.clair} />
      <rect x="470" y={bas + 4} width="60" height="2" fill={BOIS.fonce} />
      <rect x="499" y={bas} width="2" height="10" fill={BOIS.ombre} />
    </g>
  )
}

/** La réserve du champ : une botte de paille, un sac de graines, une cagette. */
function Reserve({
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
        <rect x={x} y={y + 14} width="40" height="26" fill="#d4a93e" />
        <rect x={x} y={y + 14} width="40" height="3" fill={PAILLE} />
        <rect x={x + 8} y={y + 14} width="2" height="26" fill="#8a6a1c" />
        <rect x={x + 30} y={y + 14} width="2" height="26" fill="#8a6a1c" />
      </Cliquable>
      <Cliquable {...lien('gpu-box')}>
        <rect x={x + 8} y={y} width="24" height="16" fill="#e7d3a8" />
        <rect x={x + 12} y={y - 3} width="16" height="4" fill="#d6c095" />
        <rect x={x + 14} y={y + 6} width="12" height="5" fill="#65a30d" />
      </Cliquable>
      <Cliquable {...lien('ram-box')}>
        <rect x={x + 44} y={y + 22} width="24" height="18" fill={BOIS.clair} />
        <rect x={x + 44} y={y + 28} width="24" height="2" fill={BOIS.moyen} />
        {[3, 9, 15].map((v) => (
          <rect key={v} x={x + 45 + v} y={y + 18} width="5" height="5" fill="#ea580c" />
        ))}
      </Cliquable>
    </g>
  )
}

/* ——— Les postes : une parcelle et son écriteau ——— */

/* Ce que pousse chaque parcelle : tomates, carottes, maïs, aubergines, fraises, navets. */
const RECOLTES = ['#ef4444', '#f97316', '#facc15', '#a855f7', '#fb7185', '#f5f5f4']

const LUNE = ['.yyy', 'yy..', 'yy..', 'yy..', '.yyy']

const CORBEAU = ['..kk..', '.kkkky', 'kkkkk.', 'kkkk..', '.y.y..']

/** Un plant : une pousse qui monte, un plant mûr, un plant fané, ou un plant qui dort. */
function Plant({
  x,
  y,
  etat,
  recolte,
  debut,
}: {
  x: number
  y: number
  etat: 'pousse' | 'mur' | 'fane' | 'dort'
  recolte: string
  debut: number
}) {
  if (etat === 'pousse') {
    return (
      <g>
        <rect x={x} y={y + 2} width="2" height="6" fill="#4ade80">
          <Anim attributeName="height" values="1;3;5;6;6" dur="2.4s" begin={`${debut}s`} repeatCount="indefinite" />
          <Anim
            attributeName="y"
            values={`${y + 7};${y + 5};${y + 3};${y + 2};${y + 2}`}
            dur="2.4s"
            begin={`${debut}s`}
            repeatCount="indefinite"
          />
        </rect>
        <rect x={x - 2} y={y + 3} width="2" height="2" fill="#22c55e" />
        <rect x={x + 2} y={y + 4} width="2" height="2" fill="#22c55e" />
      </g>
    )
  }
  if (etat === 'fane') {
    return (
      <g>
        <rect x={x} y={y + 3} width="2" height="5" fill="#7c5a2b" />
        <rect x={x - 3} y={y + 5} width="3" height="2" fill="#92703a" />
        <rect x={x + 2} y={y + 6} width="3" height="2" fill="#6b4a22" />
      </g>
    )
  }
  return (
    <g>
      <rect x={x - 3} y={y} width="8" height="6" fill={etat === 'dort' ? '#2f6b2a' : '#3f9b3a'} />
      <rect x={x - 1} y={y - 2} width="4" height="2" fill={etat === 'dort' ? '#2f6b2a' : '#4ade80'} />
      <rect x={x} y={y + 6} width="2" height="2" fill="#2f6b2a" />
      {etat === 'mur' ? (
        <>
          <rect x={x - 3} y={y + 3} width="3" height="3" fill={recolte} />
          <rect x={x + 3} y={y + 1} width="3" height="3" fill={recolte} />
        </>
      ) : null}
    </g>
  )
}

/** L'écriteau planté au bout de la parcelle : il dit l'état de son agent. */
function Ecriteau({
  cx,
  dy,
  statut,
  bientot,
  recolte,
}: {
  cx: number
  dy: number
  statut: Statut
  bientot: number | null
  recolte: string
}) {
  const t = useTextes()
  const l = 48
  const g = cx - l / 2
  const panne = statut === 'en-echec'
  return (
    <g>
      <rect x={cx - 2} y={dy - 6} width="4" height="18" fill={BOIS.ombre} />
      <g transform={panne ? `rotate(7 ${cx} ${dy - 8})` : undefined}>
        <rect x={g - 2} y={dy - 20} width={l + 4} height="20" fill={BOIS.ombre} />
        <rect x={g} y={dy - 18} width={l} height="16" fill={BOIS.clair} />
        <rect x={g} y={dy - 18} width={l} height="2" fill="#dcb987" />
        {statut === 'absent' ? (
          <g transform={`rotate(-6 ${cx} ${dy - 10})`}>
            <rect x={cx - 15} y={dy - 18} width="30" height="15" fill="#fde68a" />
            <rect x={cx - 15} y={dy - 18} width="30" height="3" fill="#fcd34d" />
            <text x={cx} y={dy - 6} fontSize="7" textAnchor="middle" fill="#78350f">
              {t.offNote}
            </text>
          </g>
        ) : panne ? (
          // La croix rouge peinte à la hâte.
          <path d={`M${cx - 6} ${dy - 15}L${cx + 6} ${dy - 5}M${cx + 6} ${dy - 15}L${cx - 6} ${dy - 5}`} stroke="#dc2626" strokeWidth="3" />
        ) : statut === 'au-travail' ? (
          <>
            {/* La goutte, et la jauge de pousse qui se remplit. */}
            <rect x={g + 6} y={dy - 15} width="4" height="2" fill="#38bdf8" />
            <rect x={g + 5} y={dy - 13} width="6" height="5" fill="#38bdf8" />
            <rect x={g + 14} y={dy - 13} width="28" height="5" fill={BOIS.fonce} />
            <rect x={g + 15} y={dy - 12} width="26" height="3" fill="#4ade80">
              <Anim attributeName="width" values={`${etapes(2, 26, 6)};26`} dur="2.4s" repeatCount="indefinite" />
            </rect>
          </>
        ) : statut === 'endormi' ? (
          // La nuit est tombée sur la parcelle : un croissant de lune peint.
          <g transform={`translate(${cx - 4} ${dy - 15})`}>
            <Pixels grille={LUNE} couleurs={{ y: '#fde68a' }} u={2} />
          </g>
        ) : (
          // Au repos, le dessin de ce qui pousse là.
          <>
            <rect x={cx - 4} y={dy - 15} width="8" height="8" fill={recolte} />
            <rect x={cx - 1} y={dy - 17} width="2" height="3" fill="#15803d" />
          </>
        )}
        {bientot ? (
          <>
            <rect x={g} y={dy - 9} width={l} height="7" fill={BOIS.ombre} />
            <text x={cx} y={dy - 3} fontSize="6" textAnchor="middle" fill="#fef3c7">
              {t.inMinutes(bientot)}
            </text>
          </>
        ) : null}
      </g>
      {panne ? (
        // Le corbeau perché sur l'écriteau, qui sautille.
        <g transform={`translate(${g + l - 12} ${dy - 30})`}>
          <g>
            <Pixels grille={CORBEAU} couleurs={{ k: '#1f1f2e', y: '#f59e0b' }} u={2} />
            <Anim attributeName="transform" type="translate" values="0 0;0 0;0 -2;0 0;1 0" dur="1.8s" repeatCount="indefinite" />
          </g>
        </g>
      ) : null}
    </g>
  )
}

/** La parcelle : la terre labourée, ses sillons, son bord de planches. */
function Terre({ x, dy, dessus, seche }: { x: number; dy: number; dessus: number; seche: boolean }) {
  return (
    <>
      <rect x={x} y={dy} width={BUREAU.largeur} height={dessus} fill={seche ? '#8a6a48' : '#7a4e2a'} />
      <rect x={x} y={dy} width={BUREAU.largeur} height="2" fill={seche ? '#9c7b56' : '#8f5d33'} />
      {[9, 18, 27].map((v) => (
        <rect key={v} x={x + 2} y={dy + v} width={BUREAU.largeur - 4} height="2" fill={seche ? '#735638' : '#5e3a1d'} />
      ))}
      <rect x={x} y={dy + dessus} width={BUREAU.largeur} height="12" fill={BOIS.moyen} />
      <rect x={x} y={dy + dessus} width={BUREAU.largeur} height="2" fill={BOIS.clair} />
      <rect x={x + 4} y={dy + dessus + 12} width="4" height="6" fill={BOIS.fonce} />
      <rect x={x + BUREAU.largeur - 8} y={dy + dessus + 12} width="4" height="6" fill={BOIS.fonce} />
    </>
  )
}

/** Le poste : la parcelle, ses plants, l'écriteau, l'arrosoir quand on travaille, l'emoji de l'agent sur un piquet. */
function Parcelle({ cx, dy, x, dessus, statut, accent, bientot, emoji }: PropsBureau) {
  const recolte = RECOLTES[hacher(accent, 7, 31) % RECOLTES.length]
  const etat = statut === 'au-travail' ? 'pousse' : statut === 'en-echec' ? 'fane' : statut === 'endormi' ? 'dort' : 'mur'
  const arrose = statut === 'au-travail'
  return (
    <g>
      <Terre x={x} dy={dy} dessus={dessus} seche={statut === 'en-echec' || statut === 'absent'} />
      {statut === 'absent'
        ? null
        : [26, 44, 78, 96].flatMap((dx, i) => [
            <Plant key={`a${dx}`} x={x + dx} y={dy + 3} etat={etat} recolte={recolte} debut={i * 0.3} />,
            <Plant key={`b${dx}`} x={x + dx + 4} y={dy + 21} etat={etat} recolte={recolte} debut={i * 0.3 + 0.6} />,
          ])}
      <Ecriteau cx={cx - 4} dy={dy} statut={statut} bientot={bientot} recolte={recolte} />
      {/* L'arrosoir qui verse, à la main droite de l'agent. */}
      {arrose ? (
        <g>
          <g transform={`rotate(-20 ${cx + 22} ${dy + 18})`}>
            <rect x={cx + 16} y={dy + 14} width="12" height="9" fill="#94a3b8" />
            <rect x={cx + 16} y={dy + 14} width="12" height="2" fill="#cbd5e1" />
            <rect x={cx + 10} y={dy + 15} width="6" height="2" fill="#94a3b8" />
            <rect x={cx + 26} y={dy + 11} width="2" height="5" fill="#64748b" />
          </g>
          {[0, 0.3, 0.6].map((debut, i) => (
            <rect key={debut} x={cx + 10 + i * 2} y={dy + 20} width="1" height="3" fill="#7dd3fc" opacity="0">
              <Anim attributeName="y" values={etapes(dy + 20, dy + 32, 4)} dur="0.9s" begin={`${debut}s`} repeatCount="indefinite" />
              <Anim attributeName="opacity" values={etapes(1, 0.2, 4)} dur="0.9s" begin={`${debut}s`} repeatCount="indefinite" />
            </rect>
          ))}
        </g>
      ) : null}
      {/* Le piquet de l'emoji, son ruban à la couleur de l'agent. */}
      <rect x={x + 11} y={dy + 14} width="2" height="18" fill={BOIS.ombre} />
      <rect x={x + 11} y={dy + 16} width="5" height="3" fill={accent} />
      <text x={x + 12} y={dy + 13} fontSize="10" textAnchor="middle">
        {emoji}
      </text>
    </g>
  )
}

/** La table de la véranda : la citronnade, deux verres, le livre de comptes, le panier d'œufs. */
function TableVeranda({ dy, x, dessus }: PropsBureau) {
  return (
    <g>
      <rect x={x} y={dy} width={BUREAU.largeur} height={dessus} fill={BOIS.moyen} />
      <rect x={x} y={dy} width={BUREAU.largeur} height="3" fill={BOIS.clair} />
      {[12, 24].map((v) => (
        <rect key={v} x={x} y={dy + v} width={BUREAU.largeur} height="1" fill={BOIS.fonce} />
      ))}
      <rect x={x} y={dy + dessus} width={BUREAU.largeur} height="12" fill={BOIS.fonce} />
      <rect x={x + 3} y={dy + dessus + 12} width="4" height="7" fill={BOIS.ombre} />
      <rect x={x + BUREAU.largeur - 7} y={dy + dessus + 12} width="4" height="7" fill={BOIS.ombre} />
      {/* La citronnade et ses verres. */}
      <rect x={x + 10} y={dy + 2} width="12" height="18" fill="#e0f2fe" opacity="0.8" />
      <rect x={x + 11} y={dy + 7} width="10" height="12" fill="#fde047" />
      <rect x={x + 22} y={dy + 6} width="3" height="6" fill="#e0f2fe" opacity="0.8" />
      {[28, 36].map((dx) => (
        <g key={dx}>
          <rect x={x + dx} y={dy + 12} width="6" height="8" fill="#e0f2fe" opacity="0.8" />
          <rect x={x + dx} y={dy + 15} width="6" height="5" fill="#fde047" />
        </g>
      ))}
      {/* Le livre de comptes ouvert. */}
      <rect x={x + 50} y={dy + 6} width="30" height="20" fill="#7c2d12" />
      <rect x={x + 52} y={dy + 7} width="13" height="18" fill="#fef3c7" />
      <rect x={x + 65} y={dy + 7} width="13" height="18" fill="#fef3c7" />
      {[11, 15, 19].map((v) => (
        <g key={v}>
          <rect x={x + 54} y={dy + v} width="9" height="1" fill="#a8a29e" />
          <rect x={x + 67} y={dy + v} width="9" height="1" fill="#a8a29e" />
        </g>
      ))}
      {/* Le panier d'œufs. */}
      <rect x={x + 88} y={dy + 10} width="24" height="12" fill="#b8834a" />
      <rect x={x + 88} y={dy + 10} width="24" height="2" fill="#8a5a30" />
      {[91, 97, 103].map((v) => (
        <rect key={v} x={x + v} y={dy + 6} width="6" height="6" fill={v === 97 ? '#fef3c7' : '#f5e1c8'} />
      ))}
    </g>
  )
}

/** Le rocking-chair du fermier, ses barreaux, ses patins. */
function RockingChair({ x, y }: { x: number; y: number }) {
  return (
    <g>
      <rect x={x - 15} y={y - 32} width="30" height="38" fill={BOIS.ombre} />
      {[-11, -4, 3, 10].map((dx) => (
        <rect key={dx} x={x + dx} y={y - 29} width="3" height="32" fill={BOIS.moyen} />
      ))}
      <rect x={x - 15} y={y - 32} width="30" height="3" fill={BOIS.clair} />
      <rect x={x - 19} y={y - 6} width="5" height="12" fill={BOIS.fonce} />
      <rect x={x + 14} y={y - 6} width="5" height="12" fill={BOIS.fonce} />
      <rect x={x - 22} y={y + 6} width="44" height="3" fill={BOIS.ombre} />
      <rect x={x - 24} y={y + 4} width="3" height="3" fill={BOIS.ombre} />
      <rect x={x + 21} y={y + 4} width="3" height="3" fill={BOIS.ombre} />
    </g>
  )
}

/** Le tabouret retourné où l'agent s'assoit au bout de sa parcelle. */
function Tabouret({ x, y, couleur }: PropsSiege) {
  return (
    <g>
      <rect x={x - 9} y={y - 12} width="18" height="10" fill={BOIS.moyen} />
      <rect x={x - 9} y={y - 12} width="18" height="2" fill={couleur} />
    </g>
  )
}

/** Un bout de clôture, qui passe devant le dos de l'agent : il s'y adosse. */
function BoutDeCloture({ x, y, couleur }: PropsSiege) {
  return (
    <g>
      <rect x={x - 13} y={y} width="4" height="18" fill={BOIS.fonce} />
      <rect x={x + 9} y={y} width="4" height="18" fill={BOIS.fonce} />
      <rect x={x - 15} y={y + 4} width="30" height="3" fill={BOIS.clair} />
      <rect x={x - 15} y={y + 11} width="30" height="3" fill={BOIS.clair} />
      <rect x={x + 9} y={y + 2} width="4" height="2" fill={couleur} />
    </g>
  )
}

/* ——— Les tenues ——— */

const CHEMISES = ['#dc2626', '#2563eb', '#16a34a', '#f59e0b', '#7c3aed', '#db2777', '#0891b2', '#f8fafc', '#ea580c']
const SALOPETTES = ['#3b5b92', '#2f4a7a', '#6b4f2a', '#4b5563', '#7a5230']
const CHEVEUX = ['#2a1d14', '#5a3a22', '#c8a165', '#111111', '#8a4b2a', '#e5e5e5', '#b45309', '#d97706']
const PEAUX = ['#f1c9a5', '#d9a57a', '#a86f48', '#7a4a2c', '#f5d6bf']

/** Le nombre de cet agent dans ce thème : chaque thème a sa graine, pour des tenues qui changent d'un thème à l'autre. */
const hachage = (id: string) => hacher(id, 31, 47)

/** Chemises de couleur, salopettes, bottes ; le fermier en chemise à carreaux rouges, le facteur en bleu. */
function tenueFerme(id: string): Record<string, string> {
  if (id === CHEF_ID) {
    return { h: '#9ca3af', s: '#d9a57a', e: '#1c1917', c: '#b91c1c', C: '#2f4a7a', t: '#2f4a7a', k: PAILLE, p: '#2f4a7a', b: BOIS.ombre }
  }
  if (id.startsWith('livreur:')) {
    return { h: '#2a1d14', s: '#d9a57a', e: '#1c1917', c: '#1d4ed8', C: '#1e3a8a', t: '#facc15', k: '#1e3a8a', p: '#1e3a8a', b: '#111827' }
  }
  const h = hachage(id)
  const salopette = SALOPETTES[(h >>> 4) % SALOPETTES.length]
  return {
    h: CHEVEUX[(h >>> 8) % CHEVEUX.length],
    s: PEAUX[(h >>> 12) % PEAUX.length],
    e: '#1c1917',
    c: CHEMISES[h % CHEMISES.length],
    C: salopette,
    t: salopette,
    k: PAILLE,
    p: salopette,
    b: BOIS.ombre,
  }
}

/** Le chapeau de paille : le fermier, et deux sur trois aux champs. */
const chapeauDePaille = (id: string) => id === CHEF_ID || (!estInvite(id) && hachage(id) % 3 !== 0)

/* La nuit : la pancarte de la véranda, les bornes, la lanterne de la grange, le poulailler, le puits, la pancarte du champ. */
const LUMIERES_FERME: Array<Lumiere> = [
  { x: 222, y: 40, r: 60, couleur: LANTERNE },
  { x: 373, y: 50, r: 45, couleur: '#a855f7' },
  { x: 417, y: 50, r: 40, couleur: '#22d3ee' },
  { x: 510, y: 50, r: 55, couleur: LANTERNE },
  { x: 618, y: 45, r: 35, couleur: LANTERNE },
  { x: 792, y: 53, r: 40, couleur: LANTERNE },
  { x: 695, y: 228, r: 50, couleur: LANTERNE },
]

export const THEME_FERME: Theme = {
  coins: COINS_FERME,
  coinCafe: 'puits',
  fond: '#14231a',
  Decor,
  Bureau: Parcelle,
  BureauChef: TableVeranda,
  plaque: '#fef3c7',
  Assise: Tabouret,
  Dossier: BoutDeCloture,
  Fauteuil: RockingChair,
  tenue: tenueFerme,
  casque: chapeauDePaille,
  CafeQuiCoule: SeauQuiGoutte,
  lumieres: LUMIERES_FERME,
  // Endormi, on s'adosse à la clôture, le chapeau de paille sur les yeux.
  sieste: true,
}
