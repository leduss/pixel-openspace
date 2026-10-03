'use client'

/*
 * Le thème années 80 : un bureau d'entreprise vers 1986. Boiseries aux
 * murs, moquette orange, écrans cathodiques beiges au texte vert phosphore,
 * téléphones à cadran et bannettes à courrier. Le chef a son ordinateur
 * central à bandes magnétiques et sa lampe de banquier ; la salle de pause a
 * ses bornes d'arcade, sa télé à pieds qui diffuse la mire, son canapé en
 * velours côtelé et sa photocopieuse ; la cuisine, sa cafetière à filtre et
 * son frigo vert avocat. Costumes, cravates, pulls de couleur, et un Walkman
 * sur les oreilles de certains.
 */

import { BUREAU, CHEF_ID, estInvite, type CoinDePause, type Statut } from '../engine'
import { Anim, Cliquable, MUR_SALLE, Neon, Plante, etapes, useTextes, hacher, type Lumiere } from '../primitives'
import type { PropsBureau, PropsDecor, PropsSiege, Theme } from '../theme'
import { Arcade, BorneCasseBriques } from './geek'
import type { SceneObject } from '../types'

/* Les coins de pause : la même géographie que le thème geek, d'autres objets. */
const COINS_80: Array<CoinDePause> = [
  { nom: 'cafe', x: 768, y: 100 },
  { nom: 'fontaine', x: 881, y: 104 },
  { nom: 'frigo', x: 950, y: 108 },
  { nom: 'arcade', x: 372, y: 112 },
  { nom: 'arcade-2', x: 415, y: 112 },
  { nom: 'photocopieuse', x: 636, y: 108 },
  // Sur le canapé, face à la télé : de dos.
  { nom: 'canape-gauche', x: 482, y: 146, assis: true },
  { nom: 'canape-droite', x: 538, y: 146, assis: true },
]

const BOIS = { arete: '#2b1a0e', face: '#7b4a24', rainure: '#6a3d1c', plinthe: '#3b2412' }
const PHOSPHORE = '#4ade80'

