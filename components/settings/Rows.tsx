"use client";

import { type ReactNode } from "react";

/** Panneau de réglages — style Claude : intitulé serif hors du cadre, carte
 * plate à liseré fin, rangées séparées par des hairlines. */
export function Panel({ title, children }: { title?: string; children: ReactNode }) {
  return (
    <section className="mb-8">
      {title && (
        <h3 className="landing-serif mb-2.5 px-0.5 text-[17px] tracking-tight text-[var(--text-primary)]">
          {title}
        </h3>
      )}
      <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)]">
        {children}
      </div>
    </section>
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
          <p className="mt-0.5 text-xs leading-relaxed text-[var(--text-tertiary)]">{description}</p>
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
    <div className="flex gap-0.5 rounded-full border border-[var(--border)] bg-[var(--background)] p-0.5">
      {options.map((o) => {
        const active = value === o.value;
        return (
          <button
            key={o.value}
            onClick={() => onChange(o.value)}
            disabled={disabled}
            aria-pressed={active}
            className="rounded-full px-3.5 py-1.5 text-xs font-medium transition disabled:opacity-40"
            style={
              active
                ? {
                    background: "color-mix(in srgb, var(--primary) 12%, transparent)",
                    color: "var(--primary)",
                  }
                : { color: "var(--text-secondary)" }
            }
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
