/**
 * PetChat AI - Type Definitions
 * 
 * Core data models for pet profiles and translation results.
 * 
 * AGORA SETUP:
 * To use real voice recording, set these environment variables:
 * - NEXT_PUBLIC_AGORA_APP_ID: Your Agora App ID from console.agora.io
 * - NEXT_PUBLIC_AGORA_CHANNEL_NAME: Any channel name (e.g., "petchat-demo")
 * - NEXT_PUBLIC_AGORA_TOKEN: Generate from Agora console or use temp token
 * 
 * Without these, the app runs in Demo Mode with simulated recording.
 */

export type PetType = 'cat' | 'dog' | 'human' | 'mystery'

export type PetPersonality = 'dramatic' | 'royal' | 'chaotic' | 'sweet' | 'judgy'

export type Severity = 'low' | 'medium' | 'high' | 'royal emergency'

export interface PetProfile {
  id: string
  name: string
  type: PetType
  personality: PetPersonality
  avatarEmoji: string
}

export interface TranslationResult {
  id: string
  petId: string
  createdAt: string
  originalSoundType: PetType
  translatedMessage: string
  mood: string
  intent: string
  confidence: number
  severity: Severity
  suggestedAction: string
}

export type RecordingState = 
  | 'idle' 
  | 'permission-needed' 
  | 'listening' 
  | 'translating' 
  | 'result' 
  | 'error' 
  | 'demo-mode'

export interface AgoraConfig {
  appId: string | undefined
  channelName: string | undefined
  token: string | undefined
}
