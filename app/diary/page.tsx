'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, Trash2, BookOpen, Home, Settings, Mic, Search, X } from 'lucide-react'
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
  const [isHydrated, setIsHydrated] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  // Hydration-safe data loading
  useEffect(() => {
    const stored = loadTranslations()
    const profile = loadPetProfile()
    setTranslations(stored)
    setPetProfile(profile)
    setIsHydrated(true)
  }, [])

  const handleDelete = useCallback((id: string) => {
    if (confirmDelete === id) {
      deleteTranslation(id)
      setTranslations(prev => prev.filter(t => t.id !== id))
      setConfirmDelete(null)
    } else {
      setConfirmDelete(id)
      // Auto-reset confirmation after 3 seconds
      setTimeout(() => setConfirmDelete(prev => prev === id ? null : prev), 3000)
    }
  }, [confirmDelete])

  // Filter translations by search query
  const filteredTranslations = searchQuery.trim()
    ? translations.filter(t => 
        t.translatedMessage.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.mood.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : translations

  const groupedTranslations = groupByDate(filteredTranslations)
  const dateKeys = Object.keys(groupedTranslations)

  if (!isHydrated) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-background">
        <div 
          className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"
          role="status"
          aria-label="Loading diary"
        />
      </main>
    )
  }

  return (
    <main className="min-h-screen flex flex-col pb-20 bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b">
        <div className="flex items-center justify-between px-4 py-3">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => router.back()}
            aria-label="Go back"
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>
          
          <h1 className="font-semibold text-foreground">Translation Diary</h1>
          
          <div className="w-10" aria-hidden="true" />
        </div>

        {/* Search bar - only show if there are translations */}
        {translations.length > 0 && (
          <div className="px-4 pb-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
              <input
                type="search"
                placeholder="Search translations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-10 py-2 rounded-lg border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                aria-label="Search translations"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  aria-label="Clear search"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Content */}
      <div className="flex-1 px-4 py-6">
        <AnimatePresence mode="wait">
          {filteredTranslations.length === 0 ? (
            <motion.div
              key="empty"
              className="flex flex-col items-center justify-center py-16 text-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              <div className="w-20 h-20 rounded-full bg-secondary flex items-center justify-center mb-6">
                <BookOpen className="w-10 h-10 text-muted-foreground" aria-hidden="true" />
              </div>
              <h2 className="text-xl font-semibold text-foreground mb-2">
                {searchQuery ? 'No matches found' : 'No translations yet'}
              </h2>
              <p className="text-muted-foreground max-w-xs mb-6">
                {searchQuery 
                  ? 'Try a different search term.'
                  : 'Your saved pet translations will appear here. Time to record some meows and barks!'}
              </p>
              {searchQuery ? (
                <Button variant="outline" onClick={() => setSearchQuery('')}>
                  Clear Search
                </Button>
              ) : (
                <Link href="/app">
                  <Button>
                    <Mic className="w-4 h-4 mr-2" aria-hidden="true" />
                    Start Recording
                  </Button>
                </Link>
              )}
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
                <section key={date} aria-labelledby={`date-${dateIndex}`}>
                  <h2 
                    id={`date-${dateIndex}`}
                    className="text-sm font-medium text-muted-foreground mb-3 px-1"
                  >
                    {date}
                  </h2>
                  <ul className="space-y-3" role="list">
                    {groupedTranslations[date].map((translation, index) => (
                      <motion.li
                        key={translation.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: dateIndex * 0.1 + index * 0.05 }}
                      >
                        <Card className="p-4">
                          <article className="flex items-start gap-3">
                            <div 
                              className="text-3xl flex-shrink-0" 
                              role="img" 
                              aria-label="Pet avatar"
                            >
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
                                <time 
                                  className="text-xs text-muted-foreground"
                                  dateTime={translation.createdAt}
                                >
                                  {new Date(translation.createdAt).toLocaleTimeString('en-US', {
                                    hour: 'numeric',
                                    minute: '2-digit',
                                  })}
                                </time>
                              </div>
                            </div>
                            <Button
                              variant={confirmDelete === translation.id ? "destructive" : "ghost"}
                              size="icon"
                              className="flex-shrink-0"
                              onClick={() => handleDelete(translation.id)}
                              aria-label={confirmDelete === translation.id 
                                ? "Confirm delete translation" 
                                : "Delete translation"
                              }
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </article>
                        </Card>
                      </motion.li>
                    ))}
                  </ul>
                </section>
              ))}
              
              {/* Summary */}
              <div className="text-center pt-4">
                <p className="text-xs text-muted-foreground">
                  {filteredTranslations.length} translation{filteredTranslations.length === 1 ? '' : 's'} 
                  {searchQuery && ` matching "${searchQuery}"`}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom Navigation */}
      <nav 
        className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-sm border-t"
        aria-label="Main navigation"
      >
        <div className="flex items-center justify-around py-3 px-4 max-w-md mx-auto">
          <Link href="/" aria-label="Home">
            <Button variant="ghost" className="flex flex-col items-center gap-1 h-auto py-2">
              <Home className="w-5 h-5" aria-hidden="true" />
              <span className="text-xs">Home</span>
            </Button>
          </Link>
          
          <Link href="/diary" aria-current="page" aria-label="Diary (current page)">
            <Button variant="ghost" className="flex flex-col items-center gap-1 h-auto py-2 text-primary">
              <BookOpen className="w-5 h-5" aria-hidden="true" />
              <span className="text-xs">Diary</span>
            </Button>
          </Link>
          
          <Link href="/settings" aria-label="Settings">
            <Button variant="ghost" className="flex flex-col items-center gap-1 h-auto py-2">
              <Settings className="w-5 h-5" aria-hidden="true" />
              <span className="text-xs">Settings</span>
            </Button>
          </Link>
        </div>
      </nav>
    </main>
  )
}
