'use client'

import { useEffect, useRef, useState } from 'react'
import { X } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { generateId } from '@/lib/storage'
import type { CatAgeGroup, CatPersonality, CatProfile } from '@/lib/types'

interface CatProfileSetupProps {
  isOpen: boolean
  onClose: () => void
  onSave: (profile: CatProfile) => void
  initialProfile?: CatProfile | null
}

const personalities: { value: CatPersonality; label: string; description: string }[] = [
  { value: 'vocal', label: 'Very Vocal', description: 'Always has something to say' },
  { value: 'quiet', label: 'Quiet', description: 'Selective with their opinions' },
  { value: 'demanding', label: 'Demanding', description: 'Clear standards, firm deadlines' },
  { value: 'affectionate', label: 'Affectionate', description: 'Social and people-focused' },
  { value: 'independent', label: 'Independent', description: 'Runs their own calendar' },
]

const ageGroups: { value: CatAgeGroup; label: string }[] = [
  { value: 'kitten', label: 'Kitten' },
  { value: 'adult', label: 'Adult' },
  { value: 'senior', label: 'Senior' },
]

const avatars = ['🐱', '😺', '😸', '🐈', '🐈‍⬛']

export function CatProfileSetup({ isOpen, onClose, onSave, initialProfile }: CatProfileSetupProps) {
  const [name, setName] = useState('')
  const [personality, setPersonality] = useState<CatPersonality>('vocal')
  const [ageGroup, setAgeGroup] = useState<CatAgeGroup>('adult')
  const [avatarEmoji, setAvatarEmoji] = useState('🐱')
  const [healthNotes, setHealthNotes] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!isOpen) return
    setName(initialProfile?.name || '')
    setPersonality(initialProfile?.personality || 'vocal')
    setAgeGroup(initialProfile?.ageGroup || 'adult')
    setAvatarEmoji(initialProfile?.avatarEmoji || '🐱')
    setHealthNotes(initialProfile?.healthNotes || '')
    window.setTimeout(() => inputRef.current?.focus(), 100)
  }, [isOpen, initialProfile])

  const save = () => {
    if (!name.trim()) return

    onSave({
      id: initialProfile?.id || generateId(),
      name: name.trim(),
      personality,
      ageGroup,
      avatarEmoji,
      healthNotes: healthNotes.trim() || undefined,
      photoUrl: initialProfile?.photoUrl,
    })
    onClose()
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 sm:items-center"
          role="dialog"
          aria-modal="true"
          aria-labelledby="cat-profile-title"
          onClick={onClose}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="w-full max-w-md"
            onClick={(event) => event.stopPropagation()}
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
          >
            <Card className="max-h-[85vh] overflow-y-auto p-6">
              <div className="mb-6 flex items-center justify-between">
                <h2 id="cat-profile-title" className="text-xl font-semibold">
                  {initialProfile ? 'Edit Cat Profile' : 'Create Cat Profile'}
                </h2>
                <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close">
                  <X className="h-5 w-5" />
                </Button>
              </div>

              <div className="space-y-5">
                <div>
                  <label htmlFor="cat-name" className="mb-2 block text-sm font-medium">
                    Cat Name
                  </label>
                  <input
                    ref={inputRef}
                    id="cat-name"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    placeholder="Mochi"
                    className="w-full rounded-lg border bg-background px-4 py-3 text-foreground outline-none focus:ring-2 focus:ring-primary"
                    maxLength={30}
                  />
                </div>

                <fieldset>
                  <legend className="mb-2 text-sm font-medium">Avatar</legend>
                  <div className="flex flex-wrap gap-2">
                    {avatars.map((avatar) => (
                      <button
                        key={avatar}
                        type="button"
                        onClick={() => setAvatarEmoji(avatar)}
                        className={`h-12 w-12 rounded-lg border text-2xl ${avatarEmoji === avatar ? 'border-primary bg-primary/10' : 'border-border'}`}
                      >
                        {avatar}
                      </button>
                    ))}
                  </div>
                </fieldset>

                <fieldset>
                  <legend className="mb-2 text-sm font-medium">Age Group</legend>
                  <div className="grid grid-cols-3 gap-2">
                    {ageGroups.map((age) => (
                      <button
                        key={age.value}
                        type="button"
                        onClick={() => setAgeGroup(age.value)}
                        className={`rounded-lg border px-3 py-2 text-sm ${ageGroup === age.value ? 'border-primary bg-primary/10' : 'border-border'}`}
                      >
                        {age.label}
                      </button>
                    ))}
                  </div>
                </fieldset>

                <fieldset>
                  <legend className="mb-2 text-sm font-medium">Personality</legend>
                  <div className="space-y-2">
                    {personalities.map((item) => (
                      <button
                        key={item.value}
                        type="button"
                        onClick={() => setPersonality(item.value)}
                        className={`w-full rounded-lg border p-3 text-left ${personality === item.value ? 'border-primary bg-primary/10' : 'border-border'}`}
                      >
                        <span className="font-medium">{item.label}</span>
                        <span className="block text-xs text-muted-foreground">{item.description}</span>
                      </button>
                    ))}
                  </div>
                </fieldset>

                <div>
                  <label htmlFor="health-notes" className="mb-2 block text-sm font-medium">
                    Health Notes
                  </label>
                  <textarea
                    id="health-notes"
                    value={healthNotes}
                    onChange={(event) => setHealthNotes(event.target.value)}
                    placeholder="Optional"
                    className="min-h-20 w-full rounded-lg border bg-background px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <Button className="w-full" size="xl" disabled={!name.trim()} onClick={save}>
                  {initialProfile ? 'Save Changes' : 'Create Profile'}
                </Button>
              </div>
            </Card>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
