'use client'

import React, { useEffect, useState } from 'react'
import { Joyride, EventData, STATUS, Step } from 'react-joyride'
import { usePathname } from 'next/navigation'
import { HelpCircle, PlayCircle, X } from 'lucide-react'

interface OnboardingTourProps {
  forceStart?: boolean
  onComplete?: () => void
}

const TOUR_STORAGE_KEY = 'votein-onboarding-completed'

export function OnboardingTour({ forceStart = false, onComplete }: OnboardingTourProps) {
  const pathname = usePathname()
  const [run, setRun] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  useEffect(() => {
    setMounted(true)
    const isCompleted = localStorage.getItem(TOUR_STORAGE_KEY)
    if (!isCompleted || forceStart) {
      // Delay to ensure components are rendered
      const timer = setTimeout(() => setRun(true), 1500)
      return () => clearTimeout(timer)
    }
  }, [forceStart])

  const handleJoyrideCallback = (data: EventData) => {
    const { status } = data
    const finishedStatuses: string[] = [STATUS.FINISHED, STATUS.SKIPPED]

    if (finishedStatuses.includes(status)) {
      setRun(false)
      localStorage.setItem(TOUR_STORAGE_KEY, 'true')
      if (onComplete) onComplete()
    }
  }

  const steps: Step[] = []

  // Steps for Dashboard / Beranda
  if (pathname === '/pemilih') {
    steps.push(
      {
        target: '#tour-voter-home-title',
        content: 'Selamat datang di Ruang Voting Anda! Di sini Anda dapat memantau pemilihan yang sedang berlangsung.',
        placement: 'bottom',
        skipBeacon: true,
      },
      {
        target: '#tour-voter-featured-election',
        content: 'Ini adalah kartu pemilihan aktif. Anda bisa melihat status, sisa waktu, dan melakukan aksi seperti memilih kandidat atau konfirmasi suara.',
        placement: 'right',
      },
      {
        target: '#tour-voter-participation-stats',
        content: 'Pantau tingkat partisipasi voting Anda sepanjang tahun di sini.',
        placement: 'left',
      }
    )
  }

  // Steps for Bukti Saya
  if (pathname === '/pemilih/bukti-saya') {
    steps.push(
      {
        target: '#tour-voter-proof-title',
        content: 'Halaman Bukti Saya menyimpan semua riwayat pemilihan Anda secara transparan.',
        placement: 'bottom',
        skipBeacon: true,
      },
      {
        target: '#tour-voter-participation-total',
        content: 'Di sini Anda bisa melihat total partisipasi Anda.',
        placement: 'right',
      },
      {
        target: '#tour-voter-view-proof-btn',
        content: 'Pilih pemilihan dari daftar untuk melihat detail bukti digitalnya.',
        placement: 'left',
      },
      {
        target: '#tour-voter-proof-detail',
        content: 'Detail teknis seperti hash transaksi dan nomor blok di jaringan blockchain ditampilkan di sini.',
        placement: 'top',
      },
      {
        target: '#tour-voter-download-cert-btn',
        content: 'Anda juga bisa mengunduh sertifikat digital sebagai bukti partisipasi yang sah.',
        placement: 'top',
      }
    )
  }

  // Steps for Bantuan
  if (pathname === '/pemilih/bantuan') {
    steps.push(
      {
        target: '#tour-voter-help-title',
        content: 'Pusat Bantuan menyediakan panduan lengkap untuk memudahkan Anda dalam memberikan suara.',
        placement: 'bottom',
        skipBeacon: true,
      },
      {
        target: '#tour-voter-help-search',
        content: 'Gunakan fitur pencarian untuk menemukan jawaban atas pertanyaan Anda dengan cepat.',
        placement: 'bottom',
      },
      {
        target: '#tour-voter-help-flow',
        content: 'Pelajari alur memilih yang aman: Pilih, Simpan, dan Konfirmasi.',
        placement: 'top',
      },
      {
        target: '#tour-voter-help-chat-btn',
        content: 'Butuh bantuan lebih lanjut? Hubungi tim dukungan kami melalui Live Chat atau Email.',
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
          zIndex: 1000,
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
              <h4 className="text-[14px] font-bold text-slate-900">Butuh Panduan?</h4>
              <button onClick={() => setShowConfirm(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="mt-2 text-[12px] leading-5 text-slate-600">
              Apakah Anda ingin memulai tur onboarding untuk memahami fitur di halaman ini?
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
          aria-label="Bantuan Onboarding"
          title="Tampilkan Panduan Halaman"
        >
          <HelpCircle className="h-6 w-6" />
        </button>
      </div>
    </>
  )
}
