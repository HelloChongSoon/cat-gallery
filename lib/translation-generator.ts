/**
 * PetChat AI - Fake Translation Generator
 * 
 * Generates humorous pet translations based on pet type and personality.
 * This is all client-side logic - no AI API needed.
 */

import type { PetProfile, PetType, TranslationResult, Severity } from './types'

const catMessages: Record<string, string[]> = {
  dramatic: [
    "I noticed you were comfortable, so I require your chair immediately.",
    "The bowl is technically not empty, but emotionally it is.",
    "I have filed a complaint with the furniture department.",
    "You have been staring at that glowing rectangle for too long. Look at ME.",
    "I knocked something off the table. This is your fault for leaving it there.",
  ],
  royal: [
    "Your presence has been tolerated for another day. You may continue serving me.",
    "The salmon was acceptable. I expect improvements tomorrow.",
    "I shall allow you to pet me for exactly 3.5 seconds. Do not waste this opportunity.",
    "My throne (your bed) requires fresh linens. See to it immediately.",
    "I have graced this room with my presence. Applause is expected.",
  ],
  chaotic: [
    "3 AM ZOOMIES ACTIVATED. SLEEP IS FOR THE WEAK.",
    "I have discovered a bug. It is now deceased. You are welcome.",
    "MUST. CLIMB. THE. FORBIDDEN. SHELF.",
    "I have knocked over precisely everything. My work here is done.",
    "Plot twist: I was UNDER the blanket the whole time!",
  ],
  sweet: [
    "I brought you this dead mouse because I love you.",
    "Your lap is my favorite place in the whole world.",
    "I have been waiting by the door for 6 hours. Where did you GO?",
    "Headbutts are my love language. Accept them.",
    "I will now knead your stomach at maximum intensity. This is affection.",
  ],
  judgy: [
    "You call THAT a meal? I have seen better presentation at a gas station.",
    "I am not ignoring you. I am simply choosing to acknowledge more important things.",
    "Your life choices concern me. Please reconsider... everything.",
    "I watched you trip. I will remember this forever.",
    "Another day, another disappointing human performance.",
  ],
}

const dogMessages: Record<string, string[]> = {
  dramatic: [
    "You left for 4 minutes. I counted it as 7 years.",
    "The mailman came AGAIN. When will this INJUSTICE end?!",
    "I have been waiting for dinner since breakfast. I am STARVING.",
    "You said 'walk' and then put on SOCKS first?! THE BETRAYAL.",
    "The thunder is trying to get me. HOLD ME.",
  ],
  royal: [
    "I require the premium treats. The regular ones are beneath me now.",
    "This belly will not rub itself, human.",
    "I shall sit in the exact center of the bed. You may have the edges.",
    "My schedule is clear. Yours should be too. We have snuggling to attend to.",
    "I have blessed this carpet with my presence. And also a little accident.",
  ],
  chaotic: [
    "SQUIRREL! SQUIRREL! FALSE ALARM! SQUIRREL!",
    "I have detected snack energy in your hand!",
    "The door moved. I protected everyone!",
    "CAR RIDE?! DID SOMEONE SAY CAR?! I HEARD CAR!",
    "I have found mud. We are now both muddy. This is how pack bonding works.",
  ],
  sweet: [
    "I brought you my favorite toy. Please throw it. Please. PLEASE.",
    "You are home! This is the best day of my life! Again!",
    "I will now lay on your feet so you can never leave.",
    "Your face is right there. I must lick it. It is the law.",
    "I had a dream about you. It was the best dream ever.",
  ],
  judgy: [
    "You went somewhere without me. I saw you. I remember.",
    "The cat gets to sit on the counter. This is discrimination.",
    "You gave the OTHER dog a treat first. We need to discuss this.",
    "I noticed you pet a different dog. I can smell the betrayal.",
    "You said 'outside' but meant 'bathroom only.' False advertising.",
  ],
}