/** Un mur lambrissé, vu de biais : son arête, ses lames de bois, sa plinthe. */
function Lambris({ x, largeur, y = 20, hauteur = 32 }: { x: number; largeur: number; y?: number; hauteur?: number }) {
  return (
    <>
      <rect x={x} y={y - 6} width={largeur} height="6" fill={BOIS.arete} />
      <rect x={x} y={y} width={largeur} height={hauteur} fill={BOIS.face} />
      {Array.from({ length: Math.floor(largeur / 12) }, (_, i) => (
        <rect key={i} x={x + 6 + i * 12} y={y} width="1" height={hauteur} fill={BOIS.rainure} />
      ))}
      <rect x={x} y={y + hauteur} width={largeur} height="4" fill={BOIS.plinthe} />
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
        <pattern id="moquette-80" width="24" height="24" patternUnits="userSpaceOnUse">
          <rect width="24" height="24" fill="#6b4a2b" />
          <rect x="2" y="2" width="8" height="8" fill="#76532f" />
          <rect x="14" y="14" width="8" height="8" fill="#76532f" />
          <rect x="11" width="2" height="24" fill="#5e3f23" />
          <rect y="11" width="24" height="2" fill="#5e3f23" />
        </pattern>
        <pattern id="moquette-chef-80" width="10" height="10" patternUnits="userSpaceOnUse">
          <rect width="10" height="10" fill="#5c2a1e" />
          <rect x="2" y="2" width="2" height="2" fill="#6b3324" />
          <rect x="7" y="6" width="2" height="2" fill="#4f2318" />
        </pattern>
        <pattern id="shag-80" width="8" height="8" patternUnits="userSpaceOnUse">
          <rect width="8" height="8" fill="#b45309" />
          <rect x="1" y="1" width="2" height="2" fill="#c2610f" />
          <rect x="5" y="4" width="2" height="2" fill="#9a4708" />
          <rect x="3" y="6" width="1" height="1" fill="#d97706" />
        </pattern>
        <pattern id="lino-80" width="24" height="24" patternUnits="userSpaceOnUse">
          <rect width="24" height="24" fill="#e7d8b0" />
          <rect width="12" height="12" fill="#c9b48a" />
          <rect x="12" y="12" width="12" height="12" fill="#c9b48a" />
        </pattern>
        <pattern id="faience-80" width="10" height="10" patternUnits="userSpaceOnUse">
          <rect width="10" height="10" fill="#e9d38a" />
          <rect width="10" height="1" fill="#d4ba6a" />
          <rect width="1" height="10" fill="#d4ba6a" />
        </pattern>
      </defs>

      {/* Les sols : moquette bordeaux chez le chef, orange à poils longs en salle de pause, lino en damier en cuisine. */}
      <rect x="20" y="56" width="310" height="142" fill="url(#moquette-chef-80)" />
      <rect x="338" y="56" width="344" height="142" fill="url(#shag-80)" />
      <rect x="690" y="56" width="290" height="142" fill="url(#lino-80)" />
      <rect x="20" y="198" width="960" height={bas - 198} fill="url(#moquette-80)" />

      {/* Les murs du fond : lambris, et faïence jaune en cuisine. */}
      <Lambris x={20} largeur={310} />
      <Lambris x={338} largeur={344} />
      <rect x="690" y="14" width="290" height="6" fill={BOIS.arete} />
      <rect x="690" y="20" width="290" height="36" fill="url(#faience-80)" />

      {/* Le bureau du chef : l'ordinateur central, la plaque en laiton, le ficus. */}
      <Cliquable {...lien('server-rack')}>
        <OrdinateurCentral x={34} />
      </Cliquable>
      <rect x="160" y="28" width="124" height="18" fill="#7a5a1e" />
      <rect x="162" y="30" width="120" height="14" fill="#d4a93b" />
      <text x="222" y="41" fontSize="9" textAnchor="middle" fill="#3b2a0a">
        {t.leadOffice}
      </text>
      <Plante x={300} y={62} />

      {/* La salle de pause : les bornes, la télé à pieds et son magnétoscope, le canapé, la photocopieuse. */}
      <Cliquable titre={t.objects.snake} faire={() => jouer('snake')}>
        <Arcade x={352} />
      </Cliquable>
      <Cliquable titre={t.objects.breakout} faire={() => jouer('casse-briques')}>
        <BorneCasseBriques x={396} />
      </Cliquable>
      <Cliquable {...lien('tv')}>
        <TeleCathodique x={462} />
      </Cliquable>
      <Canape x={456} y={130} />
      <Cliquable {...lien('workbench')}>
        <Photocopieuse x={596} />
      </Cliquable>
      <Plante x={346} y={160} />
      <Plante x={650} y={160} />

      {/* La cuisine : plan de travail stratifié, cafetière à filtre, fontaine, frigo vert avocat, téléphone mural, table orange. */}
      <rect x="730" y="44" width="122" height="24" fill="#b08b5b" />
      <rect x="730" y="44" width="122" height="3" fill="#c49e6c" />
      <rect x="730" y="68" width="122" height="18" fill="#8b5a2b" />
      {[734, 774, 814].map((x) => (
        <g key={x}>
          <rect x={x} y="71" width="34" height="12" fill="#7a4d24" />
          <rect x={x + 14} y="76" width="6" height="2" fill="#d4a93b" />
        </g>
      ))}
      <Cafetiere x={748} />
      <rect x="814" y="50" width="34" height="12" fill="#a8a29e" />
      <rect x="818" y="53" width="26" height="6" fill="#d6d3d1" />
      <rect x="700" y="24" width="12" height="22" fill="#facc15" />
      <rect x="702" y="28" width="8" height="8" fill="#ca8a04" />
      <rect x="704" y="38" width="4" height="6" fill="#1f2937" />
      <Cliquable {...lien('vending-machine')}>
        <Fontaine x={862} />
      </Cliquable>
      <Cliquable {...lien('fridge')}>
        <FrigoAvocat x={922} />
      </Cliquable>
      <rect x="818" y="132" width="8" height="34" fill="#78350f" />
      <circle cx="822" cy="131" r="20" fill="#9a3412" shapeRendering="auto" />
      <circle cx="822" cy="128" r="20" fill="#ea580c" shapeRendering="auto" />
      {[784, 850].map((x) => (
        <g key={x}>
          <rect x={x} y="140" width="12" height="10" fill="#f97316" />
          <rect x={x + 4} y="150" width="4" height="12" fill="#57534e" />
        </g>
      ))}
      <Plante x={700} y={160} />

      {/* La grande salle : les cartons de fournitures, les plantes. */}
      <Cartons80 x={56} y={bas - 44} lien={lien} />
      <Plante x={946} y={bas - 32} />

      {/* Le mur de la grande salle, lambrissé, percé de ses trois entrées. */}
      {MUR_SALLE.map(([de, a]) => (
        <g key={de}>
          <Lambris x={de} largeur={a - de} y={204} hauteur={38} />
        </g>
      ))}
      <Neon x={695} y={226} texte={titre} couleur="#fb923c" taille={titre.length > 14 ? 7 : 9} />
      <Porte80 bas={bas} />
      <rect x="330" y="14" width="8" height="190" fill={BOIS.arete} />
      <rect x="332" y="14" width="4" height="190" fill={BOIS.rainure} />
      <rect x="682" y="14" width="8" height="190" fill={BOIS.arete} />
      <rect x="12" y="14" width="8" height={bas - 6} fill={BOIS.arete} />
      <rect x="980" y="14" width="8" height={bas - 6} fill={BOIS.arete} />
      <rect x="12" y="6" width="976" height="8" fill={BOIS.arete} />
      <rect x="12" y={bas} width="976" height="10" fill={BOIS.arete} />
    </>
  )
}

