'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { 
  Home, 
  Mic, 
  BookOpen, 
  Settings, 
  TrendingUp,
  Clock,
  Utensils,
  Heart,
  Activity,
  AlertCircle,
  ChevronRight,
  Calendar,
  BarChart3
} from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { loadCatProfile, loadMeowLogs, loadCatRoutine } from '@/lib/storage'
import type { CatProfile, MeowLogEntry, CatRoutine, MeowSound, MoodCategory } from '@/lib/types'

// Mood category display config
const moodConfig: Record<MoodCategory, { label: string; color: string; icon: typeof Heart }> = {
  content: { label: 'Content', color: 'text-green-600 bg-green-100', icon: Heart },
  hungry: { label: 'Hungry', color: 'text-orange-600 bg-orange-100', icon: Utensils },
  playful: { label: 'Playful', color: 'text-blue-600 bg-blue-100', icon: Activity },
  attention: { label: 'Attention', color: 'text-purple-600 bg-purple-100', icon: Heart },
  stressed: { label: 'Stressed', color: 'text-red-600 bg-red-100', icon: AlertCircle },
  territorial: { label: 'Territorial', color: 'text-amber-600 bg-amber-100', icon: AlertCircle },
}

// Sound type labels
const soundLabels: Record<MeowSound, string> = {
  'short-meow': 'Short Meow',
  'long-meow': 'Long Meow',
  'chirp': 'Chirp/Trill',
  'yowl': 'Yowl',
  'hiss': 'Hiss',
  'purr': 'Purr',
  'chattering': 'Chattering',
  'silent-meow': 'Silent Meow',
}

