/*
 * Les thèmes, et le contexte qui donne le thème de la salle à tout ce qui la dessine.
 */

import { createContext, useContext } from 'react'
import type { Theme } from './theme'
import { THEME_80 } from './themes/eighties'
import { THEME_GEEK } from './themes/geek'
import { THEME_GYM } from './themes/gym'
import { THEME_MODERNE } from './themes/modern'
import type { ThemeName } from './types'

/* Les thèmes disponibles, par leur nom public. */
export const THEMES: Record<ThemeName, Theme> = { geek: THEME_GEEK, eighties: THEME_80, gym: THEME_GYM, modern: THEME_MODERNE }

/* Le thème de la scène, à portée des postes et des bonshommes. */
export const ThemeContexte = createContext<Theme>(THEME_GEEK)
export const useTheme = () => useContext(ThemeContexte)
