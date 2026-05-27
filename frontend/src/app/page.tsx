import { PublicPage } from '@/components/public/site-shell'
import { HeroSection, InfrastructureSection } from './home-sections'

export default function HomePage() {
  return (
    <PublicPage activePath="/">
      <HeroSection />
      <InfrastructureSection />
    </PublicPage>
  )
}
