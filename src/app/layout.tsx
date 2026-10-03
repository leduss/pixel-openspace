import type { Metadata } from 'next'
import { Atkinson_Hyperlegible, Cookie, Geist_Mono, Pixelify_Sans } from 'next/font/google'
import './globals.css'

/* Le texte en Atkinson Hyperlegible, dessinée pour la signalétique ; le code en Geist Mono. */
const atkinson = Atkinson_Hyperlegible({ variable: '--font-atkinson', subsets: ['latin'], weight: ['400', '700'] })
const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'] })
/* La police des titres, et des étiquettes de la scène : pixel-openspace la lit dans --font-pixel. */
const pixel = Pixelify_Sans({ variable: '--font-pixel', subsets: ['latin'] })
// La police du bouton Buy Me a Coffee.
const cookie = Cookie({ variable: '--font-cookie', weight: '400', subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'pixel-openspace — your cron jobs, at their desks',
  description:
    'An open source shadcn/ui component that shows your scheduled jobs and AI agents as pixel-art employees in an open space. For Next.js and React.',
  alternates: { languages: { en: '/', fr: '/fr' } },
}

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="en" className={`dark ${atkinson.variable} ${geistMono.variable} ${pixel.variable} ${cookie.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  )
}
