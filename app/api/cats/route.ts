import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = Number(searchParams.get('limit') || 24)
    
    const response = await fetch(
      `https://api.thecatapi.com/v1/images/search?limit=${limit}`,
      {
        headers: {
          'x-api-key': process.env.CAT_API_KEY || '',
        },
      }
    )
    
    const data = await response.json()
    return NextResponse.json(data, { status: response.status })
  } catch (error) {
    console.error('Error fetching cats:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
