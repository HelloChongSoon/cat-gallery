'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
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
  
  const inputRef = useRef<HTMLInputElement>(null)
  const modalRef = useRef<HTMLDivElement>(null)

  // Reset form when modal opens with different profile
  useEffect(() => {
    if (isOpen) {
      setName(initialProfile?.name || '')
      setType(initialProfile?.type || 'cat')
      setPersonality(initialProfile?.personality || 'dramatic')
      setAvatarEmoji(initialProfile?.avatarEmoji || '🐱')
      
      // Focus input after animation
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [isOpen, initialProfile])

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose])

  // Trap focus within modal
  useEffect(() => {
    if (!isOpen) return
    
    const modal = modalRef.current
    if (!modal) return
    
    const focusableElements = modal.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )
    const firstElement = focusableElements[0]
    const lastElement = focusableElements[focusableElements.length - 1]
    
    const handleTab = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return
      
      if (e.shiftKey && document.activeElement === firstElement) {
        e.preventDefault()
        lastElement?.focus()
      } else if (!e.shiftKey && document.activeElement === lastElement) {
        e.preventDefault()
        firstElement?.focus()
      }
    }
    
    document.addEventListener('keydown', handleTab)
    return () => document.removeEventListener('keydown', handleTab)
  }, [isOpen])

  const handleSave = useCallback(() => {
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
  }, [name, type, personality, avatarEmoji, initialProfile?.id, onSave, onClose])

  const handleTypeChange = useCallback((newType: PetType) => {
    setType(newType)
    setAvatarEmoji(defaultAvatars[newType][0])
  }, [])

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          role="dialog"
          aria-modal="true"
          aria-labelledby="profile-setup-title"
        >
          <motion.div
            ref={modalRef}
            className="w-full max-w-md"
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            onClick={e => e.stopPropagation()}
          >
            <Card className="p-6 max-h-[85vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 id="profile-setup-title" className="text-xl font-semibold text-foreground">
                  {initialProfile ? 'Edit Pet Profile' : 'Create Pet Profile'}
                </h2>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={onClose}
                  aria-label="Close dialog"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>

              {/* Name Input */}
              <div className="mb-6">
                <label 
                  htmlFor="pet-name"
                  className="block text-sm font-medium text-foreground mb-2"
                >
                  Pet Name
                </label>
                <input
                  ref={inputRef}
                  id="pet-name"
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Sir Whiskers III"
                  className="w-full px-4 py-3 rounded-lg border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  maxLength={30}
                  autoComplete="off"
                />
              </div>

              {/* Pet Type */}
              <fieldset className="mb-6">
                <legend className="block text-sm font-medium text-foreground mb-2">
                  Pet Type
                </legend>
                <div className="grid grid-cols-4 gap-2" role="radiogroup">
                  {petTypes.map(pt => (
                    <button
                      key={pt.type}
                      type="button"
                      onClick={() => handleTypeChange(pt.type)}
                      className={`flex flex-col items-center gap-1 p-3 rounded-lg border transition-all focus:outline-none focus:ring-2 focus:ring-primary ${
                        type === pt.type
                          ? 'border-primary bg-primary/10'
                          : 'border-border hover:border-primary/50'
                      }`}
                      role="radio"
                      aria-checked={type === pt.type}
                      aria-label={pt.label}
                    >
                      <span className="text-2xl" role="img" aria-hidden="true">{pt.emoji}</span>
                      <span className="text-xs text-muted-foreground">{pt.label}</span>
                    </button>
                  ))}
                </div>
              </fieldset>

              {/* Avatar */}
              <fieldset className="mb-6">
                <legend className="block text-sm font-medium text-foreground mb-2">
                  Avatar
                </legend>
                <div className="flex gap-2 flex-wrap" role="radiogroup">
                  {defaultAvatars[type].map(emoji => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => setAvatarEmoji(emoji)}
                      className={`w-12 h-12 text-2xl rounded-lg border transition-all focus:outline-none focus:ring-2 focus:ring-primary ${
                        avatarEmoji === emoji
                          ? 'border-primary bg-primary/10'
                          : 'border-border hover:border-primary/50'
                      }`}
                      role="radio"
                      aria-checked={avatarEmoji === emoji}
                      aria-label={`Avatar ${emoji}`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </fieldset>

              {/* Personality */}
              <fieldset className="mb-6">
                <legend className="block text-sm font-medium text-foreground mb-2">
                  Personality
                </legend>
                <div className="space-y-2" role="radiogroup">
                  {personalities.map(p => (
                    <button
                      key={p.value}
                      type="button"
                      onClick={() => setPersonality(p.value)}
                      className={`w-full flex items-center justify-between p-3 rounded-lg border text-left transition-all focus:outline-none focus:ring-2 focus:ring-primary ${
                        personality === p.value
                          ? 'border-primary bg-primary/10'
                          : 'border-border hover:border-primary/50'
                      }`}
                      role="radio"
                      aria-checked={personality === p.value}
                    >
                      <div>
                        <span className="font-medium text-foreground">{p.label}</span>
                        <p className="text-xs text-muted-foreground">{p.description}</p>
                      </div>
                      {personality === p.value && (
                        <div className="w-2 h-2 rounded-full bg-primary" aria-hidden="true" />
                      )}
                    </button>
                  ))}
                </div>
              </fieldset>

              {/* Save Button */}
              <Button 
                className="w-full" 
                size="xl"
                onClick={handleSave}
                disabled={!name.trim()}
                aria-disabled={!name.trim()}
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
