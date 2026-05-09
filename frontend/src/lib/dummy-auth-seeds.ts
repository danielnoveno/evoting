export const dummyAuthSeeds = {
  campusLogin: {
    voter: { identifier: 'mahasiswa220711663@students.uajy.ac.id', secret: 'voter12345' },
    admin: { identifier: 'admin.himaforka@uajy.ac.id', secret: 'admin12345' },
    superadmin: { identifier: 'superadmin.fti@uajy.ac.id', secret: 'super12345' },
  },
} as const

export function resolveCampusLoginRole(identifier: string, secret: string) {
  const normalizedIdentifier = identifier.trim().toLowerCase()
  const normalizedSecret = secret.trim()

  const entries = Object.entries(dummyAuthSeeds.campusLogin) as Array<[
    keyof typeof dummyAuthSeeds.campusLogin,
    (typeof dummyAuthSeeds.campusLogin)[keyof typeof dummyAuthSeeds.campusLogin],
  ]>

  return entries.find(([, seed]) => {
    return seed.identifier.toLowerCase() === normalizedIdentifier && seed.secret === normalizedSecret
  })?.[0] ?? null
}
