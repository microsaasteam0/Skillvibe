'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Menu, X, Crown, Users, Home, Zap, Sparkles, MessageSquare, Info, LayoutDashboard, LogOut, Rocket, Trophy, Briefcase } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'

interface MobileMenuProps {
  isAuthenticated: boolean
  user?: any
  onSignIn?: () => void
  onSignUp?: () => void
  onDashboard?: () => void
  onTabChange?: (tab: string) => void
  usageStats?: any
}

export default function MobileMenu({
  isAuthenticated: propIsAuthenticated,
  user: propUser,
  onSignIn,
  onSignUp,
  onDashboard,
  onTabChange,
  usageStats
}: MobileMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const { logout, user: authUser, isAuthenticated: authIsAuthenticated } = useAuth()

  const user = propUser !== undefined ? propUser : authUser
  const isAuthenticated = propIsAuthenticated !== undefined ? propIsAuthenticated : authIsAuthenticated

  const pathname = usePathname()

  const closeMenu = () => setIsOpen(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Block scrolling when menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  // Close on route change
  useEffect(() => {
    closeMenu()
  }, [pathname])

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

  const isRecruiter = user?.role === 'recruiter'

  const allLinks = [
    { name: 'Home', href: '/', icon: isAuthenticated ? Zap : Home },
    ...(isAuthenticated ? [
      { name: isRecruiter ? 'Find Talent' : 'My Profile', href: isRecruiter ? '/recruiter' : '/profile', icon: isRecruiter ? Users : Sparkles },
      ...(isRecruiter ? [{ name: 'Job Posts', href: '/recruiter/jobs', icon: Briefcase }] : []),
    ] : []),
    { name: 'Jobs', href: '/jobs', icon: Briefcase },
    { name: 'Rankings', href: '/leaderboard', icon: Trophy },
    { name: 'Pricing', href: '/pricing', icon: Crown },
    { name: 'About Us', href: '/about', icon: Info, marketingOnly: true },
  ]

  const navLinks = allLinks.filter(link => {
    if (isAuthenticated) return !link.marketingOnly
    return true
  })

  const matchesPath = (href: string) => {
    if (href === '/') return pathname === '/'
    return pathname === href || pathname.startsWith(`${href}/`)
  }
  const activeHref = navLinks
    .map(link => link.href)
    .filter(matchesPath)
    .sort((a, b) => b.length - a.length)[0]

  const menuContent = (
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 flex justify-end"
          style={{ zIndex: 99999 }}
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={closeMenu}
          />

          {/* Slide-in Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 220 }}
            className="relative w-[85vw] max-w-[320px] h-full flex flex-col overflow-hidden"
            style={{ zIndex: 100000 }}
          >
            {/* Panel background */}
            <div className="absolute inset-0 bg-zinc-50 dark:bg-slate-950 border-l border-zinc-200 dark:border-slate-800" />

            {/* Content wrapper */}
            <div className="relative flex flex-col h-full overflow-y-auto">

              {/* ── Header ── */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-200 dark:border-slate-800 bg-zinc-50/95 dark:bg-slate-950/95 backdrop-blur sticky top-0 z-10">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-white dark:bg-slate-900 rounded-xl flex items-center justify-center p-1.5 border border-zinc-200 dark:border-slate-800 shadow-sm">
                    <Image src="/logo.png" alt="BuildInPublic" width={28} height={28} className="w-full h-full object-contain" />
                  </div>
                  <span className="text-base font-black tracking-tighter text-slate-900 dark:text-white uppercase italic">
                    Skill<span className="text-cyan-500">Vibe</span>
                  </span>
                </div>
                <button
                  onClick={closeMenu}
                  className="w-8 h-8 flex items-center justify-center rounded-xl bg-zinc-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-zinc-200 dark:hover:bg-slate-700 transition-all active:scale-95 border border-zinc-200 dark:border-slate-700/50"
                  aria-label="Close menu"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* ── User Info (authenticated) ── */}
              {isAuthenticated && user && (
                <div className="px-5 py-4 border-b border-zinc-200 dark:border-slate-800 bg-zinc-100/50 dark:bg-slate-900/50">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-11 h-11 rounded-2xl bg-indigo-600 flex items-center justify-center relative overflow-hidden ring-2 ring-indigo-500/20 flex-shrink-0">
                      {user.profile_picture && isValidImageUrl(user.profile_picture) ? (
                        <Image
                          src={user.profile_picture}
                          alt="Profile"
                          fill
                          sizes="44px"
                          className="object-cover"
                        />
                      ) : (
                        <span className="font-black text-base text-white font-mono">
                          {user.email?.charAt(0).toUpperCase() || 'U'}
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-black text-sm text-slate-900 dark:text-white truncate tracking-tight">
                        {user.username || 'User'}
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate font-mono">
                        {user.email}
                      </p>
                      {user.is_premium && (
                        <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 bg-amber-500/10 border border-amber-500/20 rounded-full text-[9px] font-black text-amber-600 dark:text-amber-400 tracking-widest uppercase">
                          <Crown className="w-2.5 h-2.5" /> Pro
                        </span>
                      )}
                      {usageStats?.leaderboard_rank && user?.role !== 'recruiter' && (
                        <span className="inline-flex items-center gap-1 mt-1 ml-1 px-2 py-0.5 bg-indigo-500/10 border border-indigo-500/20 rounded-full text-[9px] font-black text-indigo-600 dark:text-indigo-400 tracking-widest uppercase">
                          <Trophy className="w-2.5 h-2.5" /> {usageStats.leaderboard_rank.startsWith('#') ? 'Rank: ' : ''}{usageStats.leaderboard_rank}
                        </span>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => { onDashboard?.(); closeMenu(); }}
                    className="w-full py-2.5 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-500 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 border border-cyan-500/20 tracking-widest uppercase italic"
                  >
                    <LayoutDashboard className="w-3.5 h-3.5" /> MY ACCOUNT
                  </button>
                </div>
              )}

              {/* ── Navigation Links ── */}
              <nav className="flex-1 px-4 py-4 space-y-1">
                {navLinks.map((link) => {
                  const Icon = link.icon
                  const active = activeHref === link.href
                  return (
                    <Link
                      key={link.name}
                      href={link.href}
                      onClick={closeMenu}
                      className={`flex items-center gap-3.5 px-4 py-3.5 rounded-2xl transition-all font-black text-sm tracking-[0.1em] uppercase italic ${active
                        ? 'bg-cyan-500/10 text-cyan-500 border border-cyan-500/20 glow-cyan'
                        : 'text-slate-500 dark:text-slate-400 hover:bg-white/5 hover:text-white border border-transparent'
                        }`}
                    >
                      <Icon className={`w-4.5 h-4.5 flex-shrink-0 ${active ? 'text-cyan-500' : 'opacity-60'}`} />
                      <span>{link.name}</span>
                      {link.href === '/pricing' && isAuthenticated && !user?.is_premium && (
                        <span className="ml-auto flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-cyan-400 opacity-75" />
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500" />
                        </span>
                      )}
                    </Link>
                  )
                })}
              </nav>

              {/* ── Footer Actions ── */}
              <div className="px-5 py-5 border-t border-zinc-200 dark:border-slate-800 bg-zinc-50/80 dark:bg-slate-950/80">
                {isAuthenticated ? (
                  <button
                    onClick={() => { logout(); closeMenu(); }}
                    className="w-full px-4 py-3 rounded-2xl bg-red-500/10 text-red-500 font-black text-xs tracking-widest hover:bg-red-500/20 transition-all flex items-center justify-center gap-2 border border-red-500/20 uppercase italic"
                  >
                    <LogOut className="w-4 h-4" /> LOG OUT
                  </button>
                ) : (
                  <div className="space-y-3">
                    <button
                      onClick={() => { onSignUp?.(); closeMenu(); }}
                      className="w-full px-4 py-3.5 rounded-2xl bg-cyan-500 hover:bg-cyan-600 text-black font-black text-xs tracking-widest transition-all shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/40 hover:-translate-y-0.5 active:scale-95 uppercase italic"
                    >
                      JOIN NOW
                    </button>
                    <button
                      onClick={() => { onSignIn?.(); closeMenu(); }}
                      className="w-full px-4 py-3.5 rounded-2xl bg-white/5 text-white font-black text-xs tracking-widest hover:bg-white/10 transition-all border border-white/10 uppercase italic"
                    >
                      LOG IN
                    </button>
                  </div>
                )}

                <p className="mt-5 text-center text-[10px] text-slate-400 dark:text-slate-600 font-mono">
                  © 2026 SkillVibe · Entrext Labs
                </p>
              </div>

            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )

  return (
    <>
      {/* Hamburger Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="w-10 h-10 flex items-center justify-center rounded-2xl bg-zinc-100 dark:bg-slate-800/80 hover:bg-zinc-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 shadow-sm border border-zinc-200 dark:border-slate-700 active:scale-95 transition-all"
        aria-label="Open menu"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Portal-rendered menu (outside navbar stacking context) */}
      {mounted && createPortal(menuContent, document.body)}
    </>
  )
}
