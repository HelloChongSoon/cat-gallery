/**
 * What Meow? - LocalStorage Utilities
 * 
 * Handles persistence of cat profiles, meow logs, routines, and settings.
 */

import type { 
  CatProfile, 
  CatRoutine, 
  MeowLogEntry, 
  FeedbackAccuracy,
  ActionThatHelped 
} from './types'

const STORAGE_KEYS = {
  CAT_PROFILE: 'whatmeow-cat-profile',
  CAT_ROUTINE: 'whatmeow-cat-routine',
  MEOW_LOGS: 'whatmeow-meow-logs',
  SETTINGS: 'whatmeow-settings',
} as const

// Safe localStorage access for SSR
function getStorage(): Storage | null {
  if (typeof window === 'undefined') return null
  try {
    const test = '__storage_test__'
    window.localStorage.setItem(test, test)
    window.localStorage.removeItem(test)
    return window.localStorage
  } catch {
    return null
  }
}

// Generate unique IDs
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`
}

// ============================================
// Cat Profile Storage
// ============================================

export function saveCatProfile(profile: CatProfile): void {
  const storage = getStorage()
  if (!storage) return
  try {
    storage.setItem(STORAGE_KEYS.CAT_PROFILE, JSON.stringify(profile))
  } catch (err) {
    console.error('Failed to save cat profile:', err)
  }
}

export function loadCatProfile(): CatProfile | null {
  const storage = getStorage()
  if (!storage) return null
  try {
    const stored = storage.getItem(STORAGE_KEYS.CAT_PROFILE)
    if (!stored) return null
    const parsed = JSON.parse(stored)
    if (parsed && typeof parsed.id === 'string' && typeof parsed.name === 'string') {
      return parsed as CatProfile
    }
    return null
  } catch {
    return null
  }
}

export function clearCatProfile(): void {
  const storage = getStorage()
  if (!storage) return
  try {
    storage.removeItem(STORAGE_KEYS.CAT_PROFILE)
  } catch {
    // Ignore errors
  }
}

// ============================================
// Cat Routine Storage
// ============================================

export function saveCatRoutine(routine: CatRoutine): void {
  const storage = getStorage()
  if (!storage) return
  try {
    storage.setItem(STORAGE_KEYS.CAT_ROUTINE, JSON.stringify(routine))
  } catch (err) {
    console.error('Failed to save cat routine:', err)
  }
}

export function loadCatRoutine(): CatRoutine | null {
  const storage = getStorage()
  if (!storage) return null
  try {
    const stored = storage.getItem(STORAGE_KEYS.CAT_ROUTINE)
    if (!stored) return null
    const parsed = JSON.parse(stored)
    if (parsed && Array.isArray(parsed.feedingTimes)) {
      return parsed as CatRoutine
    }
    return null
  } catch {
    return null
  }
}

export function clearCatRoutine(): void {
  const storage = getStorage()
  if (!storage) return
  try {
    storage.removeItem(STORAGE_KEYS.CAT_ROUTINE)
  } catch {
    // Ignore errors
  }
}

// ============================================
// Meow Log Storage
// ============================================

export function saveMeowLog(entry: MeowLogEntry): void {
  const storage = getStorage()
  if (!storage) return
  try {
    const existing = loadMeowLogs()
    // Limit to 500 entries to prevent storage overflow
    const updated = [entry, ...existing].slice(0, 500)
    storage.setItem(STORAGE_KEYS.MEOW_LOGS, JSON.stringify(updated))
  } catch (err) {
    console.error('Failed to save meow log:', err)
  }
}

export function loadMeowLogs(): MeowLogEntry[] {
  const storage = getStorage()
  if (!storage) return []
  try {
    const stored = storage.getItem(STORAGE_KEYS.MEOW_LOGS)
    if (!stored) return []
    const parsed = JSON.parse(stored)
    if (Array.isArray(parsed)) {
      return parsed as MeowLogEntry[]
    }
    return []
  } catch {
    return []
  }
}

export function updateMeowLogFeedback(
  id: string, 
  feedback: { 
    accuracy: FeedbackAccuracy
    actionThatHelped: ActionThatHelped | null 
  }
): void {
  const storage = getStorage()
  if (!storage) return
  try {
    const logs = loadMeowLogs()
    const updated = logs.map(log => {
      if (log.id === id) {
        return {
          ...log,
          feedback: {
            accuracy: feedback.accuracy,
            actionThatHelped: feedback.actionThatHelped,
            timestamp: new Date().toISOString(),
          }
        }
      }
      return log
    })
    storage.setItem(STORAGE_KEYS.MEOW_LOGS, JSON.stringify(updated))
  } catch (err) {
    console.error('Failed to update meow log feedback:', err)
  }
}

export function deleteMeowLog(id: string): void {
  const storage = getStorage()
  if (!storage) return
  try {
    const existing = loadMeowLogs()
    const updated = existing.filter(log => log.id !== id)
    storage.setItem(STORAGE_KEYS.MEOW_LOGS, JSON.stringify(updated))
  } catch {
    // Ignore errors
  }
}

export function clearAllMeowLogs(): void {
  const storage = getStorage()
  if (!storage) return
  try {
    storage.removeItem(STORAGE_KEYS.MEOW_LOGS)
  } catch {
    // Ignore errors
  }
}

// ============================================
// Settings Storage
// ============================================

export interface AppSettings {
  interpretationStyle?: 'scientific' | 'playful' | 'detailed'
  notificationsEnabled?: boolean
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

// ============================================
// Helper: Get logs for a specific time range
// ============================================

export function getMeowLogsForRange(startDate: Date, endDate: Date): MeowLogEntry[] {
  const logs = loadMeowLogs()
  return logs.filter(log => {
    const logTime = new Date(log.timestamp || log.createdAt).getTime()
    return logTime >= startDate.getTime() && logTime <= endDate.getTime()
  })
}

// ============================================
// Helper: Get recent logs count by mood
// ============================================

export function getRecentMoodCounts(days: number = 7): Record<string, number> {
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)
  const logs = getMeowLogsForRange(startDate, new Date())
  
  const counts: Record<string, number> = {}
  logs.forEach(log => {
    const mood = log.interpretation.mood
    counts[mood] = (counts[mood] || 0) + 1
  })
  
  return counts
}
