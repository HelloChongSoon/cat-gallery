'use client'

import { Edit2 } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import type { CatProfile } from '@/lib/types'

interface CatProfileCardProps {
  profile: CatProfile
  onEdit?: () => void
  size?: 'sm' | 'md' | 'lg'
}

export function CatProfileCard({ profile, onEdit, size = 'md' }: CatProfileCardProps) {
  const avatarSize = {
    sm: 'text-3xl',
    md: 'text-5xl',
    lg: 'text-6xl',
  }[size]

  return (
    <Card
      className={cn('p-4 transition-shadow', onEdit && 'cursor-pointer hover:shadow-md')}
      onClick={onEdit}
      role={onEdit ? 'button' : undefined}
      tabIndex={onEdit ? 0 : undefined}
      onKeyDown={onEdit ? (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          onEdit()
        }
      } : undefined}
    >
      <div className="flex items-center gap-4">
        <div className={cn('shrink-0', avatarSize)} aria-hidden="true">
          {profile.photoUrl ? (
            <img src={profile.photoUrl} alt="" className="h-14 w-14 rounded-full object-cover" />
          ) : (
            profile.avatarEmoji
          )}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-semibold text-foreground">{profile.name}</h3>
          <p className="text-sm capitalize text-muted-foreground">
            {profile.ageGroup} · {profile.personality}
          </p>
        </div>
        {onEdit && <Edit2 className="h-4 w-4 text-muted-foreground" aria-hidden="true" />}
      </div>
    </Card>
  )
}
