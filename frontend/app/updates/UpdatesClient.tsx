'use client'

import { useState } from 'react'
import { CheckCircle, Clock, FileText, Zap, TrendingUp, Settings, Plus, Crown, Shield, Users, Star, ArrowRight, MessageSquare, Sparkles, Mail, Send } from 'lucide-react'
import { AuthProvider, useAuth } from '../../contexts/AuthContext'
import { ThemeProvider } from '../../contexts/ThemeContext'
import { UserPreferencesProvider } from '../../contexts/UserPreferencesContext'
import Navbar from '../../components/Navbar'
import AuthModal from '../../components/AuthModal'
import DashboardModal from '../../components/DashboardModal.jsx'
import Footer from '../../components/Footer'
import { motion } from 'framer-motion'

function UpdatesContent() {
  const { user, isAuthenticated } = useAuth()
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>('login')
  const [showDashboard, setShowDashboard] = useState(false)

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  }

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-black selection:bg-indigo-500/30 font-sans">

      {/* Innovative 'Builder' Background */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute inset-0 bg-grid-blueprint-light opacity-30 dark:opacity-10" />
        <div className="absolute top-[20%] right-[-5%] w-[40%] h-[40%] bg-indigo-500/5 rounded-full blur-[100px] animate-pulse-slow" />
        <div className="absolute bottom-[10%] left-[-5%] w-[40%] h-[40%] bg-purple-500/5 rounded-full blur-[100px] animate-pulse-slow delay-1000" />

        {/* Dynamic Scanline */}
        <div className="absolute inset-0 overflow-hidden opacity-10">
          <div className="w-full h-1 bg-indigo-500 animate-scanline" />
        </div>
      </div>

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        initialMode={authModalMode}
      />

      <Navbar
        isAuthenticated={isAuthenticated}
        user={user}
        onSignIn={() => { setShowAuthModal(true); setAuthModalMode('login') }}
        onSignUp={() => { setShowAuthModal(true); setAuthModalMode('register') }}
        onUserDashboard={() => setShowDashboard(true)}
      />

      <main className="relative z-10 pt-28 pb-24 max-w-5xl mx-auto px-6">

        {/* Header */}
        <div className="text-center mb-20 space-y-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="inline-flex items-center px-4 py-1.5 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 text-xs font-black uppercase tracking-[0.3em] font-mono shadow-sm"
          >
            <Clock className="w-4 h-4 mr-2" />
            PLATFORM_LOG.STABLE
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-5xl md:text-7xl font-display font-black text-slate-900 dark:text-white"
          >
            SkillVibe <span className="text-gradient">Update Log</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto"
          >
            Follow our progress as we improve Elite Rating accuracy, add verification features, and fine‑tune platform performance.
          </motion.p>
        </div>

        {/* Timeline Section */}
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="space-y-12 mb-32"
        >
          {[
            {
              version: 'v2.0.0',
              date: 'February 14, 2026',
              title: 'Elite Rating Algorithm Upgrade',
              tag: 'Latest',
              items: [
                'Refined AI scoring with additional career metrics',
                'Reduced false positives on buzzword-heavy resumes',
                'Improved performance for large batch verifications',
              ],
              color: 'indigo'
            },
            {
              version: 'v1.9.0',
              date: 'December 30, 2025',
              title: 'Verification Workflow Streamlining',
              items: [
                'Simplified signup path for candidates',
                'Added recruiter dashboard overview',
                'Implemented webhook notifications for completed reviews',
              ],
              color: 'emerald'
            },
            {
              version: 'v1.8.0',
              date: 'November 15, 2025',
              title: 'UI & Accessibility Improvements',
              items: [
                'Updated dark mode contrast ratios',
                'Added keyboard navigation shortcuts',
                'Enhanced mobile responsiveness across pages',
              ],
              color: 'purple'
            }
          ].map((update, idx) => (
            <motion.div key={idx} variants={item} className="relative pl-10 md:pl-0 group">
              {/* Timeline Line */}
              <div className="absolute left-4 md:left-1/2 top-0 bottom-0 w-px bg-slate-200 dark:bg-slate-800 -translate-x-1/2" />

              <div className={`flex flex-col md:flex-row items-center gap-8 ${idx % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'}`}>
                <div className="flex-1 w-full md:w-auto">
                  <div className={`glass-card p-8 rounded-[2.5rem] border-l-4 border-l-${update.color}-500 hover:shadow-2xl transition-all relative overflow-hidden group-hover:-translate-y-2 duration-500`}>

                    {/* Horizontal Scanline on update card */}
                    <div className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-5 transition-opacity">
                      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-indigo-500 to-transparent h-[50%] animate-scanline" />
                    </div>

                    <div className="flex items-center justify-between mb-4">
                      <span className={`text-[10px] font-black uppercase tracking-widest text-${update.color}-500 bg-${update.color}-500/10 px-3 py-1 rounded-full border border-${update.color}-500/20`}>
                        {update.version}
                      </span>
                      <span className="text-sm font-mono text-slate-500 whitespace-nowrap">{update.date}</span>
                    </div>
                    <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-4 group-hover:text-indigo-500 transition-colors tracking-tight">
                      {update.title}
                    </h3>
                    <ul className="space-y-3">
                      {update.items.map((li, i) => (
                        <li key={i} className="flex items-start gap-3 text-sm text-slate-600 dark:text-slate-400 font-medium leading-relaxed">
                          <CheckCircle className={`w-4 h-4 text-${update.color}-500 mt-0.5 flex-shrink-0`} />
                          {li}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Timeline Node */}
                <div className="absolute left-4 md:left-1/2 w-8 h-8 rounded-full bg-white dark:bg-slate-900 border-4 border-slate-200 dark:border-slate-800 -translate-x-1/2 z-10 flex items-center justify-center">
                  <div className={`w-2.5 h-2.5 rounded-full bg-${update.color}-500 animate-ping`} />
                </div>

                <div className="hidden md:block flex-1" />
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Feedback Section */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="relative p-12 rounded-[3rem] bg-indigo-600 text-white overflow-hidden shadow-2xl shadow-indigo-500/20"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-32 -mt-32" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-black/20 rounded-full blur-3xl -ml-32 -mb-32" />

          <div className="relative z-10 grid md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center mb-6 backdrop-blur-md">
                <MessageSquare className="w-6 h-6" />
              </div>
              <h2 className="text-3xl font-black mb-4 tracking-tight">Help Shape the Future</h2>
              <p className="text-indigo-100 mb-8 leading-relaxed">
                SkillVibe is built with the community. Your feedback directly determines our roadmap for the next sprint.
              </p>
              <div className="flex gap-4">
                <div className="flex -space-x-3">
                  {[1, 2, 3, 4].map(i => (
                    <img
                      key={i}
                      src={`https://i.pravatar.cc/40?img=${i + 10}`}
                      alt="User avatar"
                      className="w-10 h-10 rounded-full border-2 border-indigo-600 object-cover"
                    />
                  ))}
                </div>
                <div className="text-xs font-medium text-indigo-100">
                  <span className="font-black text-white">1,200+</span> creators <br /> contributing ideas
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <button
                onClick={() => window.open('mailto:business@entrext.in?subject=Feature%20Request')}
                className="w-full p-4 bg-white text-indigo-600 rounded-2xl font-black flex items-center justify-between group hover:scale-[1.02] transition-transform"
              >
                <span>Request a Feature</span>
                <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform" />
              </button>
              <button
                onClick={() => window.open('mailto:business@entrext.in?subject=Platform%20Feedback')}
                className="w-full p-4 bg-indigo-500/30 border border-white/20 backdrop-blur-md text-white rounded-2xl font-black flex items-center justify-between group hover:bg-white/10 transition-all"
              >
                <span>Share General Feedback</span>
                <Send className="w-5 h-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
              </button>
            </div>
          </div>
        </motion.div>

      </main>

      <Footer />

      <DashboardModal
        isOpen={showDashboard}
        onClose={() => setShowDashboard(false)}
      />
    </div>
  )
}

export default function UpdatesClient() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <UserPreferencesProvider>
          <UpdatesContent />
        </UserPreferencesProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}