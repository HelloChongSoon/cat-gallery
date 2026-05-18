'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import type { PetProfile, PetType, PetPersonality } from '@/lib/types'
import { generateId } from '@/lib/storage'

interface PetProfileSetupProps {
  isOpen: boolean
  onClose: () => void
  onSave: (profile: PetProfile) => void
  initialProfile?: PetProfile | null
}

const petTypes: { type: PetType; emoji: string; label: string }[] = [
  { type: 'cat', emoji: '🐱', label: 'Cat' },
  { type: 'dog', emoji: '🐕', label: 'Dog' },
  { type: 'human', emoji: '🧑', label: 'Human' },
  { type: 'mystery', emoji: '👽', label: 'Mystery' },
]

const personalities: { value: PetPersonality; label: string; description: string }[] = [
  { value: 'dramatic', label: 'Dramatic', description: 'Every moment is a crisis' },
  { value: 'royal', label: 'Royal', description: 'Born to be served' },
  { value: 'chaotic', label: 'Chaotic', description: 'Pure unhinged energy' },
  { value: 'sweet', label: 'Sweet', description: 'Pure love and kindness' },
  { value: 'judgy', label: 'Judgy', description: 'Silently disappointed' },
]

const defaultAvatars: Record<PetType, string[]> = {
  cat: ['🐱', '😺', '😸', '🐈', '🐈‍⬛'],
  dog: ['🐕', '🐶', '🦮', '🐕‍🦺', '🐩'],
  human: ['🧑', '👤', '🙂', '😏', '🤔'],
  mystery: ['👽', '🦎', '🐸', '🦜', '🐹'],
}

export function PetProfileSetup({ isOpen, onClose, onSave, initialProfile }: PetProfileSetupProps) {
  const [name, setName] = useState(initialProfile?.name || '')
  const [type, setType] = useState<PetType>(initialProfile?.type || 'cat')
  const [personality, setPersonality] = useState<PetPersonality>(initialProfile?.personality || 'dramatic')
  const [avatarEmoji, setAvatarEmoji] = useState(initialProfile?.avatarEmoji || '🐱')

  const handleSave = () => {
    if (!name.trim()) return

    const profile: PetProfile = {
      id: initialProfile?.id || generateId(),
      name: name.trim(),
      type,
      personality,
      avatarEmoji,
    }

    onSave(profile)
    onClose()
  }

  const handleTypeChange = (newType: PetType) => {
    setType(newType)
    setAvatarEmoji(defaultAvatars[newType][0])
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="w-full max-w-md"
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            onClick={e => e.stopPropagation()}
          >
            <Card className="p-6 max-h-[85vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-foreground">
                  {initialProfile ? 'Edit Pet Profile' : 'Create Pet Profile'}
                </h2>
                <Button variant="ghost" size="icon" onClick={onClose}>
                  <X className="w-5 h-5" />
                </Button>
              </div>

              {/* Name Input */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-foreground mb-2">
                  Pet Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Sir Whiskers III"
                  className="w-full px-4 py-3 rounded-lg border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  maxLength={30}
                />
              </div>

              {/* Pet Type */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-foreground mb-2">
                  Pet Type
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {petTypes.map(pt => (
                    <button
                      key={pt.type}
                      onClick={() => handleTypeChange(pt.type)}
                      className={`flex flex-col items-center gap-1 p-3 rounded-lg border transition-all ${
                        type === pt.type
                          ? 'border-primary bg-primary/10'
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <span className="text-2xl">{pt.emoji}</span>
                      <span className="text-xs text-muted-foreground">{pt.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Avatar */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-foreground mb-2">
                  Avatar
                </label>
                <div className="flex gap-2 flex-wrap">
                  {defaultAvatars[type].map(emoji => (
                    <button
                      key={emoji}
                      onClick={() => setAvatarEmoji(emoji)}
                      className={`w-12 h-12 text-2xl rounded-lg border transition-all ${
                        avatarEmoji === emoji
                          ? 'border-primary bg-primary/10'
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>

              {/* Personality */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-foreground mb-2">
                  Personality
                </label>
                <div className="space-y-2">
                  {personalities.map(p => (
                    <button
                      key={p.value}
                      onClick={() => setPersonality(p.value)}
                      className={`w-full flex items-center justify-between p-3 rounded-lg border text-left transition-all ${
                        personality === p.value
                          ? 'border-primary bg-primary/10'
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <div>
                        <span className="font-medium text-foreground">{p.label}</span>
                        <p className="text-xs text-muted-foreground">{p.description}</p>
                      </div>
                      {personality === p.value && (
                        <div className="w-2 h-2 rounded-full bg-primary" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Save Button */}
              <Button 
                className="w-full" 
                size="xl"
                onClick={handleSave}
                disabled={!name.trim()}
              >
                {initialProfile ? 'Save Changes' : 'Create Profile'}
              </Button>
            </Card>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
