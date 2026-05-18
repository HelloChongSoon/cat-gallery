'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { ChevronLeft, Home, BookOpen, Settings, Edit3, Trash2, Info } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { PetProfileCard } from '@/components/pet-profile-card'
import { PetProfileSetup } from '@/components/pet-profile-setup'
import { ConnectionStatusBadge } from '@/components/connection-status-badge'
import { loadPetProfile, savePetProfile, clearPetProfile, clearAllTranslations } from '@/lib/storage'
import { useAgoraVoice } from '@/hooks/use-agora-voice'
import type { PetProfile } from '@/lib/types'

export default function SettingsPage() {
  const router = useRouter()
  const [petProfile, setPetProfile] = useState<PetProfile | null>(null)
  const [showProfileSetup, setShowProfileSetup] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [isLoaded, setIsLoaded] = useState(false)

  const agora = useAgoraVoice()

  useEffect(() => {
    const profile = loadPetProfile()
    setPetProfile(profile)
    setIsLoaded(true)
  }, [])

  const handleProfileSave = (profile: PetProfile) => {
    savePetProfile(profile)
    setPetProfile(profile)
  }

  const handleDeleteProfile = () => {
    clearPetProfile()
    clearAllTranslations()
    router.push('/')
  }

  // Get connection status
  const getConnectionStatus = () => {
    if (agora.error) return 'error'
    if (!agora.isAgoraConfigured) return 'demo-mode'
    if (agora.isConnected) return 'connected'
    return 'missing-credentials'
  }

  if (!isLoaded) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </main>
    )
  }

  return (
    <main className="min-h-screen flex flex-col pb-20">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b">
        <div className="flex items-center justify-between px-4 py-3">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ChevronLeft className="w-5 h-5" />
          </Button>
          
          <h1 className="font-semibold text-foreground">Settings</h1>
          
          <div className="w-10" /> {/* Spacer */}
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 px-4 py-6 space-y-6">
        {/* Pet Profile Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h2 className="text-sm font-medium text-muted-foreground mb-3 px-1">
            Pet Profile
          </h2>
          
          {petProfile ? (
            <div className="space-y-3">
              <PetProfileCard 
                profile={petProfile}
                onEdit={() => setShowProfileSetup(true)}
                size="lg"
              />
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowProfileSetup(true)}
                >
                  <Edit3 className="w-4 h-4 mr-2" />
                  Edit Profile
                </Button>
                <Button
                  variant="outline"
                  className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
                  onClick={() => setShowDeleteConfirm(true)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ) : (
            <Card className="p-6 text-center">
              <p className="text-muted-foreground mb-4">No pet profile created yet</p>
              <Button onClick={() => setShowProfileSetup(true)}>
                Create Profile
              </Button>
            </Card>
          )}
        </motion.section>

        {/* Connection Status Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <h2 className="text-sm font-medium text-muted-foreground mb-3 px-1">
            Connection Status
          </h2>
          
          <Card className="p-4">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="font-medium text-foreground mb-1">Agora Voice</p>
                <p className="text-xs text-muted-foreground">
                  Real-time voice capture service
                </p>
              </div>
              <ConnectionStatusBadge 
                status={getConnectionStatus()} 
                error={agora.error}
              />
            </div>
            
            <div className="bg-secondary/50 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <Info className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Demo Mode uses simulated audio so you can test the experience 
                  without Agora credentials. To enable real voice recording, 
                  set the following environment variables:
                </p>
              </div>
              <div className="mt-3 space-y-1">
                <code className="block text-xs bg-background px-2 py-1 rounded font-mono text-foreground">
                  NEXT_PUBLIC_AGORA_APP_ID
                </code>
                <code className="block text-xs bg-background px-2 py-1 rounded font-mono text-foreground">
                  NEXT_PUBLIC_AGORA_CHANNEL_NAME
                </code>
                <code className="block text-xs bg-background px-2 py-1 rounded font-mono text-foreground">
                  NEXT_PUBLIC_AGORA_TOKEN
                </code>
              </div>
            </div>
          </Card>
        </motion.section>

        {/* About Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h2 className="text-sm font-medium text-muted-foreground mb-3 px-1">
            About
          </h2>
          
          <Card className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-foreground">Version</span>
              <span className="text-sm text-muted-foreground">1.0.0</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-foreground">Data Storage</span>
              <span className="text-sm text-muted-foreground">Local Only</span>
            </div>
            <p className="text-xs text-muted-foreground pt-2 border-t">
              PetChat AI is a fun entertainment app. All translations are 
              generated locally for entertainment purposes only. No actual 
              pet communication is occurring. Please consult a veterinarian 
              for real pet health concerns.
            </p>
          </Card>
        </motion.section>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
          onClick={() => setShowDeleteConfirm(false)}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            onClick={e => e.stopPropagation()}
          >
            <Card className="p-6 max-w-sm">
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Delete Profile?
              </h3>
              <p className="text-sm text-muted-foreground mb-6">
                This will permanently delete your pet profile and all saved 
                translations. This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowDeleteConfirm(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  className="flex-1"
                  onClick={handleDeleteProfile}
                >
                  Delete
                </Button>
              </div>
            </Card>
          </motion.div>
        </div>
      )}

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-sm border-t">
        <div className="flex items-center justify-around py-3 px-4 max-w-md mx-auto">
          <Link href="/">
            <Button variant="ghost" className="flex flex-col items-center gap-1 h-auto py-2">
              <Home className="w-5 h-5" />
              <span className="text-xs">Home</span>
            </Button>
          </Link>
          
          <Link href="/diary">
            <Button variant="ghost" className="flex flex-col items-center gap-1 h-auto py-2">
              <BookOpen className="w-5 h-5" />
              <span className="text-xs">Diary</span>
            </Button>
          </Link>
          
          <Link href="/settings">
            <Button variant="ghost" className="flex flex-col items-center gap-1 h-auto py-2 text-primary">
              <Settings className="w-5 h-5" />
              <span className="text-xs">Settings</span>
            </Button>
          </Link>
        </div>
      </nav>

      {/* Profile Setup Modal */}
      <PetProfileSetup
        isOpen={showProfileSetup}
        onClose={() => setShowProfileSetup(false)}
        onSave={handleProfileSave}
        initialProfile={petProfile}
      />
    </main>
  )
}
