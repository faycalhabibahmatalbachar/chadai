import { clearSession, loadSession } from "./api";

let handling = false;

/** Le token a expiré ou est invalide (401) et le refresh a échoué.
 *
 * - Session invité : on efface et on recharge — le chat relancera une
 *   connexion invitée automatique, rien à perdre.
 * - Compte réel : on N'EFFACE PAS silencieusement vers un invité (c'était le
 *   « je ne suis plus reconnu » signalé) — on envoie vers /login avec un
 *   message d'expiration pour que l'utilisateur se reconnecte à SON compte.
 */
export function handleUnauthorized(): void {
  if (handling || typeof window === "undefined") return;
  handling = true;
  const wasRealAccount = !(loadSession()?.is_guest ?? true);
  clearSession();
  if (wasRealAccount) {
    window.location.href = "/login?expired=1";
  } else {
    window.location.reload();
  }
}
