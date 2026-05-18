'use client'

import { useState } from 'react'
import { RotateCcw, Save } from 'lucide-react'
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
  return (
    <Card className="p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <p className="text-xs text-muted-foreground">{catName} might need</p>
          <h2 className="text-lg font-semibold capitalize">
            {interpretation.likelyNeed.replace('_', ' ')}
          </h2>
        </div>
        <Badge variant={interpretation.urgency === 'high' ? 'destructive' : 'secondary'}>
          {interpretation.confidence}% sure
        </Badge>
      </div>

      <blockquote className="mb-4 rounded-xl bg-primary/5 p-4 text-sm italic text-foreground">
        “{interpretation.playfulTranslation}”
      </blockquote>

      <div className="space-y-3 text-sm">
        <div>
          <p className="text-xs text-muted-foreground">Reasoning</p>
          <p>{interpretation.reasoningSummary}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Suggested Action</p>
          <p>{interpretation.suggestedAction}</p>
        </div>
        {interpretation.possibleTrigger && (
          <div>
            <p className="text-xs text-muted-foreground">Possible Trigger</p>
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
