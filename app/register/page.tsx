"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";

export default function RegisterPage() {
  const router = useRouter();
  const { registerAccount } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    if (password.length < 8) {
      setError("Choisissez un mot de passe d'au moins 8 caractères.");
      return;
    }
    setLoading(true);
    try {
      const loggedIn = await registerAccount(email, password, name);
      if (loggedIn) {
        router.push("/chat");
      } else {
        setInfo("Compte créé — confirmez votre e-mail avant de vous connecter.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Échec de l'inscription");
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
        <h1 className="mb-1 text-center text-xl font-semibold">Créer un compte</h1>
        <p className="mb-8 text-center text-sm text-[var(--text-secondary)]">
          Rejoignez Toumaï AI en quelques secondes.
        </p>

        <form onSubmit={submit} className="space-y-4">
          <input
            type="text"
            required
            placeholder="Nom"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-xl border border-[var(--border)] bg-[var(--card)] px-4 py-3 text-sm outline-none focus:border-[var(--primary)]"
          />
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
            placeholder="Mot de passe (8+ caractères)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-xl border border-[var(--border)] bg-[var(--card)] px-4 py-3 text-sm outline-none focus:border-[var(--primary)]"
          />
          {error && <p className="text-sm text-[var(--error)]">{error}</p>}
          {info && <p className="text-sm text-[var(--success)]">{info}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
            style={{ background: "var(--primary)" }}
          >
            {loading ? "Création…" : "Créer mon compte"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-[var(--text-secondary)]">
          Déjà un compte ?{" "}
          <Link href="/login" className="font-semibold" style={{ color: "var(--primary)" }}>
            Se connecter
          </Link>
        </p>
      </div>
    </div>
  );
}