/** L'ordinateur central : une armoire beige, deux bobines de bande qui tournent, un pupitre de voyants. */
function OrdinateurCentral({ x }: { x: number }) {
  return (
    <g>
      <rect x={x} y="20" width="54" height="86" fill="#a8a092" />
      <rect x={x + 2} y="22" width="50" height="82" fill="#d6cfbd" />
      <rect x={x + 5} y="26" width="44" height="40" fill="#3f3a30" />
      {[x + 16, x + 38].map((cx) => (
        <g key={cx}>
          <circle cx={cx} cy="40" r="9" fill="#1c1917" shapeRendering="auto" />
          <circle cx={cx} cy="40" r="3" fill="#a8a29e" shapeRendering="auto" />
          <rect x={cx - 1} y="31" width="2" height="18" fill="#57534e">
            <Anim
              attributeName="transform"
              type="rotate"
              values={`0 ${cx} 40;60 ${cx} 40;120 ${cx} 40`}
              dur="0.9s"
              repeatCount="indefinite"
            />
          </rect>
        </g>
      ))}
      <rect x={x + 8} y="52" width="38" height="10" fill="#57534e" />
      {Array.from({ length: 6 }, (_, i) => (
        <rect key={i} x={x + 8 + i * 7} y="72" width="4" height="4" fill={['#ef4444', '#facc15', '#22c55e'][i % 3]}>
          <Anim attributeName="opacity" values="1;0.2;1" dur={`${0.6 + (i % 4) * 0.35}s`} repeatCount="indefinite" />
        </rect>
      ))}
      <rect x={x + 6} y="82" width="42" height="18" fill="#c9c1ad" />
      <rect x={x + 10} y="86" width="34" height="2" fill="#a8a092" />
      <rect x={x + 10} y="92" width="34" height="2" fill="#a8a092" />
    </g>
  )
}

/** La télé à pieds en bois : un écran bombé qui diffuse la mire, deux boutons, un magnétoscope dessous. */
function TeleCathodique({ x }: { x: number }) {
  const mire = ['#e5e7eb', '#facc15', '#22d3ee', '#22c55e', '#d946ef', '#ef4444', '#2563eb']
  return (
    <g>
      <rect x={x} y="22" width="96" height="54" fill="#5b3415" />
      <rect x={x + 2} y="24" width="92" height="50" fill="#7c4a1f" />
      <rect x={x + 6} y="28" width="64" height="42" fill="#111827" />
      {mire.map((c, i) => (
        <rect key={c} x={x + 9 + i * 8.4} y="31" width="8.4" height="28" fill={c} />
      ))}
      <rect x={x + 9} y="59" width="58.8" height="8" fill="#1e293b" />
      <rect x={x + 9} y="31" width="58.8" height="36" fill="white" opacity="0">
        <Anim attributeName="opacity" values="0;0;0.15;0" dur="3s" repeatCount="indefinite" />
      </rect>
      <circle cx={x + 82} cy="38" r="4" fill="#d6d3d1" shapeRendering="auto" />
      <circle cx={x + 82} cy="52" r="4" fill="#d6d3d1" shapeRendering="auto" />
      <rect x={x + 76} y="62" width="12" height="2" fill="#a8a29e" />
      <rect x={x + 10} y="76" width="4" height="12" fill="#3b2412" />
      <rect x={x + 82} y="76" width="4" height="12" fill="#3b2412" />
      <rect x={x + 22} y="78" width="52" height="8" fill="#1c1917" />
      <rect x={x + 26} y="81" width="18" height="2" fill="#57534e" />
      <rect x={x + 62} y="80" width="6" height="3" fill="#ef4444">
        <Anim attributeName="opacity" values="1;0.3" dur="1s" repeatCount="indefinite" />
      </rect>
    </g>
  )
}

