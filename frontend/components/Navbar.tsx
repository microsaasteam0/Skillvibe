'use client'

import { Sparkles, Users, Crown, Menu, X, Rocket, Zap, LogIn, LogOut, Trophy, Terminal } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import MobileMenu from './MobileMenu'
import { motion, AnimatePresence } from 'framer-motion'
import axios from 'axios'
import { API_URL } from '@/lib/api-config'
import { requestCache } from '@/lib/cache-util'
import { useAuth } from '../contexts/AuthContext'

interface NavbarProps {
  showAuthButtons?: boolean
  isAuthenticated?: boolean
  user?: any
  usageStats?: any
  activeMainTab?: string
  onSignIn?: () => void
  onSignUp?: () => void
  onUserDashboard?: () => void
  onCommunityClick?: () => void
  onTabChange?: (tab: string) => void
}

export default function Navbar({
  showAuthButtons = true,
  isAuthenticated: propIsAuthenticated,
  user: propUser,
  usageStats = null,
  activeMainTab = 'home',
  onSignIn,
  onSignUp,
  onUserDashboard,
  onTabChange
}: NavbarProps) {
  const { logout, user: authUser, isAuthenticated: authIsAuthenticated, token } = useAuth()

  const user = propUser !== undefined ? propUser : authUser
  const isAuthenticated = propIsAuthenticated !== undefined ? propIsAuthenticated : authIsAuthenticated

  const pathname = usePathname()
  const [scrolled, setScrolled] = useState(false)
  const [internalUsageStats, setInternalUsageStats] = useState<any>(null)

  const displayUsageStats = usageStats || internalUsageStats

  useEffect(() => {
    console.log("📈 Display Usage Stats Updated:", displayUsageStats)
  }, [displayUsageStats])

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    const fetchStats = async () => {
      if (isAuthenticated && !usageStats && user?.id && token) {
        try {
          console.log("📊 Fetching navbar usage stats for user:", user.id, "Token available:", !!token)
          const stats = await requestCache.get(
            `usage-stats-${user.id}`,
            async () => {
              const res = await axios.get(`${API_URL}/api/v1/auth/usage-stats`, {
                timeout: 15000,
                withCredentials: true,
                headers: {
                  'Authorization': `Bearer ${token}`
                }
              })
              console.log("✅ Stats fetched successfully:", res.data)
              return res.data
            },
            60 * 1000
          )
          setInternalUsageStats(stats)
        } catch (err) {
          console.error("❌ Error fetching navbar stats:", err)
        }
      } else {
        console.log("⏭️ Skipping stats fetch - Auth:", isAuthenticated, "UsageStats:", usageStats, "UserId:", user?.id, "Token:", !!token)
      }
    }
    fetchStats()
  }, [isAuthenticated, usageStats, user?.id, token])

  const isRecruiter = user?.role === 'recruiter'

  const getCompanySlug = () => {
    if (!user?.company_info) return user?.id?.toString() || 'company'
    const slug = user.company_info
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
    return slug || user?.id?.toString() || 'company'
  }

  const navLinks = [
    { name: 'Home', href: '/', show: true },
    { name: 'Rankings', href: '/leaderboard', show: true },
    { name: 'Jobs', href: '/jobs', show: !isRecruiter },
    { name: isRecruiter ? 'Find Talent' : 'My Profile', href: isRecruiter ? '/recruiter' : '/profile', show: isAuthenticated },
    { name: 'Job Posts', href: '/recruiter/jobs', show: isAuthenticated && isRecruiter },
    { name: 'Vibe Protocol', href: '/vibe-trust', show: true },
    { name: 'Pricing', href: '/pricing', show: true },
  ]

  const handleSignIn = () => {
    if (onSignIn) onSignIn()
    else window.location.href = '/?auth=login'
  }

  const handleSignUp = () => {
    if (onSignUp) onSignUp()
    else window.location.href = '/?auth=register'
  }

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

  const visibleLinks = navLinks.filter(link => link.show)
  const matchesPath = (href: string) => {
    if (href === '/') return pathname === '/'
    return pathname === href || pathname.startsWith(`${href}/`)
  }
  const activeHref = visibleLinks
    .map(link => link.href)
    .filter(matchesPath)
    .sort((a, b) => b.length - a.length)[0]

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className={`fixed top-0 left-0 right-0 z-[100] transition-all duration-500 ${scrolled
        ? 'py-3 sm:py-4 px-4'
        : 'py-6 sm:py-8 px-4'
        }`}
    >
      <div className={`max-w-7xl mx-auto transition-all duration-500 ${scrolled ? 'glass-card border border-white/10 rounded-2xl glow-cyan' : ''}`}>
        <div className={`flex items-center justify-between gap-4 px-4 sm:px-6 py-2`}>

          {/* Logo */}
          <Link href="/" className="flex items-center group gap-3 flex-shrink-0">
            <div className="relative mr-3 w-12 h-12 bg-white/[0.03] rounded-xl border border-white/10 flex items-center justify-center transition-all duration-500 group-hover:border-cyan-500/40 group-hover:scale-105 overflow-hidden">
              <Image
                src="/logo.png"
                alt="SkillVibe Logo"
                width={48}
                height={48}
                className="w-full h-full object-contain"
              />
            </div>
            <span className="text-xl sm:text-2xl font-black tracking-tighter text-slate-900 dark:text-white uppercase italic">
              SKILL<span className="text-cyan-500">VIBE</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            {visibleLinks.map((link) => {
              const isActive = activeHref === link.href
              return (
                <Link
                  key={link.name}
                  href={link.href}
                  className={`px-5 py-2 rounded-xl text-[11px] font-black uppercase tracking-[0.15em] transition-all duration-300 ${isActive
                    ? 'text-cyan-500 bg-cyan-500/10 border border-cyan-500/20'
                    : 'text-slate-600 dark:text-zinc-400 hover:text-cyan-400 hover:bg-black/5 dark:hover:bg-white/5'
                    }`}
                >
                  {link.name}
                </Link>
              )
            })}
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <div className="flex items-center gap-4">
                {displayUsageStats?.leaderboard_rank && user?.role !== 'recruiter' && (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="hidden lg:flex items-center px-4 py-2 glass-panel rounded-xl border border-cyan-500/30 glow-cyan"
                  >
                    <Trophy className="w-4 h-4 mr-2 text-cyan-500" />
                    <span className="text-[10px] font-black text-cyan-500 tracking-[0.2em] font-mono uppercase">
                      {displayUsageStats.leaderboard_rank.startsWith('#') ? 'RANK : ' : ''}{displayUsageStats.leaderboard_rank}
                    </span>
                  </motion.div>
                )}

                {displayUsageStats?.resume_upload_count !== undefined && user?.role !== 'recruiter' && (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="hidden lg:flex items-center px-4 py-2 glass-panel rounded-xl border border-amber-500/30"
                  >
                    <span className="text-[10px] font-black text-amber-400 tracking-[0.2em] font-mono uppercase">
                      📄 {displayUsageStats.resume_upload_count} / {displayUsageStats.resume_upload_limit}
                    </span>
                  </motion.div>
                )}

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={onUserDashboard}
                  className="w-10 h-10 rounded-xl bg-cyan-500 flex items-center justify-center text-black shadow-[0_0_20px_rgba(6,182,212,0.4)] border-2 border-white/20 relative overflow-hidden group/avatar"
                >
                  {user?.profile_picture && isValidImageUrl(user.profile_picture) ? (
                    <Image
                      src={user.profile_picture}
                      alt="Profile"
                      fill
                      sizes="40px"
                      className="object-cover group-hover/avatar:scale-110 transition-transform duration-500"
                    />
                  ) : (
                    <span className="font-black text-xs font-mono">
                      {user?.email?.charAt(0).toUpperCase() || 'U'}
                    </span>
                  )}
                </motion.button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <button
                  onClick={handleSignIn}
                  className="hidden sm:block text-[11px] font-black text-slate-500 hover:text-cyan-500 transition-colors uppercase tracking-widest font-mono"
                >
                  Log in
                </button>
                <button
                  onClick={handleSignUp}
                  className="group relative px-6 py-3 bg-cyan-500 text-black text-[11px] font-black rounded-xl shadow-[0_0_20px_rgba(6,182,212,0.3)] hover:scale-105 active:scale-95 transition-all uppercase tracking-widest font-mono"
                >
                  Join Now
                </button>
              </div>
            )}

            {/* Mobile Menu Button */}
            <div className="md:hidden">
              <MobileMenu
                isAuthenticated={isAuthenticated}
                user={user}
                onSignIn={handleSignIn}
                onSignUp={handleSignUp}
                onDashboard={onUserDashboard}
                onTabChange={onTabChange}
                usageStats={displayUsageStats}
              />
            </div>
          </div>
        </div>
      </div>
    </motion.nav>
  )
}
