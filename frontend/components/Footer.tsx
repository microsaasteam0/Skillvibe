'use client'

import { useState } from 'react'
import { Sparkles, Heart, ChevronDown, Mail, Instagram, Linkedin, MessageSquare, ExternalLink, Globe, Twitter, Rocket, Zap, Target, ShieldCheck } from 'lucide-react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import Image from 'next/image'
import toast from 'react-hot-toast'
import { useAuth } from '../contexts/AuthContext'

interface FooterProps {
  onSupportClick?: () => void
}

export default function Footer({ onSupportClick }: FooterProps) {
  const { user, isAuthenticated } = useAuth()
  const [newsletterEmail, setNewsletterEmail] = useState('')
  const [isSubscribing, setIsSubscribing] = useState(false)

  const handleNewsletterSubscribe = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newsletterEmail.trim()) {
      toast.error('Please enter your email')
      return
    }
    setIsSubscribing(true)
    try {
      const substackUrl = `https://entrextlabs.substack.com/subscribe?email=${encodeURIComponent(newsletterEmail)}`
      toast.success('Establishing connection...')
      setTimeout(() => {
        window.open(substackUrl, '_blank')
        setNewsletterEmail('')
      }, 1000)
    } finally {
      setIsSubscribing(false)
    }
  }

  const isRecruiter = user?.role === 'recruiter'

  const sections = [
    {
      title: 'Links',
      links: [
        { name: 'Home', href: '/', external: false },
        { name: 'Rankings', href: '/leaderboard', external: false },
        ...(isAuthenticated ? [
          { name: isRecruiter ? 'Find Talent' : 'My Profile', href: isRecruiter ? '/recruiter' : '/profile', external: false }
        ] : []),
        { name: 'Pricing', href: '/pricing', external: false },
      ]
    },
    {
      title: 'Company',
      links: [
        { name: 'About Us', href: '/about', external: false },
        { name: 'Entrext Labs', href: 'https://www.entrext.com/', external: true },
        { name: 'Join Us', href: 'https://deformity.ai/d/C-P5znqtG_ZZ', external: true },
      ]
    },
    {
      title: 'Legal',
      links: [
        { name: 'Privacy', href: '/privacy-policy', external: false },
        { name: 'Terms', href: '/terms-of-service', external: false },
        { name: 'Cookies', href: '/cookie-policy', external: false },
      ]
    }
  ]

  const socialLinks = [
    { name: 'Discord', href: 'https://discord.com/invite/ZZx3cBrx2', icon: <MessageSquare className="w-5 h-5" /> },
    { name: 'Global', href: 'https://linktr.ee/entrext.in', icon: <Globe className="w-5 h-5" /> },
    { name: 'LinkedIn', href: 'https://www.linkedin.com/company/entrext/posts/?feedView=all', icon: <Linkedin className="w-5 h-5" /> },
    { name: 'Instagram', href: 'https://www.instagram.com/entrext.labs/', icon: <Instagram className="w-5 h-5" /> },
  ]

  return (
    <footer className="bg-background border-t border-white/5 mt-32 relative overflow-hidden" aria-label="SkillVibe Footer">
      {/* Background Decor */}
      <div className="absolute inset-0 bg-cyber-grid opacity-10 pointer-events-none" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[600px] bg-gradient-to-b from-cyan-500/5 to-transparent pointer-events-none" />

      <div className="container mx-auto px-6 py-20 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 xl:gap-24">

          {/* Core Identity */}
          <div className="lg:col-span-5 flex flex-col justify-between">
            <div className="space-y-10">
              <Link href="/" className="flex items-center group gap-4 w-fit">
                <div className="relative w-14 h-14 bg-black rounded-2xl border border-white/10 flex items-center justify-center p-2 group-hover:glow-cyan group-hover:scale-110 transition-all duration-500">
                  <Image src="/logo.png" alt="Logo" width={40} height={40} className="w-full h-full object-contain filter dark:invert-0 invert" />
                </div>
                <span className="text-3xl font-black tracking-tighter text-slate-900 dark:text-white uppercase italic">
                  SKILL<span className="text-cyan-500">VIBE</span>
                </span>
              </Link>

              <p className="text-slate-500 dark:text-slate-500 text-xl font-bold tracking-tight max-w-sm leading-relaxed">
                The easiest <span className="text-cyan-500">Trust System</span> for the world's best workers.
              </p>

              <div className="flex items-center gap-4">
                {socialLinks.map((social) => (
                  <motion.a
                    key={social.name}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    whileHover={{ scale: 1.1, y: -5 }}
                    className="w-12 h-12 glass-panel border border-white/10 rounded-xl flex items-center justify-center text-slate-600 dark:text-slate-400 hover:text-cyan-500 hover:border-cyan-500/50 transition-colors"
                  >
                    {social.icon}
                  </motion.a>
                ))}
              </div>
            </div>

            <div className="mt-16 lg:mt-24 p-8 glass-card rounded-card border border-white/10 glow-cyan relative group">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-10 h-10 bg-cyan-500/10 rounded-xl flex items-center justify-center text-cyan-500">
                  <Zap className="w-6 h-6" />
                </div>
                <span className="text-xs font-black uppercase tracking-[0.2em] text-slate-800 dark:text-white italic">GET UPDATES</span>
              </div>
              <form onSubmit={handleNewsletterSubscribe} className="flex gap-2">
                <input
                  type="email"
                  placeholder="name@email.com"
                  className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-xs font-mono tracking-widest outline-none focus:border-cyan-500/50 transition-colors"
                  value={newsletterEmail}
                  onChange={(e) => setNewsletterEmail(e.target.value)}
                />
                <button className="bg-cyan-500 text-black px-6 rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all">
                  Join
                </button>
              </form>
            </div>
          </div>

          {/* Links */}
          <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-3 gap-12 pt-8">
            {sections.map((section) => (
              <div key={section.title}>
                <h3 className="text-[10px] font-black tracking-[0.4em] text-slate-400 dark:text-slate-600 mb-10 flex items-center gap-3">
                  <div className="w-6 h-px bg-slate-600/30" />
                  {section.title}
                </h3>
                <ul className="space-y-6">
                  {section.links.map((link) => (
                    <li key={link.name}>
                      <Link
                        href={link.href}
                        target={link.external ? "_blank" : "_self"}
                        className="text-[13px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-400 hover:text-cyan-500 transition-all flex items-center gap-3 group"
                      >
                        <div className="w-1.5 h-1.5 rounded-full bg-cyan-500/0 group-hover:bg-cyan-500 transition-all" />
                        {link.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

        </div>

        {/* Bottom */}
        <div className="mt-32 pt-10 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-10">
          <div className="flex flex-col md:flex-row items-center gap-6">
            <span className="text-[10px] font-black tracking-[0.3em] text-slate-600 uppercase">
              © 2026 SKILLVIBE
            </span>
            <div className="hidden md:block w-px h-4 bg-white/10" />
            <div className="flex items-center gap-4 text-[10px] font-black tracking-[0.3em] text-slate-600 uppercase">
              <ShieldCheck className="w-4 h-4 text-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
              100% SECURE
            </div>
          </div>

          <a href="https://entrext.in" target="_blank" className="flex items-center gap-3 glass-panel px-6 py-3 rounded-xl border border-white/10 group hover:glow-cyan transition-all">
            <span className="text-[10px] font-black tracking-[0.3em] text-slate-500 uppercase">Architected by</span>
            <span className="text-[11px] font-black text-slate-800 dark:text-white uppercase transition-colors group-hover:text-cyan-500">Entrext Labs</span>
            <Target className="w-4 h-4 text-cyan-500 animate-pulse" />
          </a>
        </div>
      </div>
    </footer>
  )
}
