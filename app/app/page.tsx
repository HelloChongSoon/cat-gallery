'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Settings, BookOpen, Home, Play, Info, AlertCircle, Mic, CheckCircle2, Clock, Wifi, WifiOff } from 'lucide-react'
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
  const [isHydrated, setIsHydrated] = useState(false)
  const [copyFeedback, setCopyFeedback] = useState(false)
  
  // Track if component is mounted
  const isMountedRef = useRef(true)
  const sessionStartedRef = useRef(false)

  // Agora voice hook
  const agora = useAgoraVoice()
  
  // Mock voice hook for demo mode
  const mock = useMockVoice()

  // Determine if we're in demo mode (not configured OR connection failed)
  const isDemoMode = !agora.isAgoraConfigured || agora.connectionStatus === 'error'

  // Hydration effect - load profile from localStorage
  useEffect(() => {
    const profile = loadPetProfile()
    if (!profile) {
      router.replace('/')
      return
    }
    setPetProfile(profile)
    setIsHydrated(true)
    
    return () => {
      isMountedRef.current = false
    }
  }, [router])

  // Initialize Agora session when profile is loaded
  useEffect(() => {
    if (!isHydrated || !petProfile || sessionStartedRef.current) return
    
    if (agora.isAgoraConfigured && !agora.isConnected && !agora.isConnecting) {
      sessionStartedRef.current = true
      agora.startSession()
    }
    
    return () => {
      // Only cleanup on unmount, not on re-renders
      if (!isMountedRef.current && agora.isConnected) {
        agora.stopSession()
      }
    }
  }, [isHydrated, petProfile, agora])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false
      sessionStartedRef.current = false
    }
  }, [])

  const handleProfileSave = useCallback((profile: PetProfile) => {
    savePetProfile(profile)
    setPetProfile(profile)
  }, [])

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
    if (!petProfile || !isMountedRef.current) return

    if (isDemoMode) {
      mock.stopRecording()
    } else {
      await agora.stopRecording()
    }

    setRecordingState('translating')

    // Simulate translation processing
    await new Promise(resolve => setTimeout(resolve, 2500))

    if (!isMountedRef.current) return

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

  const handleCopy = useCallback(async () => {
    if (translation) {
      try {
        await navigator.clipboard.writeText(translation.translatedMessage)
        setCopyFeedback(true)
        setTimeout(() => setCopyFeedback(false), 2000)
      } catch {
        // Fallback for older browsers
        const textArea = document.createElement('textarea')
        textArea.value = translation.translatedMessage
        document.body.appendChild(textArea)
        textArea.select()
        document.execCommand('copy')
        document.body.removeChild(textArea)
        setCopyFeedback(true)
        setTimeout(() => setCopyFeedback(false), 2000)
      }
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
    if (!petProfile || recordingState !== 'idle') return
    
    handleRecordStart()
    
    // Auto-stop after 2 seconds for demo
    setTimeout(() => {
      if (isMountedRef.current) {
        handleRecordStop()
      }
    }, 2000)
  }, [petProfile, recordingState, handleRecordStart, handleRecordStop])

  // Get connection status for badge display
  const getConnectionStatus = useCallback((): 'connected' | 'connecting' | 'demo-mode' | 'missing-credentials' | 'error' => {
    if (!agora.isAgoraConfigured) return 'demo-mode'
    if (agora.error) return 'error'
    if (agora.connectionStatus === 'connected') return 'connected'
    if (agora.connectionStatus === 'connecting') return 'connecting'
    if (agora.connectionStatus === 'error') return 'error'
    return 'missing-credentials'
  }, [agora.isAgoraConfigured, agora.error, agora.connectionStatus])

  // Handle microphone permission request
  const handleRequestPermission = useCallback(async () => {
    const granted = await agora.requestPermission()
    if (granted && agora.isAgoraConfigured && !agora.isConnected) {
      await agora.startSession()
    }
  }, [agora])

  // Loading state during hydration
  if (!isHydrated || !petProfile) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-background">
        <div 
          className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" 
          role="status"
          aria-label="Loading"
        />
      </main>
    )
  }

  const currentVolumeLevel = isDemoMode ? mock.volumeLevel : agora.volumeLevel
  const isButtonDisabled = !isDemoMode && !agora.isConnected
  const isConnecting = agora.isConnecting
  const showPermissionPrompt = !isDemoMode && agora.permissionStatus === 'denied'

  return (
    <main className="min-h-screen flex flex-col pb-20 bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b">
        <div className="flex items-center justify-between px-4 py-3">
          <Link href="/" aria-label="Go to home page">
            <Button variant="ghost" size="icon" aria-label="Home">
              <Home className="w-5 h-5" />
            </Button>
          </Link>
          
          <div className="flex items-center gap-2">
            <span className="text-2xl" role="img" aria-label={`${petProfile.name} avatar`}>
              {petProfile.avatarEmoji}
            </span>
            <span className="font-semibold text-foreground">{petProfile.name}</span>
          </div>
          
          <Link href="/settings" aria-label="Go to settings">
            <Button variant="ghost" size="icon" aria-label="Settings">
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

              {/* Permission Denied Warning */}
              {showPermissionPrompt && (
                <Card className="w-full max-w-sm mb-6 p-4 border-destructive/50 bg-destructive/5">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-foreground mb-1">Microphone Access Denied</p>
                      <p className="text-xs text-muted-foreground mb-3">
                        Please enable microphone access in your browser settings to use voice recording.
                      </p>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={handleRequestPermission}
                        className="text-xs"
                      >
                        <Mic className="w-3 h-3 mr-1" />
                        Try Again
                      </Button>
                    </div>
                  </div>
                </Card>
              )}

              {/* Production Status Card */}
              {!isDemoMode && agora.isConnected && agora.tokenInfo && (
                <Card className="w-full max-w-sm mb-6 p-4 bg-card/50">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-muted-foreground">Connection Status</span>
                      <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                        <span className="text-xs text-green-600 font-medium">Connected</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-muted-foreground">Token Status</span>
                      <div className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-3 h-3 text-green-500" />
                        <span className="text-xs text-foreground">Generated</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-muted-foreground">Token Expires In</span>
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3 h-3 text-muted-foreground" />
                        <span className={`text-xs font-mono ${
                          agora.tokenExpiresIn && agora.tokenExpiresIn < 300 
                            ? 'text-orange-500' 
                            : 'text-foreground'
                        }`}>
                          {agora.tokenExpiresIn 
                            ? `${Math.floor(agora.tokenExpiresIn / 60)}:${String(agora.tokenExpiresIn % 60).padStart(2, '0')}`
                            : '--:--'
                          }
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-muted-foreground">Mic Permission</span>
                      <div className="flex items-center gap-1.5">
                        {agora.permissionStatus === 'granted' ? (
                          <>
                            <Mic className="w-3 h-3 text-green-500" />
                            <span className="text-xs text-green-600">Granted</span>
                          </>
                        ) : agora.permissionStatus === 'denied' ? (
                          <>
                            <AlertCircle className="w-3 h-3 text-destructive" />
                            <span className="text-xs text-destructive">Denied</span>
                          </>
                        ) : (
                          <>
                            <Mic className="w-3 h-3 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">Pending</span>
                          </>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-muted-foreground">Channel</span>
                      <span className="text-xs font-mono text-foreground">{agora.tokenInfo.channelName}</span>
                    </div>
                  </div>
                </Card>
              )}

              {/* Demo Mode Info */}
              {isDemoMode && (
                <Card className="w-full max-w-sm mb-6 p-4">
                  <div className="flex items-start gap-3">
                    <Info className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-foreground mb-1">Demo Mode Active</p>
                      <p className="text-xs text-muted-foreground">
                        {agora.connectionStatus === 'error' 
                          ? 'Agora connection failed. Using simulated audio for demo purposes.'
                          : 'Real voice recording requires Agora credentials. Tap the demo button below to test with simulated audio.'
                        }
                      </p>
                    </div>
                  </div>
                </Card>
              )}

              {/* Waveform Preview */}
              <div className="w-full max-w-sm mb-8">
                <WaveformVisualizer 
                  volumeLevel={currentVolumeLevel} 
                  isActive={false}
                />
              </div>

              {/* Recording Button */}
              <div className="mb-16">
                <VoiceRecorderButton
                  isRecording={false}
                  isLoading={isConnecting}
                  onRecordStart={handleRecordStart}
                  onRecordStop={handleRecordStop}
                  isDisabled={isButtonDisabled && !isDemoMode}
                />
              </div>

              {/* Demo Button */}
              {isDemoMode && (
                <Button
                  variant="outline"
                  className="gap-2"
                  onClick={handleDemoRecord}
                  aria-label="Try demo recording with simulated pet sounds"
                >
                  <Play className="w-4 h-4" />
                  Try Demo
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
                  volumeLevel={currentVolumeLevel} 
                  isActive={true}
                />
              </div>

              {/* Recording Button */}
              <VoiceRecorderButton
                isRecording={true}
                onRecordStart={handleRecordStart}
                onRecordStop={handleRecordStop}
                volumeLevel={currentVolumeLevel}
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
                copyFeedback={copyFeedback}
              />
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
              <Home className="w-5 h-5" />
              <span className="text-xs">Home</span>
            </Button>
          </Link>
          
          <Link href="/diary" aria-label="Translation diary">
            <Button variant="ghost" className="flex flex-col items-center gap-1 h-auto py-2">
              <BookOpen className="w-5 h-5" />
              <span className="text-xs">Diary</span>
            </Button>
          </Link>
          
          <Link href="/settings" aria-label="Settings">
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
