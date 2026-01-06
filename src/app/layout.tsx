import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { Toaster } from "sonner"
import "./globals.css"
import { AppShell } from "@/components/shell/app-shell"
import { VersionBadge } from "@/components/shell/version-badge"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-geist-sans",
})

export const metadata: Metadata = {
  title: "Headwaters | Strategic Operating System",
  description: "Where strategy meets execution. The source of team clarity.",
  icons: {
    icon: "/favicon.svg",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} font-sans antialiased`}>
        <AppShell>
          {children}
        </AppShell>
        <VersionBadge />
        <Toaster position="bottom-right" richColors closeButton />
      </body>
    </html>
  )
}
