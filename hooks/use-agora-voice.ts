/**
 * PetChat AI - Agora Voice Hook
 * 
 * SETUP INSTRUCTIONS:
 * 1. Create an Agora account at https://console.agora.io
 * 2. Create a new project and get your App ID
 * 3. Generate a temporary token for testing
 * 4. Set environment variables:
 *    - NEXT_PUBLIC_AGORA_APP_ID=your_app_id
 *    - NEXT_PUBLIC_AGORA_CHANNEL_NAME=petchat-demo
 *    - NEXT_PUBLIC_AGORA_TOKEN=your_temp_token
 * 
 * Without these variables, the app runs in Demo Mode.
 */

'use client'

import { useState, useCallback, useRef, useEffect } from 'react'

// Agora types - imported dynamically to avoid SSR issues
type IAgoraRTCClient = Awaited<ReturnType<typeof import('agora-rtc-sdk-ng')>>['default'] extends { createClient: (config: unknown) => infer C } ? C : never
type IMicrophoneAudioTrack = Awaited<ReturnType<Awaited<ReturnType<typeof import('agora-rtc-sdk-ng')>>['default']['createMicrophoneAudioTrack']>>

export interface UseAgoraVoiceReturn {
  isAgoraConfigured: boolean
  isConnected: boolean
  isConnecting: boolean
  isRecording: boolean
  isMicMuted: boolean
  startSession: () => Promise<void>
  stopSession: () => Promise<void>
  startRecording: () => Promise<void>
  stopRecording: () => Promise<void>
  toggleMic: () => Promise<void>
  error: string | null
  volumeLevel: number
  permissionStatus: 'prompt' | 'granted' | 'denied' | 'unknown'
  requestPermission: () => Promise<boolean>
}

