/**
 * PetChat AI - Agora Token Generation API
 * 
 * SECURITY NOTES:
 * - AGORA_APP_CERTIFICATE must ONLY exist in server-side environment variables
 * - Clients must NEVER generate tokens directly - always use this API
 * - Token expiry is intentionally short-lived (1 hour default)
 * - TODO: Add rate limiting before public launch
 * 
 * This endpoint generates short-lived RTC tokens for Agora voice channels.
 * The App Certificate is never exposed to the client.
 */

import { NextRequest, NextResponse } from 'next/server'
import { RtcTokenBuilder, RtcRole } from 'agora-token'

// Force Node.js runtime (not Edge) for agora-token compatibility
export const runtime = 'nodejs'

// Default token expiry: 1 hour (3600 seconds)
const DEFAULT_EXPIRY_SECONDS = 3600

interface TokenRequest {
  channelName: string
  uid?: number | string
  role?: 'publisher' | 'subscriber'
}

interface TokenResponse {
  appId: string
  token: string
  channelName: string
  uid: number
  expiresAt: number
  expiresIn: number
}

interface ErrorResponse {
  error: string
  code: string
}

export async function POST(request: NextRequest): Promise<NextResponse<TokenResponse | ErrorResponse>> {
  try {
    // Read server-side environment variables (never exposed to client)
    const appId = process.env.AGORA_APP_ID
    const appCertificate = process.env.AGORA_APP_CERTIFICATE

    // Check if Agora is configured on the server
    if (!appId || !appCertificate) {
      return NextResponse.json(
        { 
          error: 'Agora is not configured on the server. Running in Demo Mode.',
          code: 'NOT_CONFIGURED'
        },
        { status: 503 }
      )
    }

    // Parse request body
    let body: TokenRequest
    try {
      body = await request.json()
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON in request body', code: 'INVALID_JSON' },
        { status: 400 }
      )
    }

    const { channelName, uid, role = 'publisher' } = body

    // Validate channelName
    if (!channelName || typeof channelName !== 'string') {
      return NextResponse.json(
        { error: 'channelName is required and must be a string', code: 'INVALID_CHANNEL' },
        { status: 400 }
      )
    }

    // Validate channelName format (alphanumeric, dash, underscore, 1-64 chars)
    if (!/^[a-zA-Z0-9_-]{1,64}$/.test(channelName)) {
      return NextResponse.json(
        { error: 'channelName must be 1-64 alphanumeric characters, dashes, or underscores', code: 'INVALID_CHANNEL_FORMAT' },
        { status: 400 }
      )
    }

    // Parse and validate uid
    let numericUid: number
    if (uid === undefined || uid === null || uid === '') {
      // Auto-generate uid if not provided
      numericUid = Math.floor(Math.random() * 100000)
    } else if (typeof uid === 'number') {
      numericUid = Math.floor(uid)
    } else if (typeof uid === 'string') {
      numericUid = parseInt(uid, 10)
      if (isNaN(numericUid)) {
        return NextResponse.json(
          { error: 'uid must be a valid number', code: 'INVALID_UID' },
          { status: 400 }
        )
      }
    } else {
      return NextResponse.json(
        { error: 'uid must be a number or numeric string', code: 'INVALID_UID' },
        { status: 400 }
      )
    }

    // Validate uid range (0 to 2^32 - 1)
    if (numericUid < 0 || numericUid > 4294967295) {
      return NextResponse.json(
        { error: 'uid must be between 0 and 4294967295', code: 'INVALID_UID_RANGE' },
        { status: 400 }
      )
    }

    // Determine role
    const rtcRole = role === 'subscriber' ? RtcRole.SUBSCRIBER : RtcRole.PUBLISHER

    // Calculate expiry timestamp
    const currentTimestamp = Math.floor(Date.now() / 1000)
    const privilegeExpiredTs = currentTimestamp + DEFAULT_EXPIRY_SECONDS

    // Generate RTC token
    // SECURITY: App Certificate is used here but NEVER returned to client
    const token = RtcTokenBuilder.buildTokenWithUid(
      appId,
      appCertificate,
      channelName,
      numericUid,
      rtcRole,
      privilegeExpiredTs,
      privilegeExpiredTs // Token expire and privilege expire same
    )

    // Return token data (never include appCertificate!)
    const response: TokenResponse = {
      appId,
      token,
      channelName,
      uid: numericUid,
      expiresAt: privilegeExpiredTs * 1000, // Convert to milliseconds for JS Date
      expiresIn: DEFAULT_EXPIRY_SECONDS,
    }

    return NextResponse.json(response)

  } catch (err) {
    console.error('[Agora Token API] Error generating token:', err)
    
    return NextResponse.json(
      { error: 'Internal server error while generating token', code: 'INTERNAL_ERROR' },
      { status: 500 }
    )
  }
}

// Only allow POST method
export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed. Use POST.', code: 'METHOD_NOT_ALLOWED' },
    { status: 405 }
  )
}
