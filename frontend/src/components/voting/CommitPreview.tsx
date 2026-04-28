import { Button } from '@/components/ui/Button'
import { Card, Divider } from '@/components/ui/Card'
import { HashBox } from '@/components/ui/HashBox'

interface CommitPreviewProps {
  commitment: string
  salt: string
  candidateId: number
}

export function CommitPreview({ commitment, salt, candidateId }: CommitPreviewProps) {
  return (
    <Card className="mt-6">
      <h3 className="text-[13px] font-semibold text-slate-900">Detail Komitmen</h3>
      <p className="mt-1 text-xs text-slate-400">
        Hash ini yang akan dikirim ke blockchain. Isi pilihanmu tidak terekspos.
      </p>

      <div className="mt-3">
        <HashBox>{`commitment: ${commitment}\nsalt (tersimpan lokal): ${salt}\ncandidateId: ${candidateId}`}</HashBox>
      </div>

      <Divider className="mb-0" />

      <div className="mt-4 flex justify-end gap-2">
        <Button variant="ghost">Batal</Button>
        <Button variant="primary">Kirim Commit →</Button>
      </div>
    </Card>
  )
}
