import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl

    // Skip middleware for public and framework paths
    if (
        pathname.startsWith('/_next') ||
        pathname.startsWith('/api') ||
        pathname.startsWith('/icons') ||
        pathname === '/favicon.ico' ||
        pathname === '/manifest.json'
    ) {
        return NextResponse.next()
    }

    try {
        const url = new URL('/api/get-user-config', request.url)
        const res = await fetch(url, { cache: 'no-store' })
        if (res.ok) {
            const data = await res.json()
            const simplefinUrl = data?.userConfig?.simplefin_url
            const isOnboarding = pathname.startsWith('/onboarding')
            if (!simplefinUrl && !isOnboarding) {
                const redirectUrl = request.nextUrl.clone()
                redirectUrl.pathname = '/onboarding'
                redirectUrl.search = ''
                return NextResponse.redirect(redirectUrl)
            }
            if (simplefinUrl && isOnboarding) {
                const redirectUrl = request.nextUrl.clone()
                redirectUrl.pathname = '/'
                redirectUrl.search = ''
                return NextResponse.redirect(redirectUrl)
            }
        }
    } catch {
        // If the config check fails, allow navigation rather than blocking the app
    }

    return NextResponse.next()
}

// Optionally narrow which paths run this middleware (kept broad and filtered above)
export const config = {
    matcher: ['/((?!_next).*)'],
}


