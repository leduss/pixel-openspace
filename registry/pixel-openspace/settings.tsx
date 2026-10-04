'use client'

/*
 * La fenêtre des réglages, derrière la roue dentée : le thème, la langue, le
 * son, les alertes, les saisons, la nuit et les déplacements. Ce que le
 * visiteur choisit est gardé dans son navigateur et passe avant les props.
 */

import { SettingsIcon } from 'lucide-react'
import { useEffect, useId, useState, type ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { ButtonGroup } from '@/components/ui/button-group'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { COLONNES, LONGUEUR_ENSEIGNE, THEMES, type Preferences } from './preferences'
import { useTextes } from './primitives'
import type { Columns, Language, ThemeName, Weather } from './types'
import { lireMeteo, localiser, type Endroit } from './weather'

/** Où en est la recherche du lieu choisi dans les réglages. */
export type EtatMeteo = { etat: 'aucun' } | { etat: 'recherche' } | { etat: 'introuvable' } | { etat: 'trouve'; meteo: Weather }

/**
 * La météo du lieu tapé dans les réglages : cherchée une fois la frappe
 * finie, puis relue toutes les quinze minutes.
 */
export function useMeteoDuLieu(lieu: string | undefined, langue: Language): EtatMeteo {
  const cherche = lieu?.trim()
  // Le dernier résultat, avec le lieu qu'il concerne : un résultat pour un autre lieu ne compte plus.
  const [resultat, setResultat] = useState<{ lieu: string; etat: EtatMeteo } | null>(null)
  useEffect(() => {
    if (!cherche) return
    let fini = false
    let endroit: Endroit | null = null
    const lire = async () => {
      try {
        endroit ??= await localiser(cherche, langue)
        const meteo = { ...(await lireMeteo(endroit)), place: endroit.nom ?? cherche }
        if (!fini) setResultat({ lieu: cherche, etat: { etat: 'trouve', meteo } })
      } catch {
        if (!fini && !endroit) setResultat({ lieu: cherche, etat: { etat: 'introuvable' } })
      }
    }
    // Une recherche par lieu, pas une par lettre tapée.
    const attente = setTimeout(lire, 700)
    const minuterie = setInterval(lire, 15 * 60_000)
    return () => {
      fini = true
      clearTimeout(attente)
      clearInterval(minuterie)
    }
  }, [cherche, langue])
  if (!cherche) return { etat: 'aucun' }
  return resultat?.lieu === cherche ? resultat.etat : { etat: 'recherche' }
}

const NOMS_LANGUES: Array<[Language, string]> = [
  ['en', 'English'],
  ['fr', 'Français'],
]

/** Un réglage à interrupteur : son nom, une ligne d'explication, et l'interrupteur à droite. */
function Interrupteur({
  nom,
  aide,
  actif,
  changer,
  desactive,
}: {
  nom: string
  aide: ReactNode
  actif: boolean
  changer: (actif: boolean) => void
  desactive?: boolean
}) {
  const id = useId()
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="flex flex-col gap-1">
        <Label htmlFor={id}>{nom}</Label>
        <p className="text-sm text-muted-foreground">{aide}</p>
      </div>
      <Switch id={id} checked={actif} onCheckedChange={changer} disabled={desactive} className="mt-0.5" />
    </div>
  )
}

/** Un choix parmi quelques boutons, celui retenu en avant. */
function Choix<T extends string>({
  nom,
  options,
  valeur,
  changer,
}: {
  nom: string
  options: Array<[T, string]>
  valeur: T
  changer: (v: T) => void
}) {
  return (
    <div className="flex flex-col gap-2">
      <Label>{nom}</Label>
      <ButtonGroup aria-label={nom} className="flex-wrap">
        {options.map(([v, libelle]) => (
          <Button key={v} size="sm" variant={valeur === v ? 'default' : 'outline'} aria-pressed={valeur === v} onClick={() => changer(v)}>
            {libelle}
          </Button>
        ))}
      </ButtonGroup>
    </div>
  )
}

