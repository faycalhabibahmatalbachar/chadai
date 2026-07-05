"use client";

import { useEffect, useState } from "react";
import { getWaSettings, updateWaSettings, type WaSettings } from "@/lib/connectors-api";
import { Segmented } from "./Rows";

type BoolKey = Exclude<keyof WaSettings, "status_audience">;

interface PermDef {
  key: BoolKey;
  label: string;
  desc: string;
  icon: React.ReactNode;
}

const GROUPS: { title: string; items: PermDef[] }[] = [
  {
    title: "Envoi",
    items: [
      { key: "send_text", label: "Messages texte", desc: "Envoyer des messages écrits à vos contacts et groupes.", icon: <ChatIcon /> },
      { key: "send_voice", label: "Messages vocaux", desc: "Envoyer des notes vocales et de l'audio.", icon: <MicIcon /> },
      { key: "send_image", label: "Images", desc: "Envoyer des photos et images générées.", icon: <ImageIcon /> },
      { key: "send_video", label: "Vidéos", desc: "Envoyer des vidéos.", icon: <VideoIcon /> },
      { key: "send_document", label: "Documents", desc: "Envoyer des PDF, Word, Excel…", icon: <DocIcon /> },
      { key: "send_file", label: "Autres fichiers", desc: "Stickers, sondages, positions géographiques.", icon: <ClipIcon /> },
      { key: "post_status", label: "Statuts (stories)", desc: "Publier des statuts texte ou image en votre nom.", icon: <StatusIcon /> },
    ],
  },
  {
    title: "Lecture & analyse",
    items: [
      { key: "read_messages", label: "Lire les messages", desc: "Consulter vos conversations, non-lus et statuts reçus.", icon: <EyeIcon /> },
      { key: "summaries", label: "Résumés", desc: "Résumer vos conversations et groupes.", icon: <SummaryIcon /> },
      { key: "search", label: "Recherche", desc: "Rechercher un mot-clé dans vos messages.", icon: <SearchIcon /> },
      { key: "analyze", label: "Analyse", desc: "Sentiment, export PDF, mémoire de conversation.", icon: <ChartIcon /> },
    ],
  },
  {
    title: "Gestion & confidentialité",
    items: [
      { key: "manage_messages", label: "Gérer les messages", desc: "Réagir, transférer, modifier, marquer comme lu.", icon: <ManageIcon /> },
      { key: "sync_contacts", label: "Synchroniser les contacts", desc: "Resynchroniser votre carnet d'adresses.", icon: <SyncIcon /> },
      { key: "save_contacts", label: "Fiches contact", desc: "Enregistrer et partager des fiches contact.", icon: <ContactIcon /> },
      { key: "advanced", label: "Fonctions avancées", desc: "Mode furtif, présence, messages éphémères…", icon: <BoltIcon /> },
    ],
  },
];

/** Panneau de contrôle complet des permissions WhatsApp — chaque interrupteur
 * est appliqué immédiatement côté backend (registre d'outils) : ce que vous
 * désactivez ici, l'IA ne peut plus le faire, même si on le lui demande. */
