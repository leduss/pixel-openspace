import type { Metadata } from 'next'
import { Fredoka } from 'next/font/google'
import { Tableau } from '@/components/tableau'

/* Les titres ronds du tableau de bord, comme dans la maquette. */
const fredoka = Fredoka({ variable: '--font-fredoka', subsets: ['latin'], weight: ['500', '600', '700'] })

export const metadata: Metadata = {
  title: 'Dashboard — pixel-openspace',
  robots: { index: false },
  alternates: { languages: { en: '/tableau', fr: '/fr/tableau' } },
}

export default function Page() {
  return (
    <div className={fredoka.variable}>
      <Tableau langue="en" />
    </div>
  )
}
