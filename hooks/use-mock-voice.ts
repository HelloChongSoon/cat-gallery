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
  
  const volumeIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const durationIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const animationFrameRef = useRef<number | null>(null)
  const startTimeRef = useRef<number>(0)
  const isMountedRef = useRef(true)

  // Track mounted state for cleanup
  useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
      if (volumeIntervalRef.current) clearInterval(volumeIntervalRef.current)
      if (durationIntervalRef.current) clearInterval(durationIntervalRef.current)
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current)
    }
  }, [])

  const startRecording = useCallback(() => {
    if (!isMountedRef.current) return
    
    setIsRecording(true)
    setRecordingDuration(0)
    startTimeRef.current = performance.now()
    
    // Use requestAnimationFrame for smooth waveform animation
    const animateVolume = () => {
      if (!isMountedRef.current) return
      
      const elapsed = performance.now() - startTimeRef.current
      // Create natural-looking volume fluctuations using sine waves
      const baseLevel = 0.35 + Math.sin(elapsed / 200) * 0.15
      const mediumWave = Math.sin(elapsed / 80) * 0.12
      const fastWave = Math.sin(elapsed / 30) * 0.08
      const spike = Math.random() > 0.85 ? Math.random() * 0.2 : 0
      
      const newLevel = Math.max(0.1, Math.min(1, baseLevel + mediumWave + fastWave + spike))
      setVolumeLevel(newLevel)
      
      animationFrameRef.current = requestAnimationFrame(animateVolume)
    }
    
    animationFrameRef.current = requestAnimationFrame(animateVolume)

    // Track recording duration
    durationIntervalRef.current = setInterval(() => {
      if (isMountedRef.current) {
        setRecordingDuration(prev => prev + 100)
      }
    }, 100)
  }, [])

  const stopRecording = useCallback(() => {
    setIsRecording(false)
    
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
      animationFrameRef.current = null
    }
    
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
