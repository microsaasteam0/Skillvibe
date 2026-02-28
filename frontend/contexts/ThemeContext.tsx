'use client'

import React, { createContext, useContext, useEffect } from 'react'

interface ThemeContextType {
  resolvedTheme: 'dark'
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export const useTheme = () => {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}

interface ThemeProviderProps {
  children: React.ReactNode
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  // Force dark theme on app load
  useEffect(() => {
    const root = document.documentElement
    root.classList.remove('light')
    root.classList.add('dark')
    root.style.setProperty('--bg-color', '#111827')
    root.style.setProperty('--text-color', '#ffffff')
    root.style.colorScheme = 'dark'
    root.classList.add('theme-loaded')

    const metaThemeColor = document.querySelector('meta[name="theme-color"]')
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', '#111827')
    }
  }, [])

  return (
    <ThemeContext.Provider value={{ resolvedTheme: 'dark' }}>
      {children}
    </ThemeContext.Provider>
  )
}