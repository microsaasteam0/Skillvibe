'use client'

import { useEffect, useState } from 'react'
import Script from 'next/script'
import { useAuth } from '../contexts/AuthContext'

export default function UpvoteWidget() {
  const { user } = useAuth()
  const [remountKey, setRemountKey] = useState(0)

  useEffect(() => {
    // Force widget remount when auth state changes
    setRemountKey((prev) => prev + 1)
  }, [user])

  if (!user) return null

  return (
    <div key={remountKey}>
      <div
        className="upvote-widget"
        data-application-id="skillvibe-ai"
        data-user-id={user?.id}
      />
      <Script
        src="https://upvote.entrext.com/widget.js"
        strategy="afterInteractive"
      />
    </div>
  )
}
