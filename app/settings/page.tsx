'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  ChevronLeft, 
  Home, 
  Mic,
  BookOpen, 
  Settings, 
  TrendingUp,
  Edit3, 
  Trash2, 
  AlertTriangle,
  Clock,
  Plus,
  X
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ConnectionStatusBadge } from '@/components/connection-status-badge'
import { CatProfileSetup } from '@/components/cat-profile-setup'
import { 
  loadCatProfile, 
  saveCatProfile, 
  clearCatProfile, 
  loadCatRoutine,
  saveCatRoutine,
  clearAllMeowLogs 
} from '@/lib/storage'
import { useAgoraVoice } from '@/hooks/use-agora-voice'
import type { CatProfile, CatRoutine } from '@/lib/types'

const catPersonalityLabels: Record<CatProfile['personality'], string> = {
  'vocal': 'Very Vocal',
  'quiet': 'Quiet & Reserved',
  'demanding': 'Demanding Diva',
  'affectionate': 'Affectionate Purrer',
  'independent': 'Independent Spirit',
}

export default function SettingsPage() {
  const router = useRouter()
  const [catProfile, setCatProfile] = useState<CatProfile | null>(null)
  const [routine, setRoutine] = useState<CatRoutine | null>(null)
  const [showProfileSetup, setShowProfileSetup] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showRoutineEditor, setShowRoutineEditor] = useState(false)
  const [isHydrated, setIsHydrated] = useState(false)

  const agora = useAgoraVoice()

  useEffect(() => {
    const profile = loadCatProfile()
    const savedRoutine = loadCatRoutine()
    setCatProfile(profile)
    setRoutine(savedRoutine)
    setIsHydrated(true)
  }, [])

  const handleProfileSave = (profile: CatProfile) => {
    saveCatProfile(profile)
    setCatProfile(profile)
    setShowProfileSetup(false)
  }

  const handleDeleteProfile = () => {
    clearCatProfile()
    clearAllMeowLogs()
    router.push('/')
  }

  const handleRoutineSave = (newRoutine: CatRoutine) => {
    saveCatRoutine(newRoutine)
    setRoutine(newRoutine)
    setShowRoutineEditor(false)
  }

  const getConnectionStatus = (): 'connected' | 'connecting' | 'demo-mode' | 'ready' | 'error' => {
    if (!agora.isAgoraConfigured) return 'demo-mode'
    if (agora.error) return 'error'
    if (agora.connectionStatus === 'connected') return 'connected'
    if (agora.connectionStatus === 'connecting') return 'connecting'
    if (agora.connectionStatus === 'error') return 'error'
    return 'ready'
  }

  if (!isHydrated) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-background">
        <div 
          className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"
          role="status"
          aria-label="Loading settings"
        />
      </main>
    )
  }

  return (
    <main className="min-h-screen flex flex-col pb-24 bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b">
        <div className="flex items-center justify-between px-4 py-3 max-w-lg mx-auto">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => router.back()}
            aria-label="Go back"
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>
          
          <h1 className="font-semibold text-foreground">Settings</h1>
          
          <div className="w-10" aria-hidden="true" />
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 px-4 py-6 space-y-6 max-w-lg mx-auto w-full">
        {/* Cat Profile Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          aria-labelledby="cat-profile-heading"
        >
          <h2 id="cat-profile-heading" className="text-sm font-medium text-muted-foreground mb-3 px-1">
            Cat Profile
          </h2>
          
          {catProfile ? (
            <Card className="p-4">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-2xl">
                    {catProfile.photoUrl ? (
                      <img 
                        src={catProfile.photoUrl} 
                        alt={catProfile.name}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    ) : (
                      '🐱'
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">{catProfile.name}</h3>
                    <p className="text-xs text-muted-foreground">
                      {catPersonalityLabels[catProfile.personality]}
                    </p>
                  </div>
                </div>
                <Badge variant="secondary" className="text-xs">
                  {catProfile.ageGroup === 'kitten' ? 'Kitten' : 
                   catProfile.ageGroup === 'adult' ? 'Adult' : 'Senior'}
                </Badge>
              </div>
              
              {catProfile.healthNotes && (
                <p className="text-xs text-muted-foreground mb-4 p-2 bg-secondary/50 rounded">
                  {catProfile.healthNotes}
                </p>
              )}
              
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowProfileSetup(true)}
                  aria-label={`Edit ${catProfile.name}'s profile`}
                >
                  <Edit3 className="w-4 h-4 mr-2" aria-hidden="true" />
                  Edit Profile
                </Button>
                <Button
                  variant="outline"
                  className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
                  onClick={() => setShowDeleteConfirm(true)}
                  aria-label="Delete cat profile"
                >
                  <Trash2 className="w-4 h-4" aria-hidden="true" />
                </Button>
              </div>
            </Card>
          ) : (
            <Card className="p-6 text-center">
              <p className="text-muted-foreground mb-4">No cat profile created yet</p>
              <Button onClick={() => setShowProfileSetup(true)}>
                Create Profile
              </Button>
            </Card>
          )}
        </motion.section>

        {/* Routine Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          aria-labelledby="routine-heading"
        >
          <h2 id="routine-heading" className="text-sm font-medium text-muted-foreground mb-3 px-1">
            Daily Routine
          </h2>
          
          <Card className="p-4">
            {routine ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-foreground">Feeding Times</span>
                  </div>
                  <div className="flex gap-1">
                    {routine.feedingTimes.map((time, i) => (
                      <Badge key={i} variant="secondary" className="text-xs">
                        {time}
                      </Badge>
                    ))}
                  </div>
                </div>
                
                {routine.playTimes && routine.playTimes.length > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-foreground">Play Times</span>
                    <div className="flex gap-1">
                      {routine.playTimes.map((time, i) => (
                        <Badge key={i} variant="outline" className="text-xs">
                          {time}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full mt-2"
                  onClick={() => setShowRoutineEditor(true)}
                >
                  <Edit3 className="w-3 h-3 mr-2" />
                  Edit Routine
                </Button>
              </div>
            ) : (
              <div className="text-center py-2">
                <p className="text-sm text-muted-foreground mb-3">
                  Add your cat&apos;s routine for smarter interpretations
                </p>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setShowRoutineEditor(true)}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Routine
                </Button>
              </div>
            )}
          </Card>
        </motion.section>

        {/* Connection Status Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          aria-labelledby="connection-heading"
        >
          <h2 id="connection-heading" className="text-sm font-medium text-muted-foreground mb-3 px-1">
            Connection Status
          </h2>
          
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-foreground mb-1">Agora Voice</p>
                <p className="text-xs text-muted-foreground">
                  Real-time voice capture service
                </p>
              </div>
              <ConnectionStatusBadge 
                status={getConnectionStatus()} 
                error={agora.error}
              />
            </div>
          </Card>
        </motion.section>

        {/* About Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          aria-labelledby="about-heading"
        >
          <h2 id="about-heading" className="text-sm font-medium text-muted-foreground mb-3 px-1">
            About
          </h2>
          
          <Card className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-foreground">Version</span>
              <span className="text-sm text-muted-foreground">2.0.0</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-foreground">Data Storage</span>
              <span className="text-sm text-muted-foreground">Local Only</span>
            </div>
            <p className="text-xs text-muted-foreground pt-2 border-t">
              What Meow? helps you understand your cat&apos;s vocalizations using 
              context-aware interpretation. All data stays on your device. 
              This is for entertainment and bonding - always consult a vet 
              for health concerns.
            </p>
          </Card>
        </motion.section>
      </div>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <motion.div 
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
            onClick={() => setShowDeleteConfirm(false)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-dialog-title"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={e => e.stopPropagation()}
            >
              <Card className="p-6 max-w-sm">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center">
                    <AlertTriangle className="w-5 h-5 text-destructive" aria-hidden="true" />
                  </div>
                  <h3 id="delete-dialog-title" className="text-lg font-semibold text-foreground">
                    Delete Profile?
                  </h3>
                </div>
                <p className="text-sm text-muted-foreground mb-6">
                  This will permanently delete {catProfile?.name}&apos;s profile and all 
                  meow logs. This action cannot be undone.
                </p>
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => setShowDeleteConfirm(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    className="flex-1"
                    onClick={handleDeleteProfile}
                  >
                    Delete
                  </Button>
                </div>
              </Card>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Routine Editor Modal */}
      <AnimatePresence>
        {showRoutineEditor && (
          <RoutineEditor
            routine={routine}
            onSave={handleRoutineSave}
            onClose={() => setShowRoutineEditor(false)}
          />
        )}
      </AnimatePresence>

      {/* Bottom Navigation */}
      <nav 
        className="fixed bottom-0 left-0 right-0 bg-background/80 backdrop-blur-sm border-t border-border"
        aria-label="Main navigation"
      >
        <div className="max-w-lg mx-auto px-4 py-2 flex items-center justify-around">
          <Link href="/" aria-label="Home">
            <Button variant="ghost" size="icon" className="text-muted-foreground">
              <Home className="w-5 h-5" />
            </Button>
          </Link>
          <Link href="/app" aria-label="Record meow">
            <Button variant="ghost" size="icon" className="text-muted-foreground">
              <Mic className="w-5 h-5" />
            </Button>
          </Link>
          <Link href="/log" aria-label="Meow log">
            <Button variant="ghost" size="icon" className="text-muted-foreground">
              <BookOpen className="w-5 h-5" />
            </Button>
          </Link>
          <Link href="/insights" aria-label="Insights">
            <Button variant="ghost" size="icon" className="text-muted-foreground">
              <TrendingUp className="w-5 h-5" />
            </Button>
          </Link>
          <Link href="/settings" aria-label="Settings" aria-current="page">
            <Button variant="ghost" size="icon" className="text-primary">
              <Settings className="w-5 h-5" />
            </Button>
          </Link>
        </div>
      </nav>

      {/* Profile Setup Modal */}
      <CatProfileSetup
        isOpen={showProfileSetup}
        onClose={() => setShowProfileSetup(false)}
        onSave={handleProfileSave}
        initialProfile={catProfile}
      />
    </main>
  )
}

