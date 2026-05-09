import { ReactNode, InputHTMLAttributes } from 'react'
import { PublicFooter } from '@/components/public/site-shell'

export function AuthShell({ children }: { children: ReactNode }) {
  return (
    <main className="flex min-h-screen flex-col bg-slate-50">
      <div className="flex flex-1 items-center justify-center px-4 py-4 md:px-5 md:py-5 lg:px-6 lg:py-6">
        {children}
      </div>
      <PublicFooter />
    </main>
  )
}

export function AuthCard({ children }: { children: ReactNode }) {
  return (
    <section className="w-full max-w-[432px] rounded-[28px] border border-slate-100 bg-white px-5 py-6 md:px-8 md:py-7">
      {children}
    </section>
  )
}

export function AuthHeader() {
  return (
    <div className="text-center">
      <img src="/assets/votein-logo" alt="Votein" className="mx-auto h-8 w-auto" />
    </div>
  )
}

export function AuthTitle({ title, body }: { title: string; body?: string }) {
  return (
    <div className="mt-5 text-center">
      <h1 className="text-[22px] font-semibold tracking-[-0.02em] text-slate-900 md:text-[24px]">{title}</h1>
      {body ? (
        <p className="mx-auto mt-3 max-w-[316px] text-[13px] leading-7 text-slate-600 md:text-[14px]">
          {body}
        </p>
      ) : null}
    </div>
  )
}

export function AuthNotice() {
  return (
    <div className="mt-5 rounded-3xl bg-slate-100 px-4 py-3 text-[12px] leading-6 text-slate-600">
      <div className="flex flex-col items-center text-center">
        <p>
          Dompet Anda digunakan sebagai identitas terdesentralisasi.
        </p>
      </div>
    </div>
  )
}

type AuthFieldProps = {
  label: string
  error?: string
} & InputHTMLAttributes<HTMLInputElement>

export function AuthField({ label, error, type = 'text', className, ...props }: AuthFieldProps) {
  return (
    <div>
      <label className="mb-2 block text-[12px] font-semibold text-slate-600">{label}</label>
      <input
        type={type}
        className={`h-11 w-full rounded-2xl border bg-white px-4 text-[14px] text-slate-900 outline-none placeholder:text-slate-400 focus:border-slate-900 ${error ? 'border-red-400 bg-red-50' : 'border-slate-200'} ${className ?? ''}`}
        {...props}
      />
      {error ? <p className="mt-2 text-[12px] leading-5 text-red-600">{error}</p> : null}
    </div>
  )
}
