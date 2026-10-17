import type { ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { ButtonGroup } from '@/components/ui/button-group'
import { Separator } from '@/components/ui/separator'
import { ANNUAIRE, ATELIER, BUG, CAFE, DEPOT, DISCUSSIONS, IDEE, NPM, RELEASES, SITE, chemin, type Page } from '@/data/site'
import type { Language } from '@/registry/pixel-openspace/types'

/*
 * Le cadre de chaque page du site : l'en-tête avec sa navigation, le pied de
 * page avec ses colonnes de liens, et la page elle-même entre les deux.
 */

/** Le bouton jaune de Buy Me a Coffee, avec ses couleurs et sa police Cookie, sans le compteur de soutiens de leur image. */
export function BoutonCafe({ texte }: { texte: string }) {
  return (
    <a
      href={CAFE}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex h-10 w-fit items-center gap-2 rounded-lg border border-black bg-[#ffdd00] px-4 font-[family-name:var(--font-cookie)] text-2xl leading-none text-black transition-colors hover:bg-[#ffe633] focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
    >
      <span aria-hidden="true" className="font-sans text-lg">
        ☕
      </span>
      {texte}
    </a>
  )
}

/** Le choix de la langue : la même page, en anglais ou en français. */
function ChoixLangue({ langue, page, libelle }: { langue: Language; page: Page; libelle: string }) {
  const liens: Array<{ code: Language; texte: string }> = [
    { code: 'en', texte: 'EN' },
    { code: 'fr', texte: 'FR' },
  ]
  return (
    <ButtonGroup aria-label={libelle}>
      {liens.map((l) => (
        <Button
          key={l.code}
          size="sm"
          variant={l.code === langue ? 'default' : 'outline'}
          nativeButton={false}
          render={<a href={chemin(l.code, page)} hrefLang={l.code} lang={l.code} aria-current={l.code === langue ? 'page' : undefined} />}
        >
          {l.texte}
        </Button>
      ))}
    </ButtonGroup>
  )
}

function EnTete({ langue, page }: { langue: Language; page: Page }) {
  const t = SITE[langue].nav
  const lien = (vers: Page, texte: string) => (
    <Button
      variant="ghost"
      size="sm"
      className={`hidden sm:inline-flex ${page === vers ? 'text-primary' : ''}`}
      nativeButton={false}
      render={<a href={chemin(langue, vers)} aria-current={page === vers ? 'page' : undefined} />}
    >
      {texte}
    </Button>
  )
  return (
    <header className="flex items-center justify-between gap-4 py-6">
      <a href={chemin(langue, 'accueil')} aria-label="pixel-openspace">
        {/* Le logo officiel, en version sombre : le site ne connaît que le thème sombre. */}
        {/* eslint-disable-next-line @next/next/no-img-element -- un SVG statique, rien à optimiser */}
        <img src="/docs/logo-sombre.svg" alt="pixel-openspace" width={204} height={48} className="h-12 w-auto" />
      </a>
      <nav className="flex items-center gap-1 text-sm">
        <Button
          variant="ghost"
          size="sm"
          className="hidden lg:inline-flex"
          nativeButton={false}
          render={<a href={`${chemin(langue, 'accueil')}#setup`} />}
        >
          {t.installer}
        </Button>
        {lien('changelog', t.changelog)}
        {lien('faq', t.faq)}
        {lien('contact', t.contact)}
        <Button variant="ghost" size="sm" nativeButton={false} render={<a href={DEPOT} />}>
          GitHub
        </Button>
        <ChoixLangue langue={langue} page={page} libelle={langue === 'fr' ? 'Langue' : 'Language'} />
      </nav>
    </header>
  )
}

function PiedDePage({ langue, page }: { langue: Language; page: Page }) {
  const t = SITE[langue].pied
  const colonnes: Array<{ titre: string; liens: Array<{ texte: string; href: string }> }> = [
    {
      titre: t.produit,
      liens: [
        { texte: t.demo, href: chemin(langue, 'accueil') },
        { texte: t.installer, href: `${chemin(langue, 'accueil')}#setup` },
        { texte: t.changelog, href: chemin(langue, 'changelog') },
        { texte: t.faq, href: chemin(langue, 'faq') },
      ],
    },
    {
      titre: t.projet,
      liens: [
        { texte: t.github, href: DEPOT },
        { texte: t.npm, href: NPM },
        { texte: t.releases, href: RELEASES },
        { texte: t.annuaire, href: ANNUAIRE },
      ],
    },
    {
      titre: t.aide,
      liens: [
        { texte: t.contact, href: chemin(langue, 'contact') },
        { texte: t.discussions, href: DISCUSSIONS },
        { texte: t.bug, href: BUG },
        { texte: t.idee, href: IDEE },
      ],
    },
  ]
  return (
    <footer className="flex flex-col gap-10 py-14 text-sm">
      <div className="grid gap-10 md:grid-cols-[1.4fr_repeat(3,1fr)]">
        <div className="flex max-w-[34ch] flex-col gap-4">
          {/* eslint-disable-next-line @next/next/no-img-element -- un SVG statique, rien à optimiser */}
          <img src="/docs/logo-sombre.svg" alt="pixel-openspace" width={170} height={40} className="h-10 w-auto self-start" />
          <p className="leading-relaxed text-muted-foreground">{t.accroche}</p>
          <BoutonCafe texte={langue === 'fr' ? 'M’offrir un café' : 'Buy me a coffee'} />
        </div>
        {colonnes.map((c) => (
          <nav key={c.titre} aria-label={c.titre} className="flex flex-col gap-3">
            <h2 className="font-heading text-base text-foreground">{c.titre}</h2>
            <ul className="flex flex-col gap-2">
              {c.liens.map((l) => (
                <li key={l.href}>
                  <a href={l.href} className="text-muted-foreground transition-colors hover:text-foreground">
                    {l.texte}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>
      <Separator />
      <div className="flex flex-col gap-4 text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <p>
          © {new Date().getFullYear()} pixel-openspace · {t.licence} · {t.faitA}
          <a href={ATELIER} className="underline-offset-2 hover:text-foreground hover:underline">
            Monte Ma Tour
          </a>
          {t.atelier}
        </p>
        <ChoixLangue langue={langue} page={page} libelle={langue === 'fr' ? 'Langue' : 'Language'} />
      </div>
    </footer>
  )
}

/** Une page du site : l'en-tête, son contenu, le pied de page. */
export function Cadre({ langue, page, children }: { langue: Language; page: Page; children: ReactNode }) {
  return (
    <main lang={langue} className="mx-auto flex w-full max-w-6xl flex-col px-4 sm:px-6">
      <EnTete langue={langue} page={page} />
      {children}
      <Separator />
      <PiedDePage langue={langue} page={page} />
    </main>
  )
}

/** Le titre et l'introduction d'une page intérieure. */
export function TitrePage({ titre, intro, children }: { titre: string; intro: string; children?: ReactNode }) {
  return (
    <div className="flex max-w-3xl flex-col gap-5 pt-10 pb-12 sm:pt-16">
      <h1 className="font-heading text-5xl leading-[0.95] tracking-tight text-balance sm:text-6xl">{titre}</h1>
      <p className="max-w-[62ch] text-lg leading-relaxed text-muted-foreground">{intro}</p>
      {children}
    </div>
  )
}