/** Le canapé en velours côtelé, vu de dos depuis la salle. */
function Canape({ x, y }: { x: number; y: number }) {
  return (
    <g>
      <rect x={x} y={y + 10} width="108" height="26" fill="#5c3a1f" />
      <rect x={x + 6} y={y} width="96" height="22" fill="#7c4a2a" />
      {Array.from({ length: 12 }, (_, i) => (
        <rect key={i} x={x + 8 + i * 8} y={y + 2} width="2" height="18" fill="#6b3d22" />
      ))}
      <rect x={x} y={y + 4} width="10" height="32" fill="#6b3d22" />
      <rect x={x + 98} y={y + 4} width="10" height="32" fill="#6b3d22" />
    </g>
  )
}

/** La photocopieuse : une grosse caisse beige, son couvercle, son pupitre et sa pile de feuilles. */
function Photocopieuse({ x }: { x: number }) {
  return (
    <g>
      <rect x={x} y="40" width="78" height="52" fill="#a8a092" />
      <rect x={x + 2} y="42" width="74" height="48" fill="#d6cfbd" />
      <rect x={x + 4} y="34" width="52" height="10" fill="#57534e" />
      <rect x={x + 58} y="44" width="16" height="10" fill="#3f3a30" />
      <rect x={x + 60} y="46" width="5" height="3" fill="#22c55e">
        <Anim attributeName="opacity" values="1;0.3;1" dur="1.4s" repeatCount="indefinite" />
      </rect>
      <rect x={x + 6} y="58" width="66" height="4" fill="#a8a092" />
      <rect x={x + 6} y="66" width="66" height="4" fill="#a8a092" />
      <rect x={x + 78} y="60" width="10" height="12" fill="#f5f5f4" />
      <rect x={x + 4} y="90" width="6" height="6" fill="#3f3a30" />
      <rect x={x + 68} y="90" width="6" height="6" fill="#3f3a30" />
    </g>
  )
}

/** La cafetière à filtre : son réservoir, son filtre, sa verseuse où le café attend. */
function Cafetiere({ x }: { x: number }) {
  return (
    <g>
      <rect x={x} y="22" width="40" height="38" fill="#1c1917" />
      <rect x={x + 2} y="24" width="36" height="10" fill="#44403c" />
      <rect x={x + 30} y="27" width="5" height="4" fill="#ef4444" />
      <rect x={x + 10} y="40" width="20" height="16" fill="#e0f2fe" opacity="0.6" />
      <rect x={x + 11} y="48" width="18" height="8" fill="#5b2c0f" />
      <rect x={x + 30} y="44" width="4" height="8" fill="#1c1917" />
    </g>
  )
}

/** Le café qui coule dans la verseuse, quand quelqu'un attend devant. */
function CafeQuiCoule80() {
  return (
    <g pointerEvents="none">
      <rect x="767" y="36" width="2" height="12" fill="#5b2c0f">
        <Anim attributeName="opacity" values="1;0.4;1" dur="0.5s" repeatCount="indefinite" />
      </rect>
    </g>
  )
}

/** La fontaine à eau, sa grosse bonbonne bleue retournée et ses gobelets. */
function Fontaine({ x }: { x: number }) {
  return (
    <g>
      <rect x={x + 4} y="14" width="30" height="30" fill="#60a5fa" opacity="0.85" />
      <rect x={x + 8} y="18" width="6" height="20" fill="#bfdbfe" opacity="0.8" />
      <rect x={x + 12} y="10" width="14" height="6" fill="#3b82f6" />
      <rect x={x} y="44" width="38" height="50" fill="#f5f5f4" />
      <rect x={x} y="44" width="38" height="4" fill="#d6d3d1" />
      <rect x={x + 8} y="54" width="6" height="5" fill="#3b82f6" />
      <rect x={x + 24} y="54" width="6" height="5" fill="#ef4444" />
      <rect x={x + 6} y="70" width="26" height="4" fill="#a8a29e" />
      <rect x={x + 40} y="50" width="6" height="22" fill="#e5e7eb" />
    </g>
  )
}

