'use client'

import * as React from 'react'
import { useTheme } from 'next-themes'

function getOrCreateAppThemeColorMeta(): HTMLMetaElement {
    const existing = document.querySelector('meta[name="theme-color"][data-app-controlled="true"]') as HTMLMetaElement | null
    if (existing) return existing
    const meta = document.createElement('meta')
    meta.name = 'theme-color'
    meta.setAttribute('data-app-controlled', 'true')
    document.head.appendChild(meta)
    return meta
}

export function ThemeColorUpdater() {
    const { resolvedTheme } = useTheme()
    const [mounted, setMounted] = React.useState(false)
    React.useEffect(() => setMounted(true), [])

    React.useEffect(() => {
        if (!mounted) return
        const meta = getOrCreateAppThemeColorMeta()
        const update = () => {
            const htmlBg = window.getComputedStyle(document.documentElement).backgroundColor
            const bodyBg = window.getComputedStyle(document.body).backgroundColor
            const fallback = resolvedTheme === 'dark' ? '#0a0a0a' : '#ffffff'
            const themeColor = htmlBg || bodyBg || fallback
            if (meta.content !== themeColor) meta.content = themeColor
        }
        // Use rAF to ensure styles have applied for the new theme before reading
        if (typeof window.requestAnimationFrame === 'function') {
            window.requestAnimationFrame(update)
        } else {
            setTimeout(update, 0)
        }
    }, [mounted, resolvedTheme])

    return null
}