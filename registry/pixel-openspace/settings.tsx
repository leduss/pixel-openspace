'use client'

/*
 * La fenêtre des réglages, derrière la roue dentée : le thème, la langue, le
 * son, les alertes, les saisons, la nuit et les déplacements. Ce que le
 * visiteur choisit est gardé dans son navigateur et passe avant les props.
 */

import { SettingsIcon } from 'lucide-react'
import { useId, useState, type ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { ButtonGroup } from '@/components/ui/button-group'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { useTextes } from './primitives'
import type { Language, ThemeName } from './types'

/** Ce que le visiteur a changé ; ce qu'il n'a pas touché suit les props. */
export type Preferences = {
  title?: string
  theme?: ThemeName
  language?: Language
  seasonal?: boolean
  night?: boolean
  motion?: boolean
}

const CLE = 'pixel-openspace:settings'

export function lirePreferences(): Preferences {
  try {
    return JSON.parse(localStorage.getItem(CLE) ?? '{}') as Preferences
  } catch {
    return {}
  }
}

export function ecrirePreferences(preferences: Preferences) {
  try {
    if (Object.keys(preferences).length) localStorage.setItem(CLE, JSON.stringify(preferences))
    else localStorage.removeItem(CLE)
  } catch {
    /* Navigation privée ou stockage bloqué : le réglage vaut pour cette visite. */
  }
}

const THEMES: Array<ThemeName> = ['geek', 'eighties', 'gym', 'modern']
const LANGUES: Array<[Language, string]> = [
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
  theme,
  langue,
  saisons,
  nuit,
  mouvement,
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
  theme: ThemeName
  langue: Language
  saisons: boolean
  nuit: boolean
  mouvement: boolean
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
  return (
    <Dialog open={ouverte} onOpenChange={setOuverte}>
      <Button variant="outline" size="icon-sm" aria-label={t.open} title={t.open} onClick={() => setOuverte(true)}>
        <SettingsIcon />
      </Button>
      <DialogContent className="sm:max-w-md">
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
              maxLength={24}
              onChange={(e) => changer({ title: e.target.value || undefined })}
            />
          </div>
          <Choix nom={t.theme} options={THEMES.map((n) => [n, t.themes[n]])} valeur={theme} changer={(v) => changer({ theme: v })} />
          <Choix nom={t.language} options={LANGUES} valeur={langue} changer={(v) => changer({ language: v })} />
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
