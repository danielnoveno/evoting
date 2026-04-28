export type DemoRole = 'voter' | 'admin' | 'superadmin'

const DEMO_ROLE_STORAGE_KEY = 'votechain_demo_role'

export const DEMO_ROLE_DESTINATIONS: Record<DemoRole, string> = {
  voter: '/voter/beranda',
  admin: '/admin/beranda',
  superadmin: '/superadmin/beranda',
}

export function getDemoRoleDestination(role: DemoRole) {
  return DEMO_ROLE_DESTINATIONS[role]
}

export function setDemoSessionRole(role: DemoRole) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(DEMO_ROLE_STORAGE_KEY, role)
}

export function getDemoSessionRole(): DemoRole | null {
  if (typeof window === 'undefined') return null

  const value = window.localStorage.getItem(DEMO_ROLE_STORAGE_KEY)
  if (value === 'voter' || value === 'admin' || value === 'superadmin') {
    return value
  }

  return null
}

export function clearDemoSessionRole() {
  if (typeof window === 'undefined') return
  window.localStorage.removeItem(DEMO_ROLE_STORAGE_KEY)
}