/** Le frigo vert avocat, poignées chromées. */
function FrigoAvocat({ x }: { x: number }) {
  return (
    <g>
      <rect x={x} y="16" width="54" height="82" fill="#4d6b1c" />
      <rect x={x + 2} y="18" width="50" height="78" fill="#6b8e23" />
      <rect x={x + 2} y="46" width="50" height="2" fill="#4d6b1c" />
      <rect x={x + 42} y="26" width="4" height="14" fill="#d6d3d1" />
      <rect x={x + 42} y="54" width="4" height="26" fill="#d6d3d1" />
      <rect x={x + 8} y="24" width="12" height="8" fill="#facc15" />
    </g>
  )
}

/** Les cartons de fournitures : processeurs 8086, cartes EGA, mémoire 64 Ko. */
function Cartons80({
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
        <rect x={x} y={y + 14} width="40" height="26" fill="#b08b5b" />
        <rect x={x} y={y + 14} width="40" height="4" fill="#c49e6c" />
        <text x={x + 20} y={y + 32} fontSize="7" textAnchor="middle" fill="#3b2412">
          8086
        </text>
      </Cliquable>
      <Cliquable {...lien('gpu-box')}>
        <rect x={x + 6} y={y} width="30" height="16" fill="#1e3a8a" />
        <rect x={x + 6} y={y} width="30" height="3" fill="#2563eb" />
        <text x={x + 21} y={y + 12} fontSize="6" textAnchor="middle" fill="#eff6ff">
          EGA
        </text>
      </Cliquable>
      <Cliquable {...lien('ram-box')}>
        <rect x={x + 44} y={y + 22} width="22" height="18" fill="#991b1b" />
        <text x={x + 55} y={y + 34} fontSize="6" textAnchor="middle" fill="#fef2f2">
          64K
        </text>
      </Cliquable>
    </g>
  )
}

/** La porte d'entrée en bois, sa poignée en laiton, son paillasson. */
function Porte80({ bas }: { bas: number }) {
  const t = useTextes()
  return (
    <g pointerEvents="none">
      <rect x="472" y={bas - 14} width="56" height="12" fill="#7c2d12" />
      <rect x="476" y={bas - 12} width="48" height="8" fill="#9a3412" />
      <text x="500" y={bas - 6} fontSize="5.5" textAnchor="middle" fill="#fed7aa">
        {t.welcome}
      </text>
      <rect x="470" y={bas} width="60" height="10" fill="#7b4a24" />
      <rect x="499" y={bas} width="2" height="10" fill={BOIS.arete} />
      <rect x="490" y={bas + 3} width="3" height="3" fill="#d4a93b" />
      <rect x="507" y={bas + 3} width="3" height="3" fill="#d4a93b" />
    </g>
  )
}

/* ——— Les postes ——— */

/** Le plateau en bois veiné, sa tranche, ses pieds pleins. */
function PlateauBois({ x, dy, dessus, fonce = false }: { x: number; dy: number; dessus: number; fonce?: boolean }) {
  const [plateau, veine, tranche] = fonce ? ['#5a2e1a', '#4a2414', '#3d1d10'] : ['#9a6235', '#8a5530', '#74451f']
  return (
    <>
      <rect x={x} y={dy} width={BUREAU.largeur} height={dessus} fill={plateau} />
      <rect x={x} y={dy} width={BUREAU.largeur} height="3" fill={fonce ? '#6b3a22' : '#ad7442'} />
      {[10, 22, 31].map((v) => (
        <rect key={v} x={x + 4} y={dy + v} width={BUREAU.largeur - 8} height="1" fill={veine} />
      ))}
      <rect x={x} y={dy + dessus} width={BUREAU.largeur} height="12" fill={tranche} />
      <rect x={x + 2} y={dy + dessus + 12} width="8" height="7" fill={tranche} />
      <rect x={x + BUREAU.largeur - 10} y={dy + dessus + 12} width="8" height="7" fill={tranche} />
    </>
  )
}

/**
 * L'écran cathodique beige et son unité centrale. Au repos, l'invite
 * `C:\>` clignote ; au travail, des lignes vertes défilent ; en échec,
 * ERROR clignote en rouge et l'unité centrale fume ; absent, l'écran est
 * noir et un post-it y est collé.
 */
