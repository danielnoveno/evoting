'use client'

import { useEffect, useState } from 'react'
import {
  superadminPlatformData,
  superadminRiskData,
  type SuperadminAdminRecord,
  type SuperadminAuditLogItem,
  type SuperadminElectionRecord,
  type SuperadminPlatformSession,
  type SuperadminProposalRecord,
  type SuperadminRiskAlert,
} from '@/lib/superadmin-data'
import { getSupabaseBrowserClient } from '@/lib/supabase/browser'

const STORAGE_KEYS = {
  admins: 'votein_superadmin_admins_v3_live',
  elections: 'votein_superadmin_elections_v3_live',
  proposals: 'votein_superadmin_proposals_v3_live',
  platform: 'votein_superadmin_platform_v3_live',
  alerts: 'votein_superadmin_risk_alerts_v3_live',
  auditLogs: 'votein_superadmin_audit_logs_v3_live',
  masterVoters: 'votein_superadmin_master_voters_v3_live',
} as const

type PlatformSettingsState = {
  platformName: string
  defaultLanguage: string
  sessions: SuperadminPlatformSession[]
  twoFactorEnabled: boolean
}

function readStore<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback

  const raw = window.localStorage.getItem(key)
  if (!raw) return fallback

  try {
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

function writeStore<T>(key: string, value: T) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(key, JSON.stringify(value))
}

export function useSuperadminAdminsStore() {
  const [admins, setAdminsState] = useState<SuperadminAdminRecord[]>([])

  useEffect(() => {
    setAdminsState(readStore(STORAGE_KEYS.admins, []))
  }, [])

  const setAdmins = (value: SuperadminAdminRecord[] | ((current: SuperadminAdminRecord[]) => SuperadminAdminRecord[])) => {
    setAdminsState((current) => {
      const nextValue = typeof value === 'function' ? value(current) : value
      writeStore(STORAGE_KEYS.admins, nextValue)
      return nextValue
    })
  }

  return { admins, setAdmins }
}

export function useSuperadminElectionsStore() {
  const [elections, setElectionsState] = useState<SuperadminElectionRecord[]>([])

  useEffect(() => {
    setElectionsState(readStore(STORAGE_KEYS.elections, []))
  }, [])

  const setElections = (value: SuperadminElectionRecord[] | ((current: SuperadminElectionRecord[]) => SuperadminElectionRecord[])) => {
    setElectionsState((current) => {
      const nextValue = typeof value === 'function' ? value(current) : value
      writeStore(STORAGE_KEYS.elections, nextValue)
      return nextValue
    })
  }

  return { elections, setElections }
}

export function useSuperadminProposalsStore() {
  const [proposals, setProposalsState] = useState<SuperadminProposalRecord[]>([])

  useEffect(() => {
    setProposalsState(readStore(STORAGE_KEYS.proposals, []))
  }, [])

  const setProposals = (value: SuperadminProposalRecord[] | ((current: SuperadminProposalRecord[]) => SuperadminProposalRecord[])) => {
    setProposalsState((current) => {
      const nextValue = typeof value === 'function' ? value(current) : value
      writeStore(STORAGE_KEYS.proposals, nextValue)
      return nextValue
    })
  }

  return { proposals, setProposals }
}

export function useSuperadminPlatformStore() {
  const fallbackState: PlatformSettingsState = {
    platformName: superadminPlatformData.system.platformName,
    defaultLanguage: superadminPlatformData.system.defaultLanguage,
    sessions: [],
    twoFactorEnabled: false,
  }

  const [platform, setPlatformState] = useState<PlatformSettingsState>(fallbackState)

  useEffect(() => {
    setPlatformState(readStore(STORAGE_KEYS.platform, fallbackState))
  }, [])

  const setPlatform = (value: PlatformSettingsState | ((current: PlatformSettingsState) => PlatformSettingsState)) => {
    setPlatformState((current) => {
      const nextValue = typeof value === 'function' ? value(current) : value
      writeStore(STORAGE_KEYS.platform, nextValue)
      return nextValue
    })
  }

  return { platform, setPlatform }
}

export function useSuperadminRiskAlertsStore() {
  const [alerts, setAlerts] = useState<SuperadminRiskAlert[]>([])
  const [metrics, setMetrics] = useState({ spaces: 0, incidents: 0 })
  const [isLoading, setIsLoading] = useState(true)
  const supabase = getSupabaseBrowserClient()

  const refresh = async () => {
    if (!supabase) return
    setIsLoading(true)
    
    // 1. Fetch active alerts
    const { data: alertsData } = await supabase
      .schema('app')
      .from('risk_alerts')
      .select('*')
      .eq('status', 'active')
      .order('created_at', { ascending: false })

    // 2. Fetch space count
    const { count: spaceCount } = await supabase
      .schema('app')
      .from('space_registry_map')
      .select('*', { count: 'exact', head: true })

    // 3. Fetch incident count (resolved/blocked)
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
        time: getRelativeTime(item.created_at),
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

function getRelativeTime(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

  if (diffInSeconds < 60) return 'Baru saja'
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} menit yang lalu`
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} jam yang lalu`
  return `${Math.floor(diffInSeconds / 86400)} hari yang lalu`
}

export function useSuperadminAuditLogsStore() {
  const [logs, setLogsState] = useState<SuperadminAuditLogItem[]>([])

  useEffect(() => {
    setLogsState(readStore(STORAGE_KEYS.auditLogs, []))
  }, [])

  const setLogs = (value: SuperadminAuditLogItem[] | ((current: SuperadminAuditLogItem[]) => SuperadminAuditLogItem[])) => {
    setLogsState((current) => {
      const nextValue = typeof value === 'function' ? value(current) : value
      writeStore(STORAGE_KEYS.auditLogs, nextValue)
      return nextValue
    })
  }

  return { logs, setLogs }
}

export type SuperadminMasterVoter = {
  nim: string
  name: string
  email: string
  faculty: string
  syncStatus: 'Tersinkronisasi' | 'Belum Sinkron'
}

const initialMasterVoters: SuperadminMasterVoter[] = []

export function useSuperadminMasterVotersStore() {
  const [voters, setVotersState] = useState<SuperadminMasterVoter[]>(initialMasterVoters)

  useEffect(() => {
    setVotersState(readStore(STORAGE_KEYS.masterVoters, initialMasterVoters))
  }, [])

  const setVoters = (value: SuperadminMasterVoter[] | ((current: SuperadminMasterVoter[]) => SuperadminMasterVoter[])) => {
    setVotersState((current) => {
      const nextValue = typeof value === 'function' ? value(current) : value
      writeStore(STORAGE_KEYS.masterVoters, nextValue)
      return nextValue
    })
  }

  return { voters, setVoters }
}
