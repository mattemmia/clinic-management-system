import { createContext, useContext, useEffect, useState } from 'react'

const ThemeContext = createContext()

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState('system') // 'light' | 'dark' | 'system'

  useEffect(() => {
    const root = document.documentElement // <-- FIXED: was window.documentElement
    const savedTheme = localStorage.getItem('theme') || 'system'
    setTheme(savedTheme)

    const applyTheme = (t) => {
      const isDark =
        t === 'dark' ||
        (t === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)

      root.classList.toggle('dark', isDark)
    }

    applyTheme(savedTheme)

    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = () => {
      const currentTheme = localStorage.getItem('theme') || 'system'
      if (currentTheme === 'system') applyTheme('system')
    }
    media.addEventListener('change', handleChange)

    return () => media.removeEventListener('change', handleChange)
  }, [])

  const updateTheme = (newTheme) => {
    localStorage.setItem('theme', newTheme)
    setTheme(newTheme)

    // Apply immediately
    const root = document.documentElement
    const isDark =
      newTheme === 'dark' ||
      (newTheme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)
    root.classList.toggle('dark', isDark)
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme: updateTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => useContext(ThemeContext)