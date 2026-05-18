'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, Trash2, BookOpen, Home, Settings, Mic } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { loadTranslations, deleteTranslation, loadPetProfile } from '@/lib/storage'
import type { TranslationResult, PetProfile } from '@/lib/types'

// Group translations by date
function groupByDate(translations: TranslationResult[]): Record<string, TranslationResult[]> {
  const groups: Record<string, TranslationResult[]> = {}
  
  translations.forEach(t => {
    const date = new Date(t.createdAt).toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
    })
    
    if (!groups[date]) {
      groups[date] = []
    }
    groups[date].push(t)
  })
  
  return groups
}

export default function DiaryPage() {
  const router = useRouter()
  const [translations, setTranslations] = useState<TranslationResult[]>([])
  const [petProfile, setPetProfile] = useState<PetProfile | null>(null)
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    const stored = loadTranslations()
    const profile = loadPetProfile()
    setTranslations(stored)
    setPetProfile(profile)
    setIsLoaded(true)
  }, [])

  const handleDelete = (id: string) => {
    deleteTranslation(id)
    setTranslations(prev => prev.filter(t => t.id !== id))
  }

  const groupedTranslations = groupByDate(translations)
  const dateKeys = Object.keys(groupedTranslations)

  if (!isLoaded) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </main>
    )
  }

  return (
    <main className="min-h-screen flex flex-col pb-20">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b">
        <div className="flex items-center justify-between px-4 py-3">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ChevronLeft className="w-5 h-5" />
          </Button>
          
          <h1 className="font-semibold text-foreground">Translation Diary</h1>
          
          <div className="w-10" /> {/* Spacer */}
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 px-4 py-6">
        <AnimatePresence mode="wait">
          {translations.length === 0 ? (
            <motion.div
              key="empty"
              className="flex flex-col items-center justify-center py-16 text-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              <div className="w-20 h-20 rounded-full bg-secondary flex items-center justify-center mb-6">
                <BookOpen className="w-10 h-10 text-muted-foreground" />
              </div>
              <h2 className="text-xl font-semibold text-foreground mb-2">
                No translations yet
              </h2>
              <p className="text-muted-foreground max-w-xs mb-6">
                Your saved pet translations will appear here. 
                Time to record some meows and barks!
              </p>
              <Link href="/app">
                <Button>
                  <Mic className="w-4 h-4 mr-2" />
                  Start Recording
                </Button>
              </Link>
            </motion.div>
          ) : (
            <motion.div
              key="list"
              className="space-y-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {dateKeys.map((date, dateIndex) => (
                <div key={date}>
                  <h2 className="text-sm font-medium text-muted-foreground mb-3 px-1">
                    {date}
                  </h2>
                  <div className="space-y-3">
                    {groupedTranslations[date].map((translation, index) => (
                      <motion.div
                        key={translation.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: dateIndex * 0.1 + index * 0.05 }}
                      >
                        <Card className="p-4">
                          <div className="flex items-start gap-3">
                            <div className="text-3xl flex-shrink-0">
                              {petProfile?.avatarEmoji || '🐾'}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-foreground leading-relaxed mb-2">
                                {translation.translatedMessage}
                              </p>
                              <div className="flex items-center gap-2 flex-wrap">
                                <Badge variant="secondary" className="text-xs">
                                  {translation.mood}
                                </Badge>
                                <Badge variant="outline" className="text-xs">
                                  {translation.confidence}% confident
                                </Badge>
                                <span className="text-xs text-muted-foreground">
                                  {new Date(translation.createdAt).toLocaleTimeString('en-US', {
                                    hour: 'numeric',
                                    minute: '2-digit',
                                  })}
                                </span>
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="flex-shrink-0 text-muted-foreground hover:text-destructive"
                              onClick={() => handleDelete(translation.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </Card>
                      </motion.div>
                    ))}
                  </div>
                </div>
              ))}
              
              {/* Summary */}
              <div className="text-center pt-4">
                <p className="text-xs text-muted-foreground">
                  {translations.length} translation{translations.length === 1 ? '' : 's'} saved
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-sm border-t">
        <div className="flex items-center justify-around py-3 px-4 max-w-md mx-auto">
          <Link href="/">
            <Button variant="ghost" className="flex flex-col items-center gap-1 h-auto py-2">
              <Home className="w-5 h-5" />
              <span className="text-xs">Home</span>
            </Button>
          </Link>
          
          <Link href="/diary">
            <Button variant="ghost" className="flex flex-col items-center gap-1 h-auto py-2 text-primary">
              <BookOpen className="w-5 h-5" />
              <span className="text-xs">Diary</span>
            </Button>
          </Link>
          
          <Link href="/settings">
            <Button variant="ghost" className="flex flex-col items-center gap-1 h-auto py-2">
              <Settings className="w-5 h-5" />
              <span className="text-xs">Settings</span>
            </Button>
          </Link>
        </div>
      </nav>
    </main>
  )
}
