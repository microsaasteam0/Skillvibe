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
      return
    }

    // Avoid too frequent checks across page reloads (max once per 5 minutes)
    const now = Date.now()
    const storedLastCheck = parseInt(sessionStorage.getItem('last_payment_check') || '0', 10)
    const effectiveLastCheck = Math.max(lastCheck, storedLastCheck)

    if (now - effectiveLastCheck < 5 * 60 * 1000) {
      const storedData = sessionStorage.getItem('subscription_info')
      if (storedData) {
        setSubscriptionInfo(JSON.parse(storedData))
      }
      return
    }

    sessionStorage.setItem('last_payment_check', now.toString())

    try {
      setIsLoading(true)
      // console.log('🔍 Checking subscription status with real-time validation...')

      const response = await axios.post(`${API_URL}/api/v1/payment/check-status`)

      if (response.data) {
        const { success, is_premium, plan, message } = response.data

        // Update user premium status if it changed
        if (user.is_premium !== is_premium) {
          // console.log(`🔄 Premium status changed: ${user.is_premium} → ${is_premium}`)
          updateUser({ is_premium })

          if (!is_premium && user.is_premium) {
            // Check if this is a manual cancellation (don't show error for manual cancellations)
            const isManualCancellation = sessionStorage.getItem('manual_cancellation')

            if (isManualCancellation) {
              // console.log('🔄 Manual cancellation detected, skipping error notification')
              sessionStorage.removeItem('manual_cancellation')
            } else {
              // User was downgraded due to expiration
              toast.error('SUBSCRIPTION_EXPIRED_DOWNGRADE')
            }

            // Dispatch event for other components to react
            window.dispatchEvent(new CustomEvent('subscription-expired', {
              detail: { previousStatus: 'premium', currentStatus: 'free' }
            }))
          }
        }

        // Parse subscription info from the message if available
        let subscriptionData: SubscriptionInfo | null = null

        if (is_premium && success) {
          // Try to get detailed subscription info
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
          } catch (detailError) {
            // console.warn('Could not fetch detailed subscription info:', detailError)
          }
        }

        // Parse expiry info from message if available
        if (message && message.includes('expires in')) {
          const match = message.match(/expires in (\d+) days/)
          if (match) {
            const days = parseInt(match[1])
            if (subscriptionData) {
              subscriptionData.days_until_expiry = days
              subscriptionData.expiry_info = `expires in ${days} days`
            }
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

        // console.log('✅ Subscription status updated:', subscriptionData)
      }
    } catch (error: any) {
      setLastCheck(now) // Update lastCheck to prevent infinite loops on error
      // console.error('❌ Error checking subscription status:', error)

      // If we get a 401, the user might have been downgraded
      if (error.response?.status === 401 && user?.is_premium) {
        // console.log('🔄 Got 401 while checking subscription, user might be downgraded')
        updateUser({ is_premium: false })
        setSubscriptionInfo(null)
        toast.error('SESSION_EXPIRED_RE_AUTH_REQUIRED')
      }
    } finally {
      setIsLoading(false)
    }
  }, [isAuthenticated, user, lastCheck, updateUser])

  const refreshSubscriptionInfo = useCallback(async () => {
    setLastCheck(0) // Force refresh
    await checkSubscriptionStatus()
  }, [checkSubscriptionStatus])

  // Check subscription status when user changes or on mount
  useEffect(() => {
    if (isAuthenticated && user) {
      checkSubscriptionStatus()
    } else {
      setSubscriptionInfo(null)
    }
  }, [isAuthenticated, user?.id, checkSubscriptionStatus])

  // Periodic check for subscription status (every 30 minutes)
  useEffect(() => {
    if (!isAuthenticated || !user?.is_premium) return

    const interval = setInterval(() => {
      // console.log('🔄 Periodic subscription status check...')
      checkSubscriptionStatus()
    }, 30 * 60 * 1000) // 30 minutes

    return () => clearInterval(interval)
  }, [isAuthenticated, user?.is_premium, checkSubscriptionStatus])

  // Listen for subscription-related events
  useEffect(() => {
    const handleSubscriptionUpdate = () => {
      // console.log('🔄 Subscription update event received, refreshing...')
      refreshSubscriptionInfo()
    }

    const handlePaymentSuccess = () => {
      // console.log('🎉 Payment success event received, refreshing subscription...')
      setTimeout(() => refreshSubscriptionInfo(), 2000) // Small delay for webhook processing
    }

    window.addEventListener('subscription-updated', handleSubscriptionUpdate)
    window.addEventListener('payment-success', handlePaymentSuccess)
    window.addEventListener('subscription-cancelled', handleSubscriptionUpdate)

    return () => {
      window.removeEventListener('subscription-updated', handleSubscriptionUpdate)
      window.removeEventListener('payment-success', handlePaymentSuccess)
      window.removeEventListener('subscription-cancelled', handleSubscriptionUpdate)
    }
  }, [refreshSubscriptionInfo])

  const value: SubscriptionContextType = {
    subscriptionInfo,
    isLoading,
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