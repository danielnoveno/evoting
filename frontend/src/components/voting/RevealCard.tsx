import { Button } from '@/components/ui/Button'
import { Card, SectionLabel } from '@/components/ui/Card'
import { InfoBanner } from '@/components/ui/InfoBanner'

export function RevealCard() {
  return (
    <Card>
      <SectionLabel>KONFIRMASI & KIRIM</SectionLabel>
      <p className="text-sm leading-relaxed text-slate-600">
        Dengan mengklik tombol di bawah, kamu mengirim candidateId dan salt ke smart contract untuk diverifikasi dan dicatat.
      </p>
      <div className="mt-4">
        <InfoBanner variant="warning">
          Pastikan admin telah membuka fase Reveal sebelum melanjutkan.
        </InfoBanner>
      </div>
      <Button className="mt-4" fullWidth size="lg" variant="primary">
        Konfirmasi Suara ke Blockchain →
      </Button>
    </Card>
  )
}
