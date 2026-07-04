"use client";

import { useEffect, useState } from "react";
import { getPreferences, updatePreferences, type Preferences } from "@/lib/preferences-api";
import { Panel, Row } from "./Rows";

export function NotificationsSection() {
  const [prefs, setPrefs] = useState<Preferences | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getPreferences()
      .then(setPrefs)
      .catch((err) => setError(err instanceof Error ? err.message : "Chargement impossible"));
  }, []);

  async function save(patch: Partial<Preferences>) {
    if (!prefs) return;
    const prev = prefs;
    setPrefs({ ...prefs, ...patch });
    setError(null);
    try {
      await updatePreferences(patch);
    } catch (err) {
      setPrefs(prev);
      setError(err instanceof Error ? err.message : "Échec de l'enregistrement");
    }
  }

  if (!prefs) {
    return <div className="h-48 w-full animate-pulse rounded-2xl bg-[var(--card)]" aria-hidden="true" />;
  }

  return (
    <div>
      <Panel>
        <Row
          label="Suggestions proactives"
          description="Toumaï AI vous propose des idées selon le contexte."
        >
          <Switch checked={prefs.notif_suggestions} onChange={(v) => save({ notif_suggestions: v })} />
        </Row>
        <Row label="Auto-pilote WhatsApp" description="Alertes liées aux réponses automatiques.">
          <Switch checked={prefs.notif_wa} onChange={(v) => save({ notif_wa: v })} />
        </Row>
        <Row label="Agenda" description="Rappels d'événements Google Agenda.">
          <Switch checked={prefs.notif_calendar} onChange={(v) => save({ notif_calendar: v })} />
        </Row>
      </Panel>

      {error && <p className="text-sm text-[var(--error)]">{error}</p>}
    </div>
  );
}

function Switch({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="relative h-6 w-11 shrink-0 rounded-full transition"
      style={{ background: checked ? "var(--primary)" : "var(--border)" }}
    >
      <span
        className="absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform"
        style={{ transform: checked ? "translateX(22px)" : "translateX(2px)" }}
      />
    </button>
  );
}
