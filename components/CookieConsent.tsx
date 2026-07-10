"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getConsentChoice, setConsentChoice } from "@/lib/analytics";

/** Bandeau de consentement — n'apparaît que si aucun choix n'a encore été
 * fait. Accepter/Refuser ne change rien de visible si aucun outil d'analytics
 * n'est configuré (cf. lib/analytics.ts) : le bandeau reste honnête même
 * dans ce cas, car le choix est stocké pour le jour où on en active un. */
export function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(getConsentChoice() === null);
  }, []);

  if (!visible) return null;

  function choose(choice: "accepted" | "declined") {
    setConsentChoice(choice);
    setVisible(false);
  }

  return (
    <div
      role="dialog"
      aria-label="Consentement aux cookies"
      className="fixed inset-x-0 bottom-0 z-50 px-4 pb-4 sm:px-6"
    >
      <div
        className="mx-auto flex max-w-2xl flex-col items-start gap-3 rounded-2xl border p-4 shadow-xl backdrop-blur sm:flex-row sm:items-center sm:gap-4"
        style={{
          borderColor: "var(--border)",
          background: "color-mix(in srgb, var(--card) 92%, transparent)",
        }}
      >
        <p className="flex-1 text-[13px] leading-relaxed" style={{ color: "var(--text-secondary)" }}>
          Nous utilisons uniquement des mesures d&apos;audience respectueuses de la vie privée
          (aucune revente de données, aucun ciblage publicitaire). Voir notre{" "}
          <Link href="/privacy" className="underline" style={{ color: "var(--text-primary)" }}>
            politique de confidentialité
          </Link>
          .
        </p>
        <div className="flex shrink-0 gap-2">
          <button
            onClick={() => choose("declined")}
            className="rounded-full border px-4 py-2 text-[13px] font-medium transition hover:opacity-80"
            style={{ borderColor: "var(--border)", color: "var(--text-secondary)" }}
          >
            Refuser
          </button>
          <button
            onClick={() => choose("accepted")}
            className="rounded-full px-4 py-2 text-[13px] font-semibold text-white transition hover:opacity-90"
            style={{ background: "var(--primary)" }}
          >
            Accepter
          </button>
        </div>
      </div>
    </div>
  );
}
