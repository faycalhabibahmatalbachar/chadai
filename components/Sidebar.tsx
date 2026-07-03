"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import {
  deleteSession,
  groupSessionsByDate,
  listSessions,
  type ChatSession,
} from "@/lib/chat-api";

interface SidebarProps {
  activeId: string | null;
  onSelect: (id: string) => void;
  onNewChat: () => void;
  refreshKey: number;
  open: boolean;
  onClose: () => void;
}

export function Sidebar({ activeId, onSelect, onNewChat, refreshKey, open, onClose }: SidebarProps) {
  const { session } = useAuth();
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (!session) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    listSessions()
      .then((data) => {
        if (!cancelled) setSessions(data);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Erreur réseau");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [session, refreshKey]);

  async function handleDelete(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    setDeletingId(id);
    try {
      await deleteSession(id);
      setSessions((prev) => prev.filter((s) => s.id !== id));
      if (activeId === id) onNewChat();
    } catch {
      // L'échec de suppression laisse la conversation visible — pas d'état incohérent.
    } finally {
      setDeletingId(null);
    }
  }

  const filtered = query.trim()
    ? sessions.filter((s) => s.title.toLowerCase().includes(query.trim().toLowerCase()))
    : sessions;
  const grouped = groupSessionsByDate(filtered);

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-30 bg-black/40 md:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-72 flex-col border-r border-[var(--border)] bg-[var(--surface)] transition-transform md:static md:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center gap-2 p-3">
          <button
            onClick={() => {
              onNewChat();
              onClose();
            }}
            className="flex flex-1 items-center gap-2 rounded-lg border border-[var(--border)] px-3 py-2.5 text-sm font-medium transition hover:bg-white/5"
          >
            <PlusIcon />
            Nouvelle conversation
          </button>
        </div>

        <div className="px-3 pb-2">
          <div className="relative">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]">
              <SearchIcon />
            </span>
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Rechercher une conversation…"
              className="w-full rounded-lg border border-[var(--border)] bg-transparent py-1.5 pl-9 pr-3 text-sm outline-none placeholder:text-[var(--text-tertiary)] focus:border-[var(--primary)]"
            />
          </div>
        </div>

        <div className="px-3 pb-1">
          <Link
            href="/library"
            onClick={onClose}
            className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-[var(--text-secondary)] transition hover:bg-white/5 hover:text-[var(--text-primary)]"
          >
            <LibraryIcon />
            Bibliothèque
          </Link>
        </div>

        <nav className="flex-1 overflow-y-auto px-2 pb-3">
          {loading && (
            <div className="flex flex-col gap-2 px-2 py-2" aria-hidden="true">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-8 animate-pulse rounded-lg bg-[var(--card)]" />
              ))}
            </div>
          )}
          {error && !loading && (
            <p className="px-2 py-3 text-xs text-[var(--error)]">{error}</p>
          )}
          {!loading && !error && sessions.length === 0 && (
            <p className="px-2 py-3 text-xs text-[var(--text-tertiary)]">
              Aucune conversation enregistrée.
            </p>
          )}
          {grouped.map((group) => (
            <div key={group.label} className="mb-3">
              <p className="px-2 pb-1 text-[11px] font-medium text-[var(--text-tertiary)]">
                {group.label}
              </p>
              {group.items.map((s) => (
                <button
                  key={s.id}
                  onClick={() => {
                    onSelect(s.id);
                    onClose();
                  }}
                  className={`group flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left text-sm transition ${
                    s.id === activeId
                      ? "bg-[var(--card)] text-[var(--text-primary)]"
                      : "text-[var(--text-secondary)] hover:bg-white/5"
                  }`}
                >
                  <span className="truncate">{s.title || "Sans titre"}</span>
                  <span
                    role="button"
                    aria-label="Supprimer la conversation"
                    onClick={(e) => handleDelete(s.id, e)}
                    className="ml-2 shrink-0 rounded p-1 text-[var(--text-tertiary)] opacity-0 transition hover:text-[var(--error)] group-hover:opacity-100"
                  >
                    {deletingId === s.id ? "…" : <CloseIcon />}
                  </span>
                </button>
              ))}
            </div>
          ))}
        </nav>

        <Link
          href="/settings"
          onClick={onClose}
          className="flex items-center gap-2.5 border-t border-[var(--border)] px-3 py-3 transition hover:bg-white/5"
        >
          <div
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white"
            style={{ background: "linear-gradient(135deg, var(--primary), var(--thinking))" }}
            aria-hidden="true"
          >
            {session ? "V" : "…"}
          </div>
          <span className="truncate text-xs font-medium text-[var(--text-secondary)]">
            {session ? "Session invité" : "Connexion…"}
          </span>
          <SettingsIcon />
        </Link>
      </aside>
    </>
  );
}

function PlusIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 5v14M5 12h14" strokeLinecap="round" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="11" cy="11" r="7" />
      <path d="M21 21l-4.35-4.35" strokeLinecap="round" />
    </svg>
  );
}

function LibraryIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path
        d="M4 19.5A2.5 2.5 0 016.5 17H20M4 19.5A2.5 2.5 0 006.5 22H20V2H6.5A2.5 2.5 0 004 4.5v15z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className="ml-auto shrink-0 text-[var(--text-tertiary)]"
    >
      <circle cx="12" cy="12" r="3" />
      <path
        d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09a1.65 1.65 0 00-1-1.51 1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 11-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09a1.65 1.65 0 001.51-1 1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 112.83-2.83l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 112.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
      <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
    </svg>
  );
}
