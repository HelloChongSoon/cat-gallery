/**
 * PetChat AI - LocalStorage Utilities
 * 
 * Handles persistence of pet profiles and translation diary.
 */

import type { PetProfile, TranslationResult } from './types'

const STORAGE_KEYS = {
  PET_PROFILE: 'petchat-pet-profile',
  TRANSLATIONS: 'petchat-translations',
} as const

// Pet Profile Storage
export function savePetProfile(profile: PetProfile): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(STORAGE_KEYS.PET_PROFILE, JSON.stringify(profile))
}

export function loadPetProfile(): PetProfile | null {
  if (typeof window === 'undefined') return null
  const stored = localStorage.getItem(STORAGE_KEYS.PET_PROFILE)
  if (!stored) return null
  try {
    return JSON.parse(stored) as PetProfile
  } catch {
    return null
  }
}

export function clearPetProfile(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(STORAGE_KEYS.PET_PROFILE)
}

// Translation History Storage
export function saveTranslation(translation: TranslationResult): void {
  if (typeof window === 'undefined') return
  const existing = loadTranslations()
  const updated = [translation, ...existing]
  localStorage.setItem(STORAGE_KEYS.TRANSLATIONS, JSON.stringify(updated))
}

export function loadTranslations(): TranslationResult[] {
  if (typeof window === 'undefined') return []
  const stored = localStorage.getItem(STORAGE_KEYS.TRANSLATIONS)
  if (!stored) return []
  try {
    return JSON.parse(stored) as TranslationResult[]
  } catch {
    return []
  }
}

export function deleteTranslation(id: string): void {
  if (typeof window === 'undefined') return
  const existing = loadTranslations()
  const updated = existing.filter(t => t.id !== id)
  localStorage.setItem(STORAGE_KEYS.TRANSLATIONS, JSON.stringify(updated))
}

export function clearAllTranslations(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(STORAGE_KEYS.TRANSLATIONS)
}

// Generate unique IDs
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}
