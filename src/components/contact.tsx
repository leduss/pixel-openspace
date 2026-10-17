import { Button } from '@/components/ui/button'
import { Item, ItemActions, ItemContent, ItemDescription, ItemGroup, ItemTitle } from '@/components/ui/item'
import { Cadre, TitrePage } from '@/components/cadre'
import { SITE } from '@/data/site'
import type { Language } from '@/registry/pixel-openspace/types'

/** Où écrire : une carte par canal, et son lien. */
export function PageContact({ langue }: { langue: Language }) {
  const t = SITE[langue].contact
  return (
    <Cadre langue={langue} page="contact">
      <TitrePage titre={t.titre} intro={t.intro} />
      <ItemGroup className="grid max-w-4xl gap-3 pb-20 sm:grid-cols-2">
        {t.canaux.map((c) => (
          <Item key={c.titre} variant="outline" className="flex-col items-start sm:[&:last-child:nth-child(odd)]:col-span-2">
            <ItemContent>
              <ItemTitle>{c.titre}</ItemTitle>
              <ItemDescription className="line-clamp-none">{c.texte}</ItemDescription>
            </ItemContent>
            <ItemActions>
              <Button variant="outline" size="sm" nativeButton={false} render={<a href={c.href} />}>
                {c.lien}
              </Button>
            </ItemActions>
          </Item>
        ))}
      </ItemGroup>
    </Cadre>
  )
}
