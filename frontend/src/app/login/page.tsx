export default function LoginPage() {
  return (
    <section className="mx-auto max-w-[400px] space-y-4 pt-10">
      <h1 className="text-2xl font-semibold text-slate-900">VoteChain</h1>
      <p className="text-sm text-slate-400">Masuk untuk mulai atau lanjutkan voting</p>
      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <button className="h-12 w-full rounded-lg border border-slate-200 text-sm font-medium text-slate-900 hover:border-slate-300 hover:bg-slate-50">
          Sambungkan MetaMask
        </button>
      </div>
    </section>
  )
}
