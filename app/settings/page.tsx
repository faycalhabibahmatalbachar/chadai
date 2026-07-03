"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { ThemeToggle } from "@/components/ThemeToggle";
import { ProfileTab } from "@/components/settings/ProfileTab";
import { PreferencesTab } from "@/components/settings/PreferencesTab";
import { ConnectorsTab } from "@/components/settings/ConnectorsTab";

type Tab = "profile" | "preferences" | "connectors";

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: "profile", label: "Profil", icon: "👤" },
  { id: "preferences", label: "Préférences", icon: "⚙️" },
  { id: "connectors", label: "Connecteurs", icon: "🔌" },
];

export default function SettingsPage() {
  const { session, loading, loginAsGuest } = useAuth();
  const [tab, setTab] = useState<Tab>("profile");
  const guestAttempted = useRef(false);

  useEffect(() => {
    if (loading || session || guestAttempted.current) return;
    guestAttempted.current = true;
    loginAsGuest().catch(() => {});
  }, [loading, session, loginAsGuest]);

  return (
    <div className="flex flex-1 flex-col">
      <header className="flex items-center justify-between border-b border-[var(--border)] px-4 py-3">
        <div className="flex items-center gap-2">
          <Link
            href="/chat"
            aria-label="Retour au chat"
            className="rounded-lg p-2 transition hover:bg-white/5"
          >
            <BackIcon />
          </Link>
          <h1 className="text-sm font-semibold">Paramètres</h1>
        </div>
        <ThemeToggle />
      </header>

      <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-8 px-4 py-6 md:flex-row md:gap-10">
        <nav className="flex shrink-0 gap-1 overflow-x-auto md:w-48 md:flex-col md:overflow-visible">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className="flex shrink-0 items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition"
              style={{
                background: tab === t.id ? "var(--card)" : "transparent",
                color: tab === t.id ? "var(--text-primary)" : "var(--text-secondary)",
              }}
            >
              <span aria-hidden="true">{t.icon}</span>
              {t.label}
            </button>
          ))}
        </nav>

        <div className="min-w-0 flex-1">
          {!session ? (
            <div className="h-40 w-full max-w-lg animate-pulse rounded-xl bg-[var(--card)]" aria-hidden="true" />
          ) : (
            <>
              {tab === "profile" && <ProfileTab />}
              {tab === "preferences" && <PreferencesTab />}
              {tab === "connectors" && <ConnectorsTab />}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function BackIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M19 12H5M12 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
