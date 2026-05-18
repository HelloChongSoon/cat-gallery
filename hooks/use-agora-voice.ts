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
import type {
  IAgoraRTCClient,
  IMicrophoneAudioTrack,
  IAgoraRTCRemoteUser,
} from 'agora-rtc-sdk-ng'

export interface UseAgoraVoiceReturn {
  isAgoraConfigured: boolean
  isConnected: boolean
  isRecording: boolean
  isMicMuted: boolean
  startSession: () => Promise<void>
  stopSession: () => Promise<void>
  startRecording: () => Promise<void>
  stopRecording: () => Promise<void>
  toggleMic: () => Promise<void>
  error: string | null
  volumeLevel: number
}

export function useAgoraVoice(): UseAgoraVoiceReturn {
  const [isConnected, setIsConnected] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [isMicMuted, setIsMicMuted] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [volumeLevel, setVolumeLevel] = useState(0)

  const clientRef = useRef<IAgoraRTCClient | null>(null)
  const localAudioTrackRef = useRef<IMicrophoneAudioTrack | null>(null)
  const volumeIntervalRef = useRef<NodeJS.Timeout | null>(null)

  const appId = process.env.NEXT_PUBLIC_AGORA_APP_ID
  const channelName = process.env.NEXT_PUBLIC_AGORA_CHANNEL_NAME
  const token = process.env.NEXT_PUBLIC_AGORA_TOKEN || null

  const isAgoraConfigured = Boolean(appId && channelName)

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (volumeIntervalRef.current) {
        clearInterval(volumeIntervalRef.current)
      }
      if (localAudioTrackRef.current) {
        localAudioTrackRef.current.close()
      }
      if (clientRef.current) {
        clientRef.current.leave()
      }
    }
  }, [])

  const startSession = useCallback(async () => {
    if (!isAgoraConfigured) {
      setError('Agora credentials not configured. Running in Demo Mode.')
      return
    }

    try {
      setError(null)
      
      // Dynamically import Agora SDK (only works in browser)
      const AgoraRTC = (await import('agora-rtc-sdk-ng')).default

      // Create client
      const client = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' })
      clientRef.current = client

      // Setup event handlers
      client.on('user-published', async (user: IAgoraRTCRemoteUser, mediaType: 'audio' | 'video') => {
        if (mediaType === 'audio') {
          await client.subscribe(user, mediaType)
          user.audioTrack?.play()
        }
      })

      client.on('user-unpublished', (user: IAgoraRTCRemoteUser, mediaType: 'audio' | 'video') => {
        if (mediaType === 'audio') {
          user.audioTrack?.stop()
        }
      })

      // Join channel
      await client.join(appId!, channelName!, token, null)
      setIsConnected(true)

    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to connect to Agora'
      setError(message)
      console.error('Agora connection error:', err)
    }
  }, [appId, channelName, token, isAgoraConfigured])

  const stopSession = useCallback(async () => {
    try {
      if (volumeIntervalRef.current) {
        clearInterval(volumeIntervalRef.current)
        volumeIntervalRef.current = null
      }

      if (localAudioTrackRef.current) {
        localAudioTrackRef.current.close()
        localAudioTrackRef.current = null
      }

      if (clientRef.current) {
        await clientRef.current.leave()
        clientRef.current = null
      }

      setIsConnected(false)
      setIsRecording(false)
      setVolumeLevel(0)
      setError(null)
    } catch (err) {
      console.error('Error stopping session:', err)
    }
  }, [])

  const startRecording = useCallback(async () => {
    if (!clientRef.current) {
      setError('Not connected to Agora')
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
      } else if (message.includes('NotFoundError')) {
        setError('No microphone found. Please connect a microphone.')
      } else {
        setError(message)
      }
      
      console.error('Recording error:', err)
    }
  }, [])

  const stopRecording = useCallback(async () => {
    try {
      if (volumeIntervalRef.current) {
        clearInterval(volumeIntervalRef.current)
        volumeIntervalRef.current = null
      }

      if (localAudioTrackRef.current && clientRef.current) {
        await clientRef.current.unpublish([localAudioTrackRef.current])
        localAudioTrackRef.current.close()
        localAudioTrackRef.current = null
      }

      setIsRecording(false)
      setVolumeLevel(0)
    } catch (err) {
      console.error('Error stopping recording:', err)
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
    isRecording,
    isMicMuted,
    startSession,
    stopSession,
    startRecording,
    stopRecording,
    toggleMic,
    error,
    volumeLevel,
  }
}
