'use client'

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import axios from 'axios'
import toast from 'react-hot-toast'
import { useAuth } from './AuthContext'
import { API_URL } from '@/lib/api-config'

interface SubscriptionInfo {
  id: number
  plan_type: string
  billing_cycle: string
  status: string
  amount?: number
  currency: string
  current_period_start?: string
  current_period_end?: string
  days_until_expiry?: number
  is_expired: boolean
  in_grace_period: boolean
  expiry_info?: string
}

interface SubscriptionContextType {
  subscriptionInfo: SubscriptionInfo | null
  isLoading: boolean
  isProcessing: boolean
  checkSubscriptionStatus: () => Promise<void>
  refreshSubscriptionInfo: () => Promise<void>
  isInGracePeriod: boolean
  daysUntilExpiry: number | null
  showExpirationWarning: boolean
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined)

export const useSubscription = () => {
  const context = useContext(SubscriptionContext)
  if (context === undefined) {
    throw new Error('useSubscription must be used within a SubscriptionProvider')
  }
  return context
}

interface SubscriptionProviderProps {
  children: React.ReactNode
}

export const SubscriptionProvider: React.FC<SubscriptionProviderProps> = ({ children }) => {
  const { user, isAuthenticated, updateUser } = useAuth()
  const [subscriptionInfo, setSubscriptionInfo] = useState<SubscriptionInfo | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isProcessing, setIsProcessing] = useState(() => {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem('payment_is_processing') === 'true'
    }
    return false
  })
  const [lastCheck, setLastCheck] = useState<number>(0)

  // Derived state
  const isInGracePeriod = subscriptionInfo?.in_grace_period || false
  const daysUntilExpiry = subscriptionInfo?.days_until_expiry || null
  const showExpirationWarning = Boolean(isAuthenticated && user?.is_premium && (
    (daysUntilExpiry !== null && daysUntilExpiry <= 3) || isInGracePeriod
  ))

  const checkSubscriptionStatus = useCallback(async () => {
    if (!isAuthenticated || !user) {
      setSubscriptionInfo(null)
      setIsProcessing(false)
      sessionStorage.removeItem('payment_is_processing')
      return
    }

    // Avoid too frequent checks across page reloads (max once per 5 minutes)
    const now = Date.now()
    const storedLastCheck = parseInt(sessionStorage.getItem('last_payment_check') || '0', 10)
    const effectiveLastCheck = Math.max(lastCheck, storedLastCheck)
    const checkInterval = isProcessing ? 15 * 60 * 1000 : 5 * 60 * 1000

    if (now - effectiveLastCheck < checkInterval) {
      const storedData = sessionStorage.getItem('subscription_info')
      if (storedData) {
        setSubscriptionInfo(JSON.parse(storedData))
      }
      return
    }

    sessionStorage.setItem('last_payment_check', now.toString())

    try {
      setIsLoading(true)
      const response = await axios.post(`${API_URL}/api/v1/payment/check-status`)

      if (response.data) {
        const { success, is_premium, status, message } = response.data

        if (status === 'processing') {
          setIsProcessing(true)
          sessionStorage.setItem('payment_is_processing', 'true')
          toast.loading(message, { id: 'payment-processing-toast', duration: 10000 })
          setSubscriptionInfo(null)
          sessionStorage.removeItem('subscription_info')
          setLastCheck(now)
          return
        } else {
          setIsProcessing(false)
          sessionStorage.removeItem('payment_is_processing')
        }

        if (user.is_premium !== is_premium) {
          updateUser({ is_premium })
          if (!is_premium && user.is_premium) {
            const isManualCancellation = sessionStorage.getItem('manual_cancellation')
            if (isManualCancellation) {
              sessionStorage.removeItem('manual_cancellation')
            } else {
              toast.error('SUBSCRIPTION_EXPIRED_DOWNGRADE')
            }
            window.dispatchEvent(new CustomEvent('subscription-expired', {
              detail: { previousStatus: 'premium', currentStatus: 'free' }
            }))
          }
        }

        let subscriptionData: SubscriptionInfo | null = null
        if (is_premium && success) {
          try {
            const detailResponse = await axios.get(`${API_URL}/api/v1/payment/history`)
            const activePayment = detailResponse.data?.payments?.find((p: any) =>
              p.status === 'completed' && p.plan_type !== 'free'
            )
            if (activePayment) {
              subscriptionData = {
                id: activePayment.id,
                plan_type: activePayment.plan_type,
                billing_cycle: activePayment.billing_cycle,
                status: 'active',
                amount: activePayment.amount,
                currency: activePayment.currency,
                is_expired: false,
                in_grace_period: false
              }
            }
          } catch (error) {
            // Error fetching history
          }
        }

        if (message && message.includes('expires in')) {
          const match = message.match(/expires in (\d+) days/)
          if (match && subscriptionData) {
            subscriptionData.days_until_expiry = parseInt(match[1])
            subscriptionData.expiry_info = `expires in ${match[1]} days`
          }
        } else if (message && message.includes('grace period')) {
          if (subscriptionData) {
            subscriptionData.in_grace_period = true
            subscriptionData.expiry_info = 'in grace period'
          }
        }

        setSubscriptionInfo(subscriptionData)
        if (subscriptionData) {
          sessionStorage.setItem('subscription_info', JSON.stringify(subscriptionData))
        } else {
          sessionStorage.removeItem('subscription_info')
        }
        setLastCheck(now)
      }
    } catch (error: any) {
      setLastCheck(now)
      if (error.response?.status === 401 && user?.is_premium) {
        updateUser({ is_premium: false })
        setSubscriptionInfo(null)
        toast.error('SESSION_EXPIRED_RE_AUTH_REQUIRED')
      }
    } finally {
      setIsLoading(false)
    }
  }, [isAuthenticated, user, lastCheck, updateUser, isProcessing])

  const refreshSubscriptionInfo = useCallback(async () => {
    setLastCheck(0)
    await checkSubscriptionStatus()
  }, [checkSubscriptionStatus])

  useEffect(() => {
    if (isAuthenticated && user) {
      checkSubscriptionStatus()
    } else {
      setSubscriptionInfo(null)
    }
  }, [isAuthenticated, user?.id, checkSubscriptionStatus])

  useEffect(() => {
    if (!isAuthenticated || !user?.is_premium) return
    const interval = setInterval(() => {
      checkSubscriptionStatus()
    }, 30 * 60 * 1000)
    return () => clearInterval(interval)
  }, [isAuthenticated, user?.is_premium, checkSubscriptionStatus])

  useEffect(() => {
    const handleUpdate = () => refreshSubscriptionInfo()
    const handleSuccess = () => setTimeout(() => refreshSubscriptionInfo(), 2000)

    window.addEventListener('subscription-updated', handleUpdate)
    window.addEventListener('payment-success', handleSuccess)
    window.addEventListener('subscription-cancelled', handleUpdate)

    return () => {
      window.removeEventListener('subscription-updated', handleUpdate)
      window.removeEventListener('payment-success', handleSuccess)
      window.removeEventListener('subscription-cancelled', handleUpdate)
    }
  }, [refreshSubscriptionInfo])

  const value: SubscriptionContextType = {
    subscriptionInfo,
    isLoading,
    isProcessing,
    checkSubscriptionStatus,
    refreshSubscriptionInfo,
    isInGracePeriod,
    daysUntilExpiry,
    showExpirationWarning
  }

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  )
}