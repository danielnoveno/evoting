import Link from 'next/link'

const links = [
  { href: '/login', label: 'Login' },
  { href: '/beranda', label: 'Beranda' },
  { href: '/space/create', label: 'Buat Space' },
  { href: '/space/demo/admin', label: 'Admin Space' },
  { href: '/space/demo/vote', label: 'Voting (Commit)' },
  { href: '/space/demo/reveal', label: 'Konfirmasi (Reveal)' },
  { href: '/space/demo/results', label: 'Hasil Publik' },
]

export default function HomePage() {
  return (
    <section className="space-y-4">
      <h1 className="text-xl font-semibold text-slate-900">Setup Frontend VoteChain MVP</h1>
      <p className="text-sm text-slate-600">Pilih halaman untuk mulai pengembangan.</p>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {links.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="rounded-xl border border-slate-200 bg-white p-4 text-sm font-semibold text-slate-900 transition-colors hover:border-slate-300"
          >
            {item.label}
          </Link>
        ))}
      </div>
    </section>
  )
}
