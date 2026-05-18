import type { Metadata, Viewport } from "next"
import { Plus_Jakarta_Sans } from "next/font/google"
import "./globals.css"

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-plus-jakarta",
  weight: ["400", "500", "600", "700", "800"],
})

export const metadata: Metadata = {
  title: "PetChat AI - Translate Your Pet",
  description: "Turn your pet's sounds into hilarious translations. Record a meow, bark, or mystery noise and discover what your furry friend is really saying!",
  openGraph: {
    title: "PetChat AI - Translate Your Pet",
    description: "Turn your pet's sounds into hilarious translations",
    type: "website",
  },
}

export const viewport: Viewport = {
  themeColor: "#855300",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${plusJakarta.variable} bg-background`}>
      <body className="font-sans antialiased min-h-screen">
        {children}
      </body>
    </html>
  )
}
