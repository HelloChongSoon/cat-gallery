'use client'

import { motion } from 'framer-motion'
import { TrendingUp, Heart, Target, AlertTriangle, Lightbulb } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { Severity } from '@/lib/types'

interface MoodInsightCardProps {
  mood: string
  intent: string
  confidence: number
  severity: Severity
  suggestedAction: string
}

const severityConfig: Record<Severity, { color: string; label: string }> = {
  low: { color: 'bg-accent text-accent-foreground', label: 'Low Priority' },
  medium: { color: 'bg-amber-100 text-amber-800', label: 'Medium Priority' },
  high: { color: 'bg-orange-100 text-orange-800', label: 'High Priority' },
  'royal emergency': { color: 'bg-red-100 text-red-800', label: 'Royal Emergency' },
}

export function MoodInsightCard({
  mood,
  intent,
  confidence,
  severity,
  suggestedAction,
}: MoodInsightCardProps) {
  const severityStyle = severityConfig[severity]

  const insights = [
    { icon: Heart, label: 'Mood', value: mood },
    { icon: Target, label: 'Intent', value: intent },
    { icon: TrendingUp, label: 'Confidence', value: `${confidence}%` },
  ]

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3, duration: 0.4 }}
    >
      <Card className="p-4" role="region" aria-labelledby="insights-title">
        <div className="flex items-center justify-between mb-4">
          <h4 id="insights-title" className="font-semibold text-foreground">
            Translation Insights
          </h4>
          <Badge className={severityStyle.color}>
            <AlertTriangle className="w-3 h-3 mr-1" aria-hidden="true" />
            <span>{severityStyle.label}</span>
          </Badge>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-4" role="list" aria-label="Mood metrics">
          {insights.map((insight, index) => (
            <motion.div
              key={insight.label}
              className="flex flex-col items-center p-2 rounded-lg bg-secondary/50"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4 + index * 0.1 }}
              role="listitem"
            >
              <insight.icon className="w-4 h-4 text-muted-foreground mb-1" aria-hidden="true" />
              <span className="text-xs text-muted-foreground">{insight.label}</span>
              <span className="text-sm font-medium text-foreground text-center" aria-label={`${insight.label}: ${insight.value}`}>
                {insight.value}
              </span>
            </motion.div>
          ))}
        </div>

        <motion.div
          className="flex items-start gap-2 p-3 rounded-lg bg-primary/5 border border-primary/10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          role="note"
          aria-label={`Suggested action: ${suggestedAction}`}
        >
          <Lightbulb className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" aria-hidden="true" />
          <div>
            <span className="text-xs text-muted-foreground block mb-0.5">
              Suggested Action
            </span>
            <span className="text-sm font-medium text-foreground">
              {suggestedAction}
            </span>
          </div>
        </motion.div>
      </Card>
    </motion.div>
  )
}
