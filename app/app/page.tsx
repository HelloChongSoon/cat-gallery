'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Settings, BookOpen, Home, Play, Info } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { PetProfileCard } from '@/components/pet-profile-card'
import { PetProfileSetup } from '@/components/pet-profile-setup'
import { VoiceRecorderButton } from '@/components/voice-recorder-button'
import { WaveformVisualizer } from '@/components/waveform-visualizer'
import { TranslationLoadingState } from '@/components/translation-loading-state'
import { PetChatBubble } from '@/components/pet-chat-bubble'
import { MoodInsightCard } from '@/components/mood-insight-card'
import { ShareCard } from '@/components/share-card'
import { ConnectionStatusBadge } from '@/components/connection-status-badge'
import { useAgoraVoice } from '@/hooks/use-agora-voice'
import { useMockVoice } from '@/hooks/use-mock-voice'
import { loadPetProfile, savePetProfile, saveTranslation, generateId } from '@/lib/storage'
import { generatePetTranslation } from '@/lib/translation-generator'
import type { PetProfile, TranslationResult, RecordingState } from '@/lib/types'

export default function AppPage() {
  const router = useRouter()
  const [petProfile, setPetProfile] = useState<PetProfile | null>(null)
  const [showProfileSetup, setShowProfileSetup] = useState(false)
  const [recordingState, setRecordingState] = useState<RecordingState>('idle')
  const [translation, setTranslation] = useState<TranslationResult | null>(null)
  const [isSaved, setIsSaved] = useState(false)
  const [isLoaded, setIsLoaded] = useState(false)

  // Agora voice hook
  const agora = useAgoraVoice()
  
  // Mock voice hook for demo mode
  const mock = useMockVoice()

  // Determine if we're in demo mode
  const isDemoMode = !agora.isAgoraConfigured

  useEffect(() => {
    const profile = loadPetProfile()
    if (!profile) {
      router.replace('/')
      return
    }
    setPetProfile(profile)
    setIsLoaded(true)
    
    // Initialize Agora session if configured
    if (agora.isAgoraConfigured) {
      agora.startSession()
    }
    
    return () => {
      if (agora.isConnected) {
        agora.stopSession()
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleProfileSave = (profile: PetProfile) => {
    savePetProfile(profile)
    setPetProfile(profile)
  }

  const handleRecordStart = useCallback(() => {
    if (!petProfile) return
    
    setRecordingState('listening')
    setTranslation(null)
    setIsSaved(false)

    if (isDemoMode) {
      mock.startRecording()
    } else {
      agora.startRecording()
    }
  }, [petProfile, isDemoMode, mock, agora])

  const handleRecordStop = useCallback(async () => {
    if (!petProfile) return

    if (isDemoMode) {
      mock.stopRecording()
    } else {
      await agora.stopRecording()
    }

    setRecordingState('translating')

    // Simulate translation processing
    await new Promise(resolve => setTimeout(resolve, 3000))

    // Generate fake translation
    const result = generatePetTranslation(petProfile, petProfile.type)
    const fullResult: TranslationResult = {
      ...result,
      id: generateId(),
      petId: petProfile.id,
      createdAt: new Date().toISOString(),
    }

    setTranslation(fullResult)
    setRecordingState('result')
  }, [petProfile, isDemoMode, mock, agora])

  const handleCopy = useCallback(() => {
    if (translation) {
      navigator.clipboard.writeText(translation.translatedMessage)
    }
  }, [translation])

  const handleSave = useCallback(() => {
    if (translation && !isSaved) {
      saveTranslation(translation)
      setIsSaved(true)
    }
  }, [translation, isSaved])

  const handleReset = useCallback(() => {
    setRecordingState('idle')
    setTranslation(null)
    setIsSaved(false)
  }, [])

  const handleDemoRecord = useCallback(() => {
    if (!petProfile) return
    
    handleRecordStart()
    
    // Auto-stop after 2 seconds for demo
    setTimeout(() => {
      handleRecordStop()
    }, 2000)
  }, [petProfile, handleRecordStart, handleRecordStop])

  // Get connection status
  const getConnectionStatus = () => {
    if (agora.error) return 'error'
    if (!agora.isAgoraConfigured) return 'demo-mode'
    if (agora.isConnected) return 'connected'
    return 'missing-credentials'
  }

  if (!isLoaded || !petProfile) {
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
          <Link href="/">
            <Button variant="ghost" size="icon">
              <Home className="w-5 h-5" />
            </Button>
          </Link>
          
          <div className="flex items-center gap-2">
            <span className="text-2xl animate-bounce-soft">{petProfile.avatarEmoji}</span>
            <span className="font-semibold text-foreground">{petProfile.name}</span>
          </div>
          
          <Link href="/settings">
            <Button variant="ghost" size="icon">
              <Settings className="w-5 h-5" />
            </Button>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 px-4 py-6">
        <AnimatePresence mode="wait">
          {/* Idle State */}
          {recordingState === 'idle' && (
            <motion.div
              key="idle"
              className="flex flex-col items-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {/* Status Badge */}
              <div className="mb-6">
                <ConnectionStatusBadge 
                  status={getConnectionStatus()} 
                  error={agora.error}
                />
              </div>

              {/* Demo Mode Info */}
              {isDemoMode && (
                <Card className="w-full max-w-sm mb-6 p-4">
                  <div className="flex items-start gap-3">
                    <Info className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-foreground mb-1">Demo Mode Active</p>
                      <p className="text-xs text-muted-foreground">
                        Real voice recording requires Agora credentials. 
                        Tap the demo button below to test with simulated audio.
                      </p>
                    </div>
                  </div>
                </Card>
              )}

              {/* Waveform Preview */}
              <div className="w-full max-w-sm mb-8">
                <WaveformVisualizer 
                  volumeLevel={isDemoMode ? mock.volumeLevel : agora.volumeLevel} 
                  isActive={false}
                />
              </div>

              {/* Recording Button */}
              <div className="mb-16">
                <VoiceRecorderButton
                  isRecording={false}
                  onRecordStart={handleRecordStart}
                  onRecordStop={handleRecordStop}
                  isDisabled={!isDemoMode && !agora.isConnected}
                />
              </div>

              {/* Demo Button */}
              {isDemoMode && (
                <Button
                  variant="outline"
                  className="gap-2"
                  onClick={handleDemoRecord}
                >
                  <Play className="w-4 h-4" />
                  Use Demo Meow
                </Button>
              )}
            </motion.div>
          )}

          {/* Listening State */}
          {recordingState === 'listening' && (
            <motion.div
              key="listening"
              className="flex flex-col items-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <Badge variant="default" className="mb-6 animate-pulse">
                Listening...
              </Badge>

              {/* Active Waveform */}
              <div className="w-full max-w-sm mb-8">
                <WaveformVisualizer 
                  volumeLevel={isDemoMode ? mock.volumeLevel : agora.volumeLevel} 
                  isActive={true}
                />
              </div>

              {/* Recording Button */}
              <VoiceRecorderButton
                isRecording={true}
                onRecordStart={handleRecordStart}
                onRecordStop={handleRecordStop}
                volumeLevel={isDemoMode ? mock.volumeLevel : agora.volumeLevel}
              />
            </motion.div>
          )}

          {/* Translating State */}
          {recordingState === 'translating' && (
            <motion.div
              key="translating"
              className="flex flex-col items-center justify-center min-h-[60vh]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <TranslationLoadingState isVisible={true} />
            </motion.div>
          )}

          {/* Result State */}
          {recordingState === 'result' && translation && (
            <motion.div
              key="result"
              className="flex flex-col gap-4 max-w-sm mx-auto"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {/* Pet Profile */}
              <PetProfileCard 
                profile={petProfile} 
                size="sm"
                onEdit={() => setShowProfileSetup(true)}
              />

              {/* Chat Bubble */}
              <PetChatBubble
                message={translation.translatedMessage}
                avatarEmoji={petProfile.avatarEmoji}
                petName={petProfile.name}
              />

              {/* Mood Insights */}
              <MoodInsightCard
                mood={translation.mood}
                intent={translation.intent}
                confidence={translation.confidence}
                severity={translation.severity}
                suggestedAction={translation.suggestedAction}
              />

              {/* Share Actions */}
              <ShareCard
                message={translation.translatedMessage}
                petName={petProfile.name}
                onCopy={handleCopy}
                onSave={handleSave}
                onReset={handleReset}
                isSaved={isSaved}
              />
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
            <Button variant="ghost" className="flex flex-col items-center gap-1 h-auto py-2">
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

      {/* Profile Setup Modal */}
      <PetProfileSetup
        isOpen={showProfileSetup}
        onClose={() => setShowProfileSetup(false)}
        onSave={handleProfileSave}
        initialProfile={petProfile}
      />
    </main>
  )
}
