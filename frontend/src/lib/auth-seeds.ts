export const authSeeds = {
  campusLogin: {
    voter: { identifier: 'mahasiswa220711663@students.uajy.ac.id', secret: 'voter12345' },
    admin: { identifier: 'admin.ukmriset@uajy.ac.id', secret: 'admin12345' },
    superadmin: { identifier: 'superadmin.fti@uajy.ac.id', secret: 'superadmin123456' },
    developer: { identifier: '220611938@students.uajy.ac.id', secret: 'E;GvRX@E3-#d>Cx' },
  },
} as const

export function resolveCampusLoginRole(identifier: string, secret: string) {
  const normalizedIdentifier = identifier.trim().toLowerCase()
  const normalizedSecret = secret.trim()

  const entries = Object.entries(authSeeds.campusLogin) as Array<[
    keyof typeof authSeeds.campusLogin,
    (typeof authSeeds.campusLogin)[keyof typeof authSeeds.campusLogin],
  ]>

  return entries.find(([, seed]) => {
    return seed.identifier.toLowerCase() === normalizedIdentifier && seed.secret === normalizedSecret
  })?.[0] ?? null
}
