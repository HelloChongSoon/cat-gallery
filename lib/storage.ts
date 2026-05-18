/**
 * PetChat AI - LocalStorage Utilities
 * 
 * Handles persistence of pet profiles and translation diary with hydration safety.
 */

import type { PetProfile, TranslationResult } from './types'

const STORAGE_KEYS = {
  PET_PROFILE: 'petchat-pet-profile',
  TRANSLATIONS: 'petchat-translations',
  SETTINGS: 'petchat-settings',
} as const

// Safe localStorage access for SSR
function getStorage(): Storage | null {
  if (typeof window === 'undefined') return null
  try {
    // Test if localStorage is available
    const test = '__storage_test__'
    window.localStorage.setItem(test, test)
    window.localStorage.removeItem(test)
    return window.localStorage
  } catch {
    return null
  }
}

// Pet Profile Storage
export function savePetProfile(profile: PetProfile): void {
  const storage = getStorage()
  if (!storage) return
  try {
    storage.setItem(STORAGE_KEYS.PET_PROFILE, JSON.stringify(profile))
  } catch (err) {
    console.error('[v0] Failed to save pet profile:', err)
  }
}

export function loadPetProfile(): PetProfile | null {
  const storage = getStorage()
  if (!storage) return null
  try {
    const stored = storage.getItem(STORAGE_KEYS.PET_PROFILE)
    if (!stored) return null
    const parsed = JSON.parse(stored)
    // Validate the parsed data has required fields
    if (parsed && typeof parsed.id === 'string' && typeof parsed.name === 'string') {
      return parsed as PetProfile
    }
    return null
  } catch {
    return null
  }
}

export function clearPetProfile(): void {
  const storage = getStorage()
  if (!storage) return
  try {
    storage.removeItem(STORAGE_KEYS.PET_PROFILE)
  } catch {
    // Ignore errors
  }
}

// Translation History Storage
export function saveTranslation(translation: TranslationResult): void {
  const storage = getStorage()
  if (!storage) return
  try {
    const existing = loadTranslations()
    // Limit to 100 translations to prevent storage overflow
    const updated = [translation, ...existing].slice(0, 100)
    storage.setItem(STORAGE_KEYS.TRANSLATIONS, JSON.stringify(updated))
  } catch (err) {
    console.error('[v0] Failed to save translation:', err)
  }
}

export function loadTranslations(): TranslationResult[] {
  const storage = getStorage()
  if (!storage) return []
  try {
    const stored = storage.getItem(STORAGE_KEYS.TRANSLATIONS)
    if (!stored) return []
    const parsed = JSON.parse(stored)
    // Validate it's an array
    if (Array.isArray(parsed)) {
      return parsed as TranslationResult[]
    }
    return []
  } catch {
    return []
  }
}

export function deleteTranslation(id: string): void {
  const storage = getStorage()
  if (!storage) return
  try {
    const existing = loadTranslations()
    const updated = existing.filter(t => t.id !== id)
    storage.setItem(STORAGE_KEYS.TRANSLATIONS, JSON.stringify(updated))
  } catch {
    // Ignore errors
  }
}

export function clearAllTranslations(): void {
  const storage = getStorage()
  if (!storage) return
  try {
    storage.removeItem(STORAGE_KEYS.TRANSLATIONS)
  } catch {
    // Ignore errors
  }
}

// Settings Storage
export interface AppSettings {
  translationStyle?: 'dramatic' | 'sarcastic' | 'sweet' | 'philosophical'
  soundEffects?: boolean
}

export function saveSettings(settings: AppSettings): void {
  const storage = getStorage()
  if (!storage) return
  try {
    storage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings))
  } catch {
    // Ignore errors
  }
}

export function loadSettings(): AppSettings {
  const storage = getStorage()
  if (!storage) return {}
  try {
    const stored = storage.getItem(STORAGE_KEYS.SETTINGS)
    if (!stored) return {}
    return JSON.parse(stored) as AppSettings
  } catch {
    return {}
  }
}

// Generate unique IDs
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`
}