export default function InsightsPage() {
  const router = useRouter()
  const [catProfile, setCatProfile] = useState<CatProfile | null>(null)
  const [logs, setLogs] = useState<MeowLogEntry[]>([])
  const [routine, setRoutine] = useState<CatRoutine | null>(null)
  const [isHydrated, setIsHydrated] = useState(false)

  useEffect(() => {
    setIsHydrated(true)
    const profile = loadCatProfile()
    if (!profile) {
      router.push('/')
      return
    }
    setCatProfile(profile)
    setLogs(loadMeowLogs())
    setRoutine(loadCatRoutine())
  }, [router])

  // Calculate insights from logs
  const insights = useMemo(() => {
    if (logs.length === 0) return null

    // Time-based patterns
    const hourCounts: Record<number, number> = {}
    const moodCounts: Record<MoodCategory, number> = {
      content: 0,
      hungry: 0,
      playful: 0,
      attention: 0,
      stressed: 0,
      territorial: 0,
    }
    const soundCounts: Record<MeowSound, number> = {
      'short-meow': 0,
      'long-meow': 0,
      'chirp': 0,
      'yowl': 0,
      'hiss': 0,
      'purr': 0,
      'chattering': 0,
      'silent-meow': 0,
    }
    const contextCounts: Record<string, number> = {}

    let accuratePredictions = 0
    let totalWithFeedback = 0

    logs.forEach(log => {
      const hour = new Date(log.timestamp || log.createdAt).getHours()
      hourCounts[hour] = (hourCounts[hour] || 0) + 1
      
      moodCounts[log.interpretation.mood]++
      soundCounts[log.sound.soundType]++
      
      const situations = log.context.situations?.length ? log.context.situations : [log.context.situation]
      situations.forEach(situation => {
        contextCounts[situation] = (contextCounts[situation] || 0) + 1
      })

      if (log.feedback) {
        totalWithFeedback++
        if (log.feedback.accuracy === 'spot-on' || log.feedback.accuracy === 'close') {
          accuratePredictions++
        }
      }
    })

    // Find peak hours (top 3)
    const peakHours = Object.entries(hourCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([hour]) => parseInt(hour))

    // Find dominant mood
    const dominantMood = Object.entries(moodCounts)
      .sort(([, a], [, b]) => b - a)[0][0] as MoodCategory

    // Find most common sound
    const commonSound = Object.entries(soundCounts)
      .sort(([, a], [, b]) => b - a)[0][0] as MeowSound

    // Find most common context
    const topContexts = Object.entries(contextCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([context]) => context)

    // Calculate accuracy rate
    const accuracyRate = totalWithFeedback > 0 
      ? Math.round((accuratePredictions / totalWithFeedback) * 100) 
      : null

    return {
      totalLogs: logs.length,
      peakHours,
      dominantMood,
      commonSound,
      topContexts,
      accuracyRate,
      moodCounts,
      soundCounts,
      logsThisWeek: logs.filter(log => {
        const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000
        return new Date(log.timestamp || log.createdAt).getTime() > weekAgo
      }).length,
    }
  }, [logs])

  const formatHour = (hour: number) => {
    if (hour === 0) return '12 AM'
    if (hour < 12) return `${hour} AM`
    if (hour === 12) return '12 PM'
    return `${hour - 12} PM`
  }

  if (!isHydrated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-sm border-b border-border">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-foreground">Insights</h1>
            {catProfile && (
              <p className="text-xs text-muted-foreground">
                {catProfile.name}&apos;s communication patterns
              </p>
            )}
          </div>
          <Badge variant="secondary" className="text-xs">
            {logs.length} meows logged
          </Badge>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-lg mx-auto w-full px-4 py-6 pb-24">
        {!insights || logs.length < 3 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-12"
          >
            <BarChart3 className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
            <h2 className="text-lg font-medium text-foreground mb-2">
              Not Enough Data Yet
            </h2>
            <p className="text-sm text-muted-foreground mb-6 max-w-xs mx-auto">
              Log at least 3 meows to start seeing patterns and insights about {catProfile?.name || 'your cat'}&apos;s communication.
            </p>
            <Button onClick={() => router.push('/app')}>
              <Mic className="w-4 h-4 mr-2" />
              Record a Meow
            </Button>
          </motion.div>
        ) : (
          <div className="space-y-6">
            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-4">
              <Card className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">{insights.logsThisWeek}</p>
                    <p className="text-xs text-muted-foreground">This week</p>
                  </div>
                </div>
              </Card>
              
              {insights.accuracyRate !== null && (
                <Card className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                      <TrendingUp className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-foreground">{insights.accuracyRate}%</p>
                      <p className="text-xs text-muted-foreground">Accuracy</p>
                    </div>
                  </div>
                </Card>
              )}
            </div>

            {/* Peak Activity Times */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Peak Activity Times
                </CardTitle>
                <CardDescription className="text-xs">
                  When {catProfile?.name} is most vocal
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  {insights.peakHours.map((hour, i) => (
                    <Badge 
                      key={hour} 
                      variant={i === 0 ? 'default' : 'secondary'}
                      className="text-sm"
                    >
                      {formatHour(hour)}
                    </Badge>
                  ))}
                </div>
                {routine && insights.peakHours.some(h => 
                  routine.feedingTimes.some(ft => {
                    const [feedHour] = ft.split(':').map(Number)
                    return Math.abs(feedHour - h) <= 1
                  })
                ) && (
                  <p className="text-xs text-muted-foreground mt-3">
                    Correlates with scheduled feeding times
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Dominant Mood */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Heart className="w-4 h-4" />
                  Primary Mood
                </CardTitle>
                <CardDescription className="text-xs">
                  Most common emotional state
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${moodConfig[insights.dominantMood].color}`}>
                    {(() => {
                      const IconComponent = moodConfig[insights.dominantMood].icon
                      return <IconComponent className="w-6 h-6" />
                    })()}
                  </div>
                  <div>
                    <p className="font-medium text-foreground">
                      {moodConfig[insights.dominantMood].label}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {Math.round((insights.moodCounts[insights.dominantMood] / insights.totalLogs) * 100)}% of meows
                    </p>
                  </div>
                </div>
                
                {/* Mood breakdown */}
                <div className="mt-4 space-y-2">
                  {Object.entries(insights.moodCounts)
                    .filter(([, count]) => count > 0)
                    .sort(([, a], [, b]) => b - a)
                    .map(([mood, count]) => (
                      <div key={mood} className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground w-20">
                          {moodConfig[mood as MoodCategory].label}
                        </span>
                        <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-primary rounded-full transition-all"
                            style={{ width: `${(count / insights.totalLogs) * 100}%` }}
                          />
                        </div>
                        <span className="text-xs text-muted-foreground w-8 text-right">
                          {count}
                        </span>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>

            {/* Sound Types */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Mic className="w-4 h-4" />
                  Vocalization Types
                </CardTitle>
                <CardDescription className="text-xs">
                  Sounds {catProfile?.name} makes most
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {Object.entries(insights.soundCounts)
                    .filter(([, count]) => count > 0)
                    .sort(([, a], [, b]) => b - a)
                    .slice(0, 5)
                    .map(([sound, count]) => (
                      <div key={sound} className="flex items-center justify-between">
                        <span className="text-sm text-foreground">
                          {soundLabels[sound as MeowSound]}
                        </span>
                        <Badge variant="secondary">{count}</Badge>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>

            {/* Common Contexts */}
            {insights.topContexts.length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Activity className="w-4 h-4" />
                    Common Situations
                  </CardTitle>
                  <CardDescription className="text-xs">
                    When meowing typically happens
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {insights.topContexts.map(context => (
                      <Badge key={context} variant="outline" className="capitalize">
                        {context.replace(/-/g, ' ')}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* View Full Log */}
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => router.push('/log')}
            >
              View Full Meow Log
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        )}
      </main>

      {/* Bottom Navigation */}
      <nav 
        className="fixed bottom-0 left-0 right-0 bg-background/80 backdrop-blur-sm border-t border-border"
        aria-label="Main navigation"
      >
        <div className="max-w-lg mx-auto px-4 py-2 flex items-center justify-around">
          <Link href="/" aria-label="Home">
            <Button variant="ghost" size="icon" className="text-muted-foreground">
              <Home className="w-5 h-5" />
            </Button>
          </Link>
          <Link href="/app" aria-label="Record meow">
            <Button variant="ghost" size="icon" className="text-muted-foreground">
              <Mic className="w-5 h-5" />
            </Button>
          </Link>
          <Link href="/log" aria-label="Meow log">
            <Button variant="ghost" size="icon" className="text-muted-foreground">
              <BookOpen className="w-5 h-5" />
            </Button>
          </Link>
          <Link href="/insights" aria-label="Insights" aria-current="page">
            <Button variant="ghost" size="icon" className="text-primary">
              <TrendingUp className="w-5 h-5" />
            </Button>
          </Link>
          <Link href="/settings" aria-label="Settings">
            <Button variant="ghost" size="icon" className="text-muted-foreground">
              <Settings className="w-5 h-5" />
            </Button>
          </Link>
        </div>
      </nav>
    </div>
  )
}
