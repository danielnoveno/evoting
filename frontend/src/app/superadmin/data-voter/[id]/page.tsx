import { SuperadminMasterVoterDetailPage } from '@/components/superadmin/superadmin-master-voter-detail-page'

export default function SuperadminDataVoterDetailRoute({ params }: { params: { id: string } }) {
  return <SuperadminMasterVoterDetailPage voterId={params.id} />
}
