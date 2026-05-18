import type { Metadata, Viewport } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "What Meow? - Decode Your Cat",
  description: "Turn cat meows into practical care clues, warm logs, and shareable playful translations.",
  openGraph: {
    title: "What Meow? - Decode Your Cat",
    description: "Turn cat meows into useful, playful care reads.",
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
    <html lang="en" className="bg-background">
      <body className="font-sans antialiased min-h-screen">
        {children}
      </body>
    </html>
  )
}
