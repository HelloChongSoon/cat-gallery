'use client'

import { useRef, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Mic, MicOff } from 'lucide-react'
import { cn } from '@/lib/utils'

interface VoiceRecorderButtonProps {
  isRecording: boolean
  isDisabled?: boolean
  onRecordStart: () => void
  onRecordStop: () => void
  volumeLevel?: number
}

export function VoiceRecorderButton({
  isRecording,
  isDisabled = false,
  onRecordStart,
  onRecordStop,
  volumeLevel = 0,
}: VoiceRecorderButtonProps) {
  const holdTimeout = useRef<NodeJS.Timeout | null>(null)

  const handlePointerDown = useCallback(() => {
    if (isDisabled) return
    
    // Small delay to prevent accidental taps
    holdTimeout.current = setTimeout(() => {
      onRecordStart()
    }, 100)
  }, [isDisabled, onRecordStart])

  const handlePointerUp = useCallback(() => {
    if (holdTimeout.current) {
      clearTimeout(holdTimeout.current)
      holdTimeout.current = null
    }
    
    if (isRecording) {
      onRecordStop()
    }
  }, [isRecording, onRecordStop])

  const handlePointerLeave = useCallback(() => {
    if (holdTimeout.current) {
      clearTimeout(holdTimeout.current)
      holdTimeout.current = null
    }
    
    if (isRecording) {
      onRecordStop()
    }
  }, [isRecording, onRecordStop])

  // Calculate pulse scale based on volume
  const pulseScale = 1 + volumeLevel * 0.3

  return (
    <div className="relative flex items-center justify-center">
      {/* Pulse rings when recording */}
      {isRecording && (
        <>
          <motion.div
            className="absolute inset-0 rounded-full bg-primary/20"
            initial={{ scale: 1, opacity: 1 }}
            animate={{ scale: 1.5, opacity: 0 }}
            transition={{ duration: 1, repeat: Infinity }}
            style={{ width: 160, height: 160, margin: 'auto' }}
          />
          <motion.div
            className="absolute inset-0 rounded-full bg-primary/15"
            initial={{ scale: 1, opacity: 1 }}
            animate={{ scale: 1.8, opacity: 0 }}
            transition={{ duration: 1, repeat: Infinity, delay: 0.3 }}
            style={{ width: 160, height: 160, margin: 'auto' }}
          />
        </>
      )}

      {/* Main button */}
      <motion.button
        className={cn(
          "relative w-32 h-32 rounded-full flex items-center justify-center",
          "shadow-lg transition-colors touch-none select-none",
          isRecording 
            ? "bg-primary" 
            : "bg-card border-2 border-primary/20 hover:border-primary/40",
          isDisabled && "opacity-50 cursor-not-allowed"
        )}
        whileHover={!isDisabled ? { scale: 1.05 } : {}}
        whileTap={!isDisabled ? { scale: 0.95 } : {}}
        animate={isRecording ? { scale: pulseScale } : { scale: 1 }}
        transition={{ type: "spring", stiffness: 400, damping: 20 }}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerLeave}
        onPointerCancel={handlePointerUp}
        disabled={isDisabled}
        aria-label={isRecording ? "Release to stop recording" : "Hold to record"}
      >
        <motion.div
          animate={isRecording ? { scale: [1, 1.1, 1] } : {}}
          transition={{ duration: 0.5, repeat: isRecording ? Infinity : 0 }}
        >
          {isRecording ? (
            <Mic className="w-12 h-12 text-primary-foreground" />
          ) : (
            <MicOff className="w-12 h-12 text-primary" />
          )}
        </motion.div>
      </motion.button>

      {/* Label */}
      <motion.p
        className="absolute -bottom-10 text-sm font-medium text-muted-foreground text-center"
        animate={{ opacity: 1 }}
        initial={{ opacity: 0 }}
      >
        {isRecording ? "Release to translate" : "Hold to translate"}
      </motion.p>
    </div>
  )
}
