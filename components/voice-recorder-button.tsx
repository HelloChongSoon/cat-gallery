'use client'

import { useRef, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Mic, Square } from 'lucide-react'
import { cn } from '@/lib/utils'

interface VoiceRecorderButtonProps {
  isRecording: boolean
  isDisabled?: boolean
  isLoading?: boolean
  onRecordStart: () => void | Promise<void>
  onRecordStop: () => void | Promise<void>
  volumeLevel?: number
}

export function VoiceRecorderButton({
  isRecording,
  isDisabled = false,
  isLoading = false,
  onRecordStart,
  onRecordStop,
  volumeLevel = 0,
}: VoiceRecorderButtonProps) {
  const holdTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isHoldingRef = useRef(false)

  const cleanup = useCallback(() => {
    if (holdTimeout.current) {
      clearTimeout(holdTimeout.current)
      holdTimeout.current = null
    }
  }, [])

  const handlePointerDown = useCallback(() => {
    if (isDisabled || isLoading) return
    
    isHoldingRef.current = true
    
    // Small delay to prevent accidental taps
    holdTimeout.current = setTimeout(() => {
      if (isHoldingRef.current) {
        void onRecordStart()
      }
    }, 100)
  }, [isDisabled, isLoading, onRecordStart])

  const handlePointerUp = useCallback(() => {
    isHoldingRef.current = false
    cleanup()
    
    if (isRecording) {
      void onRecordStop()
    }
  }, [isRecording, onRecordStop, cleanup])

  const handlePointerLeave = useCallback(() => {
    isHoldingRef.current = false
    cleanup()
    
    if (isRecording) {
      void onRecordStop()
    }
  }, [isRecording, onRecordStop, cleanup])

  // Calculate pulse scale based on volume
  const pulseScale = 1 + volumeLevel * 0.25

  const buttonLabel = isLoading 
    ? "Connecting..." 
    : isRecording 
      ? "Release to stop recording" 
      : isDisabled 
        ? "Recording unavailable"
        : "Hold to start recording"

  return (
    <div className="relative flex items-center justify-center">
      {/* Pulse rings when recording */}
      {isRecording && (
        <>
          <motion.div
            className="absolute rounded-full bg-primary/20 pointer-events-none"
            initial={{ scale: 1, opacity: 0.8 }}
            animate={{ scale: 1.6, opacity: 0 }}
            transition={{ duration: 1.2, repeat: Infinity, ease: "easeOut" }}
            style={{ width: 160, height: 160 }}
            aria-hidden="true"
          />
          <motion.div
            className="absolute rounded-full bg-primary/15 pointer-events-none"
            initial={{ scale: 1, opacity: 0.6 }}
            animate={{ scale: 2, opacity: 0 }}
            transition={{ duration: 1.2, repeat: Infinity, delay: 0.4, ease: "easeOut" }}
            style={{ width: 160, height: 160 }}
            aria-hidden="true"
          />
        </>
      )}

      {/* Main button */}
      <motion.button
        type="button"
        className={cn(
          "relative w-32 h-32 rounded-full flex items-center justify-center",
          "shadow-lg transition-colors touch-none select-none",
          "focus:outline-none focus-visible:ring-4 focus-visible:ring-ring focus-visible:ring-offset-4 focus-visible:ring-offset-background",
          isRecording 
            ? "bg-primary" 
            : "bg-card border-2 border-primary/20 hover:border-primary/40",
          (isDisabled || isLoading) && "opacity-50 cursor-not-allowed"
        )}
        whileHover={(!isDisabled && !isLoading) ? { scale: 1.05 } : {}}
        whileTap={(!isDisabled && !isLoading) ? { scale: 0.95 } : {}}
        animate={isRecording ? { scale: pulseScale } : { scale: 1 }}
        transition={{ type: "spring", stiffness: 400, damping: 20 }}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerLeave}
        onPointerCancel={handlePointerUp}
        disabled={isDisabled || isLoading}
        aria-label={buttonLabel}
        aria-pressed={isRecording}
      >
        {isLoading ? (
          <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
        ) : (
          <motion.div
            animate={isRecording ? { scale: [1, 1.1, 1] } : {}}
            transition={{ duration: 0.5, repeat: isRecording ? Infinity : 0 }}
          >
            {isRecording ? (
              <Square className="w-10 h-10 text-primary-foreground fill-current" />
            ) : (
              <Mic className="w-12 h-12 text-primary" />
            )}
          </motion.div>
        )}
      </motion.button>

      {/* Label */}
      <motion.p
        className="absolute -bottom-10 text-sm font-medium text-muted-foreground text-center whitespace-nowrap"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        key={isRecording ? 'recording' : 'idle'}
      >
        {isLoading 
          ? "Connecting..." 
          : isRecording 
            ? "Release to translate" 
            : "Hold to record"}
      </motion.p>
    </div>
  )
}
