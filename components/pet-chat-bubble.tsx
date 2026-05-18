'use client'

import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface PetChatBubbleProps {
  message: string
  avatarEmoji: string
  petName: string
  isUser?: boolean
}

export function PetChatBubble({ 
  message, 
  avatarEmoji, 
  petName,
  isUser = false 
}: PetChatBubbleProps) {
  return (
    <motion.div
      className={cn(
        "flex gap-3 max-w-full",
        isUser ? "flex-row-reverse" : "flex-row"
      )}
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ 
        type: "spring", 
        stiffness: 300, 
        damping: 25,
        delay: 0.1 
      }}
    >
      {/* Avatar */}
      <motion.div 
        className="flex-shrink-0 w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-xl shadow-sm"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 500, damping: 25 }}
      >
        {avatarEmoji}
      </motion.div>

      {/* Bubble */}
      <div className={cn(
        "flex flex-col gap-1",
        isUser ? "items-end" : "items-start"
      )}>
        <span className="text-xs text-muted-foreground px-2">
          {petName}
        </span>
        <motion.div
          className={cn(
            "px-4 py-3 rounded-2xl max-w-[280px] shadow-sm",
            isUser 
              ? "bg-primary text-primary-foreground rounded-br-md" 
              : "bg-card border rounded-bl-md"
          )}
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 400, damping: 20, delay: 0.2 }}
        >
          <p className="text-sm leading-relaxed text-pretty">
            {message}
          </p>
        </motion.div>
      </div>
    </motion.div>
  )
}
