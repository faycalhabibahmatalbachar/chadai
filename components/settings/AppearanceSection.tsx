"use client";

import { useEffect, useState } from "react";
import { getPreferences, updatePreferences, type Preferences } from "@/lib/preferences-api";
import { useTheme } from "@/lib/theme-context";
import { Panel, Row, Segmented } from "./Rows";

const FONT_SIZES: { value: Preferences["font_size"]; label: string }[] = [
  { value: "small", label: "Petite" },
  { value: "medium", label: "Moyenne" },
  { value: "large", label: "Grande" },
];

export function AppearanceSection() {
  const { theme, set } = useTheme();
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

  return (
    <div>
      <Panel title="Thème">
        <Row label="Apparence" description="S'applique immédiatement à tout le site.">
          <Segmented
            options={[
              { value: "light", label: "Clair" },
              { value: "dark", label: "Sombre" },
            ]}
            value={theme}
            onChange={set}
          />
        </Row>
      </Panel>

      <Panel title="Texte">
        <Row label="Taille du texte" description="Taille des messages dans le chat.">
          <Segmented
            options={FONT_SIZES}
            value={prefs?.font_size ?? "medium"}
            onChange={(v) => save({ font_size: v })}
            disabled={!prefs}
          />
        </Row>
      </Panel>

      {error && <p className="text-sm text-[var(--error)]">{error}</p>}
    </div>
  );
}
