"use client";

import { type ReactNode } from "react";

/** Panneau de réglages — conteneur hairline des rangées, style console
 * d'entreprise (Google Account / paramètres Claude). */
export function Panel({ title, children }: { title?: string; children: ReactNode }) {
  return (
    <div className="mb-6 overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)]">
      {title && (
        <p className="px-5 pb-1 pt-4 text-[11.5px] font-semibold uppercase tracking-[0.05em] text-[var(--text-tertiary)]">
          {title}
        </p>
      )}
      {children}
    </div>
  );
}

/** Rangée de réglage : libellé + description à gauche, contrôle à droite. */
export function Row({
  label,
  description,
  children,
  stacked = false,
}: {
  label: string;
  description?: string;
  children?: ReactNode;
  /** stacked : le contrôle passe sous le libellé (textarea, listes). */
  stacked?: boolean;
}) {
  return (
    <div
      className={`border-t border-[var(--border)] px-5 py-4 first:border-t-0 ${
        stacked ? "" : "flex items-center justify-between gap-6"
      }`}
    >
      <div className="min-w-0">
        <p className="text-sm font-medium">{label}</p>
        {description && (
          <p className="mt-0.5 text-xs text-[var(--text-tertiary)]">{description}</p>
        )}
      </div>
      <div className={stacked ? "mt-3" : "flex shrink-0 items-center gap-2"}>{children}</div>
    </div>
  );
}

/** Contrôle segmenté — choix exclusif compact (ton, thème, taille…). */
export function Segmented<T extends string>({
  options,
  value,
  onChange,
  disabled,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex overflow-hidden rounded-lg border border-[var(--border)]">
      {options.map((o, i) => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          disabled={disabled}
          className={`px-3.5 py-1.5 text-xs font-medium transition disabled:opacity-40 ${
            i > 0 ? "border-l border-[var(--border)]" : ""
          }`}
          style={
            value === o.value
              ? { background: "var(--card)", color: "var(--text-primary)" }
              : { color: "var(--text-secondary)" }
          }
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
