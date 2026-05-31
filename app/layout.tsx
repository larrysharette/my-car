import { Geist_Mono, Oxanium } from "next/font/google"
import type { Metadata, Viewport } from "next"

import "./globals.css"
import { PwaBootstrapScript } from "~/components/pwa/pwa-bootstrap-script"
import { PwaInstallPrompt } from "~/components/pwa/pwa-install-prompt"
import { SerwistProviderWrapper } from "~/components/pwa/serwist-provider"
import { ThemeProvider } from "~/components/theme-provider"
import { Toaster } from "~/components/ui/sonner"
import { cn } from "~/lib/utils"

const APP_NAME = "My Car"

export const metadata: Metadata = {
  manifest: "/manifest.webmanifest",
  icons: {
    apple: [{ url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" }],
  },
  applicationName: APP_NAME,
  title: {
    default: APP_NAME,
    template: `%s — ${APP_NAME}`,
  },
  description: "Track gas, maintenance, and inspections",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: APP_NAME,
  },
  formatDetection: {
    telephone: false,
  },
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#1a1a1a",
}

const oxanium = Oxanium({ subsets: ["latin"], variable: "--font-sans" })

const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
})

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn("dark antialiased", fontMono.variable, "font-sans", oxanium.variable)}
    >
      <body>
        <PwaBootstrapScript />
        <SerwistProviderWrapper>
          <ThemeProvider>
            {children}
            <PwaInstallPrompt />
            <Toaster />
          </ThemeProvider>
        </SerwistProviderWrapper>
      </body>
    </html>
  )
}
