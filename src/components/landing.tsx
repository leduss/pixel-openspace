import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ButtonGroup } from '@/components/ui/button-group'
import { Card } from '@/components/ui/card'
import { Item, ItemContent, ItemDescription, ItemGroup, ItemTitle } from '@/components/ui/item'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { CopyCommand } from '@/components/copy-command'
import { Demo } from '@/components/demo'
import { LogoCafe } from '@/components/logo-cafe'
import { CAFE, DEPOT, INSTALL, LAMPES, PAGE, ROUTE, TEXTES } from '@/data/landing'
import type { Language } from '@/registry/pixel-openspace/types'

/** Les deux exemples de code, en onglets : la route d'API, puis la page. */
function Exemples({ onglets }: { onglets: Array<{ titre: string; code: string }> }) {
  return (
    <Card className="max-w-3xl gap-0 py-0">
      <Tabs defaultValue={onglets[0].titre}>
        <TabsList className="m-2">
          {onglets.map((o) => (
            <TabsTrigger key={o.titre} value={o.titre}>
              {o.titre}
            </TabsTrigger>
          ))}
        </TabsList>
        {onglets.map((o) => (
          <TabsContent key={o.titre} value={o.titre}>
            <pre className="overflow-x-auto border-t p-4 font-mono text-[0.78rem] leading-relaxed">
              <code>{o.code}</code>
            </pre>
          </TabsContent>
        ))}
      </Tabs>
    </Card>
  )
}

/** Le choix de la langue : deux liens, la page anglaise et la page française. */
function ChoixLangue({ langue, libelle }: { langue: Language; libelle: string }) {
  const liens: Array<{ code: Language; href: string; texte: string }> = [
    { code: 'en', href: '/', texte: 'EN' },
    { code: 'fr', href: '/fr', texte: 'FR' },
  ]
  return (
    <ButtonGroup aria-label={libelle}>
      {liens.map((l) => (
        <Button
          key={l.code}
          size="sm"
          variant={l.code === langue ? 'default' : 'outline'}
          nativeButton={false}
          render={<a href={l.href} hrefLang={l.code} lang={l.code} aria-current={l.code === langue ? 'page' : undefined} />}
        >
          {l.texte}
        </Button>
      ))}
    </ButtonGroup>
  )
}

