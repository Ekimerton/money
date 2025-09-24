import type { MetadataRoute } from "next";
import { headers } from "next/headers";

export const dynamic = "force-dynamic";

export default async function manifest(): Promise<MetadataRoute.Manifest> {
    const h = await headers();
    const preferHeader = (h.get('Sec-CH-Prefers-Color-Scheme') || h.get('sec-ch-prefers-color-scheme') || '').toLowerCase();
    const isDark = preferHeader === 'dark';
    const themeColor = isDark ? '#0a0a0a' : '#ffffff';
    const backgroundColor = isDark ? '#0a0a0a' : '#ffffff';

    return {
        name: "Money",
        short_name: "Money",
        description: "Personal finance dashboard",
        start_url: "/",
        scope: "/",
        display: "standalone",
        background_color: backgroundColor,
        theme_color: themeColor,
        orientation: "portrait-primary",
        id: "/",
        icons: [
            {
                src: "/icons/android-chrome-192x192.png",
                sizes: "192x192",
                type: "image/png",
                purpose: "any"
            },
            {
                src: "/icons/android-chrome-512x512.png",
                sizes: "512x512",
                type: "image/png",
                purpose: "any"
            },
            {
                src: "/icons/apple-touch-icon.png",
                sizes: "180x180",
                type: "image/png",
                purpose: "any"
            },
            {
                src: "/icons/favicon-32x32.png",
                sizes: "32x32",
                type: "image/png",
                purpose: "any"
            },
            {
                src: "/icons/favicon-16x16.png",
                sizes: "16x16",
                type: "image/png",
                purpose: "any"
            }
        ]
    };
}


