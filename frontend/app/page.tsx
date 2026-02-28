'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter as useNextRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Sparkles, Loader2, Zap, Target, Terminal } from 'lucide-react'
import axios from 'axios'
import toast from 'react-hot-toast'

import { useAuth } from '../contexts/AuthContext'
import { useSubscription } from '../contexts/SubscriptionContext'
import { useFeatureGate } from '../hooks/useFeatureGate'
import { useUserPreferences } from '../contexts/UserPreferencesContext'
import { usePaymentProcessing } from '../contexts/PaymentProcessingContext'
import { requestCache } from '@/lib/cache-util'
import { API_URL } from '@/lib/api-config'

// Components
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import AuthModal from '../components/AuthModal'
import PaymentModal from '../components/PaymentModal'
import CustomTemplateModal from '../components/CustomTemplateModal'
import TemplateSelector from '../components/TemplateSelector'
import DashboardModal from '../components/DashboardModal.jsx'
import SupportModal from '../components/SupportModal'
import SubscriptionWarning from '../components/SubscriptionWarning'

// New Landing Components
// New Landing Components
import HeroSection from '../components/landing/HeroSection'
import HowItWorks from '../components/landing/HowItWorks'
import Testimonials from '../components/landing/Testimonials'
import ResumeUpload from '../components/landing/ResumeUpload'

type TabType = 'home' | 'discover' | 'rankings' | 'pricing' | 'about'

