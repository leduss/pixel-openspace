import type { Metadata } from 'next'
import { PageJournal } from '@/components/journal'
import { SITE } from '@/data/site'

const t = SITE.en.changelog

export const metadata: Metadata = {
  title: `${t.titre} — pixel-openspace`,
  description: t.meta,
  alternates: { languages: { en: '/changelog', fr: '/fr/changelog' } },
}

export default function Page() {
  return <PageJournal langue="en" />
}
