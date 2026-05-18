/**
 * PetChat AI - Agora Voice Hook (Production-Ready)
 * 
 * SECURITY NOTES:
 * - Tokens are generated server-side via /api/agora/token
 * - App Certificate NEVER exists on the client
 * - Tokens are short-lived (1 hour) and auto-renewed
 * - Client only receives appId, token, channelName, uid from API
 * 
 * Without server credentials, the app runs in Demo Mode with simulated audio.
 */

'use client'

import { useState, useCallback, useRef, useEffect } from 'react'

export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error'
export type PermissionStatus = 'prompt' | 'granted' | 'denied' | 'unknown'

export interface TokenInfo {
  appId: string
  token: string
  channelName: string
  uid: number
  expiresAt: number
  expiresIn: number
}

export interface UseAgoraVoiceReturn {
  isAgoraConfigured: boolean
  isConnected: boolean
  isConnecting: boolean
  isRecording: boolean
  isMicMuted: boolean
  connectionStatus: ConnectionStatus
  startSession: () => Promise<void>
  stopSession: () => Promise<void>
  startRecording: () => Promise<void>
  stopRecording: () => Promise<void>
  toggleMic: () => Promise<void>
  error: string | null
  volumeLevel: number
  permissionStatus: PermissionStatus
  requestPermission: () => Promise<boolean>
  // Production readiness info
  tokenInfo: TokenInfo | null
  tokenExpiresIn: number | null
}

// Store module reference to avoid multiple imports
let AgoraRTCModule: typeof import('agora-rtc-sdk-ng').default | null = null

async function getAgoraRTC() {
  if (typeof window === 'undefined') {
    throw new Error('Agora SDK can only be used in browser')
  }
  
  if (!AgoraRTCModule) {
    const module = await import('agora-rtc-sdk-ng')
    AgoraRTCModule = module.default
  }
  
  return AgoraRTCModule
}

// Token renewal buffer: renew 5 minutes before expiry
const TOKEN_RENEWAL_BUFFER_MS = 5 * 60 * 1000