export function WhatsAppPermissionsPanel({ onClose }: { onClose: () => void }) {
  const [settings, setSettings] = useState<WaSettings | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState(0);

  useEffect(() => {
    getWaSettings()
      .then(setSettings)
      .catch((err) => setError(err instanceof Error ? err.message : "Chargement impossible"));
  }, []);

  async function patch(p: Partial<WaSettings>) {
    if (!settings) return;
    const prev = settings;
    setSettings({ ...settings, ...p });
    setError(null);
    try {
      await updateWaSettings(p);
      setSavedAt(Date.now());
    } catch (err) {
      setSettings(prev);
      setError(err instanceof Error ? err.message : "Échec de l'enregistrement");
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Permissions WhatsApp"
    >
      <div
        className="flex max-h-[88vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl border border-[var(--border)] bg-[var(--surface)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 border-b border-[var(--border)] px-6 py-4">
          <span className="text-2xl" aria-hidden="true">💬</span>
          <div className="min-w-0 flex-1">
            <h2 className="landing-serif text-lg tracking-tight">Permissions WhatsApp</h2>
            <p className="text-xs text-[var(--text-tertiary)]">
              Contrôlez précisément ce que Toumaï AI peut faire sur votre compte.
            </p>
          </div>
          {savedAt > 0 && (
            <span className="text-xs font-medium" style={{ color: "var(--success)" }}>
              Enregistré ✓
            </span>
          )}
          <button
            onClick={onClose}
            aria-label="Fermer"
            className="flex h-9 w-9 items-center justify-center rounded-full text-[var(--text-tertiary)] transition hover:bg-[var(--hover)]"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          {!settings && !error && (
            <div className="space-y-3" aria-hidden="true">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-14 animate-pulse rounded-2xl bg-[var(--card)]" />
              ))}
            </div>
          )}
          {error && <p className="mb-3 text-sm text-[var(--error)]">{error}</p>}

          {settings &&
            GROUPS.map((group) => (
              <section key={group.title} className="mb-6">
                <h3 className="mb-2 px-0.5 text-[10.5px] font-semibold uppercase tracking-[0.09em] text-[var(--text-tertiary)]">
                  {group.title}
                </h3>
                <div className="overflow-hidden rounded-2xl border border-[var(--border)]">
                  {group.items.map((p) => (
                    <div
                      key={p.key}
                      className="flex items-center gap-3 border-t border-[var(--border)] px-4 py-3 first:border-t-0"
                    >
                      <span
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                        style={{
                          background: "color-mix(in srgb, var(--primary) 10%, transparent)",
                          color: "var(--primary)",
                        }}
                        aria-hidden="true"
                      >
                        {p.icon}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium">{p.label}</p>
                        <p className="text-xs text-[var(--text-tertiary)]">{p.desc}</p>
                      </div>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={settings[p.key]}
                        aria-label={p.label}
                        onClick={() => patch({ [p.key]: !settings[p.key] } as Partial<WaSettings>)}
                        className="relative h-6 w-11 shrink-0 rounded-full transition"
                        style={{ background: settings[p.key] ? "var(--primary)" : "var(--border)" }}
                      >
                        <span
                          className="absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform"
                          style={{ transform: settings[p.key] ? "translateX(22px)" : "translateX(2px)" }}
                        />
                      </button>
                    </div>
                  ))}
                </div>
              </section>
            ))}

          {settings && (
            <section className="mb-2">
              <h3 className="mb-2 px-0.5 text-[10.5px] font-semibold uppercase tracking-[0.09em] text-[var(--text-tertiary)]">
                Audience des statuts publiés par l'IA
              </h3>
              <div className="flex items-center justify-between gap-4 rounded-2xl border border-[var(--border)] px-4 py-3">
                <div>
                  <p className="text-sm font-medium">Partager avec</p>
                  <p className="text-xs text-[var(--text-tertiary)]">
                    Qui voit les statuts que Toumaï AI publie pour vous.
                  </p>
                </div>
                <Segmented
                  options={[
                    { value: "all", label: "Tous" },
                    { value: "contacts", label: "Mes contacts" },
                  ]}
                  value={settings.status_audience}
                  onChange={(v) => patch({ status_audience: v })}
                />
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}

/* ---------- Icônes dédiées ---------- */
const S = { width: 16, height: 16, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8 } as const;

function ChatIcon() {
  return <svg {...S}><path d="M21 12a8 8 0 01-8 8H4l2-3a8 8 0 1115-5z" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}
function MicIcon() {
  return <svg {...S}><rect x="9" y="2" width="6" height="12" rx="3" /><path d="M5 10a7 7 0 0014 0M12 19v3" strokeLinecap="round" /></svg>;
}
function ImageIcon() {
  return <svg {...S}><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="M21 15l-5-5L5 21" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}
function VideoIcon() {
  return <svg {...S}><rect x="2" y="5" width="14" height="14" rx="2" /><path d="M22 7l-6 5 6 5V7z" strokeLinejoin="round" /></svg>;
}
function DocIcon() {
  return <svg {...S}><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" strokeLinejoin="round" /><path d="M14 2v6h6M8 13h8M8 17h5" strokeLinecap="round" /></svg>;
}
function ClipIcon() {
  return <svg {...S}><path d="M21 12.5l-8.5 8.5a5.5 5.5 0 01-7.8-7.8l9-9a3.7 3.7 0 015.2 5.2l-9 9a1.8 1.8 0 01-2.6-2.6l8.3-8.3" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}
function StatusIcon() {
  return <svg {...S}><circle cx="12" cy="12" r="4" /><path d="M12 2a10 10 0 018.5 4.7M22 12a10 10 0 01-4.7 8.5M12 22a10 10 0 01-8.5-4.7M2 12a10 10 0 014.7-8.5" strokeLinecap="round" /></svg>;
}
function EyeIcon() {
  return <svg {...S}><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" strokeLinejoin="round" /><circle cx="12" cy="12" r="3" /></svg>;
}
function SummaryIcon() {
  return <svg {...S}><path d="M4 6h16M4 12h10M4 18h7" strokeLinecap="round" /></svg>;
}
function SearchIcon() {
  return <svg {...S}><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.35-4.35" strokeLinecap="round" /></svg>;
}
function ChartIcon() {
  return <svg {...S}><path d="M4 20V10M10 20V4M16 20v-7M22 20H2" strokeLinecap="round" /></svg>;
}
function ManageIcon() {
  return <svg {...S}><path d="M12 20h9M16.5 3.5a2.12 2.12 0 013 3L7 19l-4 1 1-4L16.5 3.5z" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}
function SyncIcon() {
  return <svg {...S}><path d="M21 12a9 9 0 11-2.64-6.36M21 4v6h-6" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}
function ContactIcon() {
  return <svg {...S}><circle cx="9" cy="8" r="3.5" /><path d="M2.5 20c0-3.3 2.9-5 6.5-5s6.5 1.7 6.5 5M17 8h5M19.5 5.5v5" strokeLinecap="round" /></svg>;
}
function BoltIcon() {
  return <svg {...S}><path d="M13 2L4 14h6l-1 8 9-12h-6l1-8z" strokeLinejoin="round" /></svg>;
}
