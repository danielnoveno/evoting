'use client'

import { notFound, redirect } from 'next/navigation'
import { useMemo } from 'react'
import { useSuperadminElectionsStore } from '@/lib/superadmin-store'

export default function SuperadminElectionRouteResolverPage({ params }: { params: { id: string } }) {
  const { elections } = useSuperadminElectionsStore()
  const election = useMemo(() => elections.find((item) => item.id === params.id), [elections, params.id])

  if (!election) notFound()

  if (election.status === 'Aktif') {
    redirect(`/superadmin/manajemen-pemilihan/${election.id}/moderasi`)
  }

  if (election.status === 'Ditangguhkan') {
    redirect(`/superadmin/manajemen-pemilihan/${election.id}/investigasi`)
  }

  redirect(`/superadmin/manajemen-pemilihan/${election.id}/laporan-final`)
}
