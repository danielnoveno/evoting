'use client'

import { useEffect, useState } from 'react'
import {
  type SuperadminElectionRecord,
  type SuperadminRiskAlert,
} from '@/lib/superadmin-data'
import { timeAgo } from '@/lib/repositories/helpers'
import { getSupabaseBrowserClient } from '@/lib/supabase/browser'

export function useSuperadminElectionsStore() {
  const [elections, setElections] = useState<SuperadminElectionRecord[]>([])
  return { elections, setElections }
}

export function useSuperadminRiskAlertsStore() {
  const [alerts, setAlerts] = useState<SuperadminRiskAlert[]>([])
  const [metrics, setMetrics] = useState({ spaces: 0, incidents: 0 })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = getSupabaseBrowserClient()

  const refresh = async () => {
    if (!supabase) {
      setError('Koneksi Supabase tidak tersedia. Periksa konfigurasi.')
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const { data: alertsData, error: alertsErr } = await supabase
        .schema('app')
        .from('risk_alerts')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false })

      if (alertsErr) {
        console.error('[risk-alerts] Query error:', alertsErr.message)
      }

      const { count: spaceCount, error: spaceErr } = await supabase
        .schema('app')
        .from('space_registry_map')
        .select('*', { count: 'exact', head: true })

      if (spaceErr) {
        console.error('[risk-alerts] Space count error:', spaceErr.message)
      }

      const { count: incidentCount, error: incidentErr } = await supabase
        .schema('app')
        .from('risk_alerts')
        .select('*', { count: 'exact', head: true })
        .neq('status', 'active')

      if (incidentErr) {
        console.error('[risk-alerts] Incident count error:', incidentErr.message)
      }

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
    } catch (err) {
      console.error('[risk-alerts] Refresh failed:', err)
      setError('Gagal memuat data risiko. Periksa koneksi atau muat ulang halaman.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    refresh()
  }, [])

  const blockActor = async (alertId: string) => {
    if (!supabase) throw new Error('Koneksi Supabase tidak tersedia')

    const { data: alert, error: fetchErr } = await supabase
      .schema('app')
      .from('risk_alerts')
      .select('*')
      .eq('id', alertId)
      .single()

    if (fetchErr || !alert) throw new Error('Alert tidak ditemukan')

    const entityType = alert.actor_label.toLowerCase().includes('ip') ? 'ip' :
                     alert.actor_label.toLowerCase().includes('wallet') ? 'wallet' : 'space'

    const { error: insertErr } = await supabase
      .schema('app')
      .from('blocked_entities')
      .insert({
        entity_type: entityType,
        entity_value: alert.actor_value,
        reason: alert.title
      })

    if (insertErr) throw new Error(`Gagal memblokir entitas: ${insertErr.message}`)

    const { error: updateErr } = await supabase
      .schema('app')
      .from('risk_alerts')
      .update({ status: 'blocked' } as any)
      .eq('id', alertId)

    if (updateErr) throw new Error(`Gagal update status alert: ${updateErr.message}`)

    await refresh()
  }

  return { alerts, metrics, isLoading, error, refresh, blockActor, setAlerts }
}
