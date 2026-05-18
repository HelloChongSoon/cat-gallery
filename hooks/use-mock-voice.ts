/**
 * PetChat AI - Mock Voice Recorder Hook
 * 
 * Simulates voice recording for Demo Mode when Agora credentials are not available.
 * Provides the same interface as useAgoraVoice for seamless switching.
 */

'use client'

import { useState, useCallback, useRef, useEffect } from 'react'

export interface UseMockVoiceReturn {
  isRecording: boolean
  startRecording: () => void
  stopRecording: () => void
  volumeLevel: number
  recordingDuration: number
}

export function useMockVoice(): UseMockVoiceReturn {
  const [isRecording, setIsRecording] = useState(false)
  const [volumeLevel, setVolumeLevel] = useState(0)
  const [recordingDuration, setRecordingDuration] = useState(0)
  
  const volumeIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const durationIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (volumeIntervalRef.current) clearInterval(volumeIntervalRef.current)
      if (durationIntervalRef.current) clearInterval(durationIntervalRef.current)
    }
  }, [])

  const startRecording = useCallback(() => {
    setIsRecording(true)
    setRecordingDuration(0)
    
    // Simulate varying volume levels for waveform animation
    volumeIntervalRef.current = setInterval(() => {
      // Generate natural-looking volume fluctuations
      const baseLevel = 0.3 + Math.random() * 0.4
      const spike = Math.random() > 0.7 ? Math.random() * 0.3 : 0
      setVolumeLevel(Math.min(baseLevel + spike, 1))
    }, 100)

    // Track recording duration
    durationIntervalRef.current = setInterval(() => {
      setRecordingDuration(prev => prev + 100)
    }, 100)
  }, [])

  const stopRecording = useCallback(() => {
    setIsRecording(false)
    
    if (volumeIntervalRef.current) {
      clearInterval(volumeIntervalRef.current)
      volumeIntervalRef.current = null
    }
    
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current)
      durationIntervalRef.current = null
    }
    
    setVolumeLevel(0)
  }, [])

  return {
    isRecording,
    startRecording,
    stopRecording,
    volumeLevel,
    recordingDuration,
  }
}
