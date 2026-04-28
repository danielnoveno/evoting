import { SpaceCard } from '@/components/space/SpaceCard'

const demoSpaces = [
  { id: '1', name: 'Ketua HIMAFORKA 2026', status: 'commit' as const },
  { id: '2', name: 'Pemilihan Bendahara', status: 'reveal' as const },
  { id: '3', name: 'Pemilihan Koordinator Acara', status: 'ended' as const },
]

export function SpaceGrid() {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {demoSpaces.map((space) => (
        <SpaceCard id={space.id} key={space.id} name={space.name} status={space.status} />
      ))}
    </div>
  )
}
