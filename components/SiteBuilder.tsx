"use client";

import { useEffect, useState } from "react";

/** Carte de construction animée — affichée pendant que Toumaï AI génère un
 * site (bloc ```html en cours de streaming). Donne un feedback vivant façon
 * « atelier » plutôt que du code brut qui défile : phases qui s'enchaînent,
 * barre de progression, lignes de code déjà écrites. */

const PHASES = [
  "Analyse de la demande",
  "Structure de la page (HTML)",
  "Styles & mise en page (CSS)",
  "Interactions & scripts (JS)",
  "Finalisation et vérification",
];

export function SiteBuildingCard({ codeLength }: { codeLength: number }) {
  const [phase, setPhase] = useState(0);

  // Les phases avancent au rythme de l'arrivée du code, avec un plancher
  // temporel pour rester lisibles même si le modèle est très rapide.
  useEffect(() => {
    const target = Math.min(PHASES.length - 1, Math.floor(codeLength / 320));
    if (target > phase) {
      const t = setTimeout(() => setPhase((p) => Math.min(target, p + 1)), 220);
      return () => clearTimeout(t);
    }
  }, [codeLength, phase]);

  const pct = Math.min(96, Math.round(((phase + 1) / PHASES.length) * 100));
  const lines = Math.max(1, codeLength > 0 ? codeLength / 42 : 0);

  return (
    <div className="my-2 overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface)]">
      <div className="flex items-center gap-3 px-4 py-3">
        <span
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-white"
          style={{ background: "linear-gradient(135deg, var(--primary), var(--thinking))" }}
          aria-hidden="true"
        >
          <BuildIcon />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold">Toumaï AI construit votre site…</p>
          <p className="truncate text-xs text-[var(--text-tertiary)]">
            {PHASES[phase]} · {Math.round(lines)} lignes écrites
          </p>
        </div>
        <span className="shrink-0 text-sm font-semibold tabular-nums" style={{ color: "var(--primary)" }}>
          {pct}%
        </span>
      </div>

      <div className="h-1 w-full bg-[var(--card)]">
        <div
          className="h-full rounded-r-full transition-all duration-500"
          style={{ width: `${pct}%`, background: "linear-gradient(90deg, var(--primary), var(--thinking))" }}
        />
      </div>

      <ul className="space-y-1.5 px-4 py-3">
        {PHASES.map((label, i) => (
          <li key={label} className="flex items-center gap-2.5 text-xs">
            <span
              className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full"
              style={{
                background:
                  i < phase
                    ? "var(--success)"
                    : i === phase
                      ? "color-mix(in srgb, var(--primary) 20%, transparent)"
                      : "var(--card)",
                color: i < phase ? "#fff" : "var(--primary)",
              }}
              aria-hidden="true"
            >
              {i < phase ? (
                <CheckMini />
              ) : i === phase ? (
                <span className="h-2 w-2 animate-pulse rounded-full" style={{ background: "var(--primary)" }} />
              ) : null}
            </span>
            <span style={{ color: i <= phase ? "var(--text-secondary)" : "var(--text-tertiary)" }}>
              {label}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Suggestions d'amélioration cliquables — proposées sous un site généré.
 * Un clic renvoie la demande dans le chat pour itérer sur le site. */
export function SiteSuggestions({ onSuggest }: { onSuggest?: (text: string) => void }) {
  if (!onSuggest) return null;
  const ideas = [
    { label: "🎨 Change les couleurs", prompt: "Change la palette de couleurs du site pour quelque chose de plus moderne et chaleureux." },
    { label: "📱 Rends-le responsive", prompt: "Améliore le site pour qu'il soit parfaitement responsive sur mobile." },
    { label: "✨ Ajoute des animations", prompt: "Ajoute des animations douces et des transitions au survol sur le site." },
    { label: "🖼️ Ajoute une section galerie", prompt: "Ajoute une section galerie d'images au site." },
    { label: "📞 Améliore le formulaire", prompt: "Améliore le formulaire de contact avec une validation et un joli style." },
  ];
  return (
    <div className="mt-2 flex flex-wrap gap-1.5">
      <span className="mr-1 self-center text-xs text-[var(--text-tertiary)]">Améliorer :</span>
      {ideas.map((s) => (
        <button
          key={s.label}
          onClick={() => onSuggest(s.prompt)}
          className="rounded-full border border-[var(--border)] px-3 py-1.5 text-xs font-medium text-[var(--text-secondary)] transition hover:border-[var(--primary)]/60 hover:text-[var(--text-primary)]"
        >
          {s.label}
        </button>
      ))}
    </div>
  );
}

function BuildIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" aria-hidden="true">
      <path d="M3 9l9-6 9 6v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" strokeLinejoin="round" />
      <path d="M9 22V12h6v10" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CheckMini() {
  return (
    <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.2">
      <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
