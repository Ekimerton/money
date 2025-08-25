export default function Head() {
    return (
        <>
            <meta name="theme-color" media="(prefers-color-scheme: light)" content="#ffffff" />
            <meta name="theme-color" media="(prefers-color-scheme: dark)" content="#0b0b0b" />
            <link rel="manifest" href="/manifest-light.webmanifest" media="(prefers-color-scheme: light)" />
            <link rel="manifest" href="/manifest-dark.webmanifest" media="(prefers-color-scheme: dark)" />
            <meta name="apple-mobile-web-app-capable" content="yes" />
            <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
            <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
        </>
    );
}