function Cathodique({ cx, dy, statut, bientot }: { cx: number; dy: number; statut: Statut; bientot: number | null }) {
  const t = useTextes()
  const g = cx - 22
  return (
    <g>
      {/* L'unité centrale, centrée sous l'écran : son lecteur de disquettes et son voyant. */}
      <rect x={cx - 28} y={dy + 6} width="56" height="12" fill="#c9c1ad" />
      <rect x={cx - 28} y={dy + 6} width="56" height="2" fill="#ddd6c3" />
      <rect x={cx - 22} y={dy + 11} width="18" height="2" fill="#3f3a30" />
      <rect x={cx + 18} y={dy + 10} width="4" height="3" fill={statut === 'au-travail' ? '#22c55e' : '#57534e'}>
        {statut === 'au-travail' ? <Anim attributeName="opacity" values="1;0.2;1;1" dur="0.4s" repeatCount="indefinite" /> : null}
      </rect>
      {/* L'écran, bombé dans son boîtier beige. */}
      <rect x={g - 4} y={dy - 22} width="52" height="30" fill="#d8cfb8" />
      <rect x={g - 4} y={dy - 22} width="52" height="2" fill="#e8e0cc" />
      <rect x={g} y={dy - 19} width="44" height="23" fill={statut === 'absent' ? '#0a0a0a' : '#052e16'} />
      {statut === 'absent' ? (
        <g transform={`rotate(-6 ${cx} ${dy - 8})`}>
          <rect x={cx - 15} y={dy - 16} width="30" height="15" fill="#fde68a" />
          <rect x={cx - 15} y={dy - 16} width="30" height="3" fill="#fcd34d" />
          <text x={cx} y={dy - 4} fontSize="7" textAnchor="middle" fill="#78350f">
            {t.offNote}
          </text>
        </g>
      ) : statut === 'en-echec' ? (
        <text x={cx} y={dy - 4} fontSize="9" textAnchor="middle" fill="#ef4444">
          ERROR
          <Anim attributeName="opacity" values="1;0.2" dur="0.8s" repeatCount="indefinite" />
        </text>
      ) : statut === 'au-travail' ? (
        <g>
          {[0, 1, 2, 3].map((i) => {
            const w = [30, 18, 34, 12][i]
            return (
              <rect key={i} x={g + 3 + (i % 2) * 4} y={dy - 17 + i * 5} width={w} height="2" fill={PHOSPHORE}>
                <Anim attributeName="width" values={`${etapes(2, w, 5)};${w}`} dur="1.6s" begin={`${i * 0.4}s`} repeatCount="indefinite" />
              </rect>
            )
          })}
        </g>
      ) : (
        <g>
          <text x={g + 3} y={dy - 11} fontSize="7" fill={PHOSPHORE}>
            {'C:\\>'}
          </text>
          <rect x={g + 22} y={dy - 16} width="4" height="6" fill={PHOSPHORE}>
            <Anim attributeName="opacity" values="1;0" dur="1s" repeatCount="indefinite" />
          </rect>
        </g>
      )}
      {bientot ? (
        <text x={cx} y={dy + 2} fontSize="6.5" textAnchor="middle" fill={PHOSPHORE}>
          {t.inMinutes(bientot)}
          <Anim attributeName="opacity" values="1;0.5;1" dur="2s" repeatCount="indefinite" />
        </text>
      ) : null}
      {/* En échec, l'unité centrale fume. */}
      {statut === 'en-echec'
        ? [0, 0.6, 1.2].map((debut, i) => (
            <rect key={debut} x={cx + 10 + i * 3} y={dy + 4} width="6" height="6" fill="#9ca3af" opacity="0">
              <Anim attributeName="y" values={etapes(dy + 4, dy - 28, 6)} dur="1.8s" begin={`${debut}s`} repeatCount="indefinite" />
              <Anim attributeName="opacity" values={etapes(0.85, 0, 6)} dur="1.8s" begin={`${debut}s`} repeatCount="indefinite" />
            </rect>
          ))
        : null}
    </g>
  )
}

