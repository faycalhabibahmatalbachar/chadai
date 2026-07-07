"use client";

import { API_BASE } from "./config";
import { authHeaders } from "./api";

export type TriggerType = "schedule" | "keyword_wa" | "manual";
export type ActionType = "assistant_task" | "send_whatsapp" | "send_email";

export interface Automation {
  id: string;
  name: string;
  trigger_type: TriggerType;
  trigger_config: Record<string, unknown>;
  action_type: ActionType;
  action_config: Record<string, unknown>;
  enabled: boolean;
  last_run_at: string | null;
  next_run_at: string | null;
  created_at: string;
}

export interface AutomationRun {
  status: string;
  summary: string | null;
  created_at: string;
}

async function unwrap<T>(res: Response): Promise<T> {
  const body = await res.json().catch(() => ({}));
  if (!res.ok || body.success === false) throw new Error(body.message || `Erreur ${res.status}`);
  return body.data as T;
}

export async function listAutomations(): Promise<Automation[]> {
  const res = await fetch(`${API_BASE}/automations`, { headers: { ...authHeaders() } });
  return (await unwrap<{ automations: Automation[] }>(res)).automations;
}

export async function createAutomation(payload: {
  name: string;
  trigger_type: TriggerType;
  trigger_config: Record<string, unknown>;
  action_type: ActionType;
  action_config: Record<string, unknown>;
}): Promise<Automation> {
  const res = await fetch(`${API_BASE}/automations`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(payload),
  });
  return unwrap<Automation>(res);
}

export async function updateAutomation(
  id: string,
  patch: Partial<Pick<Automation, "name" | "enabled" | "trigger_config" | "action_config">>,
): Promise<void> {
  await fetch(`${API_BASE}/automations/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(patch),
  });
}

export async function deleteAutomation(id: string): Promise<void> {
  await fetch(`${API_BASE}/automations/${id}`, { method: "DELETE", headers: { ...authHeaders() } });
}

export async function runAutomation(id: string): Promise<string> {
  const res = await fetch(`${API_BASE}/automations/${id}/run`, {
    method: "POST",
    headers: { ...authHeaders() },
  });
  return (await unwrap<{ summary: string }>(res)).summary;
}

export async function automationRuns(id: string): Promise<AutomationRun[]> {
  const res = await fetch(`${API_BASE}/automations/${id}/runs`, { headers: { ...authHeaders() } });
  return (await unwrap<{ runs: AutomationRun[] }>(res)).runs;
}
