'use client'

import { useEffect, useState } from 'react'
import {
  superadminPlatformData,
  type SuperadminAdminRecord,
  type SuperadminAuditLogItem,
  type SuperadminElectionRecord,
  type SuperadminPlatformSession,
  type SuperadminProposalRecord,
  type SuperadminRiskAlert,
} from '@/lib/superadmin-data'

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
  const [alerts, setAlertsState] = useState<SuperadminRiskAlert[]>([])

  useEffect(() => {
    setAlertsState(readStore(STORAGE_KEYS.alerts, []))
  }, [])

  const setAlerts = (value: SuperadminRiskAlert[] | ((current: SuperadminRiskAlert[]) => SuperadminRiskAlert[])) => {
    setAlertsState((current) => {
      const nextValue = typeof value === 'function' ? value(current) : value
      writeStore(STORAGE_KEYS.alerts, nextValue)
      return nextValue
    })
  }

  return { alerts, setAlerts }
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
