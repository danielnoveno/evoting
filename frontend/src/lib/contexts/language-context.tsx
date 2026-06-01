'use client'

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { dictionaries, type Locale, type Dictionary } from '@/lib/i18n/dictionaries'
import { usePlatformSettings } from '@/hooks/use-platform-settings'

interface LanguageContextType {
  locale: Locale
  setLocale: (locale: Locale) => void
  t: Dictionary
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

export function LanguageProvider({ children }: { children: ReactNode }) {
  const { data: settings } = usePlatformSettings()
  const [locale, setLocale] = useState<Locale>('Bahasa Indonesia')

  useEffect(() => {
    if (settings?.default_language && (settings.default_language === 'Bahasa Indonesia' || settings.default_language === 'English')) {
      setLocale(settings.default_language as Locale)
    }
  }, [settings])

  const value = {
    locale,
    setLocale,
    t: dictionaries[locale] as Dictionary
  }

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider')
  }
  return context
}
