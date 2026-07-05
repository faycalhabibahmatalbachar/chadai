import { http } from "./http";

// ---- Google Agenda -------------------------------------------------------

export function getGoogleStatus(): Promise<{ connected: boolean }> {
  return http.get("/google/status");
}

export function getGoogleAuthUrl(): Promise<{ auth_url: string }> {
  return http.get("/google/auth");
}

export function disconnectGoogle(): Promise<{ connected: boolean }> {
  return http.post("/google/logout");
}

// ---- Mail (IMAP/SMTP) -----------------------------------------------------

export interface MailStatus {
  connected: boolean;
  email: string | null;
}

export function getMailStatus(): Promise<MailStatus> {
  return http.get("/mail/status");
}

export function connectMail(email: string, appPassword: string): Promise<{ connected: boolean; email: string }> {
  return http.post("/mail/connect", { email, app_password: appPassword });
}

export function disconnectMail(): Promise<{ connected: boolean }> {
  return http.post("/mail/disconnect");
}

// ---- WhatsApp (passerelle Baileys) ----------------------------------------

export type WhatsAppStatus =
  | "unconfigured"
  | "disconnected"
  | "qr"
  | "connecting"
  | "pairing"
  | "connected"
  | "error";

export interface WhatsAppState {
  status: WhatsAppStatus;
  pairingCode?: string | null;
  codeExpiresAt?: string | null;
  number?: string | null;
}

export function getWhatsAppStatus(): Promise<WhatsAppState> {
  return http.get("/whatsapp/status");
}

export function linkWhatsApp(phone: string): Promise<WhatsAppState> {
  return http.post("/whatsapp/link", { phone });
}

export function refreshWhatsAppCode(): Promise<{ pairingCode: string; codeExpiresAt: string }> {
  return http.post("/whatsapp/refresh-code");
}

export function disconnectWhatsApp(): Promise<{ status: "disconnected" }> {
  return http.post("/whatsapp/logout");
}

/** Permissions de l'IA sur le compte WhatsApp — appliquées côté backend
 * (registre d'outils) : une capacité désactivée est refusée avant exécution. */
export interface WaSettings {
  send_text: boolean;
  send_voice: boolean;
  send_image: boolean;
  send_video: boolean;
  send_document: boolean;
  send_file: boolean;
  post_status: boolean;
  read_messages: boolean;
  summaries: boolean;
  search: boolean;
  analyze: boolean;
  manage_messages: boolean;
  advanced: boolean;
  sync_contacts: boolean;
  save_contacts: boolean;
  status_audience: "all" | "contacts";
}

export function getWaSettings(): Promise<WaSettings> {
  return http.get("/whatsapp/settings");
}

export function updateWaSettings(patch: Partial<WaSettings>): Promise<WaSettings> {
  return http.put("/whatsapp/settings", patch);
}