function HomeContent() {
  const { user, isAuthenticated, isLoading: authLoading, forceRestoreAuth } = useAuth()
  const [activeMainTab, setActiveMainTab] = useState<TabType>('home')
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>('login')
  const [authModalRole, setAuthModalRole] = useState<'candidate' | 'recruiter' | undefined>(undefined)
  const [usageStats, setUsageStats] = useState<any>(null)
  const [showDashboard, setShowDashboard] = useState(false)
  const [showSupportModal, setShowSupportModal] = useState(false)

  const searchParams = useSearchParams()
  const nextRouter = useNextRouter()

  // Handle ?auth=login&role=recruiter URL params (redirected from portfolio page)
  useEffect(() => {
    const authParam = searchParams.get('auth')
    const roleParam = searchParams.get('role')
    if (authParam === 'login' || authParam === 'register') {
      setAuthModalMode(authParam)
      if (roleParam === 'recruiter' || roleParam === 'candidate') {
        setAuthModalRole(roleParam)
      }
      setShowAuthModal(true)
      // Clean the URL without triggering a navigation
      const url = new URL(window.location.href)
      url.searchParams.delete('auth')
      url.searchParams.delete('role')
      window.history.replaceState({}, '', url.toString())
    }
  }, [searchParams])

  // Handle ?payment=success URL params (redirect from Dodo Payments)
  useEffect(() => {
    const handlePaymentSuccess = async () => {
      const paymentParam = searchParams.get('payment')
      const paymentId = searchParams.get('payment_id')
      const subscriptionId = searchParams.get('subscription_id')
      
      if (paymentParam === 'success' && (paymentId || subscriptionId)) {
        try {
          let token = localStorage.getItem('access_token')
          
          // If no token, try to refresh first
          if (!token) {
            try {
              const refreshResponse = await axios.post(`${API_URL}/api/v1/auth/refresh`)
              token = refreshResponse.data.access_token
              if (token) {
                localStorage.setItem('access_token', token)
              }
            } catch (refreshError) {
              console.warn('Token refresh failed, attempting check-status without token')
            }
          }
          
          // Try to verify payment with backend
          const headers: any = {
            'Content-Type': 'application/json'
          }
          
          if (token) {
            headers['Authorization'] = `Bearer ${token}`
          }
          
          // Build request body with payment_id and/or subscription_id
          const requestBody: any = {}
          if (paymentId) requestBody.payment_id = paymentId
          if (subscriptionId) requestBody.subscription_id = subscriptionId
          
          const response = await axios.post(
            `${API_URL}/api/v1/payment/check-status`,
            requestBody,
            { headers }
          )
          
          if (response.data.success && response.data.is_premium) {
            toast.success('🎉 Payment successful! You are now premium!')
            await forceRestoreAuth() // Refresh auth context to update user status
          } else if (response.data.success) {
            toast.info('Payment received. Premium status pending...')
            await forceRestoreAuth() // Still refresh context even if pending
          } else if (!response.data.success) {
            // Payment pending - retry a few times
            let retries = 0
            const maxRetries = 4
            const retryInterval = 2000 // 2 seconds
            
            toast.loading('Activating premium access...')
            
            const retryCheck = async () => {
              retries++
              console.log(`Retry ${retries}/${maxRetries} checking payment status...`)
              
              try {
                const retryResponse = await axios.post(
                  `${API_URL}/api/v1/payment/check-status`,
                  requestBody,
                  { headers }
                )
                
                if (retryResponse.data.success && retryResponse.data.is_premium) {
                  toast.dismiss()
                  toast.success('🎉 Payment successful! You are now premium!')
                  await forceRestoreAuth()
                  return true
                } else if (retries < maxRetries) {
                  // Still pending, retry again
                  setTimeout(retryCheck, retryInterval)
                } else {
                  // Max retries reached
                  toast.dismiss()
                  toast.info('Payment is processing. You should be upgraded within a few minutes.')
                  await forceRestoreAuth() // Try refresh anyway
                }
              } catch (retryError) {
                if (retries < maxRetries) {
                  setTimeout(retryCheck, retryInterval)
                } else {
                  toast.dismiss()
                  toast.error('Payment processing took too long. Contact support if not upgraded soon.')
                }
              }
            }
            
            // Start retrying
            retryCheck()
          }
        } catch (error: any) {
          console.error('Payment verification error:', error)
          if (error.response?.status === 401) {
            toast.error('Session expired. Please log in again to activate premium.')
          } else {
            toast.error('Failed to verify payment. Please contact support.')
          }
        }
        
        // Clean the URL without triggering a navigation
        const url = new URL(window.location.href)
        url.searchParams.delete('payment')
        url.searchParams.delete('payment_id')
        url.searchParams.delete('user_id')
        url.searchParams.delete('subscription_id')
        url.searchParams.delete('status')
        url.searchParams.delete('email')
        window.history.replaceState({}, '', url.toString())
      }
    }
    
    if (searchParams.get('payment') === 'success') {
      handlePaymentSuccess()
    }
  }, [searchParams, forceRestoreAuth])

  // Auth success listener
  useEffect(() => {
    const handleAuthSuccess = () => forceRestoreAuth()
    window.addEventListener('auth-success', handleAuthSuccess)
    return () => window.removeEventListener('auth-success', handleAuthSuccess)
  }, [forceRestoreAuth])

  // Load usage stats
  useEffect(() => {
    const fetchStats = async () => {
      if (isAuthenticated && user?.id) {
        try {
          const stats = await requestCache.get(
            `usage-stats-${user.id}`,
            async () => {
              const res = await axios.get(`${API_URL}/api/v1/auth/usage-stats`)
              return res.data
            },
            60 * 1000
          )
          setUsageStats(stats)
        } catch (err) {
          console.error(err)
        }
      }
    }
    fetchStats()
  }, [isAuthenticated, user?.id])

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black selection:bg-cyan-500/30 selection:text-cyan-900 dark:selection:text-cyan-100 font-sans relative overflow-hidden">
      <Navbar
        isAuthenticated={isAuthenticated}
        user={user}
        usageStats={usageStats}
        activeMainTab={activeMainTab}
        onSignIn={() => { setShowAuthModal(true); setAuthModalMode('login') }}
        onSignUp={() => { setShowAuthModal(true); setAuthModalMode('register') }}
        onUserDashboard={() => setShowDashboard(true)}
        onTabChange={(tab) => setActiveMainTab(tab as TabType)}
      />

      <main className="pt-24 pb-20 relative">
        {activeMainTab === 'home' && (
          <div className="animate-fade-in">
            <HeroSection
              isAuthenticated={isAuthenticated}
              user={user}
              onStartCreating={() => document.getElementById('discovery-mission')?.scrollIntoView({ behavior: 'smooth' })}
              onSignIn={() => { setShowAuthModal(true); setAuthModalMode('login') }}
              onSignUp={() => { setShowAuthModal(true); setAuthModalMode('register') }}
            />

            <div id="discovery-mission" className="container mx-auto px-6 py-32 relative overflow-hidden">
              {/* Decorative elements */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[1px] bg-gradient-to-r from-transparent via-cyan-500/20 to-transparent" />

              {isAuthenticated && user?.role === 'recruiter' ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  className="max-w-5xl mx-auto p-16 md:p-24 glass-card rounded-[4rem] border border-white/10 shadow-4xl text-center relative overflow-hidden group"
                >
                  <div className="absolute inset-0 bg-cyber-grid opacity-10 pointer-events-none" />
                  <div className="absolute top-0 right-0 p-10 opacity-5 scale-150 rotate-12">
                    <Target className="w-64 h-64 text-cyan-500" />
                  </div>

                  <div className="relative z-10">
                    <div className="inline-flex items-center gap-3 px-5 py-2 glass-panel border border-cyan-500/30 rounded-xl text-cyan-500 text-[10px] font-black uppercase tracking-[0.4em] mb-10 glow-cyan">
                      <Terminal className="w-4 h-4" />
                      RECRUITER DASHBOARD
                    </div>

                    <h2 className="text-5xl md:text-8xl font-black mb-8 uppercase italic tracking-tighter text-white leading-[0.85]">
                      FIND <span className="text-gradient-cyan">TALENT.</span>
                    </h2>
                    <p className="text-slate-500 mb-16 font-bold text-xl uppercase tracking-tight max-w-2xl mx-auto opacity-70">
                      Your talent pipeline is ready. <br /> Browse top candidates or view the full leaderboard.
                    </p>

                    <div className="flex flex-wrap justify-center gap-6">
                      <Link
                        href="/recruiter"
                        className="px-12 py-6 bg-cyan-500 text-black font-black rounded-2xl shadow-2xl hover:scale-105 transition-all uppercase tracking-[0.3em] text-xs hover:glow-cyan italic"
                      >
                        FIND CANDIDATES
                      </Link>
                      <Link
                        href="/leaderboard"
                        className="px-12 py-6 glass-panel text-white font-black rounded-2xl border border-white/10 shadow-2xl hover:scale-105 transition-all uppercase tracking-[0.3em] text-xs hover:bg-white/5 italic"
                      >
                        VIEW LEADERBOARD
                      </Link>
                    </div>
                  </div>
                </motion.div>
              ) : (
                <div id="resume-upload" className="animate-fade-in">
                  <ResumeUpload
                    onSuccess={(slug) => window.location.href = `/profile/${slug}`}
                    isAuthenticated={isAuthenticated}
                    onRequireAuth={() => { setShowAuthModal(true); setAuthModalMode('register') }}
                  />
                </div>
              )}
            </div>

            <HowItWorks />
            <Testimonials />
          </div>
        )}

        {activeMainTab !== 'home' && (
          <div className="container mx-auto px-4 py-20 text-center">
            <h2 className="text-3xl font-bold mb-4">Coming Soon</h2>
            <p className="text-muted-foreground">This section is being updated with our new design.</p>
          </div>
        )}
      </main>

      <Footer onSupportClick={() => setShowSupportModal(true)} />

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        initialMode={authModalMode}
        defaultRole={authModalRole}
      />

      <DashboardModal
        isOpen={showDashboard}
        onClose={() => setShowDashboard(false)}
        externalUsageStats={usageStats}
      />

      <SupportModal
        isOpen={showSupportModal}
        onClose={() => setShowSupportModal(false)}
      />
    </div>
  )
}

export default function Home() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen bg-slate-50 dark:bg-black">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    }>
      <HomeContent />
    </Suspense>
  )
}
