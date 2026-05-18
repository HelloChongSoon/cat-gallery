'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Home, Settings, TrendingUp, BookOpen, ChevronRight, Calendar, Filter, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { loadCatProfile, loadMeowLogs, deleteMeowLog } from '@/lib/storage'
import type { CatProfile, MeowLogEntry, LikelyNeed } from '@/lib/types'

const needLabels: Record<LikelyNeed, string> = {
  food: 'Food',
  water: 'Water',
  attention: 'Attention',
  play: 'Play',
  door_access: 'Door Access',
  litter_box: 'Litter Box',
  stress: 'Stress',
  discomfort: 'Discomfort',
  routine_request: 'Routine',
  greeting: 'Greeting',
  boredom: 'Boredom',
  unknown: 'Unknown',
}

const urgencyColors = {
  low: 'bg-green-500/10 text-green-700',
  medium: 'bg-amber-500/10 text-amber-700',
  high: 'bg-red-500/10 text-red-700',
}

function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

function formatLabel(value: string): string {
  return value.replace(/[-_]/g, ' ')
}

function groupLogsByDate(logs: MeowLogEntry[]): Map<string, MeowLogEntry[]> {
  const groups = new Map<string, MeowLogEntry[]>()
  
  for (const log of logs) {
    const date = new Date(log.createdAt)
    const key = date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
    
    const existing = groups.get(key) || []
    existing.push(log)
    groups.set(key, existing)
  }
  
  return groups
}

