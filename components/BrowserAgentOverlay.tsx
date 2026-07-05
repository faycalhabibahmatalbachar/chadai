"use client";

import { useEffect, useRef, useState } from "react";
import {
  cancelTask,
  confirmTask,
  getTask,
  startTask,
  type BrowserTask,
} from "@/lib/agent-api";
import { Logo } from "./Logo";

const TERMINAL = new Set(["done", "error", "cancelled"]);

/** Fenêtre dédiée de l'Agent Navigateur — invoquée automatiquement par le
 * chat quand l'utilisateur demande une navigation web. Montre le parcours en
 * direct : étapes animées, URL courante, confirmation des actions sensibles. */
export function BrowserAgentOverlay({
  goal,
  onClose,
}: {
  goal: string;
  onClose: (answer?: string) => void;
}) {
  const [task, setTask] = useState<BrowserTask | null>(null);
  const [error, setError] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const stepsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    startTask(goal)
      .then((t) => {
        if (cancelled) return;
        setTask(t);
        pollRef.current = setInterval(async () => {
          const cur = await getTask(t.id).catch(() => null);
          if (!cur) return;
          setTask(cur);
          if (TERMINAL.has(cur.status) && pollRef.current) {
            clearInterval(pollRef.current);
            pollRef.current = null;
          }
        }, 2000);
      })
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Impossible de lancer l'agent."),
      );
    return () => {
      cancelled = true;
      if (pollRef.current) clearInterval(pollRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    stepsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [task?.steps.length]);

  const running = task && !TERMINAL.has(task.status);

  async function stop() {
    if (task && running) await cancelTask(task.id).catch(() => {});
    onClose(task?.answer || undefined);
  }

  async function respond(approve: boolean) {
    if (!task) return;
    await confirmTask(task.id, approve).catch(() => {});
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Agent Navigateur"
    >
      <div className="flex max-h-[85vh] w-full max-w-xl flex-col overflow-hidden rounded-3xl border border-[var(--border)] bg-[var(--surface)]">
        {/* En-tête animé */}
        <div className="flex items-center gap-3 border-b border-[var(--border)] px-5 py-4">
          <span className="relative flex h-10 w-10 items-center justify-center">
            {running && (
              <span
                className="absolute inset-0 animate-ping rounded-full opacity-20"
                style={{ background: "var(--primary)" }}
                aria-hidden="true"
              />
            )}
            <span
              className="flex h-10 w-10 items-center justify-center rounded-full"
              style={{ background: "color-mix(in srgb, var(--primary) 12%, transparent)" }}
            >
              <Logo size={22} />
            </span>
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold">Agent Navigateur</p>
            <p className="truncate text-xs text-[var(--text-tertiary)]">
              {task?.current_url || goal}
            </p>
          </div>
          {running && (
            <span className="flex items-center gap-1.5 text-xs font-medium" style={{ color: "var(--primary)" }}>
              <span className="h-1.5 w-1.5 animate-pulse rounded-full" style={{ background: "var(--primary)" }} />
              Navigation…
            </span>
          )}
        </div>

        {/* Parcours en direct */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {error && <p className="text-sm text-[var(--error)]">{error}</p>}
          {!task && !error && (
            <div className="space-y-3" aria-hidden="true">
              {[...Array(2)].map((_, i) => (
                <div key={i} className="h-10 animate-pulse rounded-xl bg-[var(--card)]" />
              ))}
            </div>
          )}
          {task?.steps.map((s) => (
            <div key={s.index} className="animate-fade-in mb-3 flex gap-3">
              <span
                className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold"
                style={{
                  background: "color-mix(in srgb, var(--primary) 12%, transparent)",
                  color: "var(--primary)",
                }}
              >
                {s.index + 1}
              </span>
              <div className="min-w-0">
                <p className="text-sm">{s.thought || s.action}</p>
                {s.detail && (
                  <p className="truncate text-xs text-[var(--text-tertiary)]">{s.detail}</p>
                )}
              </div>
            </div>
          ))}

          {task?.status === "needs_confirmation" && (
            <div className="mt-2 rounded-2xl border border-[var(--border)] bg-[var(--background)] p-4">
              <p className="text-sm font-medium">
                {task.pending_action?.question || "L'agent demande votre confirmation pour continuer."}
              </p>
              <div className="mt-3 flex gap-2">
                <button
                  onClick={() => respond(true)}
                  className="rounded-full px-4 py-1.5 text-xs font-semibold text-white"
                  style={{ background: "var(--primary)" }}
                >
                  Autoriser
                </button>
                <button
                  onClick={() => respond(false)}
                  className="rounded-full border border-[var(--border)] px-4 py-1.5 text-xs font-medium"
                >
                  Refuser
                </button>
              </div>
            </div>
          )}

          {task?.status === "done" && task.answer && (
            <div className="animate-fade-in mt-2 rounded-2xl border border-[var(--border)] bg-[var(--background)] p-4">
              <p className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: "var(--success)" }}>
                ✓ Tâche terminée
              </p>
              <p className="mt-1.5 whitespace-pre-wrap text-sm leading-relaxed">{task.answer}</p>
            </div>
          )}
          {task?.status === "error" && (
            <p className="mt-2 text-sm text-[var(--error)]">
              {task.error || "L'agent n'a pas pu terminer la tâche."}
            </p>
          )}
          <div ref={stepsEndRef} />
        </div>

        <div className="flex justify-end gap-2 border-t border-[var(--border)] px-5 py-3">
          <button
            onClick={stop}
            className="rounded-full px-4 py-2 text-sm font-medium text-[var(--text-secondary)] transition hover:bg-[var(--hover)]"
          >
            {running ? "Arrêter" : "Fermer"}
          </button>
        </div>
      </div>
    </div>
  );
}

/** Détection d'une demande de navigation web — déclenche l'agent dédié.
 * Volontairement stricte pour ne pas capturer les questions normales. */
export function detectBrowserGoal(text: string): boolean {
  const t = text.trim();
  if (t.length < 10) return false;
  return (
    /\b(va|vas|allez|rends[- ]toi|navigue[rz]?|ouvre|connecte[- ]toi)\b.{0,24}\b(sur|au site|le site|à la page)\b/i.test(t) ||
    /\b(remplis?|compare[rz]?|cherche[rz]?|regarde[rz]?|extrais?)\b.{0,30}\b(site|page web|formulaire en ligne)\b/i.test(t) ||
    /\bhttps?:\/\/\S+/i.test(t) ||
    /\bwww\.\S+\.\w{2,}/i.test(t)
  );
}