/** Le bureau d'un agent : bois veiné, écran cathodique, clavier beige, téléphone à cadran, bannette à courrier. */
function Bureau80({ cx, dy, x, dessus, statut, bientot, emoji }: PropsBureau) {
  return (
    <g>
      <PlateauBois x={x} dy={dy} dessus={dessus} />
      <Cathodique cx={cx - 4} dy={dy} statut={statut} bientot={bientot} />
      {/* Le clavier beige, ses rangées de touches. */}
      <rect x={cx - 24} y={dy + 22} width="40" height="10" fill="#d8cfb8" />
      <rect x={cx - 22} y={dy + 24} width="36" height="2" fill="#a8a092" />
      <rect x={cx - 22} y={dy + 28} width="36" height="2" fill="#a8a092" />
      {/* Le téléphone à cadran. */}
      <rect x={x + 94} y={dy + 18} width="18" height="12" fill="#b91c1c" />
      <rect x={x + 92} y={dy + 14} width="22" height="5" fill="#7f1d1d" />
      <circle cx={x + 103} cy={dy + 24} r="4" fill="#fef2f2" shapeRendering="auto" />
      <circle cx={x + 103} cy={dy + 24} r="1.5" fill="#7f1d1d" shapeRendering="auto" />
      {/* La bannette à courrier, et sa pile de feuilles. */}
      <rect x={x + 90} y={dy + 2} width="24" height="10" fill="#57534e" />
      <rect x={x + 92} y={dy + 3} width="20" height="5" fill="#f5f5f4" />
      {/* La tasse et l'emoji de l'agent, en autocollant. */}
      <rect x={x + 8} y={dy + 22} width="8" height="9" fill="#f5f5f4" />
      <rect x={x + 16} y={dy + 24} width="3" height="4" fill="#f5f5f4" />
      <rect x={x + 9} y={dy + 23} width="6" height="2" fill="#5b2c0f" />
      <text x={x + 12} y={dy + 13} fontSize="10" textAnchor="middle">
        {emoji}
      </text>
    </g>
  )
}

/** Le bureau du chef : acajou, lampe de banquier verte, téléphone, sous-main et stylos. */
function BureauChef80({ dy, x, dessus }: PropsBureau) {
  return (
    <g>
      <PlateauBois x={x} dy={dy} dessus={dessus} fonce />
      <rect x={x + 10} y={dy - 8} width="26" height="10" fill="#15803d" />
      <rect x={x + 10} y={dy - 8} width="26" height="3" fill="#22c55e" />
      <rect x={x + 22} y={dy + 2} width="2" height="10" fill="#d4a93b" />
      <rect x={x + 16} y={dy + 12} width="14" height="3" fill="#d4a93b" />
      <rect x={x + 40} y={dy + 14} width="40" height="18" fill="#14532d" />
      <rect x={x + 46} y={dy + 18} width="28" height="2" fill="#f5f5f4" />
      <rect x={x + 90} y={dy + 16} width="18" height="12" fill="#1c1917" />
      <rect x={x + 88} y={dy + 12} width="22" height="5" fill="#292524" />
      <rect x={x + 100} y={dy + 2} width="8" height="10" fill="#d4a93b" />
      <rect x={x + 102} y={dy - 4} width="1" height="8" fill="#1c1917" />
      <rect x={x + 105} y={dy - 2} width="1" height="6" fill="#b91c1c" />
    </g>
  )
}

/** Le grand fauteuil de cuir sang-de-bœuf du chef, capitonné. */
function Fauteuil80({ x, y }: { x: number; y: number }) {
  return (
    <g>
      <rect x={x - 17} y={y - 36} width="34" height="44" fill="#3f0f0f" />
      <rect x={x - 14} y={y - 33} width="28" height="38" fill="#6b1f1f" />
      {[0, 1, 2].map((r) =>
        [0, 1, 2].map((c) => <rect key={`${r}${c}`} x={x - 9 + c * 8} y={y - 28 + r * 9} width="2" height="2" fill="#3f0f0f" />),
      )}
      <rect x={x - 21} y={y - 8} width="7" height="16" fill="#3f0f0f" />
      <rect x={x + 14} y={y - 8} width="7" height="16" fill="#3f0f0f" />
    </g>
  )
}

/** La chaise de bureau en tissu orangé ; un liseré de la couleur de l'agent. */
function Assise80({ x, y, couleur }: PropsSiege) {
  return (
    <g>
      <rect x={x - 11} y={y - 12} width="22" height="12" fill="#9a4708" />
      <rect x={x - 11} y={y - 2} width="22" height="2" fill={couleur} />
    </g>
  )
}

