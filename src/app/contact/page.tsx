import type { Metadata } from 'next'
import { PageContact } from '@/components/contact'
import { SITE } from '@/data/site'

const t = SITE.en.contact

export const metadata: Metadata = {
  title: `${t.titre} — pixel-openspace`,
  description: t.meta,
  alternates: { languages: { en: '/contact', fr: '/fr/contact' } },
}

export default function Page() {
  return <PageContact langue="en" />
}
