"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { getProfile, type UserProfile } from "@/lib/user-api";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Logo } from "@/components/Logo";
import { ProfileTab } from "@/components/settings/ProfileTab";
import { PreferencesTab } from "@/components/settings/PreferencesTab";
import { ConnectorsTab } from "@/components/settings/ConnectorsTab";
import { SupportTab } from "@/components/settings/SupportTab";

type Tab = "profile" | "preferences" | "connectors" | "support";

function UserIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c0-4 3.6-6 8-6s8 2 8 6" strokeLinecap="round" />
    </svg>
  );
}

function SlidersIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3" strokeLinecap="round" />
      <path d="M1 14h6M9 8h6M17 16h6" strokeLinecap="round" />
    </svg>
  );
}

function PlugIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M9 2v6M15 2v6M6 8h12v4a6 6 0 01-12 0V8zM12 18v4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function LifeBuoyIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="4" />
      <path d="M4.9 4.9l4.3 4.3M14.8 14.8l4.3 4.3M14.8 9.2l4.3-4.3M4.9 19.1l4.3-4.3" strokeLinecap="round" />
    </svg>
  );
}

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: "profile", label: "Profil", icon: <UserIcon /> },
  { id: "preferences", label: "Préférences", icon: <SlidersIcon /> },
  { id: "connectors", label: "Connecteurs", icon: <PlugIcon /> },
  { id: "support", label: "Aide & Support", icon: <LifeBuoyIcon /> },
];

export default function SettingsPage() {
  const { session, loading, loginAsGuest } = useAuth();
  const [tab, setTab] = useState<Tab>("profile");
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const guestAttempted = useRef(false);

  useEffect(() => {
    if (loading || session || guestAttempted.current) return;
    guestAttempted.current = true;
    loginAsGuest().catch(() => {});
  }, [loading, session, loginAsGuest]);

  useEffect(() => {
    if (!session) return;
    getProfile()
      .then(setProfile)
      .catch(() => {});
  }, [session]);

  // Permet un lien direct vers un onglet (ex: depuis le menu Outils du chat)
  // sans passer par useSearchParams (évite la contrainte Suspense en export statique).
  useEffect(() => {
    const requested = new URLSearchParams(window.location.search).get("tab");
    if (
      requested === "profile" ||
      requested === "preferences" ||
      requested === "connectors" ||
      requested === "support"
    ) {
      setTab(requested);
    }
  }, []);

  const isGuest = !session || session.is_guest;

  return (
    <div className="flex flex-1 flex-col">
      <header className="flex items-center justify-between border-b border-[var(--border)] px-4 py-3">
        <div className="flex items-center gap-2">
          <Link
            href="/chat"
            aria-label="Retour au chat"
            className="rounded-lg p-2 transition hover:bg-[var(--hover)]"
          >
            <BackIcon />
          </Link>
          <h1 className="text-sm font-semibold">Paramètres</h1>
        </div>
        <ThemeToggle />
      </header>

      <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 px-4 py-6 md:flex-row md:gap-10">
        <div className="shrink-0 md:w-56">
          {/* Carte profil */}
          <div className="mb-4 flex items-center gap-3 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-3">
            <div
              className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl"
              style={{ background: "linear-gradient(135deg, var(--primary), var(--thinking))" }}
            >
              {profile?.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={profile.avatar_url} alt="" className="h-full w-full object-cover" />
              ) : (
                <Logo size={26} />
              )}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">
                {isGuest ? "Session invité" : profile?.full_name || "Sans nom"}
              </p>
              <p className="truncate text-xs capitalize text-[var(--text-tertiary)]">
                {isGuest ? "Invité" : `Formule ${profile?.plan ?? "free"}`}
              </p>
            </div>
          </div>

          <nav className="flex gap-1 overflow-x-auto md:flex-col md:overflow-visible">
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
        </div>

        <div className="min-w-0 flex-1">
          {!session ? (
            <div className="h-40 w-full max-w-lg animate-pulse rounded-xl bg-[var(--card)]" aria-hidden="true" />
          ) : (
            <>
              {tab === "profile" && <ProfileTab />}
              {tab === "preferences" && <PreferencesTab />}
              {tab === "connectors" && <ConnectorsTab />}
              {tab === "support" && <SupportTab />}
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
