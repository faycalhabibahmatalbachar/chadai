"use client";

import { API_BASE } from "./config";
import { authHeaders } from "./api";

export interface PublishResult {
  slug: string;
  path: string;
}

export interface PublicSite {
  slug: string;
  title: string;
  html: string;
  views: number;
  created_at: string;
}

async function unwrap<T>(res: Response): Promise<T> {
  const body = await res.json().catch(() => ({}));
  if (!res.ok || body.success === false) {
    throw new Error(body.message || `Erreur ${res.status}`);
  }
  return body.data as T;
}

/** Publie un artefact HTML : renvoie le slug + le chemin public. */
export async function publishSite(
  html: string,
  title: string,
  slug?: string,
): Promise<PublishResult> {
  const res = await fetch(`${API_BASE}/sites/publish`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({ html, title, slug }),
  });
  return unwrap<PublishResult>(res);
}

/** Contenu public d'un site (aucune authentification requise). */
export async function getPublicSite(slug: string): Promise<PublicSite> {
  const res = await fetch(`${API_BASE}/sites/${encodeURIComponent(slug)}`);
  return unwrap<PublicSite>(res);
}

export interface MySite {
  slug: string;
  title: string;
  views: number;
  updated_at: string;
}

export async function listMySites(): Promise<MySite[]> {
  const res = await fetch(`${API_BASE}/sites/mine`, { headers: { ...authHeaders() } });
  const data = await unwrap<{ sites: MySite[] }>(res);
  return data.sites;
}

export async function unpublishSite(slug: string): Promise<void> {
  await fetch(`${API_BASE}/sites/${encodeURIComponent(slug)}`, {
    method: "DELETE",
    headers: { ...authHeaders() },
  });
}
