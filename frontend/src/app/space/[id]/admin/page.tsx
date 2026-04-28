import { AdminDashboard } from '@/components/admin/AdminDashboard'

interface SpaceAdminPageProps {
  params: Promise<{
    id: string
  }>
}

export default async function SpaceAdminPage({ params }: SpaceAdminPageProps) {
  const { id } = await params

  return <AdminDashboard spaceId={id} />
}
