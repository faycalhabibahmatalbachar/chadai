"use client";

/**
 * Analytics respectueux de la vie privée (Plausible — sans cookies de suivi
 * publicitaire), chargé uniquement si l'utilisateur a consenti ET qu'un
 * domaine est configuré (NEXT_PUBLIC_PLAUSIBLE_DOMAIN). Sans ces deux
 * conditions, rien n'est chargé — pas de tracking fantôme.
 */

const CONSENT_KEY = "toumai_cookie_consent"; // "accepted" | "declined"
const PLAUSIBLE_DOMAIN = process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN || "";

export type ConsentChoice = "accepted" | "declined";

export function getConsentChoice(): ConsentChoice | null {
  if (typeof window === "undefined") return null;
  const v = window.localStorage.getItem(CONSENT_KEY);
  return v === "accepted" || v === "declined" ? v : null;
}

export function setConsentChoice(choice: ConsentChoice): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(CONSENT_KEY, choice);
  if (choice === "accepted") loadAnalyticsIfConfigured();
}

/** N'a d'effet que si un domaine Plausible est réellement configuré côté
 * build — sinon c'est un no-op silencieux (pas de faux script). */
export function loadAnalyticsIfConfigured(): void {
  if (typeof window === "undefined" || !PLAUSIBLE_DOMAIN) return;
  if (document.querySelector('script[data-domain="' + PLAUSIBLE_DOMAIN + '"]')) return;
  const script = document.createElement("script");
  script.defer = true;
  script.dataset.domain = PLAUSIBLE_DOMAIN;
  script.src = "https://plausible.io/js/script.js";
  document.head.appendChild(script);
}

/** Au chargement de l'app : si l'utilisateur a déjà accepté lors d'une
 * visite précédente, recharge l'analytics sans redemander. */
export function initAnalyticsFromStoredConsent(): void {
  if (getConsentChoice() === "accepted") loadAnalyticsIfConfigured();
}
