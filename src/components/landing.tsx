import { Button } from '@/components/ui/button'
import { CopyCommand } from '@/components/copy-command'
import { Demo } from '@/components/demo'
import { DEPOT, INSTALL, LAMPES, PAGE, ROUTE, TEXTES } from '@/data/landing'
import type { Language } from '@/registry/pixel-openspace/types'

function Code({ titre, code }: { titre: string; code: string }) {
  return (
    <figure className="flex min-w-0 flex-col overflow-hidden rounded-lg border bg-card">
      <figcaption className="border-b px-4 py-2 text-sm text-muted-foreground">{titre}</figcaption>
      <pre className="overflow-x-auto p-4 font-mono text-[0.78rem] leading-relaxed">
        <code>{code}</code>
      </pre>
    </figure>
  )
}

/** Le choix de la langue : deux liens, la page anglaise et la page française. */
function ChoixLangue({ langue, libelle }: { langue: Language; libelle: string }) {
  const liens: Array<{ code: Language; href: string; texte: string }> = [
    { code: 'en', href: '/', texte: 'EN' },
    { code: 'fr', href: '/fr', texte: 'FR' },
  ]
  return (
    <div role="group" aria-label={libelle} className="flex overflow-hidden rounded-lg border">
      {liens.map((l) => (
        <a
          key={l.code}
          href={l.href}
          hrefLang={l.code}
          lang={l.code}
          aria-current={l.code === langue ? 'page' : undefined}
          className={`px-2.5 py-1 text-xs font-bold transition-colors ${
            l.code === langue ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
          }`}
        >
          {l.texte}
        </a>
      ))}
    </div>
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
          <a className="hidden rounded-md px-3 py-1.5 text-muted-foreground hover:text-foreground sm:block" href="#setup">
            {t.installer}
          </a>
          <a className="rounded-md px-3 py-1.5 text-muted-foreground hover:text-foreground" href={DEPOT}>
            GitHub
          </a>
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
              <p className="text-sm text-muted-foreground">{t.licence}</p>
            </div>
          </div>
        </div>
        <Demo langue={langue} />
      </section>

      {/* Le tableau d'affichage du hall. */}
      <section className="grid gap-10 border-t py-20 lg:grid-cols-[1fr_1.6fr]">
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

      {/* Les trois étapes : c'est une vraie suite, d'où les numéros. */}
      <section id="setup" className="flex scroll-mt-6 flex-col gap-12 border-t py-20">
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
              <div className="grid max-w-3xl gap-4">
                <Code titre={t.route} code={ROUTE} />
                <Code titre={t.page} code={PAGE} />
              </div>
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

      {/* Les petites choses de la salle. */}
      <section className="grid gap-10 border-t py-20 lg:grid-cols-[1fr_1.6fr]">
        <div className="flex max-w-[45ch] flex-col gap-4">
          <h2 className="font-heading text-3xl sm:text-4xl">{t.aussiTitre}</h2>
          <p className="leading-relaxed text-muted-foreground">{t.aussiTexte}</p>
        </div>
        <dl className="grid gap-x-10 gap-y-6 sm:grid-cols-2">
          {t.details.map(([quoi, detail]) => (
            <div key={quoi} className="flex flex-col gap-1">
              <dt className="font-bold">{quoi}</dt>
              <dd className="text-sm leading-relaxed text-muted-foreground">{detail}</dd>
            </div>
          ))}
        </dl>
      </section>

      <footer className="flex flex-col gap-2 border-t py-10 text-sm text-muted-foreground sm:flex-row sm:justify-between">
        <p>
          {t.faitA}
          <a className="underline underline-offset-4 hover:text-foreground" href="https://montematour.fr">
            Monte Ma Tour
          </a>
          {t.atelier}
        </p>
        <p>
          {t.mit}
          <a className="underline underline-offset-4 hover:text-foreground" href={DEPOT}>
            {t.source}
          </a>
        </p>
      </footer>
    </main>
  )
}
