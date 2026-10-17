import { Cadre, TitrePage } from '@/components/cadre'
import { SITE } from '@/data/site'
import type { Language } from '@/registry/pixel-openspace/types'

/** La foire aux questions : chaque question se déplie, sans JavaScript. */
export function PageFaq({ langue }: { langue: Language }) {
  const t = SITE[langue].faq
  return (
    <Cadre langue={langue} page="faq">
      <TitrePage titre={t.titre} intro={t.intro} />
      <div className="flex max-w-3xl flex-col gap-3 pb-20">
        {t.questions.map(({ q, r, lien }) => (
          <details key={q} className="group rounded-xl border bg-card px-5 py-4 open:pb-5">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-bold [&::-webkit-details-marker]:hidden">
              {q}
              <span aria-hidden className="font-heading text-xl text-primary transition-transform group-open:rotate-45">
                +
              </span>
            </summary>
            <p className="mt-3 max-w-[65ch] leading-relaxed text-muted-foreground">{r}</p>
            {lien ? (
              <a href={lien.href} className="mt-3 inline-block text-primary underline-offset-2 hover:underline">
                {lien.texte} →
              </a>
            ) : null}
          </details>
        ))}
      </div>
    </Cadre>
  )
}
