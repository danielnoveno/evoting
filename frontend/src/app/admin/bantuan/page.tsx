'use client'

import { useState } from 'react'
import { AdminShell } from '@/components/admin/admin-shell'
import { adminHelpData } from '@/lib/admin-help-dummy-data'
import { useToast } from '@/components/ui/toast-provider'
import { AppPageHeader } from '@/components/ui/app-page-header'
import { ScrollReveal, StaggerContainer } from '@/components/public/parallax'
import { Search, FileText, Box, Fingerprint, ShieldCheck, ChevronDown, ChevronUp, MessageSquare, Mail, ArrowRight, ExternalLink, ChevronRight, LifeBuoy, MessageCircle, Phone } from 'lucide-react'

// Helper to map icon string to Lucide component
const IconMap = {
  'file-text': FileText,
  'box': Box,
  'fingerprint': Fingerprint,
  'shield-check': ShieldCheck
}

function AccordionItem({ question, answer, defaultOpen = false }: { question: string, answer: string, defaultOpen?: boolean }) {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  return (
    <div className="rounded-2xl bg-slate-50 overflow-hidden transition-all">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-6 text-left"
      >
        <span className="text-[15px] font-semibold text-slate-900">{question}</span>
        {isOpen ? (
          <ChevronUp className="h-5 w-5 text-slate-500 flex-shrink-0 ml-4" />
        ) : (
          <ChevronDown className="h-5 w-5 text-slate-500 flex-shrink-0 ml-4" />
        )}
      </button>
      {isOpen && (
        <div className="px-6 pb-6 text-[14px] leading-7 text-slate-500">
          {answer}
        </div>
      )}
    </div>
  )
}

export default function AdminHelpPage() {
  const { showToast } = useToast()
  const [searchQuery, setSearchQuery] = useState('')
  const [showAllFaq, setShowAllFaq] = useState(false)

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (!searchQuery.trim()) return
    
    showToast({
      title: 'Pencarian Berhasil',
      description: `Menampilkan hasil panduan untuk "${searchQuery}". (Simulasi frontend)`,
      tone: 'info'
    })
  }

  const handleSupportAction = (actionType: string) => {
    showToast({
      title: 'Menghubungkan ke Tim Support',
      description: `Permintaan ${actionType} Anda sedang dialihkan ke tim teknis kami.`,
      tone: 'success'
    })
  }

  return (
    <AdminShell>
      {/* Header Section */}
      <ScrollReveal variant="fade-up" duration={700}>
        <div className="mb-12">
          <AppPageHeader 
            title={adminHelpData.header.title} 
            description={adminHelpData.header.description} 
          />

          {/* Search Bar */}
          <form onSubmit={handleSearch} className="mt-8 max-w-2xl relative flex items-center">
            <div className="absolute left-6 text-slate-400">
              <Search className="h-6 w-6" />
            </div>
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari solusi atau panduan..."
              className="w-full h-16 pl-16 pr-[120px] rounded-[24px] bg-slate-50 border border-slate-100 focus:bg-white focus:border-slate-300 focus:ring-0 text-[16px] text-slate-900 transition-all outline-none"
            />
            <button 
              type="submit"
              className="absolute right-3 h-10 px-6 bg-black text-white rounded-xl text-[14px] font-medium hover:bg-slate-800 transition-colors"
            >
              Cari
            </button>
          </form>
        </div>
      </ScrollReveal>

      {/* Categories Grid */}
      <StaggerContainer stagger={100} variant="fade-up" duration={700} className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
        {adminHelpData.categories.map((category) => {
          const IconComponent = IconMap[category.iconKey as keyof typeof IconMap] || FileText
          
          return (
            <article key={category.id} className="rounded-[28px] bg-white border border-slate-100 p-8 shadow-[0_8px_30px_rgba(15,23,42,0.04)] hover:shadow-[0_18px_40px_rgba(15,23,42,0.08)] transition-all cursor-pointer">
              <div className="h-12 w-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 mb-6">
                <IconComponent className="h-6 w-6" />
              </div>
              <h3 className="text-[16px] font-bold text-slate-900 mb-3">{category.title}</h3>
              <p className="text-[14px] leading-6 text-slate-500">{category.description}</p>
            </article>
          )
        })}
      </StaggerContainer>

      {/* Main Content Split: FAQ & Sidebar */}
      <ScrollReveal variant="fade-up" delay={300} duration={800}>
        <section className="grid gap-10 lg:grid-cols-[1fr_360px] xl:grid-cols-[1fr_400px]">
        
        {/* Left Column: FAQ */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-[20px] font-semibold text-slate-900">Pertanyaan Populer</h2>
            <button 
              onClick={() => setShowAllFaq(!showAllFaq)}
              className="flex items-center gap-2 text-[13px] font-semibold text-slate-900 hover:text-blue-600 transition-colors"
            >
              {showAllFaq ? 'Sembunyikan' : 'Lihat Semua'}
              <ArrowRight className={`h-4 w-4 transition-transform ${showAllFaq ? '-rotate-90' : ''}`} />
            </button>
          </div>
          
          <div className="space-y-4">
            {(showAllFaq ? adminHelpData.faqs : adminHelpData.faqs.slice(0, 3)).map((faq, index) => (
              <AccordionItem 
                key={faq.id} 
                question={faq.question} 
                answer={faq.answer} 
                defaultOpen={index === 0} // First item is open by default as in design
              />
            ))}
          </div>
        </div>

        {/* Right Column: Widgets */}
        <div className="space-y-6">
          {/* Support Widget */}
          <div className="rounded-[32px] bg-[#1a202c] p-8 text-white relative overflow-hidden shadow-xl">
            {/* Background subtle gradient circle */}
            <div className="absolute top-0 right-0 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            
            <h3 className="text-[22px] font-semibold relative z-10">{adminHelpData.supportWidget.title}</h3>
            <p className="mt-4 text-[14px] leading-6 text-slate-300 relative z-10">
              {adminHelpData.supportWidget.description}
            </p>

            <div className="mt-8 space-y-3 relative z-10">
              <button 
                onClick={() => handleSupportAction('Live Chat')}
                className="w-full h-12 flex items-center justify-center gap-2 rounded-2xl bg-white text-slate-900 text-[14px] font-bold hover:bg-slate-100 transition-colors"
              >
                <MessageSquare className="h-4 w-4" />
                {adminHelpData.supportWidget.primaryButton}
              </button>
              <button 
                onClick={() => handleSupportAction('Email Support')}
                className="w-full h-12 flex items-center justify-center gap-2 rounded-2xl bg-black border border-white/10 text-white text-[14px] font-medium hover:bg-black/80 transition-colors"
              >
                <Mail className="h-4 w-4" />
                {adminHelpData.supportWidget.secondaryButton}
              </button>
            </div>
          </div>

          {/* System Status Widget */}
          <div className="rounded-[28px] bg-slate-50 border border-slate-100 p-8">
            <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500 mb-6">
              {adminHelpData.systemStatus.title}
            </p>
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-3">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                <span className="text-[15px] font-semibold text-slate-900">
                  {adminHelpData.systemStatus.statusLabel}
                </span>
              </div>
              <p className="text-[12px] font-mono text-slate-500 ml-5">
                Last block: {adminHelpData.systemStatus.lastBlock}
              </p>
            </div>
          </div>
        </div>

        </section>
      </ScrollReveal>
    </AdminShell>
  )
}
