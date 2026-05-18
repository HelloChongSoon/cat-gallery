'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const loadingMessages = [
  { text: "Listening to tiny royal complaint...", icon: "👑" },
  { text: "Detecting snack urgency...", icon: "🍪" },
  { text: "Checking emotional damage...", icon: "💔" },
  { text: "Analyzing dramatic intent...", icon: "🎭" },
  { text: "Consulting pet therapist...", icon: "🛋️" },
  { text: "Translating into human language...", icon: "📝" },
]

interface TranslationLoadingStateProps {
  isVisible: boolean
}

export function TranslationLoadingState({ isVisible }: TranslationLoadingStateProps) {
  const [currentIndex, setCurrentIndex] = useState(0)

  useEffect(() => {
    if (!isVisible) {
      setCurrentIndex(0)
      return
    }

    const interval = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % loadingMessages.length)
    }, 1500)

    return () => clearInterval(interval)
  }, [isVisible])

  if (!isVisible) return null

  const currentMessage = loadingMessages[currentIndex]

  return (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      <motion.div
        className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-6"
        animate={{ scale: [1, 1.1, 1] }}
        transition={{ duration: 1.5, repeat: Infinity }}
      >
        <motion.span 
          className="text-4xl"
          animate={{ rotate: [0, 10, -10, 0] }}
          transition={{ duration: 0.5, repeat: Infinity }}
        >
          {currentMessage.icon}
        </motion.span>
      </motion.div>

      <AnimatePresence mode="wait">
        <motion.p
          key={currentIndex}
          className="text-center text-muted-foreground font-medium text-balance"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3 }}
        >
          {currentMessage.text}
        </motion.p>
      </AnimatePresence>

      <div className="flex gap-1.5 mt-6">
        {loadingMessages.map((_, i) => (
          <motion.div
            key={i}
            className={`w-2 h-2 rounded-full ${
              i === currentIndex ? 'bg-primary' : 'bg-muted'
            }`}
            animate={i === currentIndex ? { scale: [1, 1.3, 1] } : {}}
            transition={{ duration: 0.5 }}
          />
        ))}
      </div>
    </div>
  )
}
