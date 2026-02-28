'use client'

import { useState } from 'react'
import { TrendingUp, Zap, Shield, Users, CheckCircle, Star, Target, Heart, Mail, Award, Rocket, Sparkles } from 'lucide-react'
import { AuthProvider, useAuth } from '../../contexts/AuthContext'
import { ThemeProvider } from '../../contexts/ThemeContext'
import { UserPreferencesProvider } from '../../contexts/UserPreferencesContext'
import Navbar from '../../components/Navbar'
import AuthModal from '../../components/AuthModal'
import DashboardModal from '../../components/DashboardModal.jsx'
import Footer from '../../components/Footer'
import { motion } from 'framer-motion'

function AboutContent() {
  const { user, isAuthenticated } = useAuth()
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>('login')
  const [showDashboard, setShowDashboard] = useState(false)

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-black selection:bg-indigo-500/30 font-sans overflow-x-hidden">

      {/* Innovative 'Builder' Background */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 bg-grid-blueprint-light opacity-30 dark:opacity-10" />
        <div className="absolute top-[-5%] right-[-5%] w-[45%] h-[45%] bg-indigo-500/5 rounded-full blur-[120px] animate-pulse-slow" />
        <div className="absolute bottom-[-5%] left-[-5%] w-[45%] h-[45%] bg-purple-500/5 rounded-full blur-[120px] animate-pulse-slow delay-1000" />

        {/* Dynamic Scanline */}
        <div className="absolute inset-0 overflow-hidden opacity-10">
          <div className="w-full h-1 bg-indigo-500 animate-scanline shadow-[0_0_20px_rgba(99,102,241,1)]" />
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
        activeMainTab="about"
        onSignIn={() => { setShowAuthModal(true); setAuthModalMode('login') }}
        onSignUp={() => { setShowAuthModal(true); setAuthModalMode('register') }}
        onUserDashboard={() => setShowDashboard(true)}
      />

      {/* Header - Mission Manifesto Log */}
      <main className="relative z-10 pt-24 sm:pt-28 pb-16 sm:pb-24 px-4 sm:px-6 overflow-x-hidden">
        <div className="max-w-6xl mx-auto space-y-24 sm:space-y-40">

          <div className="text-center space-y-6 sm:space-y-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="flex flex-col items-center"
            >
              <div className="inline-flex items-center gap-3 mb-6 sm:mb-10 px-4 sm:px-6 py-2 sm:py-2.5 bg-slate-100 dark:bg-slate-900 text-slate-900 dark:text-indigo-400 rounded-xl text-[9px] sm:text-[10px] font-black uppercase tracking-widest sm:tracking-[0.4em] font-mono border border-slate-200 dark:border-slate-800 shadow-2xl relative overflow-hidden group">
                <div className="absolute inset-0 bg-grid-blueprint-light dark:bg-grid-blueprint opacity-[0.2] pointer-events-none" />
                <Sparkles className="w-3.5 h-3.5 relative z-10 animate-pulse" />
                <span className="relative z-10">MISSION_MANIFESTO.LOG</span>
              </div>
              <h1 className="text-4xl sm:text-6xl md:text-9xl font-display font-black mb-6 sm:mb-10 text-slate-900 dark:text-white tracking-tighter leading-[0.85] uppercase text-balance">
                Scaling the <br />
                <span className="text-indigo-600 dark:text-indigo-500">Public Journey</span>
              </h1>
              <p className="text-base sm:text-lg md:text-xl text-slate-600 dark:text-slate-400 max-w-3xl mx-auto leading-relaxed font-bold uppercase tracking-wide opacity-80 px-2 sm:px-0">
                BuildInPublic is an industrial-grade distribution engine designed for visionary founders who prioritize <span className="text-slate-900 dark:text-white">Radical Transparency</span> and <span className="text-slate-900 dark:text-white">Maximum Velocity</span>.
              </p>
            </motion.div>
          </div>

          {/* Mission & Impact Grid - Build Status Layer */}
          <div className="grid lg:grid-cols-2 gap-12 sm:gap-20 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="space-y-8 sm:space-y-12"
            >
              <div className="relative">
                <div className="inline-flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-black uppercase tracking-[0.2em] text-[10px] mb-4 sm:mb-6">
                  <div className="w-8 h-[1px] bg-indigo-500/30" />
                  <Target className="w-4 h-4" />
                  <span>CORE_OBJECTIVE</span>
                </div>
                <h2 className="text-3xl sm:text-4xl md:text-5xl font-display font-black text-slate-900 dark:text-white mb-6 sm:mb-8 leading-tight uppercase tracking-tighter">
                  Creation should not <br className="hidden sm:block" /> be bottlenecked by <br /> <span className="underline decoration-indigo-500/30">Distribution</span>.
                </h2>
                <p className="text-slate-600 dark:text-slate-400 text-base sm:text-lg leading-relaxed font-medium">
                  The friction of reformatting intellectual assets into social-ready threads is the primary failure point for busy founders. We've built an automated pipeline that extracts the essence of your journey without compromising your authority.
                </p>
              </div>

              <div className="grid sm:grid-cols-2 gap-8">
                <div className="bg-white dark:bg-slate-900 p-8 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-xl group relative overflow-hidden">
                  <div className="absolute inset-0 bg-grid-blueprint-light dark:bg-grid-blueprint opacity-[0.03] pointer-events-none" />
                  <div className="w-12 h-12 rounded-xl bg-indigo-600 flex items-center justify-center mb-6 text-white shadow-lg shadow-indigo-600/20 group-hover:rotate-6 transition-transform">
                    <Rocket className="w-6 h-6" />
                  </div>
                  <h3 className="font-black text-slate-900 dark:text-white mb-3 uppercase tracking-tight">Kinetic_Speed</h3>
                  <p className="text-[13px] text-slate-500 dark:text-slate-400 font-medium leading-relaxed">Transition from raw build logs to viral sequences in under 30 seconds of compute.</p>
                </div>
                <div className="bg-white dark:bg-slate-900 p-8 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-xl group relative overflow-hidden">
                  <div className="absolute inset-0 bg-grid-blueprint-light dark:bg-grid-blueprint opacity-[0.03] pointer-events-none" />
                  <div className="w-12 h-12 rounded-xl bg-slate-900 dark:bg-white flex items-center justify-center mb-6 text-white dark:text-slate-900 shadow-lg group-hover:-rotate-6 transition-transform">
                    <Award className="w-6 h-6" />
                  </div>
                  <h3 className="font-black text-slate-900 dark:text-white mb-3 uppercase tracking-tight">Authority_Lock</h3>
                  <p className="text-[13px] text-slate-500 dark:text-slate-400 font-medium leading-relaxed">Synthetic Intelligence that preserves your unique nuance and brand schematic.</p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="relative p-8 sm:p-12 rounded-[2.5rem] sm:rounded-[3.5rem] bg-slate-950 border border-slate-800 shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden"
            >
              <div className="absolute inset-0 bg-grid-blueprint opacity-[0.05] pointer-events-none" />
              <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-[100px] -mr-32 -mt-32" />

              <div className="flex items-center gap-3 mb-8 sm:mb-10 border-b border-slate-800 pb-6">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <h3 className="text-lg sm:text-xl font-black text-white uppercase tracking-tighter">Founder_First_Schematic</h3>
              </div>

              <div className="space-y-8">
                {[
                  { title: "LATENCY_REDUCTION", desc: "Save 5+ Hours of manual dispatch weekly." },
                  { title: "ALGORITHMIC_SYNC", desc: "Content tailored for specific platform logic." },
                  { title: "IDENTITY_RETENTION", desc: "Your unique perspective, scaled across channels." },
                  { title: "DATA_DRIVEN_OUTPUT", desc: "Built using engagement patterns from top 1% creators." }
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-5 group">
                    <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center flex-shrink-0 mt-0.5 group-hover:bg-emerald-500 group-hover:text-white transition-all duration-300">
                      <CheckCircle className="w-4 h-4 text-emerald-500 group-hover:text-white" />
                    </div>
                    <div>
                      <h4 className="font-black text-white text-[13px] uppercase tracking-wide mb-1 transition-colors group-hover:text-emerald-400">{item.title}</h4>
                      <p className="text-slate-500 text-[12px] font-bold tracking-tight">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Core Values Section - Logic Parameters */}
          <div className="space-y-12 sm:space-y-20">
            <div className="text-center px-2">
              <div className="inline-flex items-center gap-2 text-indigo-500 font-black uppercase tracking-widest sm:tracking-[0.3em] text-[10px] mb-4">
                <div className="w-3 h-3 rounded-full border border-indigo-500/30 flex items-center justify-center">
                  <div className="w-1 h-1 bg-indigo-500 rounded-full" />
                </div>
                BUILD_PRINCIPLES
              </div>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-display font-black text-slate-900 dark:text-white mb-6 uppercase tracking-tighter">Logic Parameters</h2>
              <p className="text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest text-[10px] sm:text-[11px] opacity-70">The operational directives behind our Distribution Engine.</p>
            </div>

            <div className="grid md:grid-cols-4 gap-8">
              {[
                { icon: Shield, title: "DATA_INTEGRITY", desc: "Encrypted processing. Your intellectual property is never utilized for public training.", color: "indigo" },
                { icon: Zap, title: "KINETIC_FLOW", desc: "Zero latency. Generate and dispatch protocols at the speed of thought.", color: "indigo" },
                { icon: Users, title: "FOUNDER_SYNC", desc: "Co-engineered with direct input from the world's most transparent builders.", color: "indigo" },
                { icon: Star, title: "SIGNAL_STRENGTH", desc: "Optimizing for high-impact resonance across the social spectrum.", color: "indigo" }
              ].map((item, i) => (
                <motion.div
                  key={i}
                  whileHover={{ y: -10, scale: 1.02 }}
                  className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-xl relative overflow-hidden group"
                >
                  <div className="absolute inset-0 bg-grid-blueprint-light dark:bg-grid-blueprint opacity-[0.02] pointer-events-none" />
                  <div className="w-14 h-14 bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center mb-8 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-500 border border-slate-200 dark:border-slate-700">
                    <item.icon className="w-6 h-6 transition-transform duration-500 group-hover:scale-110" />
                  </div>
                  <h3 className="font-black text-slate-900 dark:text-white mb-4 text-sm uppercase tracking-widest">{item.title}</h3>
                  <p className="text-[12px] text-slate-500 dark:text-slate-400 font-bold leading-relaxed">{item.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Premium Contact Section - Dispatch Terminal */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="p-8 sm:p-12 md:p-20 rounded-[2.5rem] sm:rounded-[4rem] bg-slate-900 dark:bg-slate-950 text-white text-center relative overflow-hidden shadow-[0_0_80px_rgba(0,0,0,0.6)] border border-slate-800"
          >
            <div className="absolute inset-0 bg-grid-blueprint opacity-[0.1] pointer-events-none" />
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-indigo-500/5 to-transparent pointer-events-none" />

            <div className="relative z-10 w-full">
              <div className="inline-flex items-center gap-2 mb-6 sm:mb-8 px-4 py-1.5 bg-indigo-500/10 border border-indigo-500/20 rounded-full">
                <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-ping" />
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-400">Dispatch_Active</span>
              </div>
              <h2 className="text-3xl sm:text-5xl md:text-7xl font-display font-black mb-8 sm:mb-10 tracking-tighter uppercase leading-none text-balance">Let's Build_Together</h2>
              <p className="text-slate-400 mb-10 sm:mb-16 max-w-2xl mx-auto text-base sm:text-lg font-bold uppercase tracking-tight opacity-80 px-2">
                Whether you are a visionary founder, a high-growth agency, or a strategic partner, our communication channels are open.
              </p>

              <div className="flex flex-col sm:flex-row justify-center gap-4 sm:gap-8 max-w-xs sm:max-w-none mx-auto">
                <button
                  onClick={() => window.open('mailto:business@entrext.in')}
                  className="group w-full sm:w-auto px-8 sm:px-12 py-5 sm:py-6 bg-white text-slate-900 rounded-2xl font-black uppercase tracking-widest text-[10px] sm:text-xs hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-4 shadow-2xl"
                >
                  <Mail className="w-4 h-4 sm:w-5 sm:h-5 transition-transform group-hover:-translate-y-1 shrink-0" />
                  Contact_Support
                </button>
                <button
                  onClick={() => window.open('mailto:business@entrext.in')}
                  className="group w-full sm:w-auto px-8 sm:px-12 py-5 sm:py-6 bg-slate-800 border border-slate-700 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] sm:text-xs hover:bg-slate-700 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-4 shadow-xl"
                >
                  <Users className="w-4 h-4 sm:w-5 sm:h-5 transition-transform group-hover:scale-110 shrink-0" />
                  Partnerships
                </button>
              </div>
            </div>
          </motion.div>

        </div>
      </main>

      <Footer />

      <DashboardModal
        isOpen={showDashboard}
        onClose={() => setShowDashboard(false)}
      />
    </div>
  )
}

export default function AboutClient() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <UserPreferencesProvider>
          <AboutContent />
        </UserPreferencesProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}