export default function MeowLogPage() {
  const router = useRouter()
  const [catProfile, setCatProfile] = useState<CatProfile | null>(null)
  const [logs, setLogs] = useState<MeowLogEntry[]>([])
  const [isHydrated, setIsHydrated] = useState(false)
  const [filterNeed, setFilterNeed] = useState<string>('all')
  const [selectedLog, setSelectedLog] = useState<MeowLogEntry | null>(null)
  const [deleteLogId, setDeleteLogId] = useState<string | null>(null)

  useEffect(() => {
    const profile = loadCatProfile()
    if (!profile) {
      router.replace('/')
      return
    }
    setCatProfile(profile)
    setLogs(loadMeowLogs())
    setIsHydrated(true)
  }, [router])

  const filteredLogs = useMemo(() => {
    if (filterNeed === 'all') return logs
    return logs.filter(log => log.interpretation.likelyNeed === filterNeed)
  }, [logs, filterNeed])

  const groupedLogs = useMemo(() => groupLogsByDate(filteredLogs), [filteredLogs])

  const handleDelete = (id: string) => {
    deleteMeowLog(id)
    setLogs(loadMeowLogs())
    setDeleteLogId(null)
    setSelectedLog(null)
  }

  if (!isHydrated || !catProfile) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-background">
        <div 
          className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" 
          role="status"
          aria-label="Loading"
        />
      </main>
    )
  }

  return (
    <main className="min-h-screen flex flex-col pb-24 bg-[radial-gradient(circle_at_top,#fff7ed_0%,#f8fafc_48%,#ffffff_100%)]">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b">
        <div className="flex items-center justify-between px-4 py-3">
          <Link href="/" aria-label="Go to home page">
            <Button variant="ghost" size="icon" aria-label="Home">
              <Home className="w-5 h-5" />
            </Button>
          </Link>
          
          <h1 className="font-semibold text-foreground">Meow Log</h1>
          
          <Link href="/settings" aria-label="Go to settings">
            <Button variant="ghost" size="icon" aria-label="Settings">
              <Settings className="w-5 h-5" />
            </Button>
          </Link>
        </div>
      </header>

      {/* Filters */}
      <div className="px-4 py-3 border-b">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <Select value={filterNeed} onValueChange={setFilterNeed}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by need" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Needs</SelectItem>
              {Object.entries(needLabels).map(([value, label]) => (
                <SelectItem key={value} value={value}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 px-4 py-4 max-w-lg mx-auto w-full">
        {filteredLogs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 rounded-full bg-white shadow-lg shadow-primary/10 flex items-center justify-center mb-4">
              <BookOpen className="w-8 h-8 text-muted-foreground" />
            </div>
            <h2 className="text-lg font-semibold text-foreground mb-2">No Meows Yet</h2>
            <p className="text-sm text-muted-foreground mb-4 max-w-xs">
              {filterNeed === 'all' 
                ? `Start recording ${catProfile.name}'s meows to build your log.`
                : `No meows with "${needLabels[filterNeed as LikelyNeed]}" need found.`
              }
            </p>
            <Button onClick={() => router.push('/app')} className="gap-2">
              Record a Meow
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {Array.from(groupedLogs.entries()).map(([dateKey, dateLogs]) => (
              <div key={dateKey}>
                <div className="flex items-center gap-2 mb-3">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <h2 className="text-sm font-medium text-muted-foreground">{dateKey}</h2>
                </div>
                <div className="space-y-3">
                  {dateLogs.map((log) => (
                    <motion.div
                      key={log.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      <Card 
                        className="p-4 cursor-pointer bg-white/90 shadow-sm shadow-primary/5 hover:shadow-md transition-all"
                        onClick={() => setSelectedLog(log)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${urgencyColors[log.interpretation.urgency]}`}>
                                {needLabels[log.interpretation.likelyNeed]}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {log.interpretation.confidence}% confidence
                              </span>
                            </div>
                            <p className="text-sm text-foreground line-clamp-2 italic">
                              &ldquo;{log.interpretation.playfulTranslation}&rdquo;
                            </p>
                            <p className="text-xs text-muted-foreground mt-2">
                              {formatDate(log.createdAt)}
                            </p>
                          </div>
                          <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                        </div>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Log Detail Modal */}
      <AnimatePresence>
        {selectedLog && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm"
            onClick={() => setSelectedLog(null)}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="absolute bottom-0 left-0 right-0 bg-background rounded-t-3xl max-h-[85vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 space-y-4">
                {/* Handle */}
                <div className="w-12 h-1 bg-muted-foreground/30 rounded-full mx-auto" />

                {/* Header */}
                <div className="flex items-start justify-between">
                  <div>
                    <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${urgencyColors[selectedLog.interpretation.urgency]}`}>
                      {needLabels[selectedLog.interpretation.likelyNeed]}
                    </span>
                    <p className="text-xs text-muted-foreground mt-2">
                      {formatDate(selectedLog.createdAt)}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:text-destructive"
                    onClick={() => setDeleteLogId(selectedLog.id)}
                  >
                    <Trash2 className="w-5 h-5" />
                  </Button>
                </div>

                {/* Translation */}
                <Card className="p-4 bg-primary/5 border-primary/10">
                  <p className="text-xs text-muted-foreground mb-1">{catProfile.name} said:</p>
                  <p className="text-foreground italic">
                    &ldquo;{selectedLog.interpretation.playfulTranslation}&rdquo;
                  </p>
                </Card>

                {/* Interpretation Details */}
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Reasoning</p>
                    <p className="text-sm text-foreground">{selectedLog.interpretation.reasoningSummary}</p>
                  </div>
                  
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Suggested Action</p>
                    <p className="text-sm text-foreground">{selectedLog.interpretation.suggestedAction}</p>
                  </div>

                  {selectedLog.interpretation.possibleTrigger && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Possible Trigger</p>
                      <p className="text-sm text-foreground">{selectedLog.interpretation.possibleTrigger}</p>
                    </div>
                  )}
                </div>

                {/* Context */}
                <div className="pt-2 border-t">
                  <p className="text-xs text-muted-foreground mb-2">Context</p>
                  <div className="flex flex-wrap gap-2">
                    <span className="px-2 py-1 bg-secondary rounded-full text-xs text-foreground">
                      {formatLabel(selectedLog.sound.soundType)}
                    </span>
                    <span className="px-2 py-1 bg-secondary rounded-full text-xs text-foreground">
                      {formatLabel(selectedLog.context.location)}
                    </span>
                    <span className="px-2 py-1 bg-secondary rounded-full text-xs text-foreground">
                      {formatLabel(selectedLog.context.situation)}
                    </span>
                    <span className="px-2 py-1 bg-secondary rounded-full text-xs text-foreground">
                      {selectedLog.sound.perceivedIntensity} intensity
                    </span>
                  </div>
                </div>

                {/* Feedback */}
                {selectedLog.feedback && (
                  <div className="pt-2 border-t">
                    <p className="text-xs text-muted-foreground mb-2">Your Feedback</p>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-1 bg-secondary rounded-full text-xs text-foreground capitalize">
                        {selectedLog.feedback.accuracy}
                      </span>
                      {selectedLog.feedback.actionThatHelped && (
                        <span className="px-2 py-1 bg-secondary rounded-full text-xs text-foreground capitalize">
                          {formatLabel(selectedLog.feedback.actionThatHelped)} helped
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Close Button */}
                <Button onClick={() => setSelectedLog(null)} className="w-full">
                  Close
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteLogId} onOpenChange={() => setDeleteLogId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this entry?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete this meow log entry.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteLogId && handleDelete(deleteLogId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bottom Navigation */}
      <nav 
        className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-sm border-t"
        aria-label="Main navigation"
      >
        <div className="flex items-center justify-around py-3 px-4 max-w-md mx-auto">
          <Link href="/" aria-label="Home">
            <Button variant="ghost" className="flex flex-col items-center gap-1 h-auto py-2">
              <Home className="w-5 h-5" />
              <span className="text-xs">Home</span>
            </Button>
          </Link>
          
          <Link href="/log" aria-label="Meow Log">
            <Button variant="ghost" className="flex flex-col items-center gap-1 h-auto py-2 text-primary">
              <BookOpen className="w-5 h-5" />
              <span className="text-xs">Meow Log</span>
            </Button>
          </Link>

          <Link href="/insights" aria-label="Insights">
            <Button variant="ghost" className="flex flex-col items-center gap-1 h-auto py-2">
              <TrendingUp className="w-5 h-5" />
              <span className="text-xs">Insights</span>
            </Button>
          </Link>
          
          <Link href="/settings" aria-label="Settings">
            <Button variant="ghost" className="flex flex-col items-center gap-1 h-auto py-2">
              <Settings className="w-5 h-5" />
              <span className="text-xs">Settings</span>
            </Button>
          </Link>
        </div>
      </nav>
    </main>
  )
}
