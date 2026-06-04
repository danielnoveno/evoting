import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  // Try to get location from Vercel headers
  const city = request.headers.get('x-vercel-ip-city') || 'Unknown City'
  const country = request.headers.get('x-vercel-ip-country') || 'Unknown Country'
  const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '127.0.0.1'

  // Detect device type from user-agent
  const ua = request.headers.get('user-agent') || ''
  let device = 'Desktop'
  if (/mobile/i.test(ua)) device = 'Mobile'
  if (/tablet/i.test(ua)) device = 'Tablet'

  // For local development fallback if Vercel headers are missing
  let location = `${city}, ${country}`
  if (city === 'Unknown City' && process.env.NODE_ENV === 'development') {
    try {
      const res = await fetch('http://ip-api.com/json/')
      const data = await res.json()
      if (data.status === 'success') {
        location = `${data.city}, ${data.country}`
      }
    } catch (e) {
      location = 'Local Development'
    }
  }

  return NextResponse.json({
    ip,
    location,
    device,
    userAgent: ua,
    time: new Date().toISOString()
  })
}
