import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const supabase = getSupabaseServerClient()
  if (!supabase) return NextResponse.json({ error: 'Backend Supabase belum dikonfigurasi.' }, { status: 503 })

  const { data: userData, error: userError } = await supabase.auth.getUser()
  if (userError || !userData.user) return NextResponse.json({ error: 'Sesi tidak ditemukan.' }, { status: 401 })

  // Try to get location from Vercel headers
  const city = request.headers.get('x-vercel-ip-city') || 'Unknown City'
  const country = request.headers.get('x-vercel-ip-country') || 'Unknown Country'
  const forwardedIp = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
  const ip = forwardedIp || request.headers.get('x-real-ip') || '127.0.0.1'

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
    ip: ip.replace(/(\d+\.\d+\.\d+)\.\d+/, '$1.x'),
    location,
    device,
    userAgent: ua,
    time: new Date().toISOString()
  })
}
