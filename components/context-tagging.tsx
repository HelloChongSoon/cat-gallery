'use client'

import { useState } from 'react'
import { ChevronLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import type { LocationContext, MeowContext, MeowSound, MeowSoundDetails, SituationContext } from '@/lib/types'

interface ContextTaggingProps {
  onComplete: (sound: MeowSoundDetails, context: MeowContext) => void
  onBack: () => void
}

const soundOptions: { value: MeowSound; label: string }[] = [
  { value: 'short-meow', label: 'Short meow' },
  { value: 'long-meow', label: 'Long meow' },
  { value: 'chirp', label: 'Chirp' },
  { value: 'yowl', label: 'Yowl' },
  { value: 'hiss', label: 'Hiss' },
  { value: 'purr', label: 'Purr' },
  { value: 'chattering', label: 'Chattering' },
  { value: 'silent-meow', label: 'Silent meow' },
]

const locationOptions: { value: LocationContext; label: string }[] = [
  { value: 'kitchen', label: 'Kitchen' },
  { value: 'bedroom', label: 'Bedroom' },
  { value: 'living_room', label: 'Living room' },
  { value: 'door', label: 'Door' },
  { value: 'litter_box', label: 'Litter box' },
  { value: 'window', label: 'Window' },
  { value: 'other', label: 'Other' },
]

const situationOptions: { value: SituationContext; label: string }[] = [
  { value: 'before_meal', label: 'Before meal' },
  { value: 'after_meal', label: 'After meal' },
  { value: 'playtime', label: 'Playtime' },
  { value: 'arrival', label: 'You arrived' },
  { value: 'bedtime', label: 'Bedtime' },
  { value: 'alone', label: 'Left alone' },
  { value: 'petting', label: 'Being petted' },
  { value: 'other', label: 'Other' },
]

export function ContextTagging({ onComplete, onBack }: ContextTaggingProps) {
  const [soundType, setSoundType] = useState<MeowSound>('short-meow')
  const [intensity, setIntensity] = useState<MeowSoundDetails['perceivedIntensity']>('medium')
  const [location, setLocation] = useState<LocationContext>('living_room')
  const [situation, setSituation] = useState<SituationContext>('other')
  const [notes, setNotes] = useState('')

  return (
    <Card className="p-5">
      <div className="mb-5 flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={onBack} aria-label="Back">
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <h2 className="font-semibold text-foreground">Add Context</h2>
      </div>

      <div className="space-y-5">
        <OptionGrid title="Sound" options={soundOptions} value={soundType} onChange={setSoundType} />
        <OptionGrid
          title="Intensity"
          options={[
            { value: 'low', label: 'Low' },
            { value: 'medium', label: 'Medium' },
            { value: 'high', label: 'High' },
          ]}
          value={intensity}
          onChange={setIntensity}
        />
        <OptionGrid title="Location" options={locationOptions} value={location} onChange={setLocation} />
        <OptionGrid title="Situation" options={situationOptions} value={situation} onChange={setSituation} />

        <div>
          <label htmlFor="context-notes" className="mb-2 block text-sm font-medium">
            Notes
          </label>
          <textarea
            id="context-notes"
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            placeholder="Optional trigger or behavior"
            className="min-h-20 w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <Button
          className="w-full"
          onClick={() => onComplete(
            { soundType, perceivedIntensity: intensity },
            { location, situation, situations: [situation], notes: notes.trim() || undefined }
          )}
        >
          Interpret Meow
        </Button>
      </div>
    </Card>
  )
}

function OptionGrid<T extends string>({
  title,
  options,
  value,
  onChange,
}: {
  title: string
  options: { value: T; label: string }[]
  value: T
  onChange: (value: T) => void
}) {
  return (
    <fieldset>
      <legend className="mb-2 text-sm font-medium">{title}</legend>
      <div className="grid grid-cols-2 gap-2">
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={`rounded-lg border px-3 py-2 text-sm ${value === option.value ? 'border-primary bg-primary/10' : 'border-border'}`}
          >
            {option.label}
          </button>
        ))}
      </div>
    </fieldset>
  )
}
