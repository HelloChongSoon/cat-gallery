/**
 * What Meow? - Type Definitions
 *
 * Core data models for cat profiles, context-aware meow interpretation,
 * logs, and lightweight feedback.
 */

export type CatPersonality =
  | 'vocal'
  | 'quiet'
  | 'demanding'
  | 'affectionate'
  | 'independent'

export type CatAgeGroup = 'kitten' | 'adult' | 'senior'

export interface CatProfile {
  id: string
  name: string
  personality: CatPersonality
  ageGroup: CatAgeGroup
  avatarEmoji: string
  photoUrl?: string
  healthNotes?: string
}

export interface CatRoutine {
  feedingTimes: string[]
  playTimes?: string[]
}

export type MeowSound =
  | 'short-meow'
  | 'long-meow'
  | 'chirp'
  | 'yowl'
  | 'hiss'
  | 'purr'
  | 'chattering'
  | 'silent-meow'

export type LocationContext =
  | 'kitchen'
  | 'bedroom'
  | 'living_room'
  | 'door'
  | 'litter_box'
  | 'window'
  | 'other'

export type SituationContext =
  | 'before_meal'
  | 'after_meal'
  | 'playtime'
  | 'arrival'
  | 'bedtime'
  | 'alone'
  | 'petting'
  | 'other'

export interface MeowContext {
  location: LocationContext
  situation: SituationContext
  situations: SituationContext[]
  notes?: string
}

export type MoodCategory =
  | 'content'
  | 'hungry'
  | 'playful'
  | 'attention'
  | 'stressed'
  | 'territorial'

export type LikelyNeed =
  | 'food'
  | 'water'
  | 'attention'
  | 'play'
  | 'door_access'
  | 'litter_box'
  | 'stress'
  | 'discomfort'
  | 'routine_request'
  | 'greeting'
  | 'boredom'
  | 'unknown'

export type Urgency = 'low' | 'medium' | 'high'

export interface MeowSoundDetails {
  soundType: MeowSound
  perceivedIntensity: 'low' | 'medium' | 'high'
}

export interface CareInterpretation {
  headline: string
  playfulTranslation: string
  likelyNeed: LikelyNeed
  confidence: number
  urgency: Urgency
  mood: MoodCategory
  reasoningSummary: string
  suggestedAction: string
  possibleTrigger?: string
}

export type FeedbackAccuracy = 'spot-on' | 'close' | 'not-quite'

export type ActionThatHelped =
  | 'food'
  | 'water'
  | 'attention'
  | 'play'
  | 'opened_door'
  | 'cleaned_litter'
  | 'comfort'
  | 'nothing'

export interface MeowLogEntry {
  id: string
  catId: string
  createdAt: string
  timestamp?: string
  sound: MeowSoundDetails
  context: MeowContext
  interpretation: CareInterpretation
  feedback: {
    accuracy: FeedbackAccuracy
    actionThatHelped: ActionThatHelped | null
    timestamp: string
  } | null
}

export type RecordingState =
  | 'idle'
  | 'listening'
  | 'context-tagging'
  | 'interpreting'
  | 'result'
  | 'feedback'
