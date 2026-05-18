'use client'

import { Wifi, WifiOff, AlertCircle, PlayCircle } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

type ConnectionStatus = 'connected' | 'demo-mode' | 'missing-credentials' | 'error'

interface ConnectionStatusBadgeProps {
  status: ConnectionStatus
  error?: string | null
}

const statusConfig = {
  connected: {
    icon: Wifi,
    label: 'Connected',
    variant: 'success' as const,
  },
  'demo-mode': {
    icon: PlayCircle,
    label: 'Demo Mode',
    variant: 'secondary' as const,
  },
  'missing-credentials': {
    icon: WifiOff,
    label: 'No Credentials',
    variant: 'warning' as const,
  },
  error: {
    icon: AlertCircle,
    label: 'Error',
    variant: 'destructive' as const,
  },
}

export function ConnectionStatusBadge({ status, error }: ConnectionStatusBadgeProps) {
  const config = statusConfig[status]
  const Icon = config.icon

  return (
    <div className="flex flex-col items-start gap-1">
      <Badge variant={config.variant} className="gap-1.5">
        <Icon className="w-3 h-3" />
        {config.label}
      </Badge>
      {error && status === 'error' && (
        <span className="text-xs text-destructive">{error}</span>
      )}
    </div>
  )
}
