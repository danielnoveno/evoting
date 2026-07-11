import { redirect } from 'next/navigation'

export default function VoterProofElectionResultPage({ params }: { params: { id: string } }) {
  redirect(`/pemilih/pemilihan/${encodeURIComponent(params.id)}/hasil`)
}
