"use client";

import { useEffect, useState } from "react";
import { getPreferences, updatePreferences, type Preferences } from "@/lib/preferences-api";
import { Toggle } from "./Toggle";

const TONES: { value: Preferences["ai_tone"]; label: string }[] = [
  { value: "friendly", label: "Chaleureux" },
  { value: "professional", label: "Professionnel" },
  { value: "casual", label: "Décontracté" },
  { value: "concise", label: "Concis" },
];

const FONT_SIZES: { value: Preferences["font_size"]; label: string }[] = [
  { value: "small", label: "Petite" },
  { value: "medium", label: "Moyenne" },
  { value: "large", label: "Grande" },
];

export function PreferencesTab() {
  const [prefs, setPrefs] = useState<Preferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getPreferences()
      .then(setPrefs)
      .catch((err) => setError(err instanceof Error ? err.message : "Chargement impossible"))
      .finally(() => setLoading(false));
  }, []);

  async function save(patch: Partial<Preferences>) {
    if (!prefs) return;
    const next = { ...prefs, ...patch };
    setPrefs(next);
    setSaving(true);
    setError(null);
    try {
      await updatePreferences(patch);
      setSaved(true);
      setTimeout(() => setSaved(false), 1500);
    } catch (err) {
      setPrefs(prefs); // rollback optimiste
      setError(err instanceof Error ? err.message : "Échec de l'enregistrement");
    } finally {
      setSaving(false);
    }
  }

  if (loading || !prefs) {
    return (
      <div className="space-y-3" aria-hidden="true">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-12 w-full max-w-lg animate-pulse rounded-xl bg-[var(--card)]" />
        ))}
      </div>
    );
  }

  return (
    <div className="max-w-lg space-y-8">
      <div>
        <p className="mb-3 text-sm font-medium">Personnalité de l'assistant</p>
        <div className="space-y-3">
          <div>
            <label className="mb-1.5 block text-xs text-[var(--text-tertiary)]">
              Comment l'assistant doit-il s'appeler ?
            </label>
            <input
              defaultValue={prefs.ai_name}
              onBlur={(e) => e.target.value.trim() && save({ ai_name: e.target.value.trim() })}
              className="w-full rounded-xl border border-[var(--border)] bg-[var(--card)] px-4 py-2.5 text-sm outline-none focus:border-[var(--primary)]"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs text-[var(--text-tertiary)]">Ton</label>
            <div className="flex flex-wrap gap-2">
              {TONES.map((t) => (
                <button
                  key={t.value}
                  onClick={() => save({ ai_tone: t.value })}
                  className="rounded-lg border px-3 py-1.5 text-xs font-medium transition"
                  style={{
                    borderColor: prefs.ai_tone === t.value ? "var(--primary)" : "var(--border)",
                    background: prefs.ai_tone === t.value ? "rgba(108,99,255,0.12)" : "transparent",
                    color: prefs.ai_tone === t.value ? "var(--primary-light)" : "var(--text-secondary)",
                  }}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-xs text-[var(--text-tertiary)]">
              Instructions personnalisées (optionnel)
            </label>
            <textarea
              defaultValue={prefs.ai_persona}
              onBlur={(e) => save({ ai_persona: e.target.value })}
              placeholder="Ex : Réponds toujours avec des exemples concrets, tutoie-moi…"
              rows={3}
              className="w-full resize-none rounded-xl border border-[var(--border)] bg-[var(--card)] px-4 py-2.5 text-sm outline-none focus:border-[var(--primary)]"
            />
          </div>
        </div>
      </div>

      <div>
        <p className="mb-3 text-sm font-medium">Affichage</p>
        <div>
          <label className="mb-1.5 block text-xs text-[var(--text-tertiary)]">Taille du texte</label>
          <div className="flex gap-2">
            {FONT_SIZES.map((f) => (
              <button
                key={f.value}
                onClick={() => save({ font_size: f.value })}
                className="rounded-lg border px-3 py-1.5 text-xs font-medium transition"
                style={{
                  borderColor: prefs.font_size === f.value ? "var(--primary)" : "var(--border)",
                  background: prefs.font_size === f.value ? "rgba(108,99,255,0.12)" : "transparent",
                  color: prefs.font_size === f.value ? "var(--primary-light)" : "var(--text-secondary)",
                }}
              >
                {f.label}
              </button>
            ))}
          </div>
          <p className="mt-1.5 text-xs text-[var(--text-tertiary)]">
            Le thème clair/sombre se change depuis l'icône en haut de page.
          </p>
        </div>
      </div>

      <div>
        <p className="mb-1 text-sm font-medium">Notifications</p>
        <div className="divide-y divide-[var(--border)]">
          <Toggle
            label="Suggestions proactives"
            description="Toumaï AI vous propose des idées selon le contexte."
            checked={prefs.notif_suggestions}
            onChange={(v) => save({ notif_suggestions: v })}
          />
          <Toggle
            label="WhatsApp"
            description="Alertes liées à l'auto-pilote WhatsApp."
            checked={prefs.notif_wa}
            onChange={(v) => save({ notif_wa: v })}
          />
          <Toggle
            label="Agenda"
            description="Rappels d'événements Google Agenda."
            checked={prefs.notif_calendar}
            onChange={(v) => save({ notif_calendar: v })}
          />
        </div>
      </div>

      <div className="flex items-center gap-2 text-xs text-[var(--text-tertiary)]">
        {saving && <span>Enregistrement…</span>}
        {saved && <span className="text-[var(--success)]">Enregistré.</span>}
      </div>
      {error && <p className="text-sm text-[var(--error)]">{error}</p>}
    </div>
  );
}
