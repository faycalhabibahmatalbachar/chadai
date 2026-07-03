"use client";

import { useEffect, useRef, useState } from "react";
import {
  connectMail,
  disconnectGoogle,
  disconnectMail,
  disconnectWhatsApp,
  getGoogleAuthUrl,
  getGoogleStatus,
  getMailStatus,
  getWhatsAppStatus,
  linkWhatsApp,
  refreshWhatsAppCode,
  type MailStatus,
  type WhatsAppState,
} from "@/lib/connectors-api";
import { ConnectorCard, type ConnectorStatus } from "./ConnectorCard";

export function ConnectorsTab() {
  return (
    <div className="max-w-lg space-y-4">
      <GoogleConnector />
      <MailConnector />
      <WhatsAppConnector />
      <ConnectorCard
        icon="🌤️"
        name="Météo"
        description="Toujours actif — Toumaï AI consulte la météo en direct quand vous le demandez, sans configuration."
        status="connected"
      />
    </div>
  );
}

function GoogleConnector() {
  const [connected, setConnected] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  function refresh() {
    return getGoogleStatus()
      .then((s) => setConnected(s.connected))
      .catch(() => setConnected(false));
  }

  useEffect(() => {
    refresh();
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  async function connect() {
    setError(null);
    setBusy(true);
    try {
      const { auth_url } = await getGoogleAuthUrl();
      window.open(auth_url, "_blank", "width=520,height=680");
      // Poll pendant que la fenêtre de consentement est ouverte.
      let attempts = 0;
      pollRef.current = setInterval(async () => {
        attempts += 1;
        const s = await getGoogleStatus().catch(() => null);
        if (s?.connected) {
          setConnected(true);
          setBusy(false);
          if (pollRef.current) clearInterval(pollRef.current);
        } else if (attempts > 40) {
          setBusy(false);
          if (pollRef.current) clearInterval(pollRef.current);
        }
      }, 3000);
    } catch (err) {
      setBusy(false);
      setError(err instanceof Error ? err.message : "Échec de la connexion");
    }
  }

  async function disconnect() {
    setBusy(true);
    setError(null);
    try {
      await disconnectGoogle();
      setConnected(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Échec de la déconnexion");
    } finally {
      setBusy(false);
    }
  }

  const status: ConnectorStatus = connected === null ? "loading" : connected ? "connected" : "disconnected";

  return (
    <ConnectorCard
      icon="📅"
      name="Google Agenda"
      description="Permet à Toumaï AI de lire et créer des événements dans votre agenda."
      status={status}
    >
      <div className="flex flex-col gap-1.5">
        {connected ? (
          <button
            onClick={disconnect}
            disabled={busy}
            className="w-fit rounded-lg border border-[var(--border)] px-3 py-1.5 text-xs font-medium transition hover:border-[var(--error)] hover:text-[var(--error)] disabled:opacity-40"
          >
            Déconnecter
          </button>
        ) : (
          <button
            onClick={connect}
            disabled={busy || connected === null}
            className="w-fit rounded-lg px-3 py-1.5 text-xs font-medium text-white transition hover:opacity-90 disabled:opacity-40"
            style={{ background: "var(--primary)" }}
          >
            {busy ? "En attente d'autorisation…" : "Connecter"}
          </button>
        )}
        {error && <p className="text-xs text-[var(--error)]">{error}</p>}
      </div>
    </ConnectorCard>
  );
}

function MailConnector() {
  const [status, setStatus] = useState<MailStatus | null>(null);
  const [form, setForm] = useState(false);
  const [email, setEmail] = useState("");
  const [pwd, setPwd] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getMailStatus()
      .then(setStatus)
      .catch(() => setStatus({ connected: false, email: null }));
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await connectMail(email, pwd);
      setStatus({ connected: res.connected, email: res.email });
      setForm(false);
      setPwd("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Connexion échouée");
    } finally {
      setBusy(false);
    }
  }

  async function disconnect() {
    setBusy(true);
    setError(null);
    try {
      await disconnectMail();
      setStatus({ connected: false, email: null });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Échec de la déconnexion");
    } finally {
      setBusy(false);
    }
  }

  const cStatus: ConnectorStatus = status === null ? "loading" : status.connected ? "connected" : "disconnected";

  return (
    <ConnectorCard
      icon="📧"
      name="Mail"
      description={
        status?.connected && status.email
          ? `Connecté à ${status.email}`
          : "Lisez et envoyez des e-mails via Toumaï AI (Gmail, Outlook…)."
      }
      status={cStatus}
    >
      {status?.connected ? (
        <button
          onClick={disconnect}
          disabled={busy}
          className="w-fit rounded-lg border border-[var(--border)] px-3 py-1.5 text-xs font-medium transition hover:border-[var(--error)] hover:text-[var(--error)] disabled:opacity-40"
        >
          Déconnecter
        </button>
      ) : form ? (
        <form onSubmit={submit} className="flex flex-col gap-2">
          <input
            type="email"
            required
            placeholder="vous@gmail.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-xs outline-none focus:border-[var(--primary)]"
          />
          <input
            type="password"
            required
            placeholder="Mot de passe d'application"
            value={pwd}
            onChange={(e) => setPwd(e.target.value)}
            className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-xs outline-none focus:border-[var(--primary)]"
          />
          <p className="text-[11px] text-[var(--text-tertiary)]">
            Utilisez un « mot de passe d'application », pas votre mot de passe principal
            (Gmail : myaccount.google.com/apppasswords).
          </p>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={busy}
              className="rounded-lg px-3 py-1.5 text-xs font-medium text-white transition hover:opacity-90 disabled:opacity-40"
              style={{ background: "var(--primary)" }}
            >
              {busy ? "Vérification…" : "Connecter"}
            </button>
            <button
              type="button"
              onClick={() => setForm(false)}
              className="rounded-lg px-3 py-1.5 text-xs text-[var(--text-secondary)] transition hover:text-[var(--text-primary)]"
            >
              Annuler
            </button>
          </div>
          {error && <p className="text-xs text-[var(--error)]">{error}</p>}
        </form>
      ) : (
        <button
          onClick={() => setForm(true)}
          className="w-fit rounded-lg px-3 py-1.5 text-xs font-medium text-white transition hover:opacity-90"
          style={{ background: "var(--primary)" }}
        >
          Connecter
        </button>
      )}
    </ConnectorCard>
  );
}

function WhatsAppConnector() {
  const [state, setState] = useState<WhatsAppState | null>(null);
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  function stopPolling() {
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = null;
  }

  function startPolling() {
    stopPolling();
    pollRef.current = setInterval(async () => {
      const s = await getWhatsAppStatus().catch(() => null);
      if (!s) return;
      setState(s);
      if (s.status === "connected" || s.status === "disconnected" || s.status === "error") {
        stopPolling();
      }
    }, 3000);
  }

  useEffect(() => {
    getWhatsAppStatus()
      .then((s) => {
        setState(s);
        if (s.status === "qr" || s.status === "pairing" || s.status === "connecting") startPolling();
      })
      .catch(() => setState({ status: "disconnected" }));
    return stopPolling;
  }, []);

  async function link() {
    if (!phone.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const s = await linkWhatsApp(phone.trim());
      setState(s);
      startPolling();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Échec de la liaison");
    } finally {
      setBusy(false);
    }
  }

  async function refreshCode() {
    setBusy(true);
    setError(null);
    try {
      const res = await refreshWhatsAppCode();
      setState((prev) => (prev ? { ...prev, pairingCode: res.pairingCode, codeExpiresAt: res.codeExpiresAt } : prev));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Échec du rafraîchissement");
    } finally {
      setBusy(false);
    }
  }

  async function disconnect() {
    setBusy(true);
    setError(null);
    try {
      await disconnectWhatsApp();
      setState({ status: "disconnected" });
      stopPolling();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Échec de la déconnexion");
    } finally {
      setBusy(false);
    }
  }

  if (state?.status === "unconfigured") {
    return (
      <ConnectorCard
        icon="💬"
        name="WhatsApp"
        description="Auto-pilote WhatsApp — pas encore disponible sur cette instance."
        status="unavailable"
      />
    );
  }

  const cStatus: ConnectorStatus =
    state === null
      ? "loading"
      : state.status === "connected"
        ? "connected"
        : state.status === "qr" || state.status === "pairing" || state.status === "connecting"
          ? "pending"
          : "disconnected";

  const description =
    state?.status === "connected" && state.number
      ? `Connecté — ${state.number}`
      : "Laissez Toumaï AI répondre automatiquement sur WhatsApp (auto-pilote).";

  return (
    <ConnectorCard icon="💬" name="WhatsApp" description={description} status={cStatus}>
      {state?.status === "connected" ? (
        <button
          onClick={disconnect}
          disabled={busy}
          className="w-fit rounded-lg border border-[var(--border)] px-3 py-1.5 text-xs font-medium transition hover:border-[var(--error)] hover:text-[var(--error)] disabled:opacity-40"
        >
          Déconnecter
        </button>
      ) : state?.pairingCode ? (
        <div className="flex flex-col gap-1.5">
          <p className="text-xs text-[var(--text-secondary)]">
            Dans WhatsApp : Appareils connectés → Lier avec le numéro de téléphone, puis saisissez :
          </p>
          <p
            className="w-fit rounded-lg px-3 py-1.5 font-mono text-lg font-semibold tracking-widest"
            style={{ background: "var(--surface)" }}
          >
            {state.pairingCode}
          </p>
          <button
            onClick={refreshCode}
            disabled={busy}
            className="w-fit text-xs text-[var(--text-tertiary)] underline transition hover:text-[var(--text-primary)] disabled:opacity-40"
          >
            Code expiré ? Regénérer
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <input
            type="tel"
            placeholder="+235 XX XX XX XX"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full max-w-[220px] rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-xs outline-none focus:border-[var(--primary)]"
          />
          <button
            onClick={link}
            disabled={busy || !phone.trim()}
            className="w-fit rounded-lg px-3 py-1.5 text-xs font-medium text-white transition hover:opacity-90 disabled:opacity-40"
            style={{ background: "var(--primary)" }}
          >
            {busy ? "Liaison…" : "Obtenir un code"}
          </button>
        </div>
      )}
      {error && <p className="mt-1.5 text-xs text-[var(--error)]">{error}</p>}
    </ConnectorCard>
  );
}
