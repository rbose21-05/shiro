import type { Metadata, Viewport } from "next"
import { Outfit, Fredoka, Fraunces } from "next/font/google"
import { Providers } from "@/components/providers"
import { SessionTree } from "@/components/session-tree"
import { PwaRegister } from "@/components/pwa-register"
import "./globals.css"

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
})

const fredoka = Fredoka({
  variable: "--font-fredoka",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
})

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: "CampusSync — AI calendar for college",
  description:
    "Upload a syllabus screenshot or paste a chat. CampusSync extracts deadlines and puts them on your calendar — after you review.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "CampusSync",
    statusBarStyle: "default",
  },
}

export const viewport: Viewport = {
  themeColor: "#E85D4C",
  width: "device-width",
  initialScale: 1,
}

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${outfit.variable} ${fredoka.variable} ${fraunces.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="flex min-h-full flex-col font-sans">
        <Providers>
          <SessionTree>{children}</SessionTree>
        </Providers>
        <PwaRegister />
      </body>
    </html>
  )
}
