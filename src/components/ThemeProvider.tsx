'use client'

import { createContext, useContext, useEffect, useState } from 'react'

type Theme = 'light' | 'dark'

interface ThemeContextType {
    theme: Theme
    toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    // Use lazy initialization to read from localStorage
    const [theme, setTheme] = useState<Theme>(() => {
        if (typeof window === 'undefined') return 'dark'
        const stored = localStorage.getItem('theme') as Theme
        if (stored) return stored
        if (window.matchMedia('(prefers-color-scheme: light)').matches) return 'light'
        return 'dark'
    })
    const [mounted, setMounted] = useState(false)

    // Set mounted after initial render
    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setMounted(true)
    }, [])


    useEffect(() => {
        if (!mounted) return

        const root = document.documentElement
        root.setAttribute('data-theme', theme)
        localStorage.setItem('theme', theme)
    }, [theme, mounted])

    const toggleTheme = () => {
        setTheme(prev => prev === 'dark' ? 'light' : 'dark')
    }

    // Prevent flash of wrong theme
    if (!mounted) {
        return null
    }

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    )
}

export function useTheme() {
    const context = useContext(ThemeContext)
    if (!context) {
        throw new Error('useTheme must be used within a ThemeProvider')
    }
    return context
}