function Dossier80({ x, y, couleur }: PropsSiege) {
  return (
    <g>
      <rect x={x - 12} y={y + 2} width="24" height="10" fill="#7c3a06" />
      <rect x={x - 10} y={y + 4} width="20" height="6" fill="#b45309" />
      <rect x={x - 10} y={y + 10} width="20" height="1" fill={couleur} />
      <rect x={x - 2} y={y + 12} width="4" height="3" fill="#44403c" />
      <rect x={x - 10} y={y + 15} width="20" height="3" fill="#292524" />
    </g>
  )
}

/* ——— Les tenues ——— */

const VESTES = ['#1e3a8a', '#4b5563', '#7c2d12', '#991b1b', '#065f46', '#b45309', '#6d28d9', '#be185d', '#0e7490', '#57534e']
const CRAVATES = ['#dc2626', '#facc15', '#f5f5f4', '#2563eb', '#16a34a', '#f472b6']
const CHEVEUX = ['#2a1d14', '#5a3a22', '#c8a165', '#111111', '#8a4b2a', '#fde68a', '#b45309']
const PEAUX = ['#f1c9a5', '#d9a57a', '#a86f48', '#7a4a2c', '#f5d6bf']
const PANTALONS = ['#44403c', '#78716c', '#1c1917', '#7c2d12', '#d6d3d1']

/** Le nombre de cet agent dans ce thème : chaque thème a sa graine, pour des tenues qui changent d'un thème à l'autre. */
const hachage = (id: string) => hacher(id, 11, 33)

/** Costumes, cravates de couleur, pulls vifs ; le chef en costume bleu nuit et cravate rouge. */
function tenue80(id: string): Record<string, string> {
  if (id === CHEF_ID) {
    return { h: '#9ca3af', s: '#f1c9a5', e: '#1c1917', c: '#172554', C: '#0f172a', t: '#dc2626', k: '#f97316', p: '#172554', b: '#1c1917' }
  }
  // Le livreur, en blouse grise.
  if (id.startsWith('livreur:')) {
    return { h: '#5b3a1a', s: '#d9a57a', e: '#1c1917', c: '#78716c', C: '#57534e', t: '#facc15', k: '#111827', p: '#44403c', b: '#111827' }
  }
  const h = hachage(id)
  const veste = VESTES[h % VESTES.length]
  return {
    h: CHEVEUX[(h >>> 4) % CHEVEUX.length],
    s: PEAUX[(h >>> 8) % PEAUX.length],
    e: '#1c1917',
    c: veste,
    C: `color-mix(in oklab, ${veste} 70%, black)`,
    t: CRAVATES[(h >>> 12) % CRAVATES.length],
    // Le casque du Walkman, mousse orange.
    k: '#f97316',
    p: PANTALONS[(h >>> 16) % PANTALONS.length],
    b: '#1c1917',
  }
}

/** Un agent sur trois a son Walkman sur les oreilles. */
const walkman = (id: string) => id !== CHEF_ID && !estInvite(id) && hachage(id) % 3 === 0

/* Les lumières dans la nuit : la lampe de banquier, la télé, les bornes, la fontaine, l'enseigne. */
const LUMIERES_80: Array<Lumiere> = [
  { x: 222, y: 36, r: 50, couleur: '#d4a93b' },
  { x: 61, y: 60, r: 40, couleur: '#ef4444' },
  { x: 373, y: 50, r: 50, couleur: '#a855f7' },
  { x: 417, y: 50, r: 45, couleur: '#22d3ee' },
  { x: 500, y: 50, r: 70, couleur: '#93c5fd' },
  { x: 768, y: 40, r: 35 },
  { x: 881, y: 40, r: 40, couleur: '#60a5fa' },
  { x: 695, y: 226, r: 60, couleur: '#fb923c' },
]

export const THEME_80: Theme = {
  coins: COINS_80,
  coinCafe: 'cafe',
  fond: '#1a120c',
  Decor,
  Bureau: Bureau80,
  BureauChef: BureauChef80,
  plaque: '#f5deb3',
  Assise: Assise80,
  Dossier: Dossier80,
  Fauteuil: Fauteuil80,
  tenue: tenue80,
  casque: walkman,
  CafeQuiCoule: CafeQuiCoule80,
  lumieres: LUMIERES_80,
  // Le vert phosphore de chaque écran cathodique.
  lumierePoste: (cx, dy) => [{ x: cx - 4, y: dy - 8, r: 42, couleur: '#22c55e' }],
}
