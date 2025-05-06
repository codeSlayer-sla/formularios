import type React from "react"
import "@/app/globals.css"
import { Inter } from "next/font/google"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"
import { AtencionButton } from "@/components/atencion-button"
import GoHomeButton from "@/components/GoHomeButton"


const inter = Inter({ subsets: ["latin"] })

export const metadata = {
  title: "Actas proyectos",
  description: "Formulario para la creación de actas de inicio de proyecto",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
          {children}
          <AtencionButton />
          <GoHomeButton/>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  )
}
