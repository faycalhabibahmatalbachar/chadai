"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { streamChat } from "@/lib/chat-stream";
import { ChatMessage, type Message } from "@/components/ChatMessage";
import { ModelSelector } from "@/components/ModelSelector";

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
  const sessionIdRef = useRef<string | null>(null);
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

  const effectiveModel = thinking ? "sayibi-reflexion" : model;

  async function send() {
    const text = input.trim();
    if (!text || sending || !session) return;
    setInput("");
    setError(null);

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
        { message: text, sessionId: sessionIdRef.current, modelPreference: effectiveModel },
        (evt) => {
          if (evt.chunk) {
            acc += evt.chunk;
            setMessages((prev) =>
              prev.map((m) => (m.id === assistantId ? { ...m, content: acc } : m)),
            );
          }
          if (evt.session_id) sessionIdRef.current = evt.session_id;
          if (evt.done) {
            setMessages((prev) =>
              prev.map((m) => (m.id === assistantId ? { ...m, streaming: false } : m)),
            );
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
    <div className="flex flex-1 flex-col">
      {/* Barre supérieure */}
      <header className="flex items-center justify-between border-b border-[var(--border)] px-4 py-3">
        <Link href="/" className="text-sm font-semibold">
          ← ChadGPT
        </Link>
        <ModelSelector value={model} onChange={setModel} />
      </header>

      {/* Messages */}
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-4 overflow-y-auto px-4 py-6">
        {messages.length === 0 && (
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
        {messages.map((m) => (
          <ChatMessage key={m.id} message={m} />
        ))}
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
              🧠 Réflexion <span className="opacity-70">✕</span>
            </button>
          )}
          <div className="flex items-end gap-2 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-2">
            <button
              onClick={() => setThinking((t) => !t)}
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
              placeholder="Écrivez à ChadGPT…"
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
  );
}
