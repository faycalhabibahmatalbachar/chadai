"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";

export default function LoginPage() {
  const router = useRouter();
  const { loginWithPassword, loginAsGuest } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await loginWithPassword(email, password);
      router.push("/chat");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Échec de connexion");
    } finally {
      setLoading(false);
    }
  }

  async function tryGuest() {
    setLoading(true);
    setError(null);
    try {
      await loginAsGuest();
      router.push("/chat");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Échec");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-1 items-center justify-center px-6 py-16">
      <div className="w-full max-w-sm">
        <Link href="/" className="mb-8 block text-center text-2xl font-bold">
          Toumaï AI
        </Link>
        <h1 className="mb-1 text-center text-xl font-semibold">Se connecter</h1>
        <p className="mb-8 text-center text-sm text-[var(--text-secondary)]">
          Retrouvez vos conversations et préférences.
        </p>

        <form onSubmit={submit} className="space-y-4">
          <input
            type="email"
            required
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-xl border border-[var(--border)] bg-[var(--card)] px-4 py-3 text-sm outline-none focus:border-[var(--primary)]"
          />
          <input
            type="password"
            required
            placeholder="Mot de passe"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-xl border border-[var(--border)] bg-[var(--card)] px-4 py-3 text-sm outline-none focus:border-[var(--primary)]"
          />
          {error && <p className="text-sm text-[var(--error)]">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
            style={{ background: "var(--primary)" }}
          >
            {loading ? "Connexion…" : "Se connecter"}
          </button>
        </form>

        <div className="my-6 flex items-center gap-3 text-xs text-[var(--text-tertiary)]">
          <div className="h-px flex-1 bg-[var(--border)]" />
          ou
          <div className="h-px flex-1 bg-[var(--border)]" />
        </div>

        <button
          onClick={tryGuest}
          disabled={loading}
          className="w-full rounded-xl border border-[var(--border)] py-3 text-sm font-semibold transition hover:border-[var(--primary)] disabled:opacity-50"
        >
          Continuer sans compte
        </button>

        <p className="mt-6 text-center text-sm text-[var(--text-secondary)]">
          Pas encore de compte ?{" "}
          <Link href="/register" className="font-semibold" style={{ color: "var(--primary)" }}>
            Créer un compte
          </Link>
        </p>
      </div>
    </div>
  );
}
