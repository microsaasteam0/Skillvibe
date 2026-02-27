'use client'

import { useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'

export default function RecruiterCompanyRedirectPage() {
  const router = useRouter()
  const params = useParams()
  const rawParam = Array.isArray(params?.id) ? params.id[0] : params?.id

  useEffect(() => {
    if (!rawParam) {
      router.replace('/jobs')
      return
    }
    router.replace(`/company/${rawParam}`)
  }, [rawParam, router])

  return null
}
