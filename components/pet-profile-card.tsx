'use client'

import { motion } from 'framer-motion'
import { Edit2 } from 'lucide-react'
import type { PetProfile } from '@/lib/types'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface PetProfileCardProps {
  profile: PetProfile
  onEdit?: () => void
  size?: 'sm' | 'md' | 'lg'
}

export function PetProfileCard({ profile, onEdit, size = 'md' }: PetProfileCardProps) {
  const sizeClasses = {
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6',
  }

  const avatarSizes = {
    sm: 'text-3xl',
    md: 'text-5xl',
    lg: 'text-6xl',
  }

  const isClickable = Boolean(onEdit)

  return (
    <motion.div
      whileHover={isClickable ? { scale: 1.02 } : {}}
      whileTap={isClickable ? { scale: 0.98 } : {}}
      transition={{ type: 'spring', stiffness: 400, damping: 17 }}
    >
      <Card 
        className={cn(
          sizeClasses[size],
          "transition-shadow",
          isClickable && "cursor-pointer hover:shadow-md"
        )}
        onClick={onEdit}
        role={isClickable ? "button" : undefined}
        tabIndex={isClickable ? 0 : undefined}
        onKeyDown={isClickable ? (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            onEdit?.()
          }
        } : undefined}
        aria-label={isClickable ? `Edit ${profile.name}'s profile` : undefined}
      >
        <div className="flex items-center gap-4">
          <div 
            className={avatarSizes[size]}
            role="img" 
            aria-label={`${profile.name}'s avatar`}
          >
            {profile.avatarEmoji}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-foreground truncate text-balance">
              {profile.name}
            </h3>
            <p className="text-sm text-muted-foreground capitalize">
              {profile.type} &bull; {profile.personality}
            </p>
          </div>
          {isClickable && (
            <Edit2 className="w-4 h-4 text-muted-foreground" aria-hidden="true" />
          )}
        </div>
      </Card>
    </motion.div>
  )
}
