"use client";

import { type ReactNode } from "react";

export type ConnectorStatus = "connected" | "disconnected" | "pending" | "loading" | "unavailable";

const STATUS_LABEL: Record<ConnectorStatus, string> = {
  connected: "Connecté",
  disconnected: "Non connecté",
  pending: "En attente",
  loading: "Vérification…",
  unavailable: "Indisponible",
};

const STATUS_COLOR: Record<ConnectorStatus, string> = {
  connected: "var(--success)",
  disconnected: "var(--text-tertiary)",
  pending: "#f59e0b",
  loading: "var(--text-tertiary)",
  unavailable: "var(--text-tertiary)",
};

/** Carte de connecteur générique — statut vivant + zone d'action libre.
 * Chaque nouvel outil (Notion, Slack…) devient simplement une carte de plus. */
export function ConnectorCard({
  icon,
  name,
  description,
  status,
  children,
}: {
  icon: ReactNode;
  name: string;
  description: string;
  status: ConnectorStatus;
  children?: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4">
      <div className="flex items-start gap-3">
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-lg"
          style={{ background: "var(--surface)" }}
          aria-hidden="true"
        >
          {icon}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="font-medium">{name}</p>
            <span className="flex items-center gap-1 text-xs" style={{ color: STATUS_COLOR[status] }}>
              <span
                className="h-1.5 w-1.5 rounded-full"
                style={{ background: STATUS_COLOR[status] }}
                aria-hidden="true"
              />
              {STATUS_LABEL[status]}
            </span>
          </div>
          <p className="mt-0.5 text-sm text-[var(--text-secondary)]">{description}</p>
          {children && <div className="mt-3">{children}</div>}
        </div>
      </div>
    </div>
  );
}
