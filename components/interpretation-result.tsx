'use client'

import { useState } from 'react'
import { AlertTriangle, CheckCircle2, HeartPulse, RotateCcw, Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { ActionThatHelped, CareInterpretation, FeedbackAccuracy } from '@/lib/types'

interface InterpretationResultProps {
  interpretation: CareInterpretation
  catName: string
  onSave: () => void
  onNewRecording: () => void
}

export function InterpretationResult({
  interpretation,
  catName,
  onSave,
  onNewRecording,
}: InterpretationResultProps) {
  const urgencyTone = interpretation.urgency === 'high'
    ? 'border-destructive/30 bg-destructive/5'
    : interpretation.urgency === 'medium'
      ? 'border-amber-300 bg-amber-50'
      : 'border-green-200 bg-green-50'
  const UrgencyIcon = interpretation.urgency === 'high' ? AlertTriangle : interpretation.urgency === 'medium' ? HeartPulse : CheckCircle2

  return (
    <Card className="overflow-hidden border-primary/10 bg-white/90 shadow-xl shadow-primary/10">
      <div className={`border-b p-5 ${urgencyTone}`}>
        <div className="mb-3 flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/80">
              <UrgencyIcon className="h-5 w-5 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{catName} might need</p>
              <h2 className="truncate text-lg font-bold capitalize text-foreground">
                {interpretation.likelyNeed.replace('_', ' ')}
              </h2>
            </div>
          </div>
          <Badge variant={interpretation.urgency === 'high' ? 'destructive' : 'secondary'}>
            {interpretation.confidence}% sure
          </Badge>
        </div>
        <p className="text-sm font-medium leading-relaxed text-foreground">
          {interpretation.headline}
        </p>
      </div>

      <div className="p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Playful read</p>
      </div>

      <blockquote className="mb-4 rounded-xl bg-primary/5 p-4 text-sm italic leading-relaxed text-foreground">
        “{interpretation.playfulTranslation}”
      </blockquote>

      <div className="space-y-3 text-sm">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Why this read</p>
          <p>{interpretation.reasoningSummary}</p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Try now</p>
          <p>{interpretation.suggestedAction}</p>
        </div>
        {interpretation.possibleTrigger && (
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Possible trigger</p>
            <p>{interpretation.possibleTrigger}</p>
          </div>
        )}
      </div>

      <div className="mt-5 flex gap-2">
        <Button className="flex-1" onClick={onSave}>
          <Save className="h-4 w-4" />
          Save
        </Button>
        <Button className="flex-1" variant="outline" onClick={onNewRecording}>
          <RotateCcw className="h-4 w-4" />
          Again
        </Button>
      </div>
      </div>
    </Card>
  )
}

interface FeedbackFormProps {
  onSubmit: (accuracy: FeedbackAccuracy, action: ActionThatHelped | null) => void
  onSkip: () => void
}

const accuracyOptions: { value: FeedbackAccuracy; label: string }[] = [
  { value: 'spot-on', label: 'Spot on' },
  { value: 'close', label: 'Close' },
  { value: 'not-quite', label: 'Not quite' },
]

const actionOptions: { value: ActionThatHelped; label: string }[] = [
  { value: 'food', label: 'Food' },
  { value: 'water', label: 'Water' },
  { value: 'attention', label: 'Attention' },
  { value: 'play', label: 'Play' },
  { value: 'opened_door', label: 'Opened door' },
  { value: 'cleaned_litter', label: 'Cleaned litter' },
  { value: 'comfort', label: 'Comfort' },
  { value: 'nothing', label: 'Nothing' },
]

export function FeedbackForm({ onSubmit, onSkip }: FeedbackFormProps) {
  const [accuracy, setAccuracy] = useState<FeedbackAccuracy>('close')
  const [action, setAction] = useState<ActionThatHelped | null>(null)

  return (
    <Card className="p-5">
      <h2 className="mb-1 text-lg font-semibold">Was it helpful?</h2>
      <p className="mb-5 text-sm text-muted-foreground">
        This keeps the log useful for future patterns.
      </p>

      <div className="space-y-5">
        <fieldset>
          <legend className="mb-2 text-sm font-medium">Accuracy</legend>
          <div className="grid grid-cols-3 gap-2">
            {accuracyOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setAccuracy(option.value)}
                className={`rounded-lg border px-3 py-2 text-sm ${accuracy === option.value ? 'border-primary bg-primary/10' : 'border-border'}`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </fieldset>

        <fieldset>
          <legend className="mb-2 text-sm font-medium">What helped?</legend>
          <div className="grid grid-cols-2 gap-2">
            {actionOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setAction(option.value)}
                className={`rounded-lg border px-3 py-2 text-sm ${action === option.value ? 'border-primary bg-primary/10' : 'border-border'}`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </fieldset>

        <div className="flex gap-2">
          <Button className="flex-1" onClick={() => onSubmit(accuracy, action)}>
            Save Feedback
          </Button>
          <Button variant="outline" className="flex-1" onClick={onSkip}>
            Skip
          </Button>
        </div>
      </div>
    </Card>
  )
}