const humanMessages: Record<string, string[]> = {
  dramatic: [
    "That was a Level 7 corporate sigh. Do not reply to Slack yet.",
    "Translation: This meeting could have been a message.",
    "Detected: Existential dread masked as a yawn.",
    "Analysis: That groan indicates WiFi issues or Monday. Possibly both.",
    "Warning: Passive-aggressive email draft detected in progress.",
  ],
  royal: [
    "Translation: I deserve a nap but society has other plans.",
    "That sigh roughly translates to 'I am the main character.'",
    "Detected: Queen/King energy constrained by workplace norms.",
    "Analysis: Deserves a crown but will settle for coffee.",
    "Translation: 'I have opinions but HR is watching.'",
  ],
  chaotic: [
    "DETECTED: Sleep-deprived decision making in progress!",
    "Translation: 'I have no idea what I am doing but here we GO!'",
    "Warning: Chaos gremlin mode activated. Stand back.",
    "Analysis: Running on caffeine and vibes only.",
    "Translation: 'Let me just try one more thing...' (will regret later)",
  ],
  sweet: [
    "Translation: That was a happy sigh. Good for you!",
    "Detected: Genuine contentment. A rare specimen.",
    "Analysis: This human is having a good day. Protect them.",
    "Translation: 'Life is actually okay right now.'",
    "Detected: Wholesome energy. Cherish this moment.",
  ],
  judgy: [
    "Translation: 'I am judging silently and with great precision.'",
    "Detected: Passive-aggressive 'fine' (not fine).",
    "Analysis: That was not a yawn, that was a statement.",
    "Translation: 'I have thoughts but I choose peace... for now.'",
    "Detected: Professional disappointment. Meetings were involved.",
  ],
}

const mysteryMessages: string[] = [
  "Unknown creature detected. It appears to demand attention and possibly cheese.",
  "Unidentified sound source. Mood: Mysterious. Intent: Unknowable.",
  "Analysis inconclusive. Recommend offering snacks and backing away slowly.",
  "Strange entity communication received. Translation may require more dimensions.",
  "Detected: Non-standard life form. Vibes are... questionable.",
  "Mystery sound analyzed. Result: We are both confused now.",
  "Unrecognized vocal pattern. Either ancient wisdom or tummy rumbles.",
]

const moods = [
  'Demanding', 'Suspicious', 'Dramatic', 'Hungry', 'Sleepy',
  'Chaotic', 'Judgmental', 'Affectionate', 'Confused', 'Royal',
  'Mischievous', 'Urgent', 'Philosophical', 'Grumpy', 'Ecstatic',
]

const intents = [
  'Seeking attention', 'Demanding food', 'Expressing displeasure',
  'Requesting cuddles', 'Asserting dominance', 'Reporting news',
  'Filing complaint', 'Requesting entry/exit', 'Expressing love',
  'Investigating suspicious activity', 'Claiming territory',
  'Requesting playtime', 'Protesting injustice', 'Greeting ritual',
]

const suggestedActions = [
  'Provide immediate snacks',
  'Clear your schedule for cuddles',
  'Prepare for dramatic performance',
  'Check the food bowl (it is always about food)',
  'Accept your fate',
  'Offer tribute (treats)',
  'Provide undivided attention',
  'Open the door. No, the other door.',
  'Cancel all plans',
  'Apologize profusely',
  'Take a photo (this is important)',
  'Just say "good boy/girl" and hope for the best',
  'Do not make eye contact',
  'Surrender the chair',
]

function randomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function generateConfidence(): number {
  // Weighted towards higher confidence with some low outliers
  const base = Math.random()
  if (base < 0.1) return Math.floor(Math.random() * 30) + 40 // 40-70%
  return Math.floor(Math.random() * 20) + 78 // 78-98%
}

function generateSeverity(): Severity {
  const roll = Math.random()
  if (roll < 0.4) return 'low'
  if (roll < 0.7) return 'medium'
  if (roll < 0.9) return 'high'
  return 'royal emergency'
}

export function generatePetTranslation(
  petProfile: PetProfile,
  soundType: PetType
): Omit<TranslationResult, 'id' | 'petId' | 'createdAt'> {
  let message: string

  if (soundType === 'mystery') {
    message = randomItem(mysteryMessages)
  } else {
    const messageMap = {
      cat: catMessages,
      dog: dogMessages,
      human: humanMessages,
    }
    
    const messages = messageMap[soundType]?.[petProfile.personality]
    message = messages ? randomItem(messages) : randomItem(mysteryMessages)
  }

  return {
    originalSoundType: soundType,
    translatedMessage: message,
    mood: randomItem(moods),
    intent: randomItem(intents),
    confidence: generateConfidence(),
    severity: generateSeverity(),
    suggestedAction: randomItem(suggestedActions),
  }
}
