'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { usePaymentProcessing } from '../contexts/PaymentProcessingContext'
import { requestCache } from '@/lib/cache-util'
import { API_URL } from '@/lib/api-config'
import axios from 'axios'

interface FeatureLimits {
  tier: string
  can_save_content: boolean
  can_process_urls: boolean
  can_access_analytics: boolean
  can_use_advanced_templates: boolean
  can_customize_branding: boolean
  generation_limit: number
  remaining_generations: number
  supported_platforms: string[]
  export_formats: string[]
  max_bulk_items: number
  max_content_length: number
}

interface UpgradePrompt {
  title: string
  message: string
  cta: string
}

export const useFeatureGate = () => {
  const { user, isAuthenticated } = useAuth()
  const { isProcessingPayment } = usePaymentProcessing()
  const [featureLimits, setFeatureLimits] = useState<FeatureLimits | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Don't make API calls during payment processing
    if (isProcessingPayment) return

    const fetchFeatureLimits = async () => {
      if (!isAuthenticated) {
        // Require authentication for all features
        setFeatureLimits({
          tier: 'unauthenticated',
          can_save_content: false,
          can_process_urls: false,
          can_access_analytics: false,
          can_use_advanced_templates: false,
          can_customize_branding: false,
          generation_limit: 0,
          remaining_generations: 0,
          supported_platforms: [],
          export_formats: [],
          max_bulk_items: 0,
          max_content_length: 0
        })
        setLoading(false)
        return
      }

      try {
        const cacheKey = `feature-limits-${user?.id || 'anon'}`
        const data = await requestCache.get(
          cacheKey,
          async () => {
            const response = await axios.get(`${API_URL}/api/v1/auth/feature-limits`)
            return response.data
          },
          60 * 1000
        )
        setFeatureLimits(data)
      } catch (error: any) {
        // Suppress 401 errors from console
        if (error?.response?.status !== 401) {
          console.error('Error fetching feature limits:', error)
        }

        // Fallback to basic limits based on user data
        // Be extra careful about the premium status
        const isPremium = user?.is_premium === true

        setFeatureLimits({
          tier: isPremium ? 'pro' : 'free',
          can_save_content: isPremium,
          can_process_urls: isPremium,
          can_access_analytics: isPremium,
          can_use_advanced_templates: isPremium,
          can_customize_branding: isPremium,
          generation_limit: isPremium ? 20 : 2,
          remaining_generations: isPremium ? 20 : 2,
          supported_platforms: ['twitter'],
          export_formats: isPremium ? ['clipboard', 'txt', 'json', 'csv'] : ['clipboard'],
          max_bulk_items: isPremium ? 50 : 1,
          max_content_length: isPremium ? 50000 : 10000
        })

      } finally {
        setLoading(false)
      }
    }

    fetchFeatureLimits()
  }, [isAuthenticated, user?.id, user?.is_premium, isProcessingPayment]) // Added isProcessingPayment

  const getUpgradePrompt = useCallback(async (feature: string): Promise<UpgradePrompt> => {
    try {
      const response = await axios.get(`${API_URL}/api/v1/auth/upgrade-prompt/${feature}`)
      return response.data
    } catch (error: any) {
      if (error?.response?.status !== 401) {
        console.error('Error fetching upgrade prompt:', error)
      }
      return {
        title: 'Upgrade to Pro',
        message: 'Unlock this feature and many more with Pro.',
        cta: 'Upgrade Now'
      }
    }
  }, [])

  const refreshLimits = useCallback(async () => {
    if (!isAuthenticated || !user?.id) return

    try {
      const cacheKey = `feature-limits-${user.id}`
      requestCache.invalidate(cacheKey)
      const data = await requestCache.get(
        cacheKey,
        async () => {
          const response = await axios.get(`${API_URL}/api/v1/auth/feature-limits`)
          return response.data
        },
        60 * 1000
      )
      setFeatureLimits(data)
    } catch (error: any) {
      if (error?.response?.status !== 401) {
        console.error('Error refreshing feature limits:', error)
      }
    }
  }, [isAuthenticated, user?.id])

  return {
    // Feature checks
    canSaveContent: featureLimits?.can_save_content || false,
    canProcessUrls: featureLimits?.can_process_urls || false,
    canAccessAnalytics: featureLimits?.can_access_analytics || false,
    canUseAdvancedTemplates: featureLimits?.can_use_advanced_templates || false,
    canCustomizeBranding: featureLimits?.can_customize_branding || false,

    // Limits and quotas
    generationLimit: featureLimits?.generation_limit === -1 ? Infinity : (featureLimits?.generation_limit || 0),
    remainingGenerations: featureLimits?.remaining_generations === -1 ? Infinity : (featureLimits?.remaining_generations || 0),
    maxContentLength: featureLimits?.max_content_length || 10000,
    maxBulkItems: featureLimits?.max_bulk_items || 1,

    // Available options
    supportedPlatforms: featureLimits?.supported_platforms || ['twitter'],
    exportFormats: featureLimits?.export_formats || ['clipboard'],

    // User tier
    tier: featureLimits?.tier || 'unauthenticated',
    isPro: featureLimits?.tier === 'pro',
    isFree: featureLimits?.tier === 'free',
    isUnauthenticated: featureLimits?.tier === 'unauthenticated',

    // Utility functions
    getUpgradePrompt,
    refreshLimits,
    loading,

    // Raw data
    featureLimits
  }
}
