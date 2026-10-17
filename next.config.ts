import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  // La carte de README charge son rendu, construit à part, à l'exécution : il faut l'embarquer avec la route.
  outputFileTracingIncludes: {
    '/api/card': ['./src/carte/dist/**'],
  },
}

export default nextConfig
