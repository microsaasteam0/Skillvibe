'use client'

import React, { useState, useEffect } from 'react'
import ThemedToaster from './ThemedToaster'
import { AuthProvider } from '../contexts/AuthContext'
import { UserPreferencesProvider } from '../contexts/UserPreferencesContext'
import { ThemeProvider } from '../contexts/ThemeContext'
import { PaymentProcessingProvider } from '../contexts/PaymentProcessingContext'
import { SubscriptionProvider } from '../contexts/SubscriptionContext'
import SupportWidget from './SupportWidget'
import CompanyInfoSetupModal from './CompanyInfoSetupModal'

interface ClientProvidersProps {
  children: React.ReactNode
}

export default function ClientProviders({ children }: ClientProvidersProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <ThemeProvider>
      <AuthProvider>
        <SubscriptionProvider>
          <PaymentProcessingProvider>
            <UserPreferencesProvider>
              {children}
              <SupportWidget />
              <ThemedToaster />
              {mounted && <CompanyInfoSetupModal />}
            </UserPreferencesProvider>
          </PaymentProcessingProvider>
        </SubscriptionProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}