'use client'

import { useEffect, useState } from 'react'
import {
  type SuperadminElectionRecord,
  type SuperadminRiskAlert,
} from '@/lib/superadmin-data'
import { timeAgo } from '@/lib/repositories/helpers'
import { getSupabaseBrowserClient } from '@/lib/supabase/browser'

// ponytail: removed localStorage layer — React Query handles caching.
// These hooks are now pure in-memory state for optimistic updates.

export function useSuperadminElectionsStore() {
  const [elections, setElections] = useState<SuperadminElectionRecord[]>([])
  return { elections, setElections }
}

export function useSuperadminRiskAlertsStore() {
  const [alerts, setAlerts] = useState<SuperadminRiskAlert[]>([])
  const [metrics, setMetrics] = useState({ spaces: 0, incidents: 0 })
  const [isLoading, setIsLoading] = useState(true)
  const supabase = getSupabaseBrowserClient()

  const refresh = async () => {
    if (!supabase) return
    setIsLoading(true)
    
    const { data: alertsData } = await supabase
      .schema('app')
      .from('risk_alerts')
      .select('*')
      .eq('status', 'active')
      .order('created_at', { ascending: false })

    const { count: spaceCount } = await supabase
      .schema('app')
      .from('space_registry_map')
      .select('*', { count: 'exact', head: true })

    const { count: incidentCount } = await supabase
      .schema('app')
      .from('risk_alerts')
      .select('*', { count: 'exact', head: true })
      .neq('status', 'active')

    if (alertsData) {
      setAlerts(alertsData.map((item: any) => ({
        id: item.id,
        title: item.title,
        description: item.description,
        actorLabel: item.actor_label,
        actorValue: item.actor_value,
        time: timeAgo(item.created_at),
        tone: item.tone,
        status: item.status
      })))
    }

    setMetrics({ 
      spaces: spaceCount || 0, 
      incidents: incidentCount || 0 
    })

    setIsLoading(false)
  }

  useEffect(() => {
    refresh()
  }, [])

  const blockActor = async (alertId: string) => {
    if (!supabase) return

    const { data: alert } = await supabase
      .schema('app')
      .from('risk_alerts')
      .select('*')
      .eq('id', alertId)
      .single()

    if (!alert) return

    const entityType = alert.actor_label.toLowerCase().includes('ip') ? 'ip' : 
                     alert.actor_label.toLowerCase().includes('wallet') ? 'wallet' : 'space'

    await supabase
      .schema('app')
      .from('blocked_entities')
      .insert({
        entity_type: entityType,
        entity_value: alert.actor_value,
        reason: alert.title
      })

    await supabase
      .schema('app')
      .from('risk_alerts')
      .update({ status: 'blocked' } as any)
      .eq('id', alertId)

    await refresh()
  }

  return { alerts, metrics, isLoading, refresh, blockActor, setAlerts }
}
