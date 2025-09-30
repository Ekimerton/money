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
            //const onboardingCompleted = Boolean(data?.userConfig?.onboarding_completed)
            const isOnboarding = pathname.startsWith('/onboarding')
            const onboardingCompleted = true;

            // Redirect to onboarding when not completed yet
            if (!onboardingCompleted && !isOnboarding) {
                const redirectUrl = request.nextUrl.clone()
                redirectUrl.pathname = '/onboarding'
                redirectUrl.search = ''
                return NextResponse.redirect(redirectUrl)
            }

            // If onboarding completed, avoid staying on onboarding page
            if (onboardingCompleted && isOnboarding) {
                const redirectUrl = request.nextUrl.clone()
                redirectUrl.pathname = '/'
                redirectUrl.search = ''
                return NextResponse.redirect(redirectUrl)
            }

            // Backwards compatibility: if token missing and on onboarding, allow; else if token missing and not onboarding, go to onboarding
            if (!simplefinUrl && !isOnboarding) {
                const redirectUrl = request.nextUrl.clone()
                redirectUrl.pathname = '/onboarding'
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


