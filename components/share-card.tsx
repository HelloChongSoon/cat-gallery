'use client'

import { motion } from 'framer-motion'
import { Copy, Share2, Bookmark, RotateCcw, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

interface ShareCardProps {
  message: string
  petName: string
  onCopy: () => void
  onSave: () => void
  onReset: () => void
  isSaved?: boolean
  copyFeedback?: boolean
}

export function ShareCard({
  message,
  petName,
  onCopy,
  onSave,
  onReset,
  isSaved = false,
  copyFeedback = false,
}: ShareCardProps) {
  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${petName} says...`,
          text: message,
        })
      } catch {
        // User cancelled or share failed - fallback to copy
        onCopy()
      }
    } else {
      onCopy()
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
    >
      <Card className="p-4">
        <div className="grid grid-cols-3 gap-2">
          <Button
            variant="outline"
            className="flex flex-col items-center gap-1 h-auto py-3 relative"
            onClick={onCopy}
            aria-label={copyFeedback ? "Copied to clipboard" : "Copy translation to clipboard"}
          >
            {copyFeedback ? (
              <Check className="w-4 h-4 text-green-600" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
            <span className="text-xs">{copyFeedback ? 'Copied!' : 'Copy'}</span>
          </Button>

          <Button
            variant="outline"
            className="flex flex-col items-center gap-1 h-auto py-3"
            onClick={handleShare}
            aria-label="Share translation"
          >
            <Share2 className="w-4 h-4" />
            <span className="text-xs">Share</span>
          </Button>

          <Button
            variant={isSaved ? "secondary" : "outline"}
            className="flex flex-col items-center gap-1 h-auto py-3"
            onClick={onSave}
            disabled={isSaved}
            aria-label={isSaved ? "Translation saved to diary" : "Save translation to diary"}
          >
            <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-current' : ''}`} />
            <span className="text-xs">{isSaved ? 'Saved' : 'Save'}</span>
          </Button>
        </div>

        <Button
          variant="default"
          className="w-full mt-3"
          onClick={onReset}
          aria-label="Record another pet sound"
        >
          <RotateCcw className="w-4 h-4 mr-2" />
          Translate Another Sound
        </Button>
      </Card>
    </motion.div>
  )
}
