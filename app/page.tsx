'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Sparkles, ChevronRight, Mic, BookOpen, Heart, Cat } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { CatProfileSetup } from '@/components/cat-profile-setup'
import { CatProfileCard } from '@/components/cat-profile-card'
import { loadCatProfile, saveCatProfile } from '@/lib/storage'
import type { CatProfile } from '@/lib/types'

export default function LandingPage() {
  const router = useRouter()
  const [catProfile, setCatProfile] = useState<CatProfile | null>(null)
  const [showSetup, setShowSetup] = useState(false)
  const [isHydrated, setIsHydrated] = useState(false)

  // Hydration-safe data loading
  useEffect(() => {
    const profile = loadCatProfile()
    setCatProfile(profile)
    setIsHydrated(true)
  }, [])

  const handleProfileSave = (profile: CatProfile) => {
    saveCatProfile(profile)
    setCatProfile(profile)
    // Navigate to app after creating profile
    router.push('/app')
  }

  const handleStart = () => {
    if (catProfile) {
      router.push('/app')
    } else {
      setShowSetup(true)
    }
  }

  const handleEditProfile = () => {
    setShowSetup(true)
  }

  // Show loading spinner during hydration
  if (!isHydrated) {
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
    <main className="min-h-screen flex flex-col overflow-hidden bg-[radial-gradient(circle_at_top,#fff7ed_0%,#f8fafc_46%,#ffffff_100%)]">
      {/* Hero Section */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-10">
        {/* Logo/Icon */}
        <motion.div
          className="relative mb-8"
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15 }}
        >
          <div className="w-28 h-28 rounded-[2rem] bg-white/80 ring-1 ring-primary/10 flex items-center justify-center shadow-xl shadow-primary/10">
            <motion.span 
              className="text-6xl"
              animate={{ rotate: [-5, 5, -5] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              role="img"
              aria-label="Paw print"
            >
              🐾
            </motion.span>
          </div>
          <motion.div
            className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-primary flex items-center justify-center shadow-md"
            animate={{ scale: [1, 1.15, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            <Sparkles className="w-4 h-4 text-primary-foreground" aria-hidden="true" />
          </motion.div>
        </motion.div>

        {/* Title */}
        <motion.h1
          className="text-4xl font-bold text-foreground text-center mb-3 text-balance"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          What Meow?
        </motion.h1>

        <motion.p
          className="text-lg text-muted-foreground text-center max-w-sm mb-8 text-pretty leading-relaxed"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          Decode your cat&apos;s meows into practical care clues, warm patterns, and just enough mischief to share.
        </motion.p>

        {/* Features */}
        <motion.div
          className="grid gap-3 w-full max-w-sm mb-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          role="list"
          aria-label="App features"
        >
          {[
            { icon: <Mic className="w-5 h-5 text-primary" />, text: 'Capture a real or demo meow' },
            { icon: <Heart className="w-5 h-5 text-primary" />, text: 'Get a useful care read first' },
            { icon: <BookOpen className="w-5 h-5 text-primary" />, text: 'Build a living meow log' },
          ].map((feature, i) => (
            <Card 
              key={i} 
              className="flex items-center gap-3 p-4 bg-white/80 shadow-sm shadow-primary/5 hover:shadow-md transition-shadow"
              role="listitem"
            >
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                {feature.icon}
              </div>
              <span className="text-sm font-medium text-foreground">{feature.text}</span>
            </Card>
          ))}
        </motion.div>

        {/* Pet Profile Card (if exists) */}
        {catProfile && (
          <motion.div
            className="w-full max-w-sm mb-6"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5 }}
          >
            <p className="text-sm text-muted-foreground mb-2 text-center">
              Your Pet
            </p>
            <CatProfileCard 
              profile={catProfile} 
              onEdit={handleEditProfile}
              size="md"
            />
          </motion.div>
        )}

        {/* CTA Button */}
        <motion.div
          className="w-full max-w-sm"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Button 
            size="xl" 
            className="w-full text-lg shadow-lg hover:shadow-xl transition-shadow"
            onClick={handleStart}
          >
            {catProfile ? 'Decode a Meow' : 'Create Cat Profile'}
            <ChevronRight className="w-5 h-5 ml-2" aria-hidden="true" />
          </Button>
          
          {!catProfile && (
            <p className="text-xs text-muted-foreground text-center mt-3">
              No account needed. Your cat&apos;s data stays on this device.
            </p>
          )}
        </motion.div>
      </div>

      {/* Footer */}
      <footer className="py-6 text-center space-y-3">
        <Link 
          href="/gallery"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <Cat className="w-4 h-4" />
          <span>Bryson&apos;s Cat Gallery</span>
        </Link>
        <p className="text-xs text-muted-foreground">
          Made for tiny mysteries and very serious snack negotiations
        </p>
      </footer>

      {/* Profile Setup Modal */}
      <CatProfileSetup
        isOpen={showSetup}
        onClose={() => setShowSetup(false)}
        onSave={handleProfileSave}
        initialProfile={catProfile}
      />
    </main>
  )
}
