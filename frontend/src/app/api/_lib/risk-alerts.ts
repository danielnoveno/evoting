import { getSupabaseServiceRoleClient } from '@/lib/supabase/admin'
import type { Database } from '@/lib/supabase/database.types'

type RiskAlertInsert = Database['app']['Tables']['risk_alerts']['Insert']

export async function createRiskAlert(alert: Pick<RiskAlertInsert, 'title' | 'description' | 'actor_label' | 'actor_value'> & {
  tone?: RiskAlertInsert['tone']
}) {
  const client = getSupabaseServiceRoleClient()
  if (!client) return

  const { error } = await client
    .from('risk_alerts')
    .insert({
      ...alert,
      tone: alert.tone ?? 'warning',
      status: 'active',
    })

  if (error) console.error('[risk-alerts] Failed to create risk alert:', error.message)
}
