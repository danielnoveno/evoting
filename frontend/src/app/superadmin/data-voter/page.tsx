import { Suspense } from 'react'
import { SuperadminMasterVoterPage } from '@/components/superadmin/superadmin-master-voter-page'

export default function SuperadminDataVoterPage() {
  return (
    <Suspense fallback={null}>
      <SuperadminMasterVoterPage />
    </Suspense>
  )
}
