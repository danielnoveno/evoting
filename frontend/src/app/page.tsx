import { ArrowRight, FileCheck2, Globe, LockKeyhole, ShieldCheck, SquarePen, Users, Zap } from 'lucide-react'
import Link from 'next/link'
import { PublicPage } from '@/components/public/site-shell'
import { sharedDummyContext } from '@/lib/dummy-shared-context'
import { HeroSection, FeatureCardsSection, InfrastructureSection } from './home-sections'

const auditItems = [
  { hash: '0x7a2...4f9e', label: 'Suara Terverifikasi', time: 'Baru saja' },
  { hash: '0x3b1...8d2c', label: 'Suara Terverifikasi', time: '12d lalu' },
  { hash: '0x9f4...1a5b', label: 'Suara Terverifikasi', time: '45d lalu' },
]

const featureItems = [
  {
    icon: 'FileCheck2',
    title: 'Jejak Audit',
    body: 'Setiap tindakan tercatat dan dapat ditelusuri kapan saja.',
  },
  {
    icon: 'ShieldCheck',
    title: 'Anti-Manipulasi',
    body: 'Teknologi blockchain mencegah perubahan dan kecurangan.',
  },
  {
    icon: 'Users',
    title: 'Akses Mudah',
    body: 'Dirancang agar siapa pun dapat berpartisipasi dengan mudah.',
  },
  {
    icon: 'LockKeyhole',
    title: 'Integritas Tinggi',
    body: 'Sistem menjaga keaslian suara dari awal hingga akhir.',
  },
]

export default function HomePage() {
  return (
    <PublicPage activePath="/">
      <HeroSection />
      <InfrastructureSection auditItems={auditItems} />
    </PublicPage>
  )
}
