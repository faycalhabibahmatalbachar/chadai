"use client";

/** Automatisation IA — workflows agent (esprit n8n). L'utilisateur compose
 * DÉCLENCHEUR → ACTION : Toumaï AI exécute la tâche seule, à l'heure dite ou
 * sur un mot-clé WhatsApp. */

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import {
  createAutomation,
  deleteAutomation,
  listAutomations,
  runAutomation,
  updateAutomation,
  type ActionType,
  type Automation,
  type TriggerType,
} from "@/lib/automations-api";
import { ThemeToggle } from "@/components/ThemeToggle";
import { cxScopeClass, cxScopeStyle, cxDisplayStyle } from "@/components/settings/cx-fonts";

const TRIGGER_LABEL: Record<TriggerType, string> = {
  schedule: "À intervalle régulier",
  keyword_wa: "Mot-clé WhatsApp reçu",
  manual: "Manuel (bouton)",
};
const ACTION_LABEL: Record<ActionType, string> = {
  assistant_task: "Confier une tâche à l'IA",
  send_whatsapp: "Envoyer un WhatsApp",
  send_email: "Envoyer un e-mail",
};

export default function AutomationsPage() {
  const { session, loading, loginAsGuest } = useAuth();
  const guestAttempted = useRef(false);
  const [items, setItems] = useState<Automation[]>([]);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [runResult, setRunResult] = useState<{ id: string; text: string } | null>(null);

  useEffect(() => {
    if (loading || session || guestAttempted.current) return;
    guestAttempted.current = true;
    loginAsGuest().catch(() => {});
  }, [loading, session, loginAsGuest]);

  function refresh() {
    setFetching(true);
    listAutomations()
      .then(setItems)
      .catch((e) => setError(e instanceof Error ? e.message : "Chargement impossible"))
      .finally(() => setFetching(false));
  }

  useEffect(() => {
    if (session) refresh();
  }, [session]);

  async function toggle(a: Automation) {
    setItems((prev) => prev.map((x) => (x.id === a.id ? { ...x, enabled: !x.enabled } : x)));
    await updateAutomation(a.id, { enabled: !a.enabled }).catch(() => refresh());
  }

  async function remove(id: string) {
    setItems((prev) => prev.filter((x) => x.id !== id));
    await deleteAutomation(id).catch(() => refresh());
  }

  async function test(id: string) {
    setRunResult({ id, text: "Exécution en cours…" });
    try {
      const summary = await runAutomation(id);
      setRunResult({ id, text: summary || "Terminé." });
    } catch (e) {
      setRunResult({ id, text: e instanceof Error ? e.message : "Échec." });
    }
    refresh();
  }

  return (
    <div className={`${cxScopeClass} flex min-h-dvh flex-col`} style={cxScopeStyle}>
      <header className="sticky top-0 z-30 flex items-center justify-between bg-[var(--background)]/95 px-4 py-3 backdrop-blur md:px-8">
        <div className="flex items-center gap-2">
          <Link
            href="/chat"
            aria-label="Retour au chat"
            className="flex h-9 w-9 items-center justify-center rounded-full text-[var(--cx-text-secondary)] transition hover:bg-[var(--cx-hover)]"
          >
            <BackIcon />
          </Link>
          <span className="text-sm text-[var(--cx-text-faint)]">
            Toumaï AI <span className="mx-1">/</span>
            <span className="text-[var(--cx-text-secondary)]">Automatisation IA</span>
          </span>
        </div>
        <ThemeToggle />
      </header>

      <div className="mx-auto w-full max-w-[900px] flex-1 px-4 pb-16 pt-4 md:px-8">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1
              className="text-[30px] font-medium leading-[1.1] tracking-[-0.015em] text-[var(--cx-text-primary)] sm:text-[38px]"
              style={cxDisplayStyle}
            >
              Automatisation IA
            </h1>
            <p className="mt-2 max-w-lg text-sm leading-relaxed text-[var(--cx-text-muted)]">
              Créez des workflows : un déclencheur, une action. Toumaï AI s'occupe du reste,
              automatiquement — à l'heure dite ou sur un mot-clé WhatsApp.
            </p>
          </div>
          <button
            onClick={() => setCreating(true)}
            className="rounded-[10px] px-[18px] py-2.5 text-sm font-semibold text-[#FFF6F1] transition hover:bg-[var(--cx-accent-hover)]"
            style={{ background: "var(--cx-accent)", boxShadow: "0 4px 14px rgba(232,104,58,0.25)" }}
          >
            + Nouvelle automatisation
          </button>
        </div>

        {creating && (
          <AutomationForm
            onCancel={() => setCreating(false)}
            onCreated={() => {
              setCreating(false);
              refresh();
            }}
          />
        )}

        {error && <p className="mb-4 text-sm text-[var(--cx-error-text)]">{error}</p>}

        {fetching && items.length === 0 ? (
          <div className="space-y-3">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="h-24 animate-pulse rounded-[14px] bg-[var(--cx-surface)]" />
            ))}
          </div>
        ) : items.length === 0 && !creating ? (
          <div className="rounded-[14px] border border-[var(--cx-border-subtle)] bg-[var(--cx-surface)] px-6 py-14 text-center">
            <p className="text-sm text-[var(--cx-text-secondary)]">Aucune automatisation pour l'instant.</p>
            <p className="mx-auto mt-1 max-w-sm text-[13px] text-[var(--cx-text-faint)]">
              Exemple : « chaque matin, envoie-moi un résumé de l'actualité du Tchad sur WhatsApp ».
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((a) => (
              <div
                key={a.id}
                className="rounded-[14px] border border-[var(--cx-border-subtle)] bg-[var(--cx-surface)] p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-[var(--cx-text-primary)]">{a.name}</p>
                    <p className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-[var(--cx-text-muted)]">
                      <span className="rounded-full bg-[var(--cx-hover)] px-2 py-0.5">
                        {TRIGGER_LABEL[a.trigger_type]}
                      </span>
                      <ArrowIcon />
                      <span className="rounded-full bg-[var(--cx-accent-bg)] px-2 py-0.5 text-[var(--cx-accent-text)]">
                        {ACTION_LABEL[a.action_type]}
                      </span>
                    </p>
                  </div>
                  <button
                    role="switch"
                    aria-checked={a.enabled}
                    onClick={() => toggle(a)}
                    className="relative h-[24px] w-[42px] shrink-0 rounded-full border transition-colors"
                    style={
                      a.enabled
                        ? { background: "var(--cx-accent)", borderColor: "var(--cx-accent)" }
                        : { background: "var(--cx-input)", borderColor: "var(--cx-border-strong)" }
                    }
                  >
                    <span
                      className="absolute top-1/2 h-[18px] w-[18px] -translate-y-1/2 rounded-full bg-white transition-all"
                      style={{ left: a.enabled ? "21px" : "2px" }}
                    />
                  </button>
                </div>

                {runResult?.id === a.id && (
                  <p className="mt-3 rounded-lg bg-[var(--cx-hover)] px-3 py-2 text-xs text-[var(--cx-text-secondary)]">
                    {runResult.text}
                  </p>
                )}

                <div className="mt-3 flex items-center gap-2">
                  <button
                    onClick={() => test(a.id)}
                    className="rounded-lg border border-[var(--cx-border-strong)] px-3 py-1.5 text-xs font-medium text-[var(--cx-text-secondary)] transition hover:bg-[var(--cx-hover)]"
                  >
                    Tester maintenant
                  </button>
                  <button
                    onClick={() => remove(a.id)}
                    className="rounded-lg px-3 py-1.5 text-xs font-medium text-[var(--cx-text-faint)] transition hover:text-[var(--cx-error-text)]"
                  >
                    Supprimer
                  </button>
                  {a.next_run_at && (
                    <span className="ml-auto text-[11px] text-[var(--cx-text-faint)]">
                      Prochaine : {new Date(a.next_run_at).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" })}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function AutomationForm({ onCancel, onCreated }: { onCancel: () => void; onCreated: () => void }) {
  const [name, setName] = useState("");
  const [trigger, setTrigger] = useState<TriggerType>("schedule");
  const [every, setEvery] = useState("day");
  const [keyword, setKeyword] = useState("");
  const [action, setAction] = useState<ActionType>("assistant_task");
  const [prompt, setPrompt] = useState("");
  const [to, setTo] = useState("");
  const [text, setText] = useState("");
  const [subject, setSubject] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function submit() {
    if (!name.trim()) return setErr("Donnez un nom à votre automatisation.");
    setBusy(true);
    setErr(null);
    const trigger_config = trigger === "schedule" ? { every } : trigger === "keyword_wa" ? { keyword } : {};
    const action_config =
      action === "assistant_task"
        ? { prompt }
        : action === "send_whatsapp"
          ? { to, text }
          : { to, subject, body: text };
    try {
      await createAutomation({ name, trigger_type: trigger, trigger_config, action_type: action, action_config });
      onCreated();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Création impossible.");
    } finally {
      setBusy(false);
    }
  }

  const field =
    "w-full rounded-[10px] border border-[var(--cx-border-default)] bg-[var(--cx-input)] px-3 py-2 text-sm text-[var(--cx-text-primary)] outline-none focus:border-[var(--cx-accent)]";

  return (
    <div className="mb-5 rounded-[14px] border border-[var(--cx-border-default)] bg-[var(--cx-surface)] p-5">
      <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.1em] text-[var(--cx-text-label)]">
        Nouvelle automatisation
      </p>
      <div className="space-y-3">
        <input className={field} placeholder="Nom (ex: Résumé actu chaque matin)" value={name} onChange={(e) => setName(e.target.value)} />

        <div>
          <label className="mb-1 block text-xs font-medium text-[var(--cx-text-muted)]">Quand ? (déclencheur)</label>
          <select className={field} value={trigger} onChange={(e) => setTrigger(e.target.value as TriggerType)}>
            <option value="schedule">À intervalle régulier</option>
            <option value="keyword_wa">Quand un WhatsApp contient un mot-clé</option>
            <option value="manual">Manuellement (bouton Tester)</option>
          </select>
          {trigger === "schedule" && (
            <select className={`${field} mt-2`} value={every} onChange={(e) => setEvery(e.target.value)}>
              <option value="hour">Toutes les heures</option>
              <option value="day">Chaque jour</option>
              <option value="week">Chaque semaine</option>
            </select>
          )}
          {trigger === "keyword_wa" && (
            <input className={`${field} mt-2`} placeholder="Mot-clé (ex: rapport)" value={keyword} onChange={(e) => setKeyword(e.target.value)} />
          )}
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-[var(--cx-text-muted)]">Quoi ? (action)</label>
          <select className={field} value={action} onChange={(e) => setAction(e.target.value as ActionType)}>
            <option value="assistant_task">Confier une tâche à l'IA (elle utilise ses outils)</option>
            <option value="send_whatsapp">Envoyer un message WhatsApp</option>
            <option value="send_email">Envoyer un e-mail</option>
          </select>
          {action === "assistant_task" && (
            <textarea
              className={`${field} mt-2`}
              rows={3}
              placeholder="Consigne (ex: Rédige un résumé de l'actualité du Tchad et envoie-le-moi sur WhatsApp)"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
            />
          )}
          {action === "send_whatsapp" && (
            <>
              <input className={`${field} mt-2`} placeholder="Numéro (+235…)" value={to} onChange={(e) => setTo(e.target.value)} />
              <textarea className={`${field} mt-2`} rows={2} placeholder="Message" value={text} onChange={(e) => setText(e.target.value)} />
            </>
          )}
          {action === "send_email" && (
            <>
              <input className={`${field} mt-2`} placeholder="Destinataire (email)" value={to} onChange={(e) => setTo(e.target.value)} />
              <input className={`${field} mt-2`} placeholder="Objet" value={subject} onChange={(e) => setSubject(e.target.value)} />
              <textarea className={`${field} mt-2`} rows={2} placeholder="Contenu" value={text} onChange={(e) => setText(e.target.value)} />
            </>
          )}
        </div>

        {err && <p className="text-xs text-[var(--cx-error-text)]">{err}</p>}
        <div className="flex gap-2">
          <button
            onClick={submit}
            disabled={busy}
            className="rounded-[10px] px-4 py-2 text-sm font-semibold text-[#FFF6F1] transition hover:bg-[var(--cx-accent-hover)] disabled:opacity-50"
            style={{ background: "var(--cx-accent)" }}
          >
            {busy ? "Création…" : "Créer l'automatisation"}
          </button>
          <button onClick={onCancel} className="rounded-[10px] px-4 py-2 text-sm text-[var(--cx-text-secondary)] transition hover:bg-[var(--cx-hover)]">
            Annuler
          </button>
        </div>
      </div>
    </div>
  );
}

function BackIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M19 12H5M12 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function ArrowIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[var(--cx-text-faint)]" aria-hidden="true">
      <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
