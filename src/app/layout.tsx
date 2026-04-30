import type { Metadata, Viewport } from "next"
import { Manrope, Inter, Instrument_Serif, JetBrains_Mono, Plus_Jakarta_Sans } from "next/font/google"
import "./globals.css"
import { Providers } from "./providers"

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
})

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
})

const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-instrument",
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
})

const jakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
})

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#050508" },
  ],
  viewportFit: "cover", // For iPhone notch support
  interactiveWidget: "resizes-content", // Handle iOS keyboard properly
}

export const metadata: Metadata = {
  title: "Proct by Triada | Integrity-First Online Quizzes",
  description: "Mobile-first online quiz platform for fair internal assessments with integrity enforcement",
  icons: {
    icon: '/icon.png',
    apple: '/icon.png',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Proct",
  },
  formatDetection: {
    telephone: false, // Prevent phone number detection on iOS
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${manrope.variable} ${inter.variable} ${instrumentSerif.variable} ${jetbrainsMono.variable} ${jakartaSans.variable}`}>
      <body className={`${manrope.className} text-zinc-50 antialiased`}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}