/** La landing, dans la langue de sa page. */
export function Landing({ langue }: { langue: Language }) {
  const t = TEXTES[langue]
  const codeEnLigne = 'font-mono text-sm text-foreground'
  return (
    <main lang={langue} className="mx-auto flex w-full max-w-6xl flex-col px-4 sm:px-6">
      <header className="flex items-center justify-between gap-4 py-6">
        <span className="font-heading text-lg">pixel-openspace</span>
        <nav className="flex items-center gap-1 text-sm">
          <Button variant="ghost" size="sm" className="hidden sm:inline-flex" nativeButton={false} render={<a href="#setup" />}>
            {t.installer}
          </Button>
          <Button variant="ghost" size="sm" nativeButton={false} render={<a href={DEPOT} />}>
            GitHub
          </Button>
          <ChoixLangue langue={langue} libelle={t.langue} />
        </nav>
      </header>

      {/* Le haut de page : le titre, la commande, puis la salle elle-même. */}
      <section className="flex flex-col gap-8 pt-10 pb-20 sm:pt-16">
        <div className="flex flex-col gap-6">
          <h1 className="max-w-3xl font-heading text-5xl leading-[0.95] tracking-tight text-balance sm:text-7xl">{t.titre}</h1>
          <p className="max-w-[60ch] text-lg leading-relaxed text-muted-foreground">{t.intro}</p>
          <div className="flex flex-col gap-3">
            <CopyCommand command={INSTALL} copy={t.copier} copied={t.copie} />
            <div className="flex flex-wrap items-center gap-3">
              <Button size="lg" nativeButton={false} render={<a href={DEPOT} />}>
                {t.etoile}
              </Button>
              <Button size="lg" variant="outline" nativeButton={false} render={<a href={CAFE} />}>
                <LogoCafe className="size-4" />
                {t.cafe}
              </Button>
              <Badge variant="outline">MIT</Badge>
              <p className="text-sm text-muted-foreground">{t.licence}</p>
            </div>
          </div>
        </div>
        <Demo langue={langue} />
      </section>

      <Separator />

      {/* Le tableau d'affichage du hall. */}
      <section className="grid gap-10 py-20 lg:grid-cols-[1fr_1.6fr]">
        <div className="flex max-w-[45ch] flex-col gap-4">
          <h2 className="font-heading text-3xl sm:text-4xl">{t.lireTitre}</h2>
          <p className="leading-relaxed text-muted-foreground">{t.lireTexte}</p>
        </div>
        <dl
          className="flex flex-col rounded-xl border-4 p-2"
          style={{
            borderColor: '#5c4a2a',
            background: 'repeating-linear-gradient(0deg, #15171b 0 13px, #1a1c21 13px 14px)',
          }}
        >
          {Object.entries(t.etats).map(([status, voit]) => (
            <div key={status} className="grid grid-cols-[1rem_7rem_1fr] items-baseline gap-x-3 px-4 py-3">
              <span className="size-2.5 rounded-full" style={{ background: LAMPES[status], boxShadow: `0 0 8px ${LAMPES[status]}` }} />
              <dt className="font-heading text-base text-[#ece6d6]">{status}</dt>
              <dd className="text-sm leading-relaxed text-[#bdb6a4]">{voit}</dd>
            </div>
          ))}
        </dl>
      </section>

      <Separator />

      {/* Les trois étapes : c'est une vraie suite, d'où les numéros. */}
      <section id="setup" className="flex scroll-mt-6 flex-col gap-12 py-20">
        <h2 className="font-heading text-3xl sm:text-4xl">{t.etapesTitre}</h2>
        <ol className="flex flex-col gap-14">
          <li className="grid gap-4 lg:grid-cols-[3rem_1fr] lg:gap-6">
            <span className="font-heading text-3xl text-primary">1</span>
            <div className="flex min-w-0 flex-col gap-4">
              <h3 className="text-xl font-bold">{t.etape1}</h3>
              <p className="max-w-[65ch] leading-relaxed text-muted-foreground">
                {t.etape1Texte.map((morceau, i) =>
                  i % 2 ? (
                    <code key={i} className={codeEnLigne}>
                      {morceau}
                    </code>
                  ) : (
                    morceau
                  ),
                )}
              </p>
              <CopyCommand command={INSTALL} copy={t.copier} copied={t.copie} />
            </div>
          </li>
          <li className="grid gap-4 lg:grid-cols-[3rem_1fr] lg:gap-6">
            <span className="font-heading text-3xl text-primary">2</span>
            <div className="flex min-w-0 flex-col gap-4">
              <h3 className="text-xl font-bold">{t.etape2}</h3>
              <p className="max-w-[65ch] leading-relaxed text-muted-foreground">{t.etape2Texte}</p>
              <Exemples
                onglets={[
                  { titre: t.route, code: ROUTE },
                  { titre: t.page, code: PAGE },
                ]}
              />
            </div>
          </li>
          <li className="grid gap-4 lg:grid-cols-[3rem_1fr] lg:gap-6">
            <span className="font-heading text-3xl text-primary">3</span>
            <div className="flex min-w-0 flex-col gap-4">
              <h3 className="text-xl font-bold">{t.etape3}</h3>
              <p className="max-w-[65ch] leading-relaxed text-muted-foreground">{t.etape3Texte}</p>
            </div>
          </li>
        </ol>
      </section>

      <Separator />

      {/* Les petites choses de la salle. */}
      <section className="grid gap-10 py-20 lg:grid-cols-[1fr_1.6fr]">
        <div className="flex max-w-[45ch] flex-col gap-4">
          <h2 className="font-heading text-3xl sm:text-4xl">{t.aussiTitre}</h2>
          <p className="leading-relaxed text-muted-foreground">{t.aussiTexte}</p>
        </div>
        <ItemGroup className="grid gap-3 sm:grid-cols-2">
          {t.details.map(([quoi, detail]) => (
            <Item key={quoi} variant="outline">
              <ItemContent>
                <ItemTitle>{quoi}</ItemTitle>
                <ItemDescription className="line-clamp-none">{detail}</ItemDescription>
              </ItemContent>
            </Item>
          ))}
        </ItemGroup>
      </section>

      <Separator />

      <footer className="flex flex-col gap-2 py-10 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <p>
          {t.faitA}
          <Button variant="link" className="h-auto p-0" nativeButton={false} render={<a href="https://montematour.fr" />}>
            Monte Ma Tour
          </Button>
          {t.atelier}
        </p>
        <p>
          {t.mit}
          <Button variant="link" className="h-auto p-0" nativeButton={false} render={<a href={DEPOT} />}>
            {t.source}
          </Button>
          {' · '}
          <Button variant="link" className="h-auto p-0" nativeButton={false} render={<a href={CAFE} />}>
            {t.cafe}
          </Button>
        </p>
      </footer>
    </main>
  )
}
