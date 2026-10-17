import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Cadre, TitrePage } from '@/components/cadre'
import { CopyCommand } from '@/components/copy-command'
import { journal, type Version } from '@/data/changelog'
import { INSTALL } from '@/data/landing'
import { RELEASES, SITE } from '@/data/site'
import type { Language } from '@/registry/pixel-openspace/types'

/*
 * Le journal des versions : un aperçu de la dernière sur la landing, toutes sur leur page.
 */

/** Le peu de Markdown du journal : le `code`, le **gras** et les [liens](…). */
function EnLigne({ texte }: { texte: string }) {
  return (
    <>
      {texte.split(/(`[^`]+`|\*\*[^*]+\*\*|\[[^\]]+\]\([^)]+\))/).map((morceau, i) => {
        if (morceau.startsWith('`')) {
          return (
            <code key={i} className="font-mono text-[0.85em] text-foreground">
              {morceau.slice(1, -1)}
            </code>
          )
        }
        if (morceau.startsWith('**')) return <strong key={i}>{morceau.slice(2, -2)}</strong>
        const lien = morceau.match(/^\[([^\]]+)\]\(([^)]+)\)$/)
        if (lien) {
          return (
            <a key={i} href={lien[2]} className="underline underline-offset-2 hover:text-foreground">
              {lien[1]}
            </a>
          )
        }
        return morceau
      })}
    </>
  )
}

/** Les dernières versions : leur numéro, leur date, et ce qui a changé. */
export function Nouveautes({ versions, niveau = 'h3' }: { versions: Array<Version>; niveau?: 'h2' | 'h3' }) {
  const Titre = niveau
  return (
    <ol className="flex flex-col gap-4">
      {versions.map((v) => (
        <li key={v.numero}>
          <Card className="gap-4 px-6">
            <div className="flex flex-wrap items-baseline gap-3">
              <Titre id={`v${v.numero}`} className="scroll-mt-6 font-heading text-2xl text-primary">
                {v.numero}
              </Titre>
              <time dateTime={v.date} className="text-sm text-muted-foreground">
                {v.date}
              </time>
            </div>
            {v.intro.map((p) => (
              <p key={p} className="text-sm leading-relaxed text-muted-foreground">
                <EnLigne texte={p} />
              </p>
            ))}
            {v.rubriques.map((r) => (
              <div key={r.titre} className="flex flex-col gap-2">
                <Badge variant="outline">{r.titre}</Badge>
                <ul className="flex list-disc flex-col gap-1.5 pl-5 text-sm leading-relaxed text-muted-foreground marker:text-primary">
                  {r.lignes.map((l) => (
                    <li key={l}>
                      <EnLigne texte={l} />
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </Card>
        </li>
      ))}
    </ol>
  )
}

/** La page des nouveautés : comment mettre à jour, puis chaque version, la plus récente en haut. */
export function PageJournal({ langue }: { langue: Language }) {
  const t = SITE[langue].changelog
  return (
    <Cadre langue={langue} page="changelog">
      <TitrePage titre={t.titre} intro={t.intro}>
        <p className="text-sm text-muted-foreground">{t.mettreAJour}</p>
        <CopyCommand
          command={`${INSTALL} --overwrite`}
          copy={langue === 'fr' ? 'Copier' : 'Copy'}
          copied={langue === 'fr' ? 'Copié' : 'Copied'}
        />
        <p className="text-sm text-muted-foreground">{t.avertissement}</p>
        <Button variant="outline" className="w-fit" nativeButton={false} render={<a href={RELEASES} />}>
          {t.releases}
        </Button>
      </TitrePage>
      <div className="max-w-3xl pb-20">
        <Nouveautes versions={journal(langue)} niveau="h2" />
      </div>
    </Cadre>
  )
}
