import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

// Les mêmes alias que tsconfig : le composant importe ses briques shadcn par « @/components/ui/… ».
export default defineConfig({
  resolve: {
    alias: [
      { find: /^@\/registry\//, replacement: fileURLToPath(new URL('./registry/', import.meta.url)) },
      { find: /^@\//, replacement: fileURLToPath(new URL('./src/', import.meta.url)) },
    ],
  },
})
