'use client'

import { useState, useEffect, useCallback } from 'react'
import { Sparkles, Users, Crown, LogOut, LayoutDashboard, Settings, User as UserIcon, Mail, MessageCircle } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import MobileMenu from './MobileMenu'
import DashboardModal from './DashboardModal.jsx'
import { useAuth } from '../contexts/AuthContext'
import { useSubscription } from '../contexts/SubscriptionContext'
import { usePaymentProcessing } from '../contexts/PaymentProcessingContext'
import { useMessages } from '../contexts/MessageContext'
import { requestCache } from '@/lib/cache-util'
import axios from 'axios'
import { API_URL } from '@/lib/api-config'
import toast from 'react-hot-toast'
import { motion } from 'framer-motion'

interface UsageStats {
  total_generations: number
  recent_generations: number
  rate_limit: number
  remaining_requests: number
  remaining_generations?: number
  is_premium: boolean
  subscription_tier?: string
}

interface AuthenticatedNavbarProps {
  activeTab?: string
  isLoading?: boolean
}

export default function AuthenticatedNavbar({ activeTab, isLoading = false }: AuthenticatedNavbarProps) {
  const { user, isAuthenticated, logout } = useAuth()
  const { isProcessingPayment } = usePaymentProcessing()
  const { totalUnreadCount } = useMessages()
  const pathname = usePathname()
  const router = useRouter()
  const [usageStats, setUsageStats] = useState<UsageStats | null>(null)
  const [statsLoading, setStatsLoading] = useState(false)
  const [showDashboard, setShowDashboard] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const isValidImageUrl = (url: string): boolean => {
    if (!url || url.trim() === '') return false
    if (url.startsWith('data:image/')) return true
    try {
      const urlObj = new URL(url)
      return urlObj.protocol === 'http:' || urlObj.protocol === 'https:'
    } catch {
      return false
    }
  }

  const loadUsageStats = useCallback(async () => {
    if (!isAuthenticated || !user) return
    try {
      const cacheKey = `usage-stats-${user.id}`
      const stats = await requestCache.get(
        cacheKey,
        async () => {
          const response = await axios.get(`${API_URL}/api/v1/auth/usage-stats`)
          return response.data
        },
        30 * 60 * 1000
      )
      setUsageStats(stats)
    } catch (error) {
      setUsageStats({
        total_generations: 0,
        recent_generations: 0,
        rate_limit: user?.is_premium ? 20 : 2,
        remaining_requests: user?.is_premium ? 20 : 2,
        is_premium: user?.is_premium || false
      })
    }
  }, [isAuthenticated, user])

  const refreshUsageStats = useCallback(async () => {
    if (!isAuthenticated || !user) return
    setStatsLoading(true)
    try {
      const cacheKey = `usage-stats-${user.id}`
      requestCache.invalidate(cacheKey)
      await loadUsageStats()
    } finally {
      setStatsLoading(false)
    }
  }, [isAuthenticated, user, loadUsageStats])

  useEffect(() => {
    if (isProcessingPayment) return
    if (isAuthenticated && user) {
      const cacheKey = `usage-stats-${user.id}`
      const cachedStats = requestCache.getCached<UsageStats>(cacheKey)
      if (cachedStats) setUsageStats(cachedStats)
      loadUsageStats()
    }
  }, [isAuthenticated, user, loadUsageStats, isProcessingPayment])

  const isActive = (path: string) => {
    if (activeTab) return activeTab === path.substring(1) || (path === '/' && activeTab === 'home')
    return pathname === path
  }

  const handleNavigation = (path: string) => router.push(path)

  if (!isAuthenticated || !user) return null

  const resendVerification = async () => {
    try {
      const response = await axios.post(`${API_URL}/api/v1/auth/resend-verification`)
      if (response.data.success) toast.success('Verification email sent! Please check your inbox.')
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to resend verification email.')
    }
  }

  return (
    <>
      {!user.is_verified && (
        <div className="bg-gradient-to-r from-amber-500/90 to-orange-600/90 backdrop-blur-md text-white py-2 px-4 shadow-sm relative z-[60]">
          <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4 text-center sm:text-left">
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4" />
              <p className="text-xs sm:text-sm font-medium">
                Your email <span className="font-bold underline">{user.email}</span> is not verified yet.
              </p>
            </div>
            <button
              onClick={resendVerification}
              className="px-3 py-1 bg-white/20 hover:bg-white/30 rounded-lg text-xs font-bold transition-all border border-white/30 active:scale-95 whitespace-nowrap"
            >
              Resend Verification Code
            </button>
          </div>
        </div>
      )}
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled
          ? 'bg-white/80 dark:bg-slate-950/80 backdrop-blur-md border-b border-slate-200/50 dark:border-slate-800/50 shadow-sm py-3'
          : 'bg-transparent py-5'
          }`}
      >
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between">

            {/* Logo */}
            <Link href="/" className="flex items-center group">
              <div className="relative mr-3 w-14 h-14 bg-white/[0.03] rounded-2xl border border-white/10 flex items-center justify-center transition-all duration-500 group-hover:border-cyan-500/50 group-hover:glow-cyan group-hover:scale-110 overflow-hidden">
                <Image src="/logo.png" alt="Logo" width={56} height={56} className="w-full h-full object-contain" />
              </div>
              <span className="text-3xl font-display font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300">
                SkillVibe
              </span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center md:space-x-1 lg:space-x-2 xl:space-x-4 bg-slate-100/50 dark:bg-slate-900/50 p-1.5 rounded-full border border-slate-200/50 dark:border-slate-800/50 backdrop-blur-sm">
              {[
                { name: 'Repurpose', path: '/' },
                { name: 'Community', path: '/community', icon: <Users className="w-3.5 h-3.5 inline mr-1.5 mb-0.5" /> },
                { name: 'Pricing', path: '/pricing', highlight: !user?.is_premium }
              ].map((link) => (
                <button
                  key={link.path}
                  onClick={() => handleNavigation(link.path)}
                  className={`relative px-5 lg:px-8 xl:px-10 py-2.5 rounded-full text-sm font-medium transition-all duration-300 ${isActive(link.path)
                    ? 'text-primary bg-white dark:bg-slate-800 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-800/50'
                    }`}
                >
                  {link.icon}
                  {link.name}
                  {link.highlight && (
                    <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary/40 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary"></span>
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Right Actions */}
            <div className="flex items-center space-x-3 pl-3 border-l border-slate-200 dark:border-slate-800">
              {/* Usage Stats */}
              {!isLoading && (
                <button
                  onClick={refreshUsageStats}
                  disabled={statsLoading}
                  className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-secondary/50 hover:bg-secondary text-secondary-foreground rounded-full text-xs font-bold border border-border transition-all"
                  title="Click to refresh usage stats"
                >
                  <Sparkles className={`w-3.5 h-3.5 ${statsLoading ? 'animate-spin' : ''}`} />
                  <span>
                    {statsLoading ? '...' : user?.is_premium ? 'Unlimited' : usageStats ? `${usageStats.remaining_requests ?? (usageStats.rate_limit - usageStats.recent_generations)}/${usageStats.rate_limit} posts left` : '?'}
                  </span>
                </button>
              )}

              {/* Messages Badge */}
              <Link
                href="/messages"
                className="relative hidden md:flex items-center gap-2 px-3 py-1.5 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-500 rounded-full text-xs font-bold border border-cyan-500/20 transition-all"
                title="Go to messages"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span>
                  {totalUnreadCount > 0 ? (
                    <>
                      <span className="text-[10px] font-black tracking-wider">
                        {totalUnreadCount > 99 ? '99+' : totalUnreadCount}
                      </span>
                    </>
                  ) : (
                    'Messages'
                  )}
                </span>
                {totalUnreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4 w-full min-w-4">
                    <span className="animate-pulse inline-flex rounded-full h-4 w-4 bg-cyan-500" />
                  </span>
                )}
              </Link>

              <button
                onClick={logout}
                className="hidden md:flex items-center gap-2 px-3 py-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-full text-xs font-bold transition-all border border-transparent hover:border-red-200 dark:hover:border-red-500/20"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign out</span>
              </button>

              {/* User Avatar */}
              <div className="hidden md:block">
                <button
                  onClick={() => setShowDashboard(true)}
                  className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-violet-600 flex items-center justify-center text-white shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all hover:scale-105 border-2 border-white dark:border-slate-800 overflow-hidden relative"
                >
                  {user?.profile_picture && isValidImageUrl(user.profile_picture) ? (
                    <Image
                      src={user.profile_picture}
                      alt="Profile"
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <span className="font-bold text-sm">{user?.email?.charAt(0).toUpperCase() || 'U'}</span>
                  )}
                </button>
              </div>

              {/* Mobile Menu */}
              <div className="md:hidden">
                <MobileMenu
                  isAuthenticated={isAuthenticated}
                  user={user}
                  onDashboard={() => setShowDashboard(true)}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Dashboard Modal */}
        <DashboardModal
          isOpen={showDashboard}
          onClose={() => setShowDashboard(false)}
          externalUsageStats={usageStats}
        />
      </motion.nav>
    </>
  )
}