'use client'

import { useState } from 'react'

import { DemoRole, setDemoSessionRole } from '@/lib/demo-auth'

type FeedbackVariant = 'success' | 'danger'

interface DemoFeedback {
  variant: FeedbackVariant
  message: string
}

export function useDemoLoginFlow() {
  const [loadingKey, setLoadingKey] = useState<string | null>(null)
  const [forceFail, setForceFail] = useState(false)
  const [feedback, setFeedback] = useState<DemoFeedback | null>(null)

  const runLogin = async (
    key: string,
    onSuccess: () => void,
    role?: DemoRole,
  ) => {
    setLoadingKey(key)
    setFeedback(null)

    await new Promise((resolve) => setTimeout(resolve, 900))

    if (forceFail) {
      setLoadingKey(null)
      setFeedback({
        variant: 'danger',
        message: 'Login demo gagal. Matikan mode gagal untuk melanjutkan simulasi.',
      })
      return
    }

    setFeedback({
      variant: 'success',
      message: 'Login demo berhasil. Mengarahkan ke halaman tujuan...',
    })

    if (role) {
      setDemoSessionRole(role)
    }

    await new Promise((resolve) => setTimeout(resolve, 500))
    onSuccess()
  }

  return {
    feedback,
    forceFail,
    loadingKey,
    runLogin,
    setFeedback,
    setForceFail,
  }
}
