import {
  ChartNoAxesColumn,
  Ellipsis,
  LayoutGrid,
  ListFilter,
  PenLine,
  Plus,
  ShieldCheck,
  Users,
} from 'lucide-react'

function FilterPill({ active, label }: { active?: boolean; label: string }) {
  return (
    <button
      className={active
        ? 'h-11 rounded-full bg-black px-8 text-sm font-semibold text-white'
        : 'h-11 rounded-full bg-[#EEF1F5] px-8 text-sm font-medium text-slate-600'}
      type="button"
    >
      {label}
    </button>
  )
}

export default function AdminManajemenPemilihanPage() {
  return (
    <div className="space-y-6">
      <section className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-7xl font-semibold leading-tight text-slate-900">ManajemenPemilihan</h2>
          <p className="mt-2 text-2xl text-slate-600">Kelola dan pantau seluruh ruang pemilihan yang Anda pimpin</p>
        </div>

        <button
          className="h-14 rounded-3xl bg-gradient-to-r from-black to-[#0E1A3A] px-8 text-xl font-semibold text-white"
          type="button"
        >
          <span className="inline-flex items-center gap-2">
            <Plus className="h-5 w-5" /> Buat Pemilihan Baru
          </span>
        </button>
      </section>

      <section className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <FilterPill active label="Semua" />
          <FilterPill label="Aktif" />
          <FilterPill label="Selesai" />
          <FilterPill label="Draft" />
        </div>

        <div className="flex items-center gap-3">
          <button className="flex h-11 items-center gap-2 rounded-xl bg-[#EEF1F5] px-4 text-sm tracking-[0.06em] text-slate-700" type="button">
            <ListFilter className="h-4 w-4" />
            URUTKAN: TERBARU
          </button>
          <button className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#EEF1F5] text-slate-700" type="button">
            <LayoutGrid className="h-5 w-5" />
          </button>
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-2">
        <article className="rounded-[28px] border border-slate-200 bg-white p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                <ChartNoAxesColumn className="h-7 w-7" />
              </div>
              <div>
                <h3 className="text-5xl font-semibold leading-tight text-slate-900">Pemilihan Ketua BEM UI 2024</h3>
                <p className="mt-2 text-2xl text-slate-500">Scheduled: Oct 12 - Oct 18, 2024 • 1,240 Eligible Voters</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <span className="rounded-full bg-emerald-100 px-4 py-2 text-xs font-semibold uppercase tracking-[0.08em] text-emerald-700">
                Active Phase: Commit
              </span>
              <div className="flex items-center">
                <span className="-mr-2 h-9 w-9 rounded-full border-2 border-white bg-slate-300" />
                <span className="-mr-2 h-9 w-9 rounded-full border-2 border-white bg-amber-200" />
                <span className="h-9 w-9 rounded-full border-2 border-white bg-slate-500" />
                <span className="ml-1 text-sm font-semibold text-slate-500">+4</span>
              </div>
            </div>
          </div>

          <div className="my-4 h-px bg-slate-100" />

          <div className="grid gap-4 md:grid-cols-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-400">Total Commits</p>
              <p className="mt-2 text-4xl font-semibold text-slate-900">842 <span className="text-2xl font-normal text-slate-400">/ 1.2k</span></p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-400">Blockchain Hash</p>
              <p className="mt-2 text-3xl text-blue-700 underline">0x71c...a3e4</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-400">Reveal Start</p>
              <p className="mt-2 text-4xl font-semibold text-slate-900">Tomorrow, 09:00</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-400">Integrity</p>
              <p className="mt-2 inline-flex items-center gap-1 text-4xl font-semibold text-emerald-700">
                <ShieldCheck className="h-5 w-5" /> ON-CHAIN
              </p>
            </div>
          </div>

          <div className="my-4 h-px bg-slate-100" />

          <div className="flex items-center justify-between">
            <div className="flex gap-3">
              <button className="h-11 rounded-xl bg-indigo-50 px-5 text-sm font-semibold text-indigo-700" type="button">Monitor Phase</button>
              <button className="inline-flex h-11 items-center gap-2 rounded-xl bg-slate-100 px-5 text-sm font-semibold text-slate-700" type="button">
                <Users className="h-4 w-4" />
                Candidates
              </button>
            </div>
            <button className="text-slate-400" type="button">
              <Ellipsis className="h-5 w-5" />
            </button>
          </div>
        </article>

        <article className="rounded-[28px] border border-slate-200 bg-white p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-500">
                <PenLine className="h-7 w-7" />
              </div>
              <div>
                <h3 className="text-5xl font-semibold leading-tight text-slate-900">Faculty Representative Election</h3>
                <p className="mt-2 text-2xl text-slate-500">Unscheduled • No Candidates Assigned</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="rounded-full bg-amber-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.08em] text-amber-600">Status: Draft</span>
              <button className="rounded-2xl bg-[#E9EDF3] px-5 py-3 text-sm font-semibold text-slate-700" type="button">Edit Setup</button>
            </div>
          </div>

          <div className="mt-8 h-2 rounded-full bg-slate-100">
            <div className="h-2 w-2/5 rounded-full bg-amber-400" />
          </div>
          <p className="mt-2 text-right text-xs font-semibold uppercase tracking-[0.08em] text-slate-400">40% Complete</p>
        </article>

        <article className="rounded-[28px] border border-slate-200 bg-white p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-500">
                <ShieldCheck className="h-7 w-7" />
              </div>
              <div>
                <h3 className="text-5xl font-semibold leading-tight text-slate-900">Dean Selection Autumn</h3>
                <p className="mt-2 text-2xl text-slate-500">Concluded Sep 20, 2024 • 98% Participation</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="rounded-full bg-blue-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.08em] text-blue-600">Finalized</span>
              <button className="rounded-2xl bg-[#E8EFFD] px-5 py-3 text-sm font-semibold text-blue-700" type="button">View Report</button>
            </div>
          </div>
        </article>

        <article className="flex min-h-[280px] flex-col items-center justify-center rounded-[28px] border-2 border-dashed border-slate-200 bg-[#FAFBFD] p-5 text-center">
          <button className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#EEF1F5] text-slate-700" type="button">
            <Plus className="h-8 w-8" />
          </button>
          <h3 className="text-5xl font-semibold text-slate-900">Buat Ruang Pemilihan Baru</h3>
          <p className="mt-2 max-w-xl text-2xl text-slate-500">Konfigurasi smart contract voting dalam hitungan menit</p>
        </article>
      </section>
    </div>
  )
}
