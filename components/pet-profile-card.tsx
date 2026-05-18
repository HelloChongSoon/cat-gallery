'use client'

import { motion } from 'framer-motion'
import type { PetProfile } from '@/lib/types'
import { Card } from '@/components/ui/card'

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

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: 'spring', stiffness: 400, damping: 17 }}
    >
      <Card 
        className={`${sizeClasses[size]} cursor-pointer hover:shadow-md transition-shadow`}
        onClick={onEdit}
      >
        <div className="flex items-center gap-4">
          <div className={`${avatarSizes[size]} animate-bounce-soft`}>
            {profile.avatarEmoji}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-foreground truncate text-balance">
              {profile.name}
            </h3>
            <p className="text-sm text-muted-foreground capitalize">
              {profile.type} • {profile.personality}
            </p>
          </div>
        </div>
      </Card>
    </motion.div>
  )
}
