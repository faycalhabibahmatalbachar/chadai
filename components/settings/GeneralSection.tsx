"use client";

import { useEffect, useRef, useState } from "react";
import {
  getProfile,
  getUsage,
  removeAvatar,
  updateAvatar,
  updateFullName,
  type UsageStats,
  type UserProfile,
} from "@/lib/user-api";
import { useAuth } from "@/lib/auth-context";
import { Logo } from "@/components/Logo";
import { Panel, Row } from "./Rows";

const MAX_AVATAR_BYTES = 2 * 1024 * 1024;

export function GeneralSection() {
  const { session, logout } = useAuth();
  const isGuest = Boolean(session?.is_guest);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [usage, setUsage] = useState<UsageStats | null>(null);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(true);
  const [savingName, setSavingName] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    Promise.all([getProfile(), getUsage()])
      .then(([p, u]) => {
        setProfile(p);
        setName(session?.is_guest ? "" : (p.full_name ?? ""));
        setUsage(u);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Chargement impossible"))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function saveName() {
    const trimmed = name.trim();
    if (!trimmed || trimmed === profile?.full_name) return;
    setSavingName(true);
    setError(null);
    try {
      await updateFullName(trimmed);
      setProfile((p) => (p ? { ...p, full_name: trimmed } : p));
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Échec de l'enregistrement");
    } finally {
      setSavingName(false);
    }
  }

  async function onAvatarPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (file.size > MAX_AVATAR_BYTES) {
      setError("Image trop lourde (2 Mo max).");
      return;
    }
    setUploadingAvatar(true);
    setError(null);
    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(new Error("Lecture du fichier impossible"));
        reader.readAsDataURL(file);
      });
      const res = await updateAvatar(dataUrl);
      setProfile((p) => (p ? { ...p, avatar_url: res.avatar_url } : p));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Échec de l'envoi");
    } finally {
      setUploadingAvatar(false);
    }
  }

  async function clearAvatar() {
    setUploadingAvatar(true);
    setError(null);
    try {
      await removeAvatar();
      setProfile((p) => (p ? { ...p, avatar_url: null } : p));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Échec de la suppression");
    } finally {
      setUploadingAvatar(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-4" aria-hidden="true">
        <div className="h-32 w-full animate-pulse rounded-2xl bg-[var(--card)]" />
        <div className="h-48 w-full animate-pulse rounded-2xl bg-[var(--card)]" />
      </div>
    );
  }

  return (
    <div>
      <Panel title="Profil">
        <Row label="Photo de profil" description={isGuest ? "Créez un compte pour personnaliser votre profil." : "Visible dans la barre latérale et l'accueil."}>
          <div className="flex items-center gap-3">
            <div
              className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full border border-[var(--border)]"
              style={{ background: "linear-gradient(135deg, var(--primary), var(--thinking))" }}
            >
              {profile?.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={profile.avatar_url} alt="Photo de profil" className="h-full w-full object-cover" />
              ) : (
                <Logo size={22} />
              )}
            </div>
            <button
              onClick={() => fileRef.current?.click()}
              disabled={uploadingAvatar || isGuest}
              className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-xs font-medium transition hover:border-[var(--primary)]/60 disabled:opacity-40"
            >
              {uploadingAvatar ? "Envoi…" : "Changer"}
            </button>
            {profile?.avatar_url && (
              <button
                onClick={clearAvatar}
                disabled={uploadingAvatar}
                className="rounded-lg px-2 py-1.5 text-xs text-[var(--text-tertiary)] transition hover:text-[var(--error)] disabled:opacity-40"
              >
                Retirer
              </button>
            )}
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onAvatarPick} />
          </div>
        </Row>
        <Row label="Nom affiché" description={saved ? "Enregistré." : undefined}>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={saveName}
            disabled={isGuest || savingName}
            placeholder={isGuest ? "Session invité" : "Votre nom"}
            className="w-52 rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm outline-none focus:border-[var(--primary)] disabled:opacity-50"
          />
        </Row>
        <Row label="Adresse e-mail">
          <span className="text-sm text-[var(--text-secondary)]">
            {isGuest ? "Session invité" : profile?.email ?? "—"}
          </span>
        </Row>
        <Row label="Formule">
          <span
            className="rounded-full px-2.5 py-0.5 text-xs font-medium capitalize"
            style={{
              background: "color-mix(in srgb, var(--primary) 14%, transparent)",
              color: "var(--primary-light)",
            }}
          >
            {profile?.plan ?? "free"}
          </span>
        </Row>
      </Panel>

      {usage && (
        <Panel title="Utilisation">
          <Row label="Aujourd'hui">
            <span className="text-sm text-[var(--text-secondary)]">
              {usage.requests_today.toLocaleString("fr-FR")} requêtes ·{" "}
              {usage.tokens_today.toLocaleString("fr-FR")} tokens
            </span>
          </Row>
          <Row label="Ce mois-ci">
            <span className="text-sm text-[var(--text-secondary)]">
              {usage.requests_month.toLocaleString("fr-FR")} requêtes ·{" "}
              {usage.tokens_month.toLocaleString("fr-FR")} tokens
            </span>
          </Row>
        </Panel>
      )}

      <Panel title="Compte">
        <Row
          label="Se déconnecter"
          description={isGuest ? "Termine la session invité en cours." : "Vous pourrez vous reconnecter à tout moment."}
        >
          <button
            onClick={logout}
            className="rounded-lg border border-[var(--border)] px-3.5 py-1.5 text-xs font-medium transition hover:border-[var(--error)] hover:text-[var(--error)]"
          >
            Déconnexion
          </button>
        </Row>
      </Panel>

      {error && <p className="text-sm text-[var(--error)]">{error}</p>}
    </div>
  );
}
