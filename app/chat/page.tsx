"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { streamChat } from "@/lib/chat-stream";
import { getHistory } from "@/lib/chat-api";
import { ChatMessage, type Message } from "@/components/ChatMessage";
import { ModelSelector } from "@/components/ModelSelector";
import { Sidebar } from "@/components/Sidebar";

let idCounter = 0;
function nextId() {
  idCounter += 1;
  return `m${Date.now()}${idCounter}`;
}

export default function ChatPage() {
  const { session, loading, loginAsGuest } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [model, setModel] = useState("auto");
  const [thinking, setThinking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarRefreshKey, setSidebarRefreshKey] = useState(0);
  const bottomRef = useRef<HTMLDivElement>(null);
  const guestAttempted = useRef(false);

  // Connexion invité automatique — parité avec "Essayer sans compte" du mobile.
  useEffect(() => {
    if (loading || session || guestAttempted.current) return;
    guestAttempted.current = true;
    loginAsGuest().catch(() => setError("Impossible de démarrer une session."));
  }, [loading, session, loginAsGuest]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Chargement de l'historique quand l'utilisateur change de conversation.
  async function openSession(id: string) {
    setActiveSessionId(id);
    setHistoryLoading(true);
    setError(null);
    try {
      const history = await getHistory(id);
      setMessages(
        history.map((m) => ({
          id: m.id,
          serverId: m.id,
          role: m.role,
          content: m.content,
        })),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Impossible de charger cette conversation.");
    } finally {
      setHistoryLoading(false);
    }
  }

  function newChat() {
    setActiveSessionId(null);
    setMessages([]);
    setError(null);
  }

  const effectiveModel = thinking ? "sayibi-reflexion" : model;

  async function send() {
    const text = input.trim();
    if (!text || sending || !session) return;
    setInput("");
    setError(null);

    const isFirstMessage = messages.length === 0;
    const userMsg: Message = { id: nextId(), role: "user", content: text };
    const assistantId = nextId();
    setMessages((prev) => [
      ...prev,
      userMsg,
      { id: assistantId, role: "assistant", content: "", streaming: true },
    ]);
    setSending(true);

    let acc = "";
    try {
      await streamChat(
        { message: text, sessionId: activeSessionId, modelPreference: effectiveModel },
        (evt) => {
          if (evt.chunk) {
            acc += evt.chunk;
            setMessages((prev) =>
              prev.map((m) => (m.id === assistantId ? { ...m, content: acc } : m)),
            );
          }
          if (evt.session_id && evt.session_id !== activeSessionId) {
            setActiveSessionId(evt.session_id);
          }
          if (evt.done) {
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantId
                  ? { ...m, streaming: false, serverId: evt.message_id }
                  : m,
              ),
            );
            // Nouvelle conversation créée : rafraîchit la sidebar pour l'afficher.
            if (isFirstMessage) setSidebarRefreshKey((k) => k + 1);
          }
          if (evt.error) {
            throw new Error(evt.error);
          }
        },
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur réseau");
      setMessages((prev) =>
        prev.map((m) => (m.id === assistantId ? { ...m, streaming: false } : m)),
      );
    } finally {
      setSending(false);
    }
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  }

  return (
    <div className="flex flex-1">
      <Sidebar
        activeId={activeSessionId}
        onSelect={openSession}
        onNewChat={newChat}
        refreshKey={sidebarRefreshKey}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="flex flex-1 flex-col">
        {/* Barre supérieure */}
        <header className="flex items-center justify-between border-b border-[var(--border)] px-3 py-3 md:px-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSidebarOpen(true)}
              aria-label="Ouvrir les conversations"
              className="rounded-lg p-2 transition hover:bg-white/5 md:hidden"
            >
              ☰
            </button>
            <Link href="/" className="text-sm font-semibold">
              Toumaï AI
            </Link>
          </div>
          <ModelSelector value={model} onChange={setModel} />
        </header>

        {/* Messages */}
        <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-4 overflow-y-auto px-4 py-6">
          {historyLoading && (
            <p className="text-center text-sm text-[var(--text-tertiary)]">
              Chargement de la conversation…
            </p>
          )}
          {!historyLoading && messages.length === 0 && (
            <div className="flex flex-1 flex-col items-center justify-center text-center text-[var(--text-secondary)]">
              <p className="mb-2 text-2xl font-semibold text-[var(--text-primary)]">
                Que puis-je faire pour vous ?
              </p>
              <p className="text-sm">
                Posez une question, demandez du code, ou activez « Réflexion » pour
                les tâches complexes.
              </p>
            </div>
          )}
          {!historyLoading &&
            messages.map((m) => <ChatMessage key={m.id} message={m} />)}
          {error && (
            <p className="text-center text-sm text-[var(--error)]">{error}</p>
          )}
          <div ref={bottomRef} />
        </main>

        {/* Saisie */}
        <footer className="border-t border-[var(--border)] px-4 py-4">
          <div className="mx-auto flex max-w-3xl flex-col gap-2">
            {thinking && (
              <button
                onClick={() => setThinking(false)}
                className="flex w-fit items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold"
                style={{ background: "rgba(139,92,246,0.14)", color: "var(--thinking)" }}
              >
                Réflexion <span aria-hidden="true">✕</span>
              </button>
            )}
            <div className="flex items-end gap-2 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-2">
              <button
                onClick={() => setThinking((t) => !t)}
                aria-pressed={thinking}
                title="Mode Réflexion (Toumaï 5)"
                className="shrink-0 rounded-xl p-2.5 transition hover:bg-white/5"
                style={{ color: thinking ? "var(--thinking)" : "var(--text-tertiary)" }}
              >
                🧠
              </button>
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={onKeyDown}
                placeholder="Écrivez à Toumaï AI…"
                rows={1}
                disabled={!session}
                className="max-h-40 flex-1 resize-none bg-transparent px-2 py-2 text-sm outline-none placeholder:text-[var(--text-tertiary)]"
              />
              <button
                onClick={send}
                disabled={!input.trim() || sending || !session}
                className="shrink-0 rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-40"
                style={{ background: "var(--primary)" }}
              >
                Envoyer
              </button>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
