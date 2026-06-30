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

const TOUR_STORAGE_PREFIX = 'votein-admin-onboarding-completed'

function getTourStorageKey(email: string | null | undefined): string {
  const normalized = email?.trim().toLowerCase() ?? 'anonymous'
  return `${TOUR_STORAGE_PREFIX}:${normalized}`
}

export function OnboardingTour({ forceStart = false, onComplete }: OnboardingTourProps) {
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

    // Auto-start ONLY on dashboard (/admin) if not completed
    const shouldAutoStart = !isCompleted && pathname === '/admin'

    if (shouldAutoStart || forceStart) {
      // Delay to ensure components are rendered
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

  // Steps for Dashboard / Beranda Admin
  if (pathname === '/admin') {
    steps.push(
      {
        target: '#tour-admin-hero-title',
        content: 'Selamat datang di Panel Admin Organisasi! Di sini Anda dapat mengelola seluruh infrastruktur pemilihan digital Anda.',
        placement: 'bottom',
        skipBeacon: true,
      },
      {
        target: '#tour-admin-modules',
        content: 'Gunakan modul-modul ini untuk mengakses manajemen pemilihan, pengajuan proposal, dan pemantauan real-time.',
        placement: 'top',
      },
      {
        target: '#tour-admin-activities',
        content: 'Pantau aktivitas terbaru di jaringan blockchain, mulai dari pembuatan kontrak hingga pendaftaran pemilih.',
        placement: 'right',
      },
      {
        target: '#tour-admin-metrics',
        content: 'Lihat ringkasan partisipasi dan pencapaian kuorum secara keseluruhan di sini.',
        placement: 'left',
      }
    )
  }

  // Steps for Manajemen Pemilihan
  if (pathname === '/admin/manajemen-pemilihan') {
    steps.push(
      {
        target: '#tour-admin-election-header',
        content: 'Halaman Manajemen Pemilihan memungkinkan Anda mengontrol fase pemilihan dan mengelola daftar pemilih (whitelist).',
        placement: 'bottom',
        skipBeacon: true,
      },
      {
        target: '#tour-admin-election-list',
        content: 'Ini adalah daftar ruang pemilihan yang Anda kelola. Klik pada kartu untuk masuk ke kontrol detail pemilihan tersebut.',
        placement: 'top',
      },
      {
        target: '#tour-admin-create-election',
        content: 'Ingin memulai pemilihan baru? Gunakan tombol ini untuk membuat ruang pemilihan baru melalui pengajuan proposal.',
        placement: 'left',
      }
    )
  }

  // Steps for Daftar Proposal
  if (pathname === '/admin/daftar-proposal') {
    steps.push(
      {
        target: '#tour-admin-proposal-header',
        content: 'Kelola seluruh pengajuan pemilihan organisasi Anda di sini sebelum dipublikasikan ke blockchain.',
        placement: 'bottom',
        skipBeacon: true,
      },
      {
        target: '#tour-admin-proposal-stats',
        content: 'Pantau status proposal Anda: dari draf, menunggu review, hingga yang telah disetujui.',
        placement: 'bottom',
      },
      {
        target: '#tour-admin-proposal-table',
        content: 'Daftar detail proposal. Anda dapat melihat, mengedit draf, atau memeriksa hash blockchain untuk proposal yang sudah divalidasi.',
        placement: 'top',
      }
    )
  }

  // Steps for Bantuan Admin
  if (pathname === '/admin/bantuan') {
    steps.push(
      {
        target: 'h1',
        content: 'Pusat Bantuan Admin. Temukan panduan operasional dan jawaban atas kendala teknis di sini.',
        placement: 'bottom',
        skipBeacon: true,
      },
      {
        target: 'section:has(h2:contains("Panduan Cepat"))',
        content: 'Gunakan panduan ini untuk memahami alur kerja dasar pemilihan dari awal hingga akhir.',
        placement: 'top',
      },
      {
        target: 'section:has(h2:contains("FAQ"))',
        content: 'Pertanyaan yang sering diajukan mengenai teknis blockchain dan sinkronisasi data.',
        placement: 'top',
      }
    )
  }

  // Steps for Profile Admin
  if (pathname === '/admin/profil') {
    steps.push(
      {
        target: 'h1',
        content: 'Ini adalah pusat kendali identitas Anda. Di sini Anda dapat mengelola data profil dan memantau keamanan sesi.',
        placement: 'bottom',
        skipBeacon: true,
      },
      {
        target: 'article:has(h2:contains("Foto Profil"))',
        content: 'Perbarui foto profil Anda untuk mempermudah identifikasi dalam organisasi.',
        placement: 'right',
      },
      {
        target: 'article:has(h2:contains("INFORMASI PERSONAL"))',
        content: 'Informasi personal Anda tersimpan di sini. Gunakan tombol "Edit Profil" untuk memperbarui nama tampilan atau bio.',
        placement: 'left',
      },
      {
        target: 'article:has(h2:contains("Sesi Aktif & Keamanan"))',
        content: 'Pantau di perangkat mana saja akun Anda masuk. Anda dapat mengeluarkan sesi lain jika mendeteksi aktivitas mencurigakan.',
        placement: 'top',
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
        styles={{
          tooltipContainer: {
            textAlign: 'left',
          },
          buttonPrimary: {
            fontSize: '13px',
            padding: '8px 16px',
            borderRadius: '8px',
          },
          buttonBack: {
            fontSize: '13px',
            marginRight: '8px',
          },
          buttonSkip: {
            fontSize: '13px',
            color: '#64748b',
          }
        }}
        locale={{
          back: 'Kembali',
          close: 'Tutup',
          last: 'Selesai',
          next: 'Lanjut',
          skip: 'Lewati Tur',
        }}
      />

      {/* Floating Help Button */}
      <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end gap-3">
        {showConfirm && (
          <div className="mb-2 w-64 rounded-2xl border border-slate-200 bg-white p-4 shadow-xl animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="flex items-start justify-between">
              <h4 className="text-[14px] font-bold text-slate-900">Butuh Panduan Admin?</h4>
              <button onClick={() => setShowConfirm(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="mt-2 text-[12px] leading-5 text-slate-600">
              Apakah Anda ingin memulai tur onboarding untuk memahami fitur manajemen admin di halaman ini?
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
          className="flex h-12 w-12 items-center justify-center rounded-full bg-[#0F172A] text-white shadow-lg transition-transform hover:scale-110 active:scale-95"
          aria-label="Bantuan Onboarding Admin"
          title="Tampilkan Panduan Admin"
        >
          <HelpCircle className="h-6 w-6" />
        </button>
      </div>
    </>
  )
}
