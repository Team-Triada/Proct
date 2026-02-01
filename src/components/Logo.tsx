'use client'

import Image from 'next/image'
import { useTheme } from './ThemeProvider'

interface LogoProps {
    className?: string
    width?: number
    height?: number
}

export default function Logo({ className = '', width = 120, height = 40 }: LogoProps) {
    const { theme } = useTheme()

    // Use light_mode.png when dark theme is active, dark_mode.png when light theme is active
    const logoSrc = theme === 'dark' ? '/logo-light.png' : '/logo-dark.png'

    return (
        <Image
            src={logoSrc}
            alt="Proct by Triada"
            width={width}
            height={height}
            className={className}
            priority
        />
    )
}