export function Reglages({
  titre,
  titreOrigine,
  lieu,
  lieuOrigine,
  etatMeteo,
  theme,
  colonnes,
  langue,
  saisons,
  nuit,
  mouvement,
  frise,
  son,
  alertes,
  alertesBloquees,
  changer,
  basculerSon,
  basculerAlertes,
  reinitialiser,
}: {
  /** L'enseigne choisie par le visiteur, vide s'il garde celle des props. */
  titre: string
  titreOrigine: string
  /** Le lieu tapé par le visiteur, vide s'il garde la météo des props. */
  lieu: string
  lieuOrigine?: string
  etatMeteo: EtatMeteo
  theme: ThemeName
  colonnes: Columns
  langue: Language
  saisons: boolean
  nuit: boolean
  mouvement: boolean
  frise: boolean
  son: boolean
  alertes: boolean
  alertesBloquees: boolean
  changer: (preferences: Preferences) => void
  basculerSon: () => void
  basculerAlertes: () => void
  reinitialiser: () => void
}) {
  const t = useTextes().settings
  // Ouverte et fermée à la main, sans `asChild` ni `render` : la même fenêtre marche avec les styles shadcn Radix et Base UI.
  const [ouverte, setOuverte] = useState(false)
  const idTitre = useId()
  const idLieu = useId()
  const aideMeteo =
    etatMeteo.etat === 'recherche'
      ? t.weatherSearching
      : etatMeteo.etat === 'introuvable'
        ? t.weatherNotFound
        : etatMeteo.etat === 'trouve'
          ? t.weatherFound(etatMeteo.meteo.place ?? lieu, etatMeteo.meteo.temperature)
          : null
  return (
    <Dialog open={ouverte} onOpenChange={setOuverte}>
      <Button variant="outline" size="icon-sm" aria-label={t.open} title={t.open} onClick={() => setOuverte(true)}>
        <SettingsIcon />
      </Button>
      <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t.title}</DialogTitle>
          <DialogDescription>{t.description}</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <Label htmlFor={idTitre}>{t.sign}</Label>
            <Input
              id={idTitre}
              value={titre}
              placeholder={titreOrigine}
              maxLength={LONGUEUR_ENSEIGNE}
              onChange={(e) => changer({ title: e.target.value || undefined })}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor={idLieu}>{t.weather}</Label>
            <Input
              id={idLieu}
              value={lieu}
              placeholder={lieuOrigine ?? t.weatherPlaceholder}
              onChange={(e) => changer({ weatherPlace: e.target.value || undefined })}
            />
            {aideMeteo ? (
              <p className={`text-sm ${etatMeteo.etat === 'introuvable' ? 'text-destructive' : 'text-muted-foreground'}`}>{aideMeteo}</p>
            ) : null}
          </div>
          <Choix nom={t.theme} options={THEMES.map((n) => [n, t.themes[n]])} valeur={theme} changer={(v) => changer({ theme: v })} />
          <Choix
            nom={t.columns}
            options={COLONNES.map((n) => [String(n) as `${Columns}`, String(n)])}
            valeur={String(colonnes) as `${Columns}`}
            changer={(v) => changer({ columns: Number(v) as Columns })}
          />
          <Choix nom={t.language} options={NOMS_LANGUES} valeur={langue} changer={(v) => changer({ language: v })} />
          <Separator />
          <Interrupteur nom={t.sound} aide={t.soundHint} actif={son} changer={basculerSon} />
          <Interrupteur
            nom={t.alerts}
            aide={alertesBloquees ? t.alertsBlocked : t.alertsHint}
            actif={alertes}
            changer={basculerAlertes}
            desactive={alertesBloquees}
          />
          <Separator />
          <Interrupteur nom={t.seasonal} aide={t.seasonalHint} actif={saisons} changer={(v) => changer({ seasonal: v })} />
          <Interrupteur nom={t.night} aide={t.nightHint} actif={nuit} changer={(v) => changer({ night: v })} />
          <Interrupteur nom={t.motion} aide={t.motionHint} actif={mouvement} changer={(v) => changer({ motion: v })} />
          <Interrupteur nom={t.timeline} aide={t.timelineHint} actif={frise} changer={(v) => changer({ timeline: v })} />
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={reinitialiser}>
            {t.reset}
          </Button>
          <Button onClick={() => setOuverte(false)}>{t.done}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
