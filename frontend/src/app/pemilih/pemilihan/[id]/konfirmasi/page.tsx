import { redirect } from 'next/navigation'

export default function VoterConfirmationRedirect({ params }: { params: { id: string } }) {
  redirect(`/pemilih/pemilihan/${params.id}/commit`)
}