// Routine Editor Component
function RoutineEditor({ 
  routine, 
  onSave, 
  onClose 
}: { 
  routine: CatRoutine | null
  onSave: (routine: CatRoutine) => void
  onClose: () => void
}) {
  const [feedingTimes, setFeedingTimes] = useState<string[]>(
    routine?.feedingTimes || ['08:00', '18:00']
  )
  const [playTimes, setPlayTimes] = useState<string[]>(
    routine?.playTimes || []
  )

  const addFeedingTime = () => {
    setFeedingTimes([...feedingTimes, '12:00'])
  }

  const removeFeedingTime = (index: number) => {
    setFeedingTimes(feedingTimes.filter((_, i) => i !== index))
  }

  const updateFeedingTime = (index: number, value: string) => {
    const updated = [...feedingTimes]
    updated[index] = value
    setFeedingTimes(updated)
  }

  const addPlayTime = () => {
    setPlayTimes([...playTimes, '10:00'])
  }

  const removePlayTime = (index: number) => {
    setPlayTimes(playTimes.filter((_, i) => i !== index))
  }

  const updatePlayTime = (index: number, value: string) => {
    const updated = [...playTimes]
    updated[index] = value
    setPlayTimes(updated)
  }

  const handleSave = () => {
    onSave({
      feedingTimes: feedingTimes.filter(t => t),
      playTimes: playTimes.filter(t => t),
    })
  }

  return (
    <motion.div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
      onClick={onClose}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="routine-dialog-title"
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        onClick={e => e.stopPropagation()}
        className="w-full max-w-sm"
      >
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 id="routine-dialog-title" className="text-lg font-semibold text-foreground">
              Edit Routine
            </h3>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
          
          <div className="space-y-6">
            {/* Feeding Times */}
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                Feeding Times
              </label>
              <div className="space-y-2">
                {feedingTimes.map((time, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <input
                      type="time"
                      value={time}
                      onChange={(e) => updateFeedingTime(index, e.target.value)}
                      className="flex-1 px-3 py-2 rounded-md border border-input bg-background text-sm"
                    />
                    {feedingTimes.length > 1 && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeFeedingTime(index)}
                        className="text-muted-foreground hover:text-destructive"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={addFeedingTime}
                  className="w-full"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Feeding Time
                </Button>
              </div>
            </div>

            {/* Play Times */}
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                Play Times (Optional)
              </label>
              <div className="space-y-2">
                {playTimes.map((time, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <input
                      type="time"
                      value={time}
                      onChange={(e) => updatePlayTime(index, e.target.value)}
                      className="flex-1 px-3 py-2 rounded-md border border-input bg-background text-sm"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removePlayTime(index)}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={addPlayTime}
                  className="w-full"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Play Time
                </Button>
              </div>
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <Button variant="outline" className="flex-1" onClick={onClose}>
              Cancel
            </Button>
            <Button className="flex-1" onClick={handleSave}>
              Save Routine
            </Button>
          </div>
        </Card>
      </motion.div>
    </motion.div>
  )
}