export function useAgoraVoice(): UseAgoraVoiceReturn {
  const [isConnected, setIsConnected] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [isMicMuted, setIsMicMuted] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [volumeLevel, setVolumeLevel] = useState(0)
  const [permissionStatus, setPermissionStatus] = useState<'prompt' | 'granted' | 'denied' | 'unknown'>('unknown')

  const clientRef = useRef<IAgoraRTCClient | null>(null)
  const localAudioTrackRef = useRef<IMicrophoneAudioTrack | null>(null)
  const volumeIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const isCleaningUpRef = useRef(false)
  const sessionIdRef = useRef<string | null>(null)

  const appId = typeof window !== 'undefined' ? process.env.NEXT_PUBLIC_AGORA_APP_ID : undefined
  const channelName = typeof window !== 'undefined' ? process.env.NEXT_PUBLIC_AGORA_CHANNEL_NAME : undefined
  const token = typeof window !== 'undefined' ? (process.env.NEXT_PUBLIC_AGORA_TOKEN || null) : null

  const isAgoraConfigured = Boolean(appId && channelName)

  // Check microphone permission status
  useEffect(() => {
    if (typeof window === 'undefined' || !navigator.permissions) {
      setPermissionStatus('unknown')
      return
    }

    navigator.permissions.query({ name: 'microphone' as PermissionName })
      .then(result => {
        setPermissionStatus(result.state as 'prompt' | 'granted' | 'denied')
        result.onchange = () => {
          setPermissionStatus(result.state as 'prompt' | 'granted' | 'denied')
        }
      })
      .catch(() => {
        setPermissionStatus('unknown')
      })
  }, [])

  // Cleanup function
  const cleanup = useCallback(async () => {
    if (isCleaningUpRef.current) return
    isCleaningUpRef.current = true

    try {
      if (volumeIntervalRef.current) {
        clearInterval(volumeIntervalRef.current)
        volumeIntervalRef.current = null
      }

      if (localAudioTrackRef.current) {
        localAudioTrackRef.current.stop()
        localAudioTrackRef.current.close()
        localAudioTrackRef.current = null
      }

      if (clientRef.current) {
        clientRef.current.removeAllListeners()
        if (clientRef.current.connectionState === 'CONNECTED') {
          await clientRef.current.leave()
        }
        clientRef.current = null
      }

      sessionIdRef.current = null
      setIsConnected(false)
      setIsRecording(false)
      setVolumeLevel(0)
    } finally {
      isCleaningUpRef.current = false
    }
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanup()
    }
  }, [cleanup])

  const requestPermission = useCallback(async (): Promise<boolean> => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      stream.getTracks().forEach(track => track.stop())
      setPermissionStatus('granted')
      return true
    } catch (err) {
      if (err instanceof Error) {
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          setPermissionStatus('denied')
        }
      }
      return false
    }
  }, [])

  const startSession = useCallback(async () => {
    if (!isAgoraConfigured) {
      setError('Agora credentials not configured. Running in Demo Mode.')
      return
    }

    if (clientRef.current || isConnecting) {
      return
    }

    const newSessionId = `${Date.now()}-${Math.random().toString(36).slice(2)}`
    sessionIdRef.current = newSessionId

    try {
      setIsConnecting(true)
      setError(null)
      
      // Dynamically import Agora SDK (only works in browser)
      const AgoraRTC = (await import('agora-rtc-sdk-ng')).default

      // Check if session was cancelled during import
      if (sessionIdRef.current !== newSessionId) {
        return
      }

      // Create client
      const client = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' })
      clientRef.current = client

      // Setup event handlers
      client.on('user-published', async (user, mediaType) => {
        if (mediaType === 'audio') {
          await client.subscribe(user, mediaType)
          user.audioTrack?.play()
        }
      })

      client.on('user-unpublished', (user, mediaType) => {
        if (mediaType === 'audio') {
          user.audioTrack?.stop()
        }
      })

      client.on('connection-state-change', (curState) => {
        if (curState === 'DISCONNECTED') {
          setIsConnected(false)
        }
      })

      // Join channel
      await client.join(appId!, channelName!, token, null)
      
      // Check if session was cancelled during join
      if (sessionIdRef.current !== newSessionId) {
        await client.leave()
        clientRef.current = null
        return
      }

      setIsConnected(true)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to connect to Agora'
      setError(message)
      console.error('[v0] Agora connection error:', err)
      clientRef.current = null
    } finally {
      setIsConnecting(false)
    }
  }, [appId, channelName, token, isAgoraConfigured, isConnecting])

  const stopSession = useCallback(async () => {
    sessionIdRef.current = null
    await cleanup()
    setError(null)
  }, [cleanup])

  const startRecording = useCallback(async () => {
    if (!clientRef.current) {
      setError('Not connected to Agora')
      return
    }

    if (localAudioTrackRef.current) {
      // Already recording
      return
    }

    try {
      setError(null)
      const AgoraRTC = (await import('agora-rtc-sdk-ng')).default

      // Create microphone track
      const localAudioTrack = await AgoraRTC.createMicrophoneAudioTrack()
      localAudioTrackRef.current = localAudioTrack

      // Publish track
      await clientRef.current.publish([localAudioTrack])
      setIsRecording(true)
      setPermissionStatus('granted')

      // Monitor volume levels
      volumeIntervalRef.current = setInterval(() => {
        if (localAudioTrackRef.current) {
          const level = localAudioTrackRef.current.getVolumeLevel()
          setVolumeLevel(level)
        }
      }, 100)

    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to start recording'
      
      if (message.includes('Permission denied') || message.includes('NotAllowedError')) {
        setError('Microphone permission denied. Please allow microphone access.')
        setPermissionStatus('denied')
      } else if (message.includes('NotFoundError')) {
        setError('No microphone found. Please connect a microphone.')
      } else {
        setError(message)
      }
      
      console.error('[v0] Recording error:', err)
    }
  }, [])

  const stopRecording = useCallback(async () => {
    try {
      if (volumeIntervalRef.current) {
        clearInterval(volumeIntervalRef.current)
        volumeIntervalRef.current = null
      }

      if (localAudioTrackRef.current) {
        if (clientRef.current && clientRef.current.connectionState === 'CONNECTED') {
          try {
            await clientRef.current.unpublish([localAudioTrackRef.current])
          } catch {
            // Ignore unpublish errors
          }
        }
        localAudioTrackRef.current.stop()
        localAudioTrackRef.current.close()
        localAudioTrackRef.current = null
      }

      setIsRecording(false)
      setVolumeLevel(0)
    } catch (err) {
      console.error('[v0] Error stopping recording:', err)
    }
  }, [])

  const toggleMic = useCallback(async () => {
    if (localAudioTrackRef.current) {
      const newMuteState = !isMicMuted
      await localAudioTrackRef.current.setMuted(newMuteState)
      setIsMicMuted(newMuteState)
    }
  }, [isMicMuted])

  return {
    isAgoraConfigured,
    isConnected,
    isConnecting,
    isRecording,
    isMicMuted,
    startSession,
    stopSession,
    startRecording,
    stopRecording,
    toggleMic,
    error,
    volumeLevel,
    permissionStatus,
    requestPermission,
  }
}
