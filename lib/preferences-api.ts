import { http } from "./http";

export interface Preferences {
  user_id?: string;
  ai_name: string;
  ai_tone: "friendly" | "professional" | "casual" | "concise";
  ai_language: string;
  ai_persona: string;
  theme: "dark" | "light" | "system";
  accent_color: string;
  font_size: "small" | "medium" | "large";
  notif_wa: boolean;
  notif_calendar: boolean;
  notif_suggestions: boolean;
  timezone: string;
}

export type PreferencesUpdate = Partial<
  Omit<Preferences, "user_id" | "ai_tone" | "theme" | "font_size">
> & {
  ai_tone?: Preferences["ai_tone"];
  theme?: Preferences["theme"];
  font_size?: Preferences["font_size"];
};

export function getPreferences(): Promise<Preferences> {
  return http.get<Preferences>("/preferences");
}

export function updatePreferences(patch: PreferencesUpdate): Promise<Partial<Preferences>> {
  return http.put<Partial<Preferences>>("/preferences", patch);
}
