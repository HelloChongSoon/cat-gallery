import type {
  CareInterpretation,
  CatProfile,
  CatRoutine,
  LikelyNeed,
  MeowContext,
  MeowLogEntry,
  MeowSoundDetails,
  MoodCategory,
  Urgency,
} from './types'

type InterpretationTemplate = {
  headline: string
  translation: string
  action: string
  reasoning: string
}

type SoundDefault = {
  mood: MoodCategory
  need: LikelyNeed
  urgency: Urgency
  templates: InterpretationTemplate[]
}

const soundDefaults: Record<MeowSoundDetails['soundType'], SoundDefault> = {
  'short-meow': {
    mood: 'attention',
    need: 'attention',
    urgency: 'low',
    templates: [
      {
        headline: 'A short check-in, probably asking for attention.',
        translation: 'I am here. Please acknowledge the excellent cat in the room.',
        action: 'Offer a calm greeting or a brief pet, then see whether the request stops.',
        reasoning: 'Short meows often work like a ping: low urgency, high social intent.',
      },
      {
        headline: 'A quick request rather than a distress call.',
        translation: 'Tiny announcement: I need you for one small but important thing.',
        action: 'Check nearby access, food, and whether your cat is trying to lead you somewhere.',
        reasoning: 'The sound is brief, so the context should carry more weight than volume.',
      },
    ],
  },
  'long-meow': {
    mood: 'hungry',
    need: 'routine_request',
    urgency: 'medium',
    templates: [
      {
        headline: 'A sustained request, likely about routine or unmet expectation.',
        translation: 'The schedule and my standards are no longer aligned.',
        action: 'Check the expected routine: food, water, doors, or a usual attention window.',
        reasoning: 'Long meows tend to appear when a request has not been answered yet.',
      },
      {
        headline: 'A louder reminder that something predictable is missing.',
        translation: 'I have escalated this from polite reminder to formal complaint.',
        action: 'Look for the obvious routine gap first before assuming distress.',
        reasoning: 'A drawn-out vocalization is usually more persistent than playful.',
      },
    ],
  },
  chirp: {
    mood: 'playful',
    need: 'play',
    urgency: 'low',
    templates: [
      {
        headline: 'Curious or playful energy, usually low risk.',
        translation: 'Something interesting is happening and you are invited.',
        action: 'Offer a toy, follow their gaze, or inspect the window/room they are focused on.',
        reasoning: 'Chirps and trills often pair with curiosity, greeting, or gentle excitement.',
      },
      {
        headline: 'A friendly alert, likely about attention or enrichment.',
        translation: 'Please witness this important discovery.',
        action: 'Engage for a minute; if they move away, let the moment pass.',
        reasoning: 'This sound usually reads more social than urgent.',
      },
    ],
  },
  yowl: {
    mood: 'stressed',
    need: 'discomfort',
    urgency: 'high',
    templates: [
      {
        headline: 'High-priority signal: check discomfort, stress, or blocked access.',
        translation: 'Something is wrong enough that subtlety has been cancelled.',
        action: 'Check for pain signs, conflict, closed doors, litter issues, or sudden behavior changes.',
        reasoning: 'Yowls are more intense and deserve a practical welfare check first.',
      },
      {
        headline: 'Possible distress or strong frustration.',
        translation: 'I need intervention, not vibes.',
        action: 'Give space if they seem tense, then inspect food, water, litter, and environment.',
        reasoning: 'The combination of duration and intensity makes this more urgent than routine chatter.',
      },
    ],
  },
  hiss: {
    mood: 'territorial',
    need: 'stress',
    urgency: 'high',
    templates: [
      {
        headline: 'Boundary signal: reduce pressure and remove the trigger.',
        translation: 'The line has been crossed. Back up the whole situation.',
        action: 'Stop approaching, give space, and separate pets or people if needed.',
        reasoning: 'A hiss is a defensive warning, so de-escalation comes before interpretation.',
      },
      {
        headline: 'Stress or threat response, not a request for contact.',
        translation: 'I am not negotiating cuddles at this time.',
        action: 'Lower stimulation, avoid picking them up, and let them choose distance.',
        reasoning: 'Hissing is about safety and boundaries more than attention.',
      },
    ],
  },
  purr: {
    mood: 'content',
    need: 'attention',
    urgency: 'low',
    templates: [
      {
        headline: 'Comfortable and socially engaged.',
        translation: 'This current arrangement has been approved.',
        action: 'Keep the interaction gentle and note what context made them settle.',
        reasoning: 'Purring often points to contentment, especially with relaxed body language.',
      },
      {
        headline: 'Likely content, with a small request for continuation.',
        translation: 'Continue the service exactly as delivered.',
        action: 'Maintain the calm environment and watch for any change in posture or tension.',
        reasoning: 'A purr is useful context, but body language should confirm comfort.',
      },
    ],
  },
  chattering: {
    mood: 'territorial',
    need: 'play',
    urgency: 'low',
    templates: [
      {
        headline: 'Prey-watch excitement or frustrated hunting energy.',
        translation: 'I have calculated the target and require impossible access.',
        action: 'Redirect into wand play or window-safe enrichment.',
        reasoning: 'Chattering often appears around birds, movement, or high-focus play drive.',
      },
      {
        headline: 'Excited focus, usually enrichment-related.',
        translation: 'My tiny hunter brain is fully online.',
        action: 'Offer a short hunt-style play session and let them complete the sequence.',
        reasoning: 'This is usually more about stimulation than a basic need.',
      },
    ],
  },
  'silent-meow': {
    mood: 'attention',
    need: 'attention',
    urgency: 'low',
    templates: [
      {
        headline: 'Soft social request, likely attention or access.',
        translation: 'I am being polite, but the request still stands.',
        action: 'Offer gentle attention or check whether they are asking you to open something.',
        reasoning: 'A silent meow is often a learned attention signal rather than an emergency.',
      },
      {
        headline: 'Quiet communication from a cat who expects you to understand.',
        translation: 'Surely my meaning is obvious to the staff.',
        action: 'Look where they are facing and check the nearest routine cue.',
        reasoning: 'Low-intensity signals need context: location and timing matter most.',
      },
    ],
  },
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function pickTemplate(templates: InterpretationTemplate[], recentLogs: MeowLogEntry[]) {
  const recentTranslations = new Set(
    recentLogs
      .slice(0, 10)
      .map((log) => log.interpretation.playfulTranslation)
  )

  return templates.find((template) => !recentTranslations.has(template.translation)) || templates[0]
}

function getContextAdjustment(context: MeowContext): Partial<Pick<SoundDefault, 'need' | 'mood' | 'urgency'>> & { confidence: number; reason: string } {
  if (context.location === 'kitchen' || context.situation === 'before_meal') {
    return {
      need: 'food',
      mood: 'hungry',
      confidence: 12,
      reason: 'The kitchen or pre-meal timing strongly points toward a food or routine request.',
    }
  }

  if (context.location === 'door') {
    return {
      need: 'door_access',
      confidence: 9,
      reason: 'Being near a door often means access is the actual request.',
    }
  }

  if (context.location === 'litter_box') {
    return {
      need: 'litter_box',
      urgency: 'medium',
      confidence: 12,
      reason: 'Litter-box context is worth checking promptly, especially if the sound is unusual.',
    }
  }

  if (context.situation === 'playtime') {
    return {
      need: 'play',
      mood: 'playful',
      confidence: 9,
      reason: 'The situation overlaps with play-seeking behavior.',
    }
  }

  if (context.situation === 'arrival') {
    return {
      need: 'greeting',
      mood: 'attention',
      confidence: 7,
      reason: 'Arrival context often turns vocalization into a greeting or reunion ritual.',
    }
  }

  return {
    confidence: 0,
    reason: 'The context is neutral, so the sound pattern carries more of the interpretation.',
  }
}

function getRoutineReason(routine: CatRoutine | null, context: MeowContext) {
  if (!routine) return 'Adding feeding and play times in Settings will make future reads sharper.'

  if (context.situation === 'before_meal' && routine.feedingTimes.length > 0) {
    return `Saved feeding windows (${routine.feedingTimes.join(', ')}) make this more likely to be routine-related.`
  }

  if (context.situation === 'playtime' && routine.playTimes?.length) {
    return `This overlaps with saved play windows (${routine.playTimes.join(', ')}).`
  }

  return 'No saved routine conflict stands out for this meow.'
}

export function generateCareInterpretation(
  profile: CatProfile,
  routine: CatRoutine | null,
  sound: MeowSoundDetails,
  context: MeowContext,
  recentLogs: MeowLogEntry[]
): CareInterpretation {
  const base = soundDefaults[sound.soundType]
  const template = pickTemplate(base.templates, recentLogs)
  const contextAdjustment = getContextAdjustment(context)
  const similarRecent = recentLogs
    .slice(0, 10)
    .filter((log) => log.interpretation.likelyNeed === (contextAdjustment.need || base.need))
    .length

  const likelyNeed = contextAdjustment.need || base.need
  const mood = contextAdjustment.mood || base.mood
  let urgency = contextAdjustment.urgency || base.urgency
  let confidence = 62 + contextAdjustment.confidence + Math.min(similarRecent * 3, 9)

  if (sound.perceivedIntensity === 'high') {
    urgency = urgency === 'low' ? 'medium' : 'high'
    confidence += 7
  }

  if (sound.perceivedIntensity === 'low' && urgency === 'medium') {
    urgency = 'low'
  }

  if (profile.personality === 'demanding' || profile.personality === 'vocal') {
    confidence += 5
  }

  const routineReason = getRoutineReason(routine, context)
  const notesReason = context.notes?.trim() ? `Your note adds a likely trigger: ${context.notes.trim()}.` : null

  return {
    headline: template.headline,
    playfulTranslation: template.translation,
    likelyNeed,
    confidence: clamp(confidence, 48, 96),
    urgency,
    mood,
    reasoningSummary: [
      template.reasoning,
      contextAdjustment.reason,
      routineReason,
      notesReason,
    ].filter(Boolean).join(' '),
    suggestedAction: template.action,
    possibleTrigger: context.notes?.trim() || undefined,
  }
}
