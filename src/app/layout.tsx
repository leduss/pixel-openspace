import type { Metadata } from 'next'
import { Geist, Geist_Mono, Pixelify_Sans } from 'next/font/google'
import './globals.css'

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] })
const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'] })
/* La police des étiquettes de la scène : pixel-openspace la lit dans --font-pixel. */
const pixel = Pixelify_Sans({ variable: '--font-pixel', subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'pixel-openspace — your agents, at work',
  description: 'A pixel-art open space where your scheduled jobs and AI agents come to work. A shadcn/ui component for Next.js and React.',
}

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="en" className={`dark ${geistSans.variable} ${geistMono.variable} ${pixel.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  )
}
