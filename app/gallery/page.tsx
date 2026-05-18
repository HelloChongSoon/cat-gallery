'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, RefreshCw, Home } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

interface CatImage {
  id: string
  url: string
  width: number
  height: number
}

export default function GalleryPage() {
  const [cats, setCats] = useState<CatImage[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedCat, setSelectedCat] = useState<CatImage | null>(null)

  const fetchCats = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true)
      } else {
        setLoading(true)
      }
      setError(null)

      const response = await fetch('/api/cats?limit=24')
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      
      const data = await response.json()
      setCats(data)
    } catch (err) {
      console.error('Error fetching cats:', err)
      setError('Failed to load cats. Please try again.')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    fetchCats()
    
    // Auto-refresh every 30 minutes
    const interval = setInterval(() => {
      fetchCats(true)
    }, 30 * 60 * 1000)
    
    return () => clearInterval(interval)
  }, [fetchCats])

  // Handle escape key for modal
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelectedCat(null)
    }
    
    if (selectedCat) {
      document.addEventListener('keydown', handleEscape)
      return () => document.removeEventListener('keydown', handleEscape)
    }
  }, [selectedCat])

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-black/80 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link 
            href="/"
            className="flex items-center gap-2 text-white/70 hover:text-white transition-colors"
            aria-label="Back to What Meow?"
          >
            <Home className="w-5 h-5" />
            <span className="text-sm hidden sm:inline">What Meow?</span>
          </Link>
          
          <h1 className="text-xl sm:text-2xl font-semibold">
            Bryson&apos;s Cat Gallery
          </h1>
          
          <button
            onClick={() => fetchCats(true)}
            disabled={refreshing}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors disabled:opacity-50"
            aria-label="Refresh gallery"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            <span className="text-sm hidden sm:inline">Refresh</span>
          </button>
        </div>
      </header>

      {/* Status Banner */}
      <AnimatePresence>
        {refreshing && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="text-center px-3 py-2 mx-5 mt-4 rounded-lg text-green-300 bg-green-900/40 border border-green-700 text-sm"
          >
            Fetching new cats...
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {loading ? (
          <div className="text-center py-20 text-lg text-gray-300">
            Loading adorable cats...
          </div>
        ) : error ? (
          <div className="text-center py-20 text-lg text-red-300">
            {error}
          </div>
        ) : (
          <motion.div 
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            {cats.map((cat, index) => (
              <motion.div
                key={cat.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
                className="group relative aspect-square rounded-xl overflow-hidden bg-neutral-900 ring-1 ring-white/10 hover:ring-white/30 transition-all shadow-md hover:shadow-xl cursor-pointer"
                onClick={() => setSelectedCat(cat)}
              >
                <Image
                  src={cat.url}
                  alt={`Cat image ${index + 1}`}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                  unoptimized
                />
              </motion.div>
            ))}
          </motion.div>
        )}
      </main>

      {/* Modal */}
      <AnimatePresence>
        {selectedCat && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setSelectedCat(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative max-w-4xl w-full max-h-[90vh]"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setSelectedCat(null)}
                className="absolute -top-3 -right-3 z-10 bg-white text-black rounded-full w-10 h-10 flex items-center justify-center shadow-lg hover:bg-gray-100 transition-colors"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
              <Image
                src={selectedCat.url}
                alt="Cat image enlarged"
                width={selectedCat.width || 800}
                height={selectedCat.height || 600}
                className="w-full h-auto max-h-[85vh] object-contain rounded-lg shadow-2xl"
                unoptimized
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
