'use client'

import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface WaveformVisualizerProps {
  volumeLevel: number
  isActive: boolean
  barCount?: number
}

export function WaveformVisualizer({ 
  volumeLevel, 
  isActive, 
  barCount = 32 
}: WaveformVisualizerProps) {
  return (
    <div className="flex items-center justify-center gap-0.5 h-16">
      {Array.from({ length: barCount }).map((_, i) => {
        // Create a wave pattern with randomization
        const baseHeight = Math.sin((i / barCount) * Math.PI) * 0.6 + 0.4
        const volumeMultiplier = isActive ? volumeLevel * 1.5 : 0.1
        const randomOffset = Math.sin(Date.now() / 200 + i) * 0.3
        const height = Math.max(0.1, Math.min(1, baseHeight * volumeMultiplier + (isActive ? randomOffset : 0)))
        
        return (
          <motion.div
            key={i}
            className={cn(
              "w-1.5 rounded-full transition-colors",
              isActive ? "bg-primary" : "bg-muted"
            )}
            initial={{ height: 4 }}
            animate={{ 
              height: isActive ? height * 64 : 4 + Math.sin(i * 0.5) * 2,
            }}
            transition={{
              duration: 0.1,
              ease: "easeOut",
            }}
          />
        )
      })}
    </div>
  )
}
