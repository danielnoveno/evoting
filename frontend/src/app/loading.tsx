import { MainContainer } from '@/components/layout/SiteContainer'

export default function RootLoading() {
  return (
    <MainContainer className="py-8">
      <div className="h-8 w-56 animate-pulse rounded bg-slate-200" />
      <div className="mt-3 h-4 w-80 animate-pulse rounded bg-slate-200" />
      <div className="mt-8 grid gap-4 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="h-40 animate-pulse rounded-xl bg-slate-200" />
        ))}
      </div>
    </MainContainer>
  )
}
