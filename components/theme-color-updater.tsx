'use client'

import * as React from 'react'
import { useTheme } from 'next-themes'

function upsertMeta(name: string, content: string) {
    let el = document.querySelector(`meta[name="${name}"]`) as HTMLMetaElement | null
    if (!el) {
        el = document.createElement('meta')
        el.name = name
        document.head.appendChild(el)
    }
    el.setAttribute('content', content)
}

export function ThemeColorUpdater() {
    const { resolvedTheme } = useTheme()
    const [mounted, setMounted] = React.useState(false)
    React.useEffect(() => setMounted(true), [])

    React.useEffect(() => {
        if (!mounted) return
        const isDark = resolvedTheme === 'dark'
        const themeColor = isDark ? '#0a0a0a' : '#ffffff'

        // Update generic theme-color (used by Android and Safari)
        upsertMeta('theme-color', themeColor)

        // Update iOS PWA status bar style
        const inStandalone = (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) || (navigator as any).standalone === true
        if (inStandalone) {
            upsertMeta('apple-mobile-web-app-status-bar-style', isDark ? 'black' : 'default')
        }
    }, [mounted, resolvedTheme])

    return null
}


