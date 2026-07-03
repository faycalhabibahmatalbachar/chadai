"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { sendFeedback } from "@/lib/chat-api";
import { CodeBlock } from "./CodeBlock";
import { Logo } from "./Logo";

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  streaming?: boolean;
  /** Présent une fois le message persisté côté backend — nécessaire pour le feedback. */
  serverId?: string;
}

function EditIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path
        d="M11 4H6a2 2 0 00-2 2v12a2 2 0 002 2h12a2 2 0 002-2v-5M18.5 2.5a2.12 2.12 0 013 3L12 15l-4 1 1-4 9.5-9.5z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Indicateur "Toumaï AI réfléchit" — affiché avant le premier token, comme
 * les trois points de ChatGPT/Gemini pendant la latence initiale. */
function TypingDots() {
  return (
    <div className="flex items-center gap-1 py-1" aria-label="Toumaï AI réfléchit">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="h-1.5 w-1.5 rounded-full bg-current opacity-40"
          style={{
            animation: "typing-bounce 1.1s ease-in-out infinite",
            animationDelay: `${i * 0.15}s`,
          }}
        />
      ))}
    </div>
  );
}

function Avatar({ role }: { role: "user" | "assistant" }) {
  if (role === "assistant") {
    return (
      <div
        className="flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-full"
        style={{ background: "linear-gradient(135deg, var(--primary), var(--thinking))" }}
        aria-hidden="true"
      >
        <Logo size={20} />
      </div>
    );
  }
  return (
    <div
      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--card)] text-xs font-semibold text-[var(--text-secondary)]"
      aria-hidden="true"
    >
      V
    </div>
  );
}

export function ChatMessage({
  message,
  onEdit,
  editable = true,
}: {
  message: Message;
  onEdit?: (newContent: string) => void;
  editable?: boolean;
}) {
  const isUser = message.role === "user";
  const [copied, setCopied] = useState(false);
  const [rated, setRated] = useState<"up" | "down" | null>(null);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(message.content);

  function startEdit() {
    setDraft(message.content);
    setEditing(true);
  }

  function saveEdit() {
    const trimmed = draft.trim();
    if (!trimmed || trimmed === message.content) {
      setEditing(false);
      return;
    }
    setEditing(false);
    onEdit?.(trimmed);
  }

  async function copy() {
    await navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  async function rate(value: "up" | "down") {
    if (!message.serverId || rated) return;
    setRated(value);
    try {
      await sendFeedback(message.serverId, value);
    } catch {
      setRated(null);
    }
  }

  if (isUser) {
    if (editing) {
      return (
        <div className="flex animate-fade-in items-start justify-end gap-2.5">
          <div className="flex max-w-[85%] flex-col gap-2 sm:max-w-[70%]">
            <textarea
              autoFocus
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  saveEdit();
                } else if (e.key === "Escape") {
                  setEditing(false);
                }
              }}
              rows={Math.min(8, Math.max(2, draft.split("\n").length))}
              className="w-full resize-none rounded-2xl border border-[var(--primary)] bg-[var(--card)] px-4 py-3 text-[15px] leading-relaxed text-[var(--text-primary)] outline-none"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setEditing(false)}
                className="rounded-lg px-3 py-1.5 text-xs text-[var(--text-secondary)] transition hover:bg-white/5"
              >
                Annuler
              </button>
              <button
                onClick={saveEdit}
                disabled={!draft.trim()}
                className="rounded-lg px-3 py-1.5 text-xs font-medium text-white transition disabled:opacity-40"
                style={{ background: "var(--primary)" }}
              >
                Envoyer
              </button>
            </div>
          </div>
          <Avatar role="user" />
        </div>
      );
    }
    return (
      <div className="group flex animate-fade-in items-start justify-end gap-2.5">
        <div className="flex max-w-[85%] flex-col items-end gap-1 sm:max-w-[70%]">
          <div
            className="rounded-2xl rounded-tr-md px-4 py-3 text-[15px] leading-relaxed whitespace-pre-wrap text-white"
            style={{ background: "var(--primary)" }}
          >
            {message.content}
          </div>
          {editable && onEdit && (
            <button
              onClick={startEdit}
              aria-label="Modifier le message"
              className="flex items-center gap-1 rounded p-1 text-[11px] text-[var(--text-tertiary)] opacity-0 transition hover:text-[var(--text-primary)] group-hover:opacity-100"
            >
              <EditIcon /> Modifier
            </button>
          )}
        </div>
        <Avatar role="user" />
      </div>
    );
  }

  return (
    <div className="flex animate-fade-in items-start gap-2.5">
      <Avatar role="assistant" />
      <div className="flex min-w-0 max-w-[90%] flex-col items-start gap-1.5 sm:max-w-[80%]">
        <div className="w-full rounded-2xl rounded-tl-md border border-[var(--border)] bg-[var(--card)] px-4 py-3 text-[15px] leading-relaxed">
          {message.streaming && !message.content ? (
            <TypingDots />
          ) : (
          <div className="prose-toumai">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                pre(props) {
                  // CodeBlock rend déjà son propre <pre> — évite un double wrapper.
                  return <>{props.children}</>;
                },
                code(props) {
                  const { className, children } = props;
                  const match = /language-(\w+)/.exec(className || "");
                  const isBlock = Boolean(match);
                  const text = String(children).replace(/\n$/, "");
                  if (!isBlock) {
                    return <code className={className}>{children}</code>;
                  }
                  return <CodeBlock language={match![1]} code={text} />;
                },
              }}
            >
              {message.content || ""}
            </ReactMarkdown>
          </div>
          )}
          {message.streaming && message.content && (
            <span className="streaming-cursor ml-0.5 inline-block h-4 w-[2px] translate-y-0.5 bg-current align-middle" />
          )}
        </div>
        {!message.streaming && message.content && (
          <div className="flex items-center gap-1 px-1 text-[var(--text-tertiary)]">
            <button
              onClick={copy}
              aria-label="Copier la réponse"
              className="rounded p-1.5 text-xs transition hover:bg-white/5 hover:text-[var(--text-primary)]"
            >
              {copied ? "Copié" : "Copier"}
            </button>
            {message.serverId && (
              <>
                <button
                  onClick={() => rate("up")}
                  aria-label="Bonne réponse"
                  disabled={!!rated}
                  className={`rounded p-1.5 text-xs transition hover:bg-white/5 ${
                    rated === "up" ? "text-[var(--success)]" : "hover:text-[var(--text-primary)]"
                  }`}
                >
                  👍
                </button>
                <button
                  onClick={() => rate("down")}
                  aria-label="Mauvaise réponse"
                  disabled={!!rated}
                  className={`rounded p-1.5 text-xs transition hover:bg-white/5 ${
                    rated === "down" ? "text-[var(--error)]" : "hover:text-[var(--text-primary)]"
                  }`}
                >
                  👎
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
