"use client";

import { useEffect } from "react";
import { initAnalyticsFromStoredConsent } from "@/lib/analytics";

/** Recharge l'analytics au démarrage si l'utilisateur avait déjà consenti
 * lors d'une visite précédente — évite de redemander à chaque page. */
export function AnalyticsInit() {
  useEffect(() => {
    initAnalyticsFromStoredConsent();
  }, []);
  return null;
}
