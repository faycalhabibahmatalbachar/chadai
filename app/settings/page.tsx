"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { getProfile, type UserProfile } from "@/lib/user-api";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Logo } from "@/components/Logo";
import { GeneralSection } from "@/components/settings/GeneralSection";
import { PersonalizationSection } from "@/components/settings/PersonalizationSection";
import { AppearanceSection } from "@/components/settings/AppearanceSection";
import { VoiceSection } from "@/components/settings/VoiceSection";
import { NotificationsSection } from "@/components/settings/NotificationsSection";
import { ConnectorsTab } from "@/components/settings/ConnectorsTab";
import { SupportTab } from "@/components/settings/SupportTab";

type Section =
  | "general"
  | "personalization"
  | "appearance"
  | "voice"
  | "notifications"
  | "connectors"
  | "support";

const SECTIONS: {
  id: Section;
  label: string;
  title: string;
  sub: string;
  icon: React.ReactNode;
}[] = [
  {
    id: "general",
    label: "Général",
    title: "Général",
    sub: "Votre profil, votre compte et votre utilisation.",
    icon: <UserIcon />,
  },
  {
    id: "personalization",
    label: "Personnalisation",
    title: "Personnalisation",
    sub: "Adaptez le comportement de Toumaï AI à votre façon de travailler.",
    icon: <SparkleIcon />,
  },
  {
    id: "appearance",
    label: "Apparence",
    title: "Apparence",
    sub: "Thème et confort de lecture.",
    icon: <PaletteIcon />,
  },
  {
    id: "voice",
    label: "Voix",
    title: "Voix de l'assistant",
    sub: "Choisissez la voix du mode vocal — écoutez chaque voix avant de décider.",
    icon: <SoundIcon />,
  },
  {
    id: "notifications",
    label: "Notifications",
    title: "Notifications",
    sub: "Ce que Toumaï AI a le droit de vous signaler.",
    icon: <BellIcon />,
  },
  {
    id: "connectors",
    label: "Connecteurs",
    title: "Connecteurs & Intégrations",
    sub: "Gérez les services tiers reliés à Toumaï AI.",
    icon: <PlugIcon />,
  },
  {
    id: "support",
    label: "Aide & Support",
    title: "Aide & Support",
    sub: "Guides rapides et contact direct.",
    icon: <LifeBuoyIcon />,
  },
];

// Compatibilité avec les anciens liens ?tab=… (menu Outils du chat, sidebar).
const LEGACY_TABS: Record<string, Section> = {
  profile: "general",
  preferences: "personalization",
  connectors: "connectors",
  support: "support",
};

export default function SettingsPage() {
  const { session, loading, loginAsGuest } = useAuth();
  const [section, setSection] = useState<Section>("general");
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

  // Lien direct vers une section (ex: /settings?tab=connectors) sans
  // useSearchParams (contrainte Suspense de l'export statique).
  useEffect(() => {
    const requested = new URLSearchParams(window.location.search).get("tab") ?? "";
    const target =
      LEGACY_TABS[requested] ?? (SECTIONS.some((s) => s.id === requested) ? (requested as Section) : null);
    if (target) setSection(target);
  }, []);

  const isGuest = !session || session.is_guest;
  const current = SECTIONS.find((s) => s.id === section) ?? SECTIONS[0];

  return (
    <div className="flex flex-1 flex-col">
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-[var(--border)] bg-[var(--background)] px-4 py-3">
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

      <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 px-4 py-8 md:flex-row md:gap-12">
        {/* Navigation */}
        <nav className="shrink-0 md:w-60">
          <div className="mb-5 flex items-center gap-3 px-2">
            <div
              className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl"
              style={{ background: "linear-gradient(135deg, var(--primary), var(--thinking))" }}
            >
              {profile?.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={profile.avatar_url} alt="" className="h-full w-full object-cover" />
              ) : (
                <Logo size={22} />
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

          <div className="flex gap-1 overflow-x-auto pb-1 md:flex-col md:overflow-visible md:pb-0">
            {SECTIONS.map((s, i) => (
              <span key={s.id} className="contents">
                {i === SECTIONS.length - 1 && (
                  <span className="my-2 hidden h-px bg-[var(--border)] md:block" aria-hidden="true" />
                )}
                <button
                  onClick={() => setSection(s.id)}
                  className="flex shrink-0 items-center gap-2.5 rounded-xl px-3 py-2 text-left text-sm font-medium transition hover:bg-[var(--hover)]"
                  style={{
                    background: section === s.id ? "var(--card)" : undefined,
                    color: section === s.id ? "var(--text-primary)" : "var(--text-secondary)",
                  }}
                >
                  <span className="opacity-75" aria-hidden="true">
                    {s.icon}
                  </span>
                  {s.label}
                </button>
              </span>
            ))}
          </div>
        </nav>

        {/* Contenu */}
        <div className="min-w-0 flex-1 pb-12">
          <h2 className="text-xl font-semibold tracking-tight">{current.title}</h2>
          <p className="mb-6 mt-1 text-sm text-[var(--text-tertiary)]">{current.sub}</p>

          {!session ? (
            <div className="h-64 w-full animate-pulse rounded-2xl bg-[var(--card)]" aria-hidden="true" />
          ) : (
            <>
              {section === "general" && <GeneralSection />}
              {section === "personalization" && <PersonalizationSection />}
              {section === "appearance" && <AppearanceSection />}
              {section === "voice" && <VoiceSection />}
              {section === "notifications" && <NotificationsSection />}
              {section === "connectors" && <ConnectorsTab />}
              {section === "support" && <SupportTab />}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/* ---------- Icônes ---------- */

function BackIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M19 12H5M12 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c0-4 3.6-6 8-6s8 2 8 6" strokeLinecap="round" />
    </svg>
  );
}

function SparkleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path
        d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9L12 3zM19 15l.9 2.1L22 18l-2.1.9L19 21l-.9-2.1L16 18l2.1-.9L19 15z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function PaletteIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M12 21a9 9 0 110-18 9 8 0 019 8 4.5 4.5 0 01-4.5 4.5h-1.8a2 2 0 00-1.4 3.4c.3.3.5.8.5 1.2a1.9 1.9 0 01-1.8 1.9z" strokeLinejoin="round" />
      <circle cx="7.5" cy="11.5" r="1" fill="currentColor" stroke="none" />
      <circle cx="10.5" cy="7.5" r="1" fill="currentColor" stroke="none" />
      <circle cx="15" cy="8" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

function SoundIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M11 5L6 9H2v6h4l5 4V5z" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M15.5 8.5a5 5 0 010 7M18.5 5.5a9 9 0 010 13" strokeLinecap="round" />
    </svg>
  );
}

function BellIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M18 8a6 6 0 10-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 01-3.4 0" strokeLinecap="round" strokeLinejoin="round" />
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
