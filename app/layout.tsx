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
  title: "Toumaï AI — Votre assistant IA, toujours là",
  description:
    "Toumaï AI : discutez avec Sao 4 (code) et Toumaï 5 (raisonnement avancé), générez des images, connectez WhatsApp/Mail/Agenda, laissez l'IA naviguer le web pour vous.",
  metadataBase: new URL("https://toumai.is-a.dev"),
  openGraph: {
    title: "Toumaï AI",
    description: "Votre assistant IA, toujours là.",
    url: "https://toumai.is-a.dev",
    siteName: "Toumaï AI",
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
