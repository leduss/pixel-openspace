import type { Metadata } from 'next'
import { PageFaq } from '@/components/faq'
import { SITE } from '@/data/site'

const t = SITE.fr.faq

export const metadata: Metadata = {
  title: `${t.titre} — pixel-openspace`,
  description: t.meta,
  alternates: { languages: { en: '/faq', fr: '/fr/faq' } },
}

export default function Page() {
  return <PageFaq langue="fr" />
}
