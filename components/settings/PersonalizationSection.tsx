"use client";

import { useEffect, useState } from "react";
import { getPreferences, updatePreferences, type Preferences } from "@/lib/preferences-api";
import { Panel, Row, Segmented } from "./Rows";

const TONES: { value: Preferences["ai_tone"]; label: string }[] = [
  { value: "friendly", label: "Chaleureux" },
  { value: "professional", label: "Professionnel" },
  { value: "casual", label: "Décontracté" },
  { value: "concise", label: "Concis" },
];

const LANGUAGES: { value: string; label: string }[] = [
  { value: "auto", label: "Auto" },
  { value: "fr", label: "Français" },
  { value: "en", label: "English" },
  { value: "ar", label: "العربية" },
];

export function PersonalizationSection() {
  const [prefs, setPrefs] = useState<Preferences | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

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
      setSaved(true);
      setTimeout(() => setSaved(false), 1500);
    } catch (err) {
      setPrefs(prev);
      setError(err instanceof Error ? err.message : "Échec de l'enregistrement");
    }
  }

  if (!prefs) {
    return <div className="h-64 w-full animate-pulse rounded-2xl bg-[var(--card)]" aria-hidden="true" />;
  }

  return (
    <div>
      <Panel title="Assistant">
        <Row label="Nom de l'assistant" description="Comment l'assistant doit-il s'appeler ?">
          <input
            defaultValue={prefs.ai_name}
            onBlur={(e) => e.target.value.trim() && save({ ai_name: e.target.value.trim() })}
            className="w-52 rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm outline-none focus:border-[var(--primary)]"
          />
        </Row>
        <Row label="Ton des réponses" description="Style d'écriture par défaut.">
          <Segmented
            options={TONES}
            value={prefs.ai_tone}
            onChange={(v) => save({ ai_tone: v })}
          />
        </Row>
        <Row
          label="Langue des réponses"
          description="L'assistant répond toujours dans cette langue — « Auto » suit la langue de vos messages."
        >
          <Segmented
            options={LANGUAGES}
            value={prefs.ai_language || "auto"}
            onChange={(v) => save({ ai_language: v })}
          />
        </Row>
        <Row
          label="Instructions personnalisées"
          description="Contexte que Toumaï AI garde en tête à chaque réponse."
          stacked
        >
          <textarea
            defaultValue={prefs.ai_persona}
            onBlur={(e) => save({ ai_persona: e.target.value })}
            placeholder="Ex : Réponds toujours avec des exemples concrets, tutoie-moi…"
            rows={3}
            className="w-full resize-none rounded-xl border border-[var(--border)] bg-[var(--background)] px-4 py-2.5 text-sm outline-none focus:border-[var(--primary)]"
          />
        </Row>
      </Panel>

      <p className="min-h-5 text-xs">
        {saved && <span className="text-[var(--success)]">Enregistré.</span>}
        {error && <span className="text-[var(--error)]">{error}</span>}
      </p>
    </div>
  );
}