export function useAgoraVoice(): UseAgoraVoiceReturn {
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected')
  const [isRecording, setIsRecording] = useState(false)
  const [isMicMuted, setIsMicMuted] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [volumeLevel, setVolumeLevel] = useState(0)
  const [permissionStatus, setPermissionStatus] = useState<PermissionStatus>('unknown')
  const [tokenInfo, setTokenInfo] = useState<TokenInfo | null>(null)
  const [tokenExpiresIn, setTokenExpiresIn] = useState<number | null>(null)
  const [isAgoraConfigured, setIsAgoraConfigured] = useState<boolean>(true) // Assume configured until proven otherwise

  // Use refs to store Agora objects to avoid re-renders and closure issues
  const clientRef = useRef<Awaited<ReturnType<typeof getAgoraRTC>> extends { createClient: (config: unknown) => infer C } ? C : unknown>(null)
  const localAudioTrackRef = useRef<unknown>(null)
  const volumeIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const tokenExpiryIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const tokenRenewalTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isPublishedRef = useRef(false)
  const sessionIdRef = useRef<string | null>(null)
  const cleanupInProgressRef = useRef(false)
  const currentTokenInfoRef = useRef<TokenInfo | null>(null)

  const isConnected = connectionStatus === 'connected'
  const isConnecting = connectionStatus === 'connecting'

  // Check microphone permission status on mount
  useEffect(() => {
    if (typeof window === 'undefined') return

    const checkPermission = async () => {
      try {
        if (navigator.permissions) {
          const result = await navigator.permissions.query({ name: 'microphone' as PermissionName })
          setPermissionStatus(result.state as PermissionStatus)
          
          result.addEventListener('change', () => {
            setPermissionStatus(result.state as PermissionStatus)
          })
        }
      } catch {
        // permissions API not supported
        setPermissionStatus('unknown')
      }
    }

    checkPermission()
  }, [])

  // Token expiry countdown
  useEffect(() => {
    if (!tokenInfo) {
      setTokenExpiresIn(null)
      return
    }

    const updateExpiry = () => {
      const now = Date.now()
      const remaining = Math.max(0, Math.floor((tokenInfo.expiresAt - now) / 1000))
      setTokenExpiresIn(remaining)
    }

    updateExpiry()
    tokenExpiryIntervalRef.current = setInterval(updateExpiry, 1000)

    return () => {
      if (tokenExpiryIntervalRef.current) {
        clearInterval(tokenExpiryIntervalRef.current)
        tokenExpiryIntervalRef.current = null
      }
    }
  }, [tokenInfo])

  // Fetch token from server API
  const fetchToken = useCallback(async (channelName: string, uid?: number): Promise<TokenInfo | null> => {
    try {
      const response = await fetch('/api/agora/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channelName, uid }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error', code: 'UNKNOWN' }))
        
        if (errorData.code === 'NOT_CONFIGURED') {
          setIsAgoraConfigured(false)
          return null
        }
        
        throw new Error(errorData.error || `HTTP ${response.status}`)
      }

      const data: TokenInfo = await response.json()
      setIsAgoraConfigured(true)
      return data

    } catch (err) {
      console.error('[v0] Token fetch error:', err)
      return null
    }
  }, [])

  // Renew token before expiry
  const renewToken = useCallback(async () => {
    const client = clientRef.current as { renewToken?: (token: string) => Promise<void> } | null
    const currentToken = currentTokenInfoRef.current

    if (!client || !currentToken) return

    try {
      const newTokenInfo = await fetchToken(currentToken.channelName, currentToken.uid)
      
      if (newTokenInfo) {
        await client.renewToken?.(newTokenInfo.token)
        currentTokenInfoRef.current = newTokenInfo
        setTokenInfo(newTokenInfo)
        
        // Schedule next renewal
        scheduleTokenRenewal(newTokenInfo)
      }
    } catch (err) {
      console.error('[v0] Token renewal failed:', err)
      setError('Token renewal failed. Session may expire soon.')
    }
  }, [fetchToken])

  // Schedule token renewal before expiry
  const scheduleTokenRenewal = useCallback((tokenData: TokenInfo) => {
    // Clear existing timeout
    if (tokenRenewalTimeoutRef.current) {
      clearTimeout(tokenRenewalTimeoutRef.current)
      tokenRenewalTimeoutRef.current = null
    }

    const now = Date.now()
    const renewalTime = tokenData.expiresAt - TOKEN_RENEWAL_BUFFER_MS
    const delay = renewalTime - now

    if (delay > 0) {
      tokenRenewalTimeoutRef.current = setTimeout(() => {
        renewToken()
      }, delay)
    }
  }, [renewToken])

  // Cleanup function - fully stops and cleans up Agora resources
  const cleanup = useCallback(async () => {
    if (cleanupInProgressRef.current) return
    cleanupInProgressRef.current = true

    try {
      // Stop volume monitoring
      if (volumeIntervalRef.current) {
        clearInterval(volumeIntervalRef.current)
        volumeIntervalRef.current = null
      }

      // Stop token expiry countdown
      if (tokenExpiryIntervalRef.current) {
        clearInterval(tokenExpiryIntervalRef.current)
        tokenExpiryIntervalRef.current = null
      }

      // Cancel token renewal
      if (tokenRenewalTimeoutRef.current) {
        clearTimeout(tokenRenewalTimeoutRef.current)
        tokenRenewalTimeoutRef.current = null
      }

      // Get references before nulling
      const client = clientRef.current as {
        unpublish?: (tracks: unknown[]) => Promise<void>
        leave?: () => Promise<void>
        connectionState?: string
        removeAllListeners?: () => void
      } | null
      const localTrack = localAudioTrackRef.current as {
        stop?: () => void
        close?: () => void
      } | null

      // Unpublish track if published
      if (client && localTrack && isPublishedRef.current) {
        try {
          await client.unpublish?.([localTrack])
        } catch {
          // Ignore unpublish errors during cleanup
        }
        isPublishedRef.current = false
      }

      // Stop and close local audio track
      if (localTrack) {
        try {
          localTrack.stop?.()
          localTrack.close?.()
        } catch {
          // Ignore track cleanup errors
        }
        localAudioTrackRef.current = null
      }

      // Leave channel and cleanup client
      if (client) {
        try {
          client.removeAllListeners?.()
          if (client.connectionState === 'CONNECTED' || client.connectionState === 'CONNECTING') {
            await client.leave?.()
          }
        } catch {
          // Ignore leave errors during cleanup
        }
        clientRef.current = null
      }

      // Reset session
      sessionIdRef.current = null
      currentTokenInfoRef.current = null
      setConnectionStatus('disconnected')
      setIsRecording(false)
      setVolumeLevel(0)
      setIsMicMuted(false)
      setTokenInfo(null)
      setTokenExpiresIn(null)

    } finally {
      cleanupInProgressRef.current = false
    }
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanup()
    }
  }, [cleanup])

  const requestPermission = useCallback(async (): Promise<boolean> => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      // Immediately stop the stream - we just wanted to request permission
      stream.getTracks().forEach(track => track.stop())
      setPermissionStatus('granted')
      return true
    } catch (err) {
      if (err instanceof Error) {
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          setPermissionStatus('denied')
          setError('Microphone access was denied. Please enable it in your browser settings.')
        } else if (err.name === 'NotFoundError') {
          setError('No microphone found. Please connect a microphone and try again.')
        } else {
          setError(`Microphone error: ${err.message}`)
        }
      }
      return false
    }
  }, [])

  const startSession = useCallback(async () => {
    // Guard: already connected or connecting
    if (connectionStatus === 'connected' || connectionStatus === 'connecting') {
      return
    }

    // Create unique session ID to prevent duplicate sessions
    const newSessionId = `session-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
    sessionIdRef.current = newSessionId

    try {
      setConnectionStatus('connecting')
      setError(null)

      // Fetch token from server API
      const channelName = 'petchat-demo' // Default channel name
      const tokenData = await fetchToken(channelName)

      // Check if session was cancelled during fetch
      if (sessionIdRef.current !== newSessionId) {
        return
      }

      // If no token (server not configured), fall back to demo mode
      if (!tokenData) {
        setConnectionStatus('error')
        setError('Agora not configured on server. Running in Demo Mode.')
        return
      }

      setTokenInfo(tokenData)
      currentTokenInfoRef.current = tokenData

      // Dynamically import Agora SDK (browser-only)
      const AgoraRTC = await getAgoraRTC()

      // Check if session was cancelled during import
      if (sessionIdRef.current !== newSessionId) {
        return
      }

      // Create RTC client with mode: rtc, codec: vp8
      const client = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' })
      clientRef.current = client

      // Setup event handlers
      client.on('user-published', async (user, mediaType) => {
        if (mediaType === 'audio') {
          try {
            await client.subscribe(user, mediaType)
            user.audioTrack?.play()
          } catch (err) {
            console.error('[v0] Error subscribing to remote user:', err)
          }
        }
      })

      client.on('user-unpublished', (user, mediaType) => {
        if (mediaType === 'audio') {
          user.audioTrack?.stop()
        }
      })

      client.on('connection-state-change', (curState, prevState, reason) => {
        console.log('[v0] Agora connection state:', prevState, '->', curState, reason)
        
        if (curState === 'DISCONNECTED') {
          if (sessionIdRef.current === newSessionId) {
            setConnectionStatus('disconnected')
            if (reason === 'LEAVE') {
              // Normal leave, no error
            } else {
              setError('Connection lost. Please try again.')
            }
          }
        } else if (curState === 'CONNECTED') {
          setConnectionStatus('connected')
        }
      })

      // Listen for token privilege will expire event
      client.on('token-privilege-will-expire', async () => {
        console.log('[v0] Token privilege will expire, renewing...')
        await renewToken()
      })

      // Listen for token privilege did expire event
      client.on('token-privilege-did-expire', async () => {
        console.log('[v0] Token privilege expired, reconnecting...')
        setError('Session expired. Please reconnect.')
        setConnectionStatus('error')
      })

      client.on('exception', (event) => {
        console.error('[v0] Agora exception:', event)
      })

      // Join the channel with server-generated token
      await client.join(tokenData.appId, tokenData.channelName, tokenData.token, tokenData.uid)

      // Verify session is still valid after join
      if (sessionIdRef.current !== newSessionId) {
        await client.leave()
        clientRef.current = null
        return
      }

      // Schedule token renewal
      scheduleTokenRenewal(tokenData)

      setConnectionStatus('connected')
      setError(null)

    } catch (err) {
      // Reset on error
      clientRef.current = null
      sessionIdRef.current = null
      currentTokenInfoRef.current = null
      setConnectionStatus('error')
      setTokenInfo(null)

      // User-friendly error messages
      if (err instanceof Error) {
        const message = err.message.toLowerCase()
        const errorString = String(err)
        
        if (message.includes('gateway') || message.includes('can_not_get_gateway') || errorString.includes('CAN_NOT_GET_GATEWAY')) {
          setError('Agora token expired or invalid. Falling back to Demo Mode.')
        } else if (message.includes('invalid token') || message.includes('token expired') || message.includes('token')) {
          setError('Agora token is invalid or expired. Falling back to Demo Mode.')
        } else if (message.includes('invalid appid') || message.includes('app id')) {
          setError('Invalid Agora App ID. Please check server configuration.')
        } else if (message.includes('channel')) {
          setError('Unable to join channel. Please check the channel name.')
        } else if (message.includes('network') || message.includes('timeout')) {
          setError('Network error. Please check your internet connection.')
        } else {
          setError(`Connection failed: ${err.message}`)
        }
        
        console.error('[v0] Agora startSession error:', err)
      } else {
        setError('Failed to connect. Please try again.')
      }
    }
  }, [connectionStatus, fetchToken, renewToken, scheduleTokenRenewal])

  const stopSession = useCallback(async () => {
    sessionIdRef.current = null
    await cleanup()
    setError(null)
  }, [cleanup])

  const startRecording = useCallback(async () => {
    const client = clientRef.current as {
      publish?: (tracks: unknown[]) => Promise<void>
      connectionState?: string
    } | null

    // Guard: not connected
    if (!client || connectionStatus !== 'connected') {
      setError('Not connected to Agora. Please wait for connection.')
      return
    }

    // Guard: already recording
    if (localAudioTrackRef.current) {
      return
    }

    try {
      setError(null)

      // Dynamically import Agora to create microphone track
      const AgoraRTC = await getAgoraRTC()

      // Create microphone audio track
      const localAudioTrack = await AgoraRTC.createMicrophoneAudioTrack()
      localAudioTrackRef.current = localAudioTrack

      // Publish the track to the channel
      await client.publish?.([localAudioTrack])
      isPublishedRef.current = true

      setIsRecording(true)
      setPermissionStatus('granted')

      // Start volume level monitoring
      volumeIntervalRef.current = setInterval(() => {
        const track = localAudioTrackRef.current as { getVolumeLevel?: () => number } | null
        if (track?.getVolumeLevel) {
          const level = track.getVolumeLevel()
          setVolumeLevel(level)
        }
      }, 100)

    } catch (err) {
      localAudioTrackRef.current = null
      isPublishedRef.current = false

      if (err instanceof Error) {
        const message = err.message.toLowerCase()
        
        if (message.includes('permission') || message.includes('notallowed') || err.name === 'NotAllowedError') {
          setPermissionStatus('denied')
          setError('Microphone permission denied. Please allow access in your browser settings.')
        } else if (message.includes('notfound') || err.name === 'NotFoundError') {
          setError('No microphone found. Please connect a microphone.')
        } else if (message.includes('notreadable') || err.name === 'NotReadableError') {
          setError('Microphone is in use by another application.')
        } else {
          setError(`Recording failed: ${err.message}`)
        }
        
        console.error('[v0] Agora startRecording error:', err)
      } else {
        setError('Failed to start recording. Please try again.')
      }
    }
  }, [connectionStatus])

  const stopRecording = useCallback(async () => {
    try {
      // Stop volume monitoring
      if (volumeIntervalRef.current) {
        clearInterval(volumeIntervalRef.current)
        volumeIntervalRef.current = null
      }

      const client = clientRef.current as {
        unpublish?: (tracks: unknown[]) => Promise<void>
        connectionState?: string
      } | null
      const localTrack = localAudioTrackRef.current as {
        stop?: () => void
        close?: () => void
      } | null

      // Unpublish track if published
      if (client && localTrack && isPublishedRef.current) {
        try {
          if (client.connectionState === 'CONNECTED') {
            await client.unpublish?.([localTrack])
          }
        } catch {
          // Ignore unpublish errors
        }
        isPublishedRef.current = false
      }

      // Stop and close track
      if (localTrack) {
        try {
          localTrack.stop?.()
          localTrack.close?.()
        } catch {
          // Ignore track errors
        }
        localAudioTrackRef.current = null
      }

      setIsRecording(false)
      setVolumeLevel(0)

    } catch (err) {
      console.error('[v0] Agora stopRecording error:', err)
      // Still update state even on error
      setIsRecording(false)
      setVolumeLevel(0)
    }
  }, [])

  const toggleMic = useCallback(async () => {
    const localTrack = localAudioTrackRef.current as { setMuted?: (muted: boolean) => Promise<void> } | null
    
    if (localTrack?.setMuted) {
      try {
        const newMuteState = !isMicMuted
        await localTrack.setMuted(newMuteState)
        setIsMicMuted(newMuteState)
      } catch (err) {
        console.error('[v0] Error toggling mic:', err)
        setError('Failed to toggle microphone.')
      }
    }
  }, [isMicMuted])

  return {
    isAgoraConfigured,
    isConnected,
    isConnecting,
    isRecording,
    isMicMuted,
    connectionStatus,
    startSession,
    stopSession,
    startRecording,
    stopRecording,
    toggleMic,
    error,
    volumeLevel,
    permissionStatus,
    requestPermission,
    tokenInfo,
    tokenExpiresIn,
  }
}
