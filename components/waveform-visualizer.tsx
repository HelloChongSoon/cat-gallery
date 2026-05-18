'use client'

import { useMemo, useRef, useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface WaveformVisualizerProps {
  volumeLevel: number
  isActive: boolean
  barCount?: number
  className?: string
}

export function WaveformVisualizer({ 
  volumeLevel, 
  isActive, 
  barCount = 32,
  className,
}: WaveformVisualizerProps) {
  const [animationTick, setAnimationTick] = useState(0)
  const animationRef = useRef<number | null>(null)

  // Animate when active
  useEffect(() => {
    if (!isActive) {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
        animationRef.current = null
      }
      return
    }

    let lastTime = 0
    const animate = (time: number) => {
      if (time - lastTime > 50) { // ~20fps for smooth animation
        setAnimationTick(t => t + 1)
        lastTime = time
      }
      animationRef.current = requestAnimationFrame(animate)
    }
    
    animationRef.current = requestAnimationFrame(animate)
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [isActive])

  // Pre-compute bar heights with memoization
  const bars = useMemo(() => {
    return Array.from({ length: barCount }).map((_, i) => {
      // Create a wave pattern
      const baseHeight = Math.sin((i / barCount) * Math.PI) * 0.6 + 0.4
      
      if (!isActive) {
        // Idle state - gentle wave
        return {
          height: 4 + Math.sin(i * 0.5) * 2,
          delay: i * 0.02,
        }
      }
      
      // Active state - responsive to volume
      const volumeMultiplier = volumeLevel * 1.5
      const randomOffset = Math.sin(animationTick * 0.3 + i * 0.5) * 0.25
      const height = Math.max(0.1, Math.min(1, baseHeight * volumeMultiplier + randomOffset))
      
      return {
        height: height * 64,
        delay: 0,
      }
    })
  }, [barCount, isActive, volumeLevel, animationTick])

  return (
    <div 
      className={cn("flex items-center justify-center gap-0.5 h-16", className)}
      role="img"
      aria-label={isActive ? "Recording audio waveform" : "Audio waveform preview"}
    >
      {bars.map((bar, i) => (
        <motion.div
          key={i}
          className={cn(
            "w-1.5 rounded-full transition-colors duration-200",
            isActive ? "bg-primary" : "bg-muted"
          )}
          initial={{ height: 4 }}
          animate={{ height: bar.height }}
          transition={{
            duration: isActive ? 0.08 : 0.3,
            ease: "easeOut",
            delay: bar.delay,
          }}
        />
      ))}
    </div>
  )
}
