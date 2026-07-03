import { http } from "./http";

export interface UserProfile {
  id: string;
  email?: string;
  full_name?: string | null;
  avatar_url?: string | null;
  plan?: string;
  language?: string;
  created_at?: string;
}

export interface UsageStats {
  tokens_today: number;
  tokens_month: number;
  requests_today: number;
  requests_month: number;
}

export function getProfile(): Promise<UserProfile> {
  return http.get<UserProfile>("/user/profile");
}

export function getUsage(): Promise<UsageStats> {
  return http.get<UsageStats>("/user/usage");
}

export function updateFullName(fullName: string): Promise<{ full_name: string }> {
  return http.put<{ full_name: string }>("/user/profile", { full_name: fullName });
}

export function updateAvatar(dataUrl: string): Promise<{ avatar_url: string }> {
  return http.put<{ avatar_url: string }>("/user/profile", { avatar_data: dataUrl });
}

export function removeAvatar(): Promise<{ avatar_url: null }> {
  return http.put<{ avatar_url: null }>("/user/profile", { avatar_url: null });
}
