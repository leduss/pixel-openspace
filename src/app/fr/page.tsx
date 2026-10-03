import type { Metadata } from 'next'
import { Landing } from '@/components/landing'

export const metadata: Metadata = {
  title: 'pixel-openspace — tes tâches cron, à leur bureau',
  description:
    'Un composant shadcn/ui open source qui montre tes tâches planifiées et tes agents IA comme des employés en pixel art dans un open space. Pour Next.js et React.',
  alternates: { languages: { en: '/', fr: '/fr' } },
}

export default function Page() {
  return <Landing langue="fr" />
}
