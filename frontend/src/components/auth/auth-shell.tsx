import { InputHTMLAttributes, ReactNode, useId } from 'react'
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
    <section className="w-full max-w-[432px] rounded-xl border border-slate-200 bg-white px-6 py-6 md:px-8 md:py-8">
      {children}
    </section>
  )
}

export function AuthHeader() {
  return (
    <div className="text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-[14px] bg-[#0F172A]">
        <img src="/assets/votein-app-logo" alt="Votein" className="h-8 w-8 object-contain" />
      </div>
    </div>
  )
}

export function AuthTitle({ title, body }: { title: string; body?: string }) {
  return (
    <div className="mt-5 text-center">
      <h1 className="text-[24px] font-semibold text-slate-900">{title}</h1>
      {body ? (
        <p className="mx-auto mt-1 max-w-[320px] text-[14px] leading-6 text-slate-400">
          {body}
        </p>
      ) : null}
    </div>
  )
}

export function AuthNotice() {
  return (
    <div className="mt-5 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-[12px] leading-6 text-slate-800">
      <div className="text-center">
        <p>
          Pratinjau ini membantu meninjau alur antarmuka voting sebelum integrasi blockchain penuh diaktifkan.
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
  const generatedId = useId()
  const fieldId = props.id ?? generatedId
  const errorId = error ? `${fieldId}-error` : undefined

  return (
    <div>
      <label htmlFor={fieldId} className="mb-1.5 block text-[12px] font-semibold text-slate-800">{label}</label>
      <input
        id={fieldId}
        type={type}
        aria-invalid={error ? 'true' : 'false'}
        aria-describedby={errorId}
        className={`h-11 w-full rounded-md border bg-white px-3 text-[14px] text-slate-900 placeholder:text-slate-400 ${error ? 'border-red-400 bg-red-50' : 'border-slate-200 focus:border-slate-900'} ${className ?? ''}`}
        {...props}
      />
      {error ? <p id={errorId} className="mt-1.5 text-[12px] leading-5 text-red-600">{error}</p> : null}
    </div>
  )
}
