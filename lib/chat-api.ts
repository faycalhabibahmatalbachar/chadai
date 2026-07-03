import { API_BASE } from "./config";
import { authHeaders } from "./api";

export interface ChatSession {
  id: string;
  title: string;
  created_at: string;
  model_used?: string;
}

export interface HistoryMessage {
  id: string;
  session_id: string;
  role: "user" | "assistant";
  content: string;
  metadata?: { image_urls?: string[]; sources?: unknown[] } | null;
  created_at: string;
}

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, { headers: { ...authHeaders() } });
  const body = await res.json();
  if (!res.ok || body.success === false) {
    throw new Error(body.message || `Erreur ${res.status}`);
  }
  return body.data as T;
}

export async function listSessions(): Promise<ChatSession[]> {
  return get<ChatSession[]>("/chat/sessions");
}

export async function getHistory(sessionId: string): Promise<HistoryMessage[]> {
  const data = await get<{ messages: HistoryMessage[] }>(
    `/chat/history/${sessionId}?page=1&page_size=100`,
  );
  return data.messages;
}

export async function deleteSession(sessionId: string): Promise<void> {
  const res = await fetch(`${API_BASE}/chat/session/${sessionId}`, {
    method: "DELETE",
    headers: { ...authHeaders() },
  });
  if (!res.ok) throw new Error(`Erreur ${res.status}`);
}

/** Supprime un message et tout ce qui le suit dans sa session — utilisé
 * avant de renvoyer un message utilisateur édité, pour que le modèle ne
 * voie pas l'ancienne branche de la conversation. */
export async function deleteMessageAndAfter(messageId: string): Promise<void> {
  const res = await fetch(`${API_BASE}/chat/message/${messageId}/after`, {
    method: "DELETE",
    headers: { ...authHeaders() },
  });
  if (!res.ok) throw new Error(`Erreur ${res.status}`);
}

export async function sendFeedback(messageId: string, rating: "up" | "down"): Promise<void> {
  const res = await fetch(`${API_BASE}/chat/feedback`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({ message_id: messageId, rating }),
  });
  if (!res.ok) throw new Error(`Erreur ${res.status}`);
}

/** Regroupe les sessions par période, comme ChatGPT/Claude.ai. */
export function groupSessionsByDate(sessions: ChatSession[]): { label: string; items: ChatSession[] }[] {
  const now = Date.now();
  const day = 86_400_000;
  const groups: Record<string, ChatSession[]> = {
    "Aujourd'hui": [],
    "7 derniers jours": [],
    "30 derniers jours": [],
    "Plus ancien": [],
  };
  for (const s of sessions) {
    const t = new Date(s.created_at).getTime();
    const diff = now - t;
    if (diff < day) groups["Aujourd'hui"].push(s);
    else if (diff < 7 * day) groups["7 derniers jours"].push(s);
    else if (diff < 30 * day) groups["30 derniers jours"].push(s);
    else groups["Plus ancien"].push(s);
  }
  return Object.entries(groups)
    .filter(([, items]) => items.length > 0)
    .map(([label, items]) => ({ label, items }));
}
