import { SuperadminRiskAlert } from '../superadmin-data'

export interface RiskAnalysisResult {
  patterns: string[]
  weightedScore: number
  riskLevel: 'low' | 'medium' | 'high' | 'critical'
  suggestedAction: string
  topThreats: string[]
}

/**
 * Pattern Analysis Engine — Heuristic risk scoring.
 * Counts alerts, detects repeated actors and multi-vector anomalies,
 * then assigns a weighted score and risk level.
 */
export function analyzeRiskPatterns(alerts: SuperadminRiskAlert[]): RiskAnalysisResult {
  if (alerts.length === 0) {
    return {
      patterns: ['No anomalies detected'],
      weightedScore: 0,
      riskLevel: 'low',
      suggestedAction: 'Monitoring rutin',
      topThreats: []
    }
  }

  const patterns: string[] = []
  let score = 0
  const actorCounts: Record<string, number> = {}
  const typeCounts: Record<string, number> = {}

  alerts.forEach(alert => {
    // Bobot skor
    score += alert.tone === 'danger' ? 25 : 10
    
    // Hitung aktor
    actorCounts[alert.actorValue] = (actorCounts[alert.actorValue] || 0) + 1
    
    // Hitung tipe (dari title)
    const type = alert.title.split(' ')[0]
    typeCounts[type] = (typeCounts[type] || 0) + 1
  })

  // Deteksi Pola 1: Targeted Attack (Satu aktor menyerang berkali-kali)
  const topActors = Object.entries(actorCounts).filter(([_, count]) => count > 1)
  if (topActors.length > 0) {
    patterns.push(`Targeted Attack: Aktor ${topActors[0][0]} melakukan ${topActors[0][1]} aktivitas mencurigakan.`)
    score += topActors.length * 15
  }

  // Deteksi Pola 2: Multi-Vector Attack (Berbagai jenis serangan dalam waktu singkat)
  if (Object.keys(typeCounts).length > 2) {
    patterns.push('Multi-Vector Anomaly: Terdeteksi berbagai jenis aktivitas tidak lazim secara simultan.')
    score += 20
  }

  // Penentuan Risk Level
  let riskLevel: RiskAnalysisResult['riskLevel'] = 'low'
  if (score > 70) riskLevel = 'critical'
  else if (score > 40) riskLevel = 'high'
  else if (score > 20) riskLevel = 'medium'

  const suggestedAction = riskLevel === 'critical' ? 'Blokir semua akses terkait & investigasi audit log' :
                          riskLevel === 'high' ? 'Perketat validasi blockchain & tinjau manual' :
                          'Tinjau log aktivitas'

  return {
    patterns,
    weightedScore: Math.min(score, 100),
    riskLevel,
    suggestedAction,
    topThreats: Object.keys(typeCounts).slice(0, 3)
  }
}
