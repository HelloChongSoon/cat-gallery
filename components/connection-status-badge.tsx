'use client'

import { Wifi, WifiOff, AlertCircle, PlayCircle, Loader2, CheckCircle } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

type ConnectionStatus = 'connected' | 'connecting' | 'demo-mode' | 'ready' | 'error'

interface ConnectionStatusBadgeProps {
  status: ConnectionStatus
  error?: string | null
}

const statusConfig = {
  connected: {
    icon: Wifi,
    label: 'Connected',
    variant: 'success' as const,
    className: '',
  },
  connecting: {
    icon: Loader2,
    label: 'Connecting...',
    variant: 'secondary' as const,
    className: 'animate-pulse',
  },
  'demo-mode': {
    icon: PlayCircle,
    label: 'Demo Mode',
    variant: 'secondary' as const,
    className: '',
  },
  'ready': {
    icon: CheckCircle,
    label: 'Ready',
    variant: 'success' as const,
    className: '',
  },
  error: {
    icon: AlertCircle,
    label: 'Error',
    variant: 'destructive' as const,
    className: '',
  },
}

export function ConnectionStatusBadge({ status, error }: ConnectionStatusBadgeProps) {
  const config = statusConfig[status]
  const Icon = config.icon

  return (
    <div className="flex flex-col items-center gap-1">
      <Badge 
        variant={config.variant} 
        className={cn("gap-1.5", config.className)}
        role="status"
        aria-live="polite"
      >
        <Icon className={cn("w-3 h-3", status === 'connecting' && "animate-spin")} aria-hidden="true" />
        {config.label}
      </Badge>
      {error && status === 'error' && (
        <span className="text-xs text-destructive max-w-xs text-center" role="alert">
          {error}
        </span>
      )}
    </div>
  )
}
