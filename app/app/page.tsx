'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Settings, BookOpen, Home, Play, Info, AlertCircle, Mic, TrendingUp, Cat } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { VoiceRecorderButton } from '@/components/voice-recorder-button'
import { WaveformVisualizer } from '@/components/waveform-visualizer'
import { ConnectionStatusBadge } from '@/components/connection-status-badge'
import { ContextTagging } from '@/components/context-tagging'
import { InterpretationResult, FeedbackForm } from '@/components/interpretation-result'
import { useAgoraVoice } from '@/hooks/use-agora-voice'
import { useMockVoice } from '@/hooks/use-mock-voice'
import { 
  loadCatProfile, 
  loadCatRoutine, 
  loadMeowLogs,
  saveMeowLog,
  updateMeowLogFeedback,
  generateId 
} from '@/lib/storage'
import { generateCareInterpretation } from '@/lib/interpretation-generator'
import type { 
  CatProfile, 
  CatRoutine,
  MeowSoundDetails, 
  MeowContext, 
  CareInterpretation,
  MeowLogEntry,
  RecordingState,
  FeedbackAccuracy,
  ActionThatHelped
} from '@/lib/types'

export default function AppPage() {
  const router = useRouter()
  const [catProfile, setCatProfile] = useState<CatProfile | null>(null)
  const [catRoutine, setCatRoutine] = useState<CatRoutine | null>(null)
  const [recordingState, setRecordingState] = useState<RecordingState>('idle')
  const [currentSound, setCurrentSound] = useState<MeowSoundDetails | null>(null)
  const [currentContext, setCurrentContext] = useState<MeowContext | null>(null)
  const [interpretation, setInterpretation] = useState<CareInterpretation | null>(null)
  const [currentLogEntry, setCurrentLogEntry] = useState<MeowLogEntry | null>(null)
  const [isHydrated, setIsHydrated] = useState(false)
  const [recordingError, setRecordingError] = useState<string | null>(null)
  const [isStartingRecording, setIsStartingRecording] = useState(false)
  
  const isMountedRef = useRef(true)
  const sessionStartedRef = useRef(false)

  // Agora voice hook
  const agora = useAgoraVoice()
  
  // Mock voice hook for demo mode
  const mock = useMockVoice()

  // Determine if we're in demo mode
  const isDemoMode = !agora.isAgoraConfigured || agora.connectionStatus === 'error'

  // Hydration effect
  useEffect(() => {
    const profile = loadCatProfile()
    if (!profile) {
      router.replace('/')
      return
    }
    setCatProfile(profile)
    setCatRoutine(loadCatRoutine())
    setIsHydrated(true)
    
    return () => {
      isMountedRef.current = false
    }
  }, [router])

  useEffect(() => {
    if (!isHydrated || !catProfile || sessionStartedRef.current) return
    if (!agora.isAgoraConfigured || agora.isConnected || agora.connectionStatus === 'connecting') return

    sessionStartedRef.current = true
    void agora.startSession().finally(() => {
      if (agora.connectionStatus === 'error') {
        sessionStartedRef.current = false
      }
    })
  }, [
    isHydrated,
    catProfile,
    agora.isAgoraConfigured,
    agora.isConnected,
    agora.connectionStatus,
    agora.startSession,
  ])

  useEffect(() => {
    return () => {
      mock.stopRecording()
      void agora.stopSession()
    }
  }, [agora.stopSession, mock.stopRecording])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false
      sessionStartedRef.current = false
    }
  }, [])

  // Get connection status for badge
  const getConnectionStatus = useCallback((): 'connected' | 'connecting' | 'demo-mode' | 'ready' | 'error' => {
    if (!agora.isAgoraConfigured) return 'demo-mode'
    if (agora.error) return 'error'
    if (agora.connectionStatus === 'connected') return 'connected'
    if (agora.connectionStatus === 'connecting') return 'connecting'
    if (agora.connectionStatus === 'error') return 'error'
    return 'ready'
  }, [agora.isAgoraConfigured, agora.error, agora.connectionStatus])

  const handleRecordStart = useCallback(async () => {
    if (!catProfile) return

    setRecordingError(null)
    setIsStartingRecording(true)
    setCurrentSound(null)
    setCurrentContext(null)
    setInterpretation(null)
    setCurrentLogEntry(null)

    try {
      if (isDemoMode) {
        mock.startRecording()
        setRecordingState('listening')
        return
      }

      const hasPermission = await agora.requestPermission()
      if (!hasPermission) {
        setRecordingError('Microphone access is blocked. Allow access or use Demo Mode.')
        return
      }

      const started = await agora.startRecording()
      if (started) {
        setRecordingState('listening')
      } else {
        setRecordingError(agora.error || 'Could not start the microphone. Try again or use Demo Mode.')
      }
    } finally {
      setIsStartingRecording(false)
    }
  }, [catProfile, isDemoMode, mock, agora])

  const handleRecordStop = useCallback(async () => {
    if (!catProfile || !isMountedRef.current) return

    try {
      if (isDemoMode) {
        mock.stopRecording()
      } else {
        await agora.stopRecording()
      }

      setRecordingState('context-tagging')
    } catch {
      setRecordingError('Recording stopped, but cleanup hit a problem. You can try again.')
      setRecordingState('idle')
    }
  }, [catProfile, isDemoMode, mock, agora])

  const handleContextComplete = useCallback((sound: MeowSoundDetails, context: MeowContext) => {
    if (!catProfile) return

    setCurrentSound(sound)
    setCurrentContext(context)
    setRecordingState('interpreting')

    // Generate interpretation
    const recentLogs = loadMeowLogs()
    const result = generateCareInterpretation(catProfile, catRoutine, sound, context, recentLogs)
    
    // Simulate processing time
    setTimeout(() => {
      if (isMountedRef.current) {
        setInterpretation(result)
        setRecordingState('result')
      }
    }, 1500)
  }, [catProfile, catRoutine])

  const handleSaveToLog = useCallback(() => {
    if (!catProfile || !currentSound || !currentContext || !interpretation) return
    const now = new Date().toISOString()

    const logEntry: MeowLogEntry = {
      id: generateId(),
      catId: catProfile.id,
      createdAt: now,
      timestamp: now,
      sound: currentSound,
      context: currentContext,
      interpretation,
      feedback: null,
    }

    saveMeowLog(logEntry)
    setCurrentLogEntry(logEntry)
    setRecordingState('feedback')
  }, [catProfile, currentSound, currentContext, interpretation])

  const handleReset = useCallback(() => {
    mock.stopRecording()
    void agora.stopRecording()
    setRecordingState('idle')
    setCurrentSound(null)
    setCurrentContext(null)
    setInterpretation(null)
    setCurrentLogEntry(null)
    setRecordingError(null)
    setIsStartingRecording(false)
  }, [agora.stopRecording, mock.stopRecording])

  const handleFeedbackSubmit = useCallback((accuracy: FeedbackAccuracy, action: ActionThatHelped | null) => {
    if (!currentLogEntry) return

    updateMeowLogFeedback(currentLogEntry.id, { accuracy, actionThatHelped: action })
    handleReset()
  }, [currentLogEntry, handleReset])

  const handleDemoRecord = useCallback(() => {
    if (!catProfile || recordingState !== 'idle') return
    
    handleRecordStart()
    
    // Auto-stop after 2 seconds for demo
    setTimeout(() => {
      if (isMountedRef.current) {
        handleRecordStop()
      }
    }, 2000)
  }, [catProfile, recordingState, handleRecordStart, handleRecordStop])

  // Loading state
  if (!isHydrated || !catProfile) {
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
  const isConnecting = agora.connectionStatus === 'connecting' || isStartingRecording
  const showPermissionPrompt = !isDemoMode && agora.permissionStatus === 'denied'

  return (
    <main className="min-h-screen flex flex-col pb-24 bg-[radial-gradient(circle_at_top,#fff7ed_0%,#f8fafc_45%,#fff_100%)]">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b">
        <div className="flex items-center justify-between px-4 py-3">
          <Link href="/" aria-label="Go to home page">
            <Button variant="ghost" size="icon" aria-label="Home">
              <Home className="w-5 h-5" />
            </Button>
          </Link>
          
          <div className="flex items-center gap-2">
            <span className="text-2xl" role="img" aria-label={`${catProfile.name} avatar`}>
              {catProfile.avatarEmoji}
            </span>
            <span className="font-semibold text-foreground">{catProfile.name}</span>
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

              {(showPermissionPrompt || recordingError) && (
                <Card className="w-full max-w-sm mb-6 p-4 border-destructive/50 bg-destructive/5">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-foreground mb-1">Microphone Access Denied</p>
                      <p className="text-xs text-muted-foreground mb-3">
                        {recordingError || 'Please enable microphone access in your browser settings.'}
                      </p>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => agora.requestPermission()}
                        className="text-xs"
                      >
                        <Mic className="w-3 h-3 mr-1" />
                        Try Again
                      </Button>
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
                      <p className="text-sm font-medium text-foreground mb-1">Demo Mode</p>
                      <p className="text-xs text-muted-foreground">
                        Full experience is available with simulated meows while Agora is not configured.
                      </p>
                    </div>
                  </div>
                </Card>
              )}

              {/* Instructions */}
              <div className="text-center mb-8 max-w-sm">
                <h2 className="text-2xl font-bold text-foreground mb-2">
                  What is {catProfile.name} trying to say?
                </h2>
                <p className="text-sm text-muted-foreground">
                  Hold to capture a meow, then add context so the result is useful before it gets funny.
                </p>
              </div>

              {/* Waveform Preview */}
              <div className="w-full max-w-sm mb-8">
                <WaveformVisualizer 
                  volumeLevel={currentVolumeLevel} 
                  isActive={false}
                />
              </div>

              {/* Recording Button */}
              <div className="mb-8">
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
                  className="gap-2 rounded-full border-primary/30 bg-white/80 shadow-sm"
                  onClick={handleDemoRecord}
                  disabled={recordingState !== 'idle' || isStartingRecording}
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
                Listening to {catProfile.name}...
              </Badge>

              <div className="w-full max-w-sm mb-8">
                <WaveformVisualizer 
                  volumeLevel={currentVolumeLevel} 
                  isActive={true}
                />
              </div>

              <VoiceRecorderButton
                isRecording={true}
                onRecordStart={handleRecordStart}
                onRecordStop={handleRecordStop}
                volumeLevel={currentVolumeLevel}
              />
            </motion.div>
          )}

          {/* Context Tagging State */}
          {recordingState === 'context-tagging' && (
            <motion.div
              key="context-tagging"
              className="max-w-sm mx-auto"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <ContextTagging
                onComplete={handleContextComplete}
                onBack={handleReset}
              />
            </motion.div>
          )}

          {/* Interpreting State */}
          {recordingState === 'interpreting' && (
            <motion.div
              key="interpreting"
              className="flex flex-col items-center justify-center min-h-[60vh]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Cat className="w-8 h-8 text-primary animate-pulse" />
              </div>
              <p className="text-sm text-muted-foreground">
                Interpreting {catProfile.name}&apos;s meow...
              </p>
            </motion.div>
          )}

          {/* Result State */}
          {recordingState === 'result' && interpretation && (
            <motion.div
              key="result"
              className="max-w-sm mx-auto"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <InterpretationResult
                interpretation={interpretation}
                catName={catProfile.name}
                onSave={handleSaveToLog}
                onNewRecording={handleReset}
              />
            </motion.div>
          )}

          {/* Feedback State */}
          {recordingState === 'feedback' && (
            <motion.div
              key="feedback"
              className="max-w-sm mx-auto"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <FeedbackForm
                onSubmit={handleFeedbackSubmit}
                onSkip={handleReset}
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
          
          <Link href="/log" aria-label="Meow Log">
            <Button variant="ghost" className="flex flex-col items-center gap-1 h-auto py-2">
              <BookOpen className="w-5 h-5" />
              <span className="text-xs">Meow Log</span>
            </Button>
          </Link>

          <Link href="/insights" aria-label="Insights">
            <Button variant="ghost" className="flex flex-col items-center gap-1 h-auto py-2">
              <TrendingUp className="w-5 h-5" />
              <span className="text-xs">Insights</span>
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
    </main>
  )
}
