'use client'

import * as React from 'react'
import Head from 'next/head'
import { useTheme } from 'next-themes'

export function ThemeColorUpdater() {
    const { resolvedTheme } = useTheme()
    const [mounted, setMounted] = React.useState(false)
    React.useEffect(() => setMounted(true), [])

    const themeColor = resolvedTheme === 'dark' ? '#0a0a0a' : '#ffffff'
    if (!mounted) return null

    return (
        <Head>
            <meta name="theme-color" content={themeColor} />
            <meta name="apple-mobile-web-app-status-bar-style" content={resolvedTheme === 'dark' ? 'black-translucent' : 'default'} />
        </Head>
    )
}


