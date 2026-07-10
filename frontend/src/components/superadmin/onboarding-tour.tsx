'use client'

import React, { useEffect, useState } from 'react'
import { Joyride, EventData, STATUS, Step } from 'react-joyride'
import { usePathname } from 'next/navigation'
import { HelpCircle, PlayCircle, X } from 'lucide-react'
import { useAuthSession } from '@/hooks/use-auth-session'

interface OnboardingTourProps {
  forceStart?: boolean
  onComplete?: () => void
}

const TOUR_STORAGE_PREFIX = 'votein-superadmin-onboarding-completed'

function getTourStorageKey(email: string | null | undefined): string {
  const normalized = email?.trim().toLowerCase() ?? 'anonymous'
  return `${TOUR_STORAGE_PREFIX}:${normalized}`
}

export function SuperadminOnboardingTour({ forceStart = false, onComplete }: OnboardingTourProps) {
  const pathname = usePathname()
  const authSessionQuery = useAuthSession()
  const [run, setRun] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const userEmail = authSessionQuery.data?.user?.email

  useEffect(() => {
    setMounted(true)
    const storageKey = getTourStorageKey(userEmail)
    const isCompleted = localStorage.getItem(storageKey)
    
    // Auto-start ONLY on dashboard (/superadmin) if not completed
    const shouldAutoStart = !isCompleted && pathname === '/superadmin'

    if (shouldAutoStart || forceStart) {
      const timer = setTimeout(() => setRun(true), 1500)
      return () => clearTimeout(timer)
    }
  }, [forceStart, pathname, userEmail])

  const handleJoyrideCallback = (data: EventData) => {
    const { status } = data
    const finishedStatuses: string[] = [STATUS.FINISHED, STATUS.SKIPPED]
    if (finishedStatuses.includes(status)) {
      setRun(false)
      const storageKey = getTourStorageKey(userEmail)
      localStorage.setItem(storageKey, 'true')
      if (onComplete) onComplete()
    }
  }

  const steps: Step[] = []

  // Beranda Superadmin
  if (pathname === '/superadmin') {
    steps.push(
      {
        target: 'h1',
        content: 'Selamat datang, Super Admin! Ini adalah dashboard utama untuk memantau seluruh ekosistem VoteIn.',
        placement: 'bottom',
        skipBeacon: true,
      },
      {
        target: '#tour-superadmin-metrics',
        content: 'Lihat ringkasan statistik real-time dari seluruh organisasi yang terdaftar di platform.',
        placement: 'bottom',
      },
      {
        target: 'aside',
        content: 'Gunakan sidebar ini untuk menavigasi ke manajemen admin, pemilihan, proposal, dan log audit sistem.',
        placement: 'right',
      }
    )
  }

  // Manajemen Superadmin
  if (pathname === '/superadmin/manajemen-superadmin') {
    steps.push(
      {
        target: 'h1',
        content: 'Kelola otoritas tertinggi platform. Anda dapat menambah atau memantau daftar superadmin lain di sini.',
        placement: 'bottom',
        skipBeacon: true,
      }
    )
  }

  // Manajemen Admin
  if (pathname === '/superadmin/manajemen-admin') {
    steps.push(
      {
        target: 'h1',
        content: 'Kelola pendaftaran admin organisasi. Pastikan email admin sesuai dengan domain kampus untuk keamanan.',
        placement: 'bottom',
        skipBeacon: true,
      },
      {
        target: 'button:contains("Tambah Admin")',
        content: 'Gunakan tombol ini untuk memberikan akses admin ke personil organisasi baru.',
        placement: 'left',
      }
    )
  }

  // Manajemen Pemilihan
  if (pathname === '/superadmin/manajemen-pemilihan') {
    steps.push(
      {
        target: 'h1',
        content: 'Pantau seluruh pemilihan yang sedang berjalan di berbagai fakultas atau organisasi.',
        placement: 'bottom',
        skipBeacon: true,
      }
    )
  }

  // Manajemen Proposal
  if (pathname === '/superadmin/manajemen-proposal') {
    steps.push(
      {
        target: 'h1',
        content: 'Review pengajuan pemilihan baru. Periksa parameter pemilihan sebelum menyetujui deployment ke blockchain.',
        placement: 'bottom',
        skipBeacon: true,
      }
    )
  }

  // Audit Log
  if (pathname === '/superadmin/audit-log') {
    steps.push(
      {
        target: 'h1',
        content: 'Log Audit Transparansi. Aktivitas penting dicatat pada log sistem untuk kebutuhan audit aplikasi.',
        placement: 'bottom',
        skipBeacon: true,
      }
    )
  }

  // Pengaturan Platform / Data Master Voter
  if (pathname === '/superadmin/data-voter') {
    steps.push(
      {
        target: 'h1',
        content: 'Kelola Database Pemilih (Voter Master). Sinkronkan data NIM dan Nama dari sistem akademik kampus.',
        placement: 'bottom',
        skipBeacon: true,
      }
    )
  }

  // Risk Activity
  if (pathname === '/superadmin/risk-activity') {
    steps.push(
      {
        target: 'h1',
        content: 'Pusat Keamanan Platform. Pantau anomali jaringan, percobaan akses ilegal, dan integritas data pemilihan.',
        placement: 'bottom',
        skipBeacon: true,
      }
    )
  }

  // Profil Superadmin
  if (pathname === '/superadmin/profil') {
    steps.push(
      {
        target: 'h1',
        content: 'Di halaman profil ini, Anda dapat mengelola identitas Anda dan melakukan konfigurasi sistem tingkat tinggi.',
        placement: 'bottom',
        skipBeacon: true,
      },
      {
        target: 'section:has(h2:contains("Profil Saya"))',
        content: 'Sekarang Anda dapat mengedit nama profil dan foto profil Anda langsung dari sini.',
        placement: 'right',
      },
      {
        target: 'section:has(h2:contains("Keamanan Sesi"))',
        content: 'Aktifkan Autentikasi Dua Faktor (2FA) untuk perlindungan maksimal akun superadmin.',
        placement: 'right',
      },
      {
        target: 'section:has(h2:contains("Konfigurasi Blockchain"))',
        content: 'Pantau status jaringan blockchain dan alamat owner contract utama platform.',
        placement: 'left',
      },
      {
        target: 'section:has(h2:contains("Konfigurasi Sistem"))',
        content: 'Ubah nama platform dan bahasa default yang akan digunakan oleh seluruh sistem.',
        placement: 'left',
      }
    )
  }

  if (!mounted || steps.length === 0) return null

  return (
    <>
      <Joyride
        onEvent={handleJoyrideCallback}
        continuous
        run={run}
        scrollToFirstStep
        steps={steps}
        options={{
          showProgress: true,
          buttons: ['back', 'primary', 'skip'],
          primaryColor: '#0F172A',
          // ponytail: z-index harus jauh di atas sticky navbar (z-30 = 30)
          zIndex: 9999,
        }}
        locale={{
          back: 'Kembali',
          close: 'Tutup',
          last: 'Selesai',
          next: 'Lanjut',
          skip: 'Lewati Tur',
        }}
      />

      <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end gap-3">
        {showConfirm && (
          <div className="mb-2 w-64 rounded-2xl border border-slate-200 bg-white p-4 shadow-xl">
            <div className="flex items-start justify-between">
              <h4 className="text-[14px] font-bold text-slate-900">Butuh Panduan Superadmin?</h4>
              <button onClick={() => setShowConfirm(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="mt-2 text-[12px] leading-5 text-slate-600">
              Mulai tur panduan untuk memahami fitur-fitur panel superadmin di halaman ini.
            </p>
            <div className="mt-4 flex gap-2">
              <button
                onClick={() => {
                  setRun(true)
                  setShowConfirm(false)
                }}
                className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-[#0F172A] py-2 text-[12px] font-semibold text-white hover:bg-slate-800"
              >
                <PlayCircle className="h-3.5 w-3.5" />
                Mulai Tur
              </button>
            </div>
          </div>
        )}
        
        <button
          onClick={() => setShowConfirm(!showConfirm)}
          className="flex h-12 w-12 items-center justify-center rounded-full bg-[#0F172A] text-white shadow-lg transition-transform hover:scale-110"
          aria-label="Bantuan Superadmin"
        >
          <HelpCircle className="h-6 w-6" />
        </button>
      </div>
    </>
  )
}
