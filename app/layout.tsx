import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { SidebarProvider } from "@/components/ui/sidebar";
import { Toaster } from "@/components/ui/sonner";
import { ShellLayout } from "@/components/shell-layout";
import { ThemeProvider } from "@/components/theme-provider";
import { IOSStatusBarUpdater } from "@/components/ios-statusbar-updater";
import Script from "next/script";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  appleWebApp: {
    capable: true,
  },
};

export const viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
  ],
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Script id="ios-statusbar-initial" strategy="beforeInteractive">
          {`
            (function() {
              var isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
              var inStandalone = (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) || (navigator.standalone === true);
              if (!isIOS || !inStandalone) return;
              try {
                var storedTheme = null;
                try { storedTheme = localStorage.getItem('theme'); } catch (e) {}
                var prefersDark = false;
                try { prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches; } catch (e) {}
                var isDark = storedTheme === 'dark' || (storedTheme !== 'light' && prefersDark);
                var el = document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]');
                if (!el) {
                  el = document.createElement('meta');
                  el.setAttribute('name', 'apple-mobile-web-app-status-bar-style');
                  document.head.appendChild(el);
                }
                el.setAttribute('content', isDark ? 'black' : 'default');
              } catch (e) {}
            })();
          `}
        </Script>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <IOSStatusBarUpdater />
          <SidebarProvider>
            <ShellLayout>
              {children}
            </ShellLayout>
          </SidebarProvider>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
