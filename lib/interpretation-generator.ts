import type {
  CareInterpretation,
  CatProfile,
  CatRoutine,
  MeowContext,
  MeowLogEntry,
  MeowSoundDetails,
  MoodCategory,
  LikelyNeed,
  Urgency,
} from './types'

const soundDefaults: Record<MeowSoundDetails['soundType'], {
  mood: MoodCategory
  need: LikelyNeed
  urgency: Urgency
  translation: string
  action: string
}> = {
  'short-meow': {
    mood: 'attention',
    need: 'attention',
    urgency: 'low',
    translation: 'Excuse me, I require a brief audience.',
    action: 'Offer attention for a minute and see if the meow settles.',
  },
  'long-meow': {
    mood: 'hungry',
    need: 'routine_request',
    urgency: 'medium',
    translation: 'This schedule has drifted from my expectations.',
    action: 'Check food, water, and the usual routine cues.',
  },
  chirp: {
    mood: 'playful',
    need: 'play',
    urgency: 'low',
    translation: 'I have discovered something fascinating. Attend immediately.',
    action: 'Try a short play session or inspect what caught their attention.',
  },
  yowl: {
    mood: 'stressed',
    need: 'discomfort',
    urgency: 'high',
    translation: 'Something is wrong and I would like management involved.',
    action: 'Check for pain, blocked access, stressors, or unusual behavior.',
  },
  hiss: {
    mood: 'territorial',
    need: 'stress',
    urgency: 'high',
    translation: 'The boundary has been crossed. Please restore order.',
    action: 'Give space and remove the trigger if it is safe to do so.',
  },
  purr: {
    mood: 'content',
    need: 'attention',
    urgency: 'low',
    translation: 'This arrangement is acceptable. Continue.',
    action: 'Keep doing what is working and note the context.',
  },
  chattering: {
    mood: 'territorial',
    need: 'play',
    urgency: 'low',
    translation: 'Tiny prey calculations are happening in my head.',
    action: 'Offer a toy or window-safe enrichment.',
  },
  'silent-meow': {
    mood: 'attention',
    need: 'attention',
    urgency: 'low',
    translation: 'I am being delicate, but the request still stands.',
    action: 'Offer gentle attention or check whether they want access somewhere.',
  },
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function getRoutineHint(routine: CatRoutine, context: MeowContext) {
  if (context.situation === 'before_meal' || context.location === 'kitchen') {
    return 'This lines up with food or routine-seeking behavior.'
  }

  if (routine.playTimes?.length && context.situation === 'playtime') {
    return 'The context matches a usual play window.'
  }

  return 'The context is more useful than the sound alone, so treat this as a best guess.'
}

export function generateCareInterpretation(
  profile: CatProfile,
  routine: CatRoutine,
  sound: MeowSoundDetails,
  context: MeowContext,
  recentLogs: MeowLogEntry[]
): CareInterpretation {
  const base = soundDefaults[sound.soundType]
  let likelyNeed = base.need
  let mood = base.mood
  let urgency = base.urgency
  let confidence = 68

  if (context.location === 'kitchen' || context.situation === 'before_meal') {
    likelyNeed = 'food'
    mood = 'hungry'
    confidence += 12
  }

  if (context.location === 'door') {
    likelyNeed = 'door_access'
    confidence += 8
  }

  if (context.location === 'litter_box') {
    likelyNeed = 'litter_box'
    urgency = sound.perceivedIntensity === 'high' ? 'high' : 'medium'
    confidence += 10
  }

  if (context.situation === 'playtime') {
    likelyNeed = 'play'
    mood = 'playful'
    confidence += 9
  }

  if (sound.perceivedIntensity === 'high') {
    urgency = urgency === 'low' ? 'medium' : 'high'
    confidence += 6
  }

  if (profile.personality === 'demanding' || profile.personality === 'vocal') {
    confidence += 5
  }

  const similarRecent = recentLogs.filter(log => log.interpretation.likelyNeed === likelyNeed).length
  confidence += Math.min(similarRecent * 2, 8)

  return {
    playfulTranslation: `${profile.name} says: "${base.translation}"`,
    likelyNeed,
    confidence: clamp(confidence, 45, 96),
    urgency,
    mood,
    reasoningSummary: `${base.translation} ${getRoutineHint(routine, context)}`,
    suggestedAction: base.action,
    possibleTrigger: context.notes?.trim() || undefined,
  }
}
