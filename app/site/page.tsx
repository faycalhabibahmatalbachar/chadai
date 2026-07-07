"use client";

/** Page publique d'un site créé par un utilisateur via Toumaï AI.
 * URL : toumaiai.com/site?s=<slug> — le HTML est servi dans une iframe
 * sandboxée (isolée du site principal), avec un bandeau discret « Créé avec
 * Toumaï AI » qui ramène vers l'accueil. */

import { useEffect, useState } from "react";
import { getPublicSite, type PublicSite } from "@/lib/sites-api";

export default function SitePage() {
  const [site, setSite] = useState<PublicSite | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [slug, setSlug] = useState<string>("");

  useEffect(() => {
    const s = new URLSearchParams(window.location.search).get("s") ?? "";
    setSlug(s);
    if (!s) {
      setError("Adresse de site manquante.");
      return;
    }
    getPublicSite(s)
      .then(setSite)
      .catch((e) => setError(e instanceof Error ? e.message : "Site introuvable."));
  }, []);

  if (error) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-3 bg-[var(--background)] px-6 text-center">
        <p className="text-lg font-semibold">Site introuvable</p>
        <p className="max-w-sm text-sm text-[var(--text-tertiary)]">{error}</p>
        <a
          href="/"
          className="mt-2 rounded-full px-5 py-2.5 text-sm font-medium text-white"
          style={{ background: "var(--primary)" }}
        >
          Aller sur Toumaï AI
        </a>
      </div>
    );
  }

  if (!site) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-[var(--background)]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--border)] border-t-[var(--primary)]" />
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh flex-col bg-white">
      <iframe
        title={site.title}
        sandbox="allow-scripts allow-forms allow-popups allow-modals"
        srcDoc={site.html}
        className="w-full flex-1 border-0"
      />
      <a
        href="/"
        className="flex items-center justify-center gap-1.5 border-t border-black/10 bg-white/90 py-1.5 text-[11px] font-medium text-black/50 backdrop-blur transition hover:text-black/80"
      >
        <span
          className="inline-block h-3 w-3 rounded-full"
          style={{ background: "linear-gradient(135deg,#d97757,#d9a441)" }}
          aria-hidden="true"
        />
        Créé avec Toumaï AI
      </a>
    </div>
  );
}
