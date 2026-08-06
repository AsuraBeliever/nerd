import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { getCurrentUser } from "@/lib/session";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "nerd",
  description:
    "Organiza tu universidad y tu entrenamiento: horario, asistencia, tareas, pendientes y progreso.",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fdfdfd" },
    { media: "(prefers-color-scheme: dark)", color: "#141416" },
  ],
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // El tema se resuelve en el servidor: así la página llega ya pintada y no
  // hay parpadeo de claro a oscuro al cargar.
  const user = await getCurrentUser();
  const theme = user?.theme === "system" ? undefined : user?.theme;

  return (
    <html lang="es" data-theme={theme}>
      <body className={`${geistSans.variable} ${geistMono.variable}`}>{children}</body>
    </html>
  );
}
