import { useEffect, useMemo, useState } from 'react'
import { ThemeContext } from './ThemeContext'

type Theme = 'light' | 'dark'
const THEME_KEY = 'app_theme'

const applyThemeToDocument = (theme: Theme) => {
  const root = document.documentElement
  if (theme === 'dark') {
    root.classList.add('dark')
    return
  }
  root.classList.remove('dark')
}

const getInitialTheme = (): Theme => {
  const stored = localStorage.getItem(THEME_KEY)
  if (stored === 'light' || stored === 'dark') {
    return stored
  }

  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [theme, setTheme] = useState<Theme>(getInitialTheme)

  useEffect(() => {
    applyThemeToDocument(theme)
    localStorage.setItem(THEME_KEY, theme)
  }, [theme])

  const value = useMemo(
    () => ({
      theme,
      toggleTheme: () => setTheme((prev) => (prev === 'light' ? 'dark' : 'light')),
    }),
    [theme],
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}
