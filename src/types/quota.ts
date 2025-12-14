// src/types/quota.ts
// Type definitions for quota tracking system
// Mirrors the web app's quota type definitions

export type QuotaFeatureType = 'flashcard_generation' | 'note_improvement';

export interface QuotaFeature {
  used: number;
  limit: number | null;
  remaining: number | null;
  isUnlimited: boolean;
}

export interface QuotaPeriod {
  start: string;
  end: string;
  daysRemaining: number;
}

export interface QuotaState {
  flashcard_generation: QuotaFeature;
  note_improvement: QuotaFeature;
  period: QuotaPeriod;
}

export interface QuotaCheckResult {
  allowed: boolean;
  used: number;
  limit: number | null;
  remaining: number | null;
  message?: string;
}
