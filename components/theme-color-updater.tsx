'use client'

import * as React from 'react'
import { useTheme } from 'next-themes'

function setThemeColorMeta(content: string) {
    // Remove all existing theme-color tags (Next.js may inject multiple with media queries)
    const existing = document.querySelectorAll('meta[name="theme-color"]')
    existing.forEach((el) => el.parentElement?.removeChild(el))

    // Insert a single theme-color tag that reflects current app theme
    const meta = document.createElement('meta')
    meta.name = 'theme-color'
    meta.content = content
    document.head.appendChild(meta)
}

export function ThemeColorUpdater() {
    const { resolvedTheme } = useTheme()
    const [mounted, setMounted] = React.useState(false)
    React.useEffect(() => setMounted(true), [])

    React.useEffect(() => {
        if (!mounted) return
        const applyThemeColor = () => {
            const computed = window.getComputedStyle(document.body)
            const bg = computed.backgroundColor || ''
            const fallback = resolvedTheme === 'dark' ? '#0a0a0a' : '#ffffff'
            const themeColor = bg || fallback
            setThemeColorMeta(themeColor)
        }

        applyThemeColor()

        // Re-apply on common events that can refresh UI on iOS
        document.addEventListener('visibilitychange', applyThemeColor)
        window.addEventListener('orientationchange', applyThemeColor)
        window.addEventListener('resize', applyThemeColor)
        return () => {
            document.removeEventListener('visibilitychange', applyThemeColor)
            window.removeEventListener('orientationchange', applyThemeColor)
            window.removeEventListener('resize', applyThemeColor)
        }
    }, [mounted, resolvedTheme])

    return null
}