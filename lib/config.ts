// Backend Toumaï AI (Northflank) — même API que l'app mobile.
export const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE ??
  "https://p01--chadgpt-backend--r4r4q8bf8vw8.code.run/api/v1";

export const SITE_NAME = "Toumaï AI";
export const SITE_TAGLINE = "Votre assistant IA, toujours là.";

// Optionnel — si absent, le bouton "Continuer avec Google" ne s'affiche pas
// du tout plutôt que d'afficher un bouton non fonctionnel.
export const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? "";
