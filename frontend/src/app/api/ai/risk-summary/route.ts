import { GoogleGenerativeAI } from '@google/generative-ai'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const { alerts, analysis } = await req.json()
    
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      return NextResponse.json({ 
        summary: "Sistem AI siap. Harap konfigurasi GEMINI_API_KEY untuk ringkasan naratif otomatis. Analisis pola internal menunjukkan kondisi: " + analysis.riskLevel 
      })
    }

    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })

    const prompt = `
      Anda adalah pakar keamanan siber untuk platform E-Voting Blockchain.
      Misi: Memberikan ringkasan eksekutif singkat (maks 3 kalimat) untuk dashboard Super Admin.
      
      Data Analisis Pola:
      - Skor Risiko: ${analysis.weightedScore}/100
      - Tingkat Risiko: ${analysis.riskLevel}
      - Pola Terdeteksi: ${analysis.patterns.join(', ')}
      - Rekomendasi: ${analysis.suggestedAction}
      
      Daftar Alert Aktif:
      ${JSON.stringify(alerts)}

      Berikan ringkasan dalam Bahasa Indonesia yang profesional dan waspada.
    `

    const result = await model.generateContent(prompt)
    const response = await result.response
    const text = response.text()

    return NextResponse.json({ summary: text })
  } catch (error) {
    console.error('Gemini API Error:', error)
    return NextResponse.json({ error: 'Gagal menghasilkan ringkasan AI' }, { status: 500 })
  }
}
