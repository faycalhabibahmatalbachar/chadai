import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ChadGPT — Votre assistant IA, toujours là",
  description:
    "ChadGPT : discutez avec Sao 4 (code) et Toumaï 5 (raisonnement avancé), générez des images, connectez WhatsApp/Mail/Agenda, laissez l'IA naviguer le web pour vous.",
  metadataBase: new URL("https://chadgpt.is-a.dev"),
  openGraph: {
    title: "ChadGPT",
    description: "Votre assistant IA, toujours là.",
    url: "https://chadgpt.is-a.dev",
    siteName: "ChadGPT",
    locale: "fr_FR",
    type: "website",
  },
  icons: { icon: "/favicon.ico" },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="fr"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[var(--background)] text-[var(--text-primary)]">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
