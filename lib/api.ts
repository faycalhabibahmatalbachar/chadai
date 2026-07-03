import { API_BASE } from "./config";

export interface TokenPayload {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
  user_id: string;
  is_guest?: boolean;
}

const STORAGE_KEY = "chadgpt_web_session_v1";

export function loadSession(): TokenPayload | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as TokenPayload) : null;
  } catch {
    return null;
  }
}

export function saveSession(payload: TokenPayload): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
}

export function clearSession(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STORAGE_KEY);
}

interface ApiEnvelope<T> {
  success: boolean;
  message?: string;
  data?: T;
}

async function request<T>(
  path: string,
  init?: RequestInit,
): Promise<ApiEnvelope<T>> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
  const body = (await res.json().catch(() => ({}))) as ApiEnvelope<T>;
  if (!res.ok || body.success === false) {
    throw new Error(body.message || `Erreur ${res.status}`);
  }
  return body;
}

export async function guestLogin(): Promise<TokenPayload> {
  const res = await request<TokenPayload>("/auth/guest", { method: "POST" });
  if (!res.data) throw new Error("Réponse invalide du serveur");
  saveSession(res.data);
  return res.data;
}

export async function login(email: string, password: string): Promise<TokenPayload> {
  const res = await request<TokenPayload>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  if (!res.data) throw new Error("Réponse invalide du serveur");
  saveSession(res.data);
  return res.data;
}

export async function register(
  email: string,
  password: string,
  name: string,
): Promise<TokenPayload | null> {
  const res = await request<TokenPayload>("/auth/register", {
    method: "POST",
    body: JSON.stringify({ email, password, name }),
  });
  if (res.data) {
    saveSession(res.data);
    return res.data;
  }
  // Confirmation e-mail requise : pas de session immédiate.
  return null;
}

/** Client fetch authentifié — ajoute le Bearer token de la session courante. */
export function authHeaders(): HeadersInit {
  const session = loadSession();
  if (!session) return {};
  return { Authorization: `Bearer ${session.access_token}` };
}
