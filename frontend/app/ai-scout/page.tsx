'use client'

import { useState, useEffect } from 'react'
import axios from 'axios'
import toast from 'react-hot-toast'
import { Search, MapPin, Send, ShieldCheck, User, Star, Loader2, Sparkles, Filter, Briefcase } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../../contexts/AuthContext'
import LocationInput from '../../components/LocationInput'
import { API_URL } from '@/lib/api-config'
import Navbar from '../../components/Navbar'
import Footer from '../../components/Footer'
import AuthModal from '../../components/AuthModal'
import DashboardModal from '../../components/DashboardModal.jsx'
import SupportModal from '../../components/SupportModal'

export default function ScoutPage() {
  const { user, isLoading } = useAuth()

  const [prompt, setPrompt] = useState('')
  const [minTrustScore, setMinTrustScore] = useState(0)
  const [minEliteRating, setMinEliteRating] = useState(0)
  const [location, setLocation] = useState('')
  const [category, setCategory] = useState('')
  const [experience, setExperience] = useState('')
  const [region, setRegion] = useState('')
  const [limit, setLimit] = useState(10)

  const [isSearching, setIsSearching] = useState(false)
  const [candidates, setCandidates] = useState<any[]>([])
  const [hasSearched, setHasSearched] = useState(false)
  const [scanningStep, setScanningStep] = useState(0)

  const scanningSteps = [
    "Initializing Scout Logic...",
    "Scanning Global Candidate Pool...",
    "Verifying Trust Scores...",
    "Calculating Elite Prowess Alignment...",
    "Finalizing Top Matches..."
  ]

  const [outreachModalOpen, setOutreachModalOpen] = useState(false)
  const [selectedCandidate, setSelectedCandidate] = useState<any>(null)
  const [outreachMessage, setOutreachMessage] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [selectedIds, setSelectedIds] = useState<number[]>([])

  const [showAuthModal, setShowAuthModal] = useState(false)
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>('login')
  const [showDashboard, setShowDashboard] = useState(false)
  const [showSupportModal, setShowSupportModal] = useState(false)

  // Background scroll locking
  useEffect(() => {
    if (outreachModalOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => { document.body.style.overflow = 'unset' }
  }, [outreachModalOpen])

  const formatError = (error: any): string => {
    try {
      const detail = error.response?.data?.detail
      if (typeof detail === 'string') return detail
      if (Array.isArray(detail) && detail.length > 0) {
        if (typeof detail[0] === 'string') return detail[0]
        if (detail[0].msg) return String(detail[0].msg)
        return JSON.stringify(detail[0])
      }
      if (detail && typeof detail === 'object') return JSON.stringify(detail)
      return error.response?.data?.message || error.message || 'An unexpected error occurred'
    } catch (e) {
      return 'An unexpected error occurred'
    }
  }

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!prompt.trim() || prompt.length < 3) {
      toast.error('Please enter a more descriptive prompt.')
      return
    }

    setIsSearching(true)
    setScanningStep(0)

    // Animate scanning steps
    const stepInterval = setInterval(() => {
      setScanningStep(prev => (prev < scanningSteps.length - 1 ? prev + 1 : prev))
    }, 1500)

    try {
      const response = await axios.post(`${API_URL}/api/v1/jobs/scout`, {
        prompt,
        min_trust_score: Number(minTrustScore),
        min_elite_rating: Number(minEliteRating),
        location: location || null,
        category: category || null,
        experience: experience || null,
        region: region || null,
        freelance_only: true,
        limit: Number(limit)
      })

      clearInterval(stepInterval)
      setScanningStep(scanningSteps.length - 1)

      // Delay slightly for dramatic effect
      setTimeout(() => {
        setCandidates(response.data)
        setHasSearched(true)
        setIsSearching(false)
        if (response.data.length === 0) {
          toast('No matches found. Try broadening your criteria.', { icon: '🔍' })
        } else {
          toast.success(`Found ${response.data.length} top candidates!`)
        }
      }, 500)

    } catch (error: any) {
      clearInterval(stepInterval)
      console.error(error)
      toast.error(formatError(error))
      setIsSearching(false)
    }
  }

  const handleOpenOutreach = (candidate: any) => {
    const targetCandidates = candidate ? [candidate] : candidates.filter(c => selectedIds.includes(c.user_id))
    if (targetCandidates.length === 0) return

    setSelectedCandidate(targetCandidates)

    const names = targetCandidates.length === 1
      ? (targetCandidates[0].full_name || targetCandidates[0].username)
      : `${targetCandidates.length} selected candidates`

    setOutreachMessage(
      `Hi ${names},\n\nI came across your profile and was impressed by your work and Trust Score. We have a freelance opportunity that aligns perfectly with your skills.\n\nWould you be open to a quick chat?\n\nBest, \n${user?.full_name || 'A recruiter from SkillVibe'}`
    )
    setOutreachModalOpen(true)
  }

  const handleSendOutreach = async () => {
    if (!outreachMessage.trim() || outreachMessage.length < 10) {
      toast.error('Please write a meaningful outreach message')
      return
    }

    const ids = Array.isArray(selectedCandidate)
      ? selectedCandidate.map(c => c.user_id)
      : [selectedCandidate.user_id]

    setIsSending(true)
    try {
      await axios.post(`${API_URL}/api/v1/jobs/scout/outreach`, {
        candidate_ids: ids,
        message: outreachMessage
      })
      toast.success(`Outreach sent to ${ids.length} candidates!`)
      setOutreachModalOpen(false)
      setSelectedIds([])
    } catch (error: any) {
      toast.error(formatError(error))
    } finally {
      setIsSending(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-cyan-500 animate-spin" />
      </div>
    )
  }

  if (!user || user.role !== 'recruiter') {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-black font-sans selection:bg-cyan-500/30">
        <Navbar
          onSignIn={() => { setShowAuthModal(true); setAuthModalMode('login') }}
          onSignUp={() => { setShowAuthModal(true); setAuthModalMode('register') }}
          onUserDashboard={() => setShowDashboard(true)}
        />
        <div className="pt-40 pb-40 text-center flex items-center justify-center">
          <div className="max-w-md">
            <ShieldCheck className="w-16 h-16 text-cyan-500 mx-auto mb-6" />
            <h1 className="text-3xl font-black mb-4 uppercase tracking-tighter">Recruiter Access Only</h1>
            <p className="text-slate-500 mb-8">The AI Talent Scout feature is exclusively available for verified recruiters searching for top talent.</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => { setShowAuthModal(true); setAuthModalMode('login') }}
                className="px-8 py-4 bg-cyan-500 text-black font-black uppercase tracking-widest rounded-xl hover:scale-105 transition-all text-[10px] inline-block shadow-[0_0_20px_rgba(6,182,212,0.3)]"
              >
                Login as Recruiter
              </button>
              <button
                onClick={() => { setShowAuthModal(true); setAuthModalMode('register') }}
                className="px-8 py-4 bg-white/5 text-white border border-white/10 font-black uppercase tracking-widest rounded-xl hover:bg-white/10 transition-all text-[10px] inline-block"
              >
                Join as Recruiter
              </button>
            </div>
          </div>
        </div>
        <Footer onSupportClick={() => setShowSupportModal(true)} />

        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          initialMode={authModalMode}
          defaultRole="recruiter"
        />
        <SupportModal
          isOpen={showSupportModal}
          onClose={() => setShowSupportModal(false)}
        />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-black font-sans selection:bg-cyan-500/30 overflow-x-hidden">
      <Navbar
        onSignIn={() => { setShowAuthModal(true); setAuthModalMode('login') }}
        onSignUp={() => { setShowAuthModal(true); setAuthModalMode('register') }}
        onUserDashboard={() => setShowDashboard(true)}
      />

      <div className="pt-32 pb-20 px-6 text-slate-900 dark:text-white">
        <div className="max-w-5xl mx-auto space-y-12">
          {/* Header */}
          <div className="space-y-4 text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 text-xs font-black uppercase tracking-widest border border-cyan-500/20">
              <Sparkles className="w-4 h-4" />
              AI Talent Scout
            </div>
            <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter italic">
              Find the Top 1% of Freelancers
            </h1>
            <p className="text-slate-500 max-w-2xl mx-auto font-medium">
              Describe the exact talent you need. Our AI scans portfolios, verifiable skills, and Trust Scores to instantly match you with elite freelancers.
            </p>
          </div>

          {/* Search Interface */}
          <div className="glass-card p-6 md:p-8 rounded-[2rem] border border-slate-200 dark:border-white/10 shadow-2xl relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-transparent to-indigo-500/5 pointer-events-none" />

            <form onSubmit={handleSearch} className="space-y-6 relative z-10">
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-slate-500 ml-2">Describe the role & skills</label>
                <div className="relative group">
                  <Search className="absolute left-6 top-6 text-slate-400 group-focus-within:text-cyan-500 transition-colors" />
                  <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="e.g. I need a senior motion designer who builds amazing Framer animations and has experience with SaaS landing pages..."
                    className="w-full pl-14 pr-6 py-6 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-3xl focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 text-slate-900 dark:text-white placeholder-slate-400 min-h-[120px] resize-none"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-slate-500 ml-2">Min. Trust Score</label>
                  <div className="relative">
                    <ShieldCheck className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5 pointer-events-none" />
                    <select
                      value={minTrustScore}
                      onChange={(e) => setMinTrustScore(Number(e.target.value))}
                      className="w-full pl-12 pr-4 py-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 outline-none appearance-none cursor-pointer text-sm font-bold text-slate-900 dark:text-white"
                    >
                      <option value="0" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Any Trust</option>
                      <option value="1" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">1 Star +</option>
                      <option value="2" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">2 Stars +</option>
                      <option value="3" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">3 Stars +</option>
                      <option value="4" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">4 Stars +</option>
                      <option value="5" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Verified Titan</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-slate-500 ml-2">Min. Elite Prowess</label>
                  <div className="relative">
                    <Star className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5 pointer-events-none" />
                    <select
                      value={minEliteRating}
                      onChange={(e) => setMinEliteRating(Number(e.target.value))}
                      className="w-full pl-12 pr-4 py-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 outline-none appearance-none cursor-pointer text-sm font-bold text-slate-900 dark:text-white"
                    >
                      <option value="0" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Any Prowess</option>
                      <option value="50" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">50% + (Seed)</option>
                      <option value="70" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">70% + (Pillar)</option>
                      <option value="85" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">85% + (Titan Elite)</option>
                      <option value="95" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">95% + (Top 1%)</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-slate-500 ml-2">Location (Optional)</label>
                  <div className="relative">
                    <LocationInput
                      value={location}
                      onChange={(val) => setLocation(val)}
                      placeholder="City, Country or Remote"
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl py-4 focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 text-sm font-bold text-slate-900 dark:text-white"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-slate-500 ml-2">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-4 py-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 text-[10px] font-black uppercase tracking-widest outline-none appearance-none cursor-pointer text-slate-900 dark:text-white"
                  >
                    <option value="" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">All Categories</option>
                    <option value="development" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Software Development</option>
                    <option value="design" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">UI/UX Design</option>
                    <option value="ai_data" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">AI & Data Science</option>
                    <option value="product" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Product Management</option>
                    <option value="marketing" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Marketing & Sales</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-slate-500 ml-2">Experience</label>
                  <select
                    value={experience}
                    onChange={(e) => setExperience(e.target.value)}
                    className="w-full px-4 py-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 text-[10px] font-black uppercase tracking-widest outline-none appearance-none cursor-pointer text-slate-900 dark:text-white"
                  >
                    <option value="" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Any Experience</option>
                    <option value="junior" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Junior (0-2y)</option>
                    <option value="mid" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Mid-Level (3-5y)</option>
                    <option value="senior" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Senior (5-8y)</option>
                    <option value="elite" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Elite/Lead (8y+)</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-slate-500 ml-2">Region</label>
                  <select
                    value={region}
                    onChange={(e) => setRegion(e.target.value)}
                    className="w-full px-4 py-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 text-[10px] font-black uppercase tracking-widest outline-none appearance-none cursor-pointer text-slate-900 dark:text-white"
                  >
                    <option value="" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">All Regions</option>
                    <option value="americas" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Americas</option>
                    <option value="emea" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Europe & MEA</option>
                    <option value="apac" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Asia Pacific</option>
                    <option value="south_asia" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">South Asia</option>
                    <option value="remote" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Fully Remote</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-between items-center pt-4">
                <div className="flex items-center gap-3">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Max Candidates:</label>
                  <select
                    value={limit}
                    onChange={(e) => {
                      if (!user?.is_premium && Number(e.target.value) > 3) {
                        toast.error('Upgrade to Pillar Elite to unlock higher candidate limits.')
                        setLimit(3)
                        return
                      }
                      setLimit(Number(e.target.value))
                    }}
                    className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 text-[10px] font-black uppercase tracking-widest outline-none cursor-pointer text-slate-900 dark:text-white"
                  >
                    {!user?.is_premium && <option value="3" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Top 3 (Free Limit)</option>}
                    <option value="5" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Top 5 {!user?.is_premium ? '🔒' : ''}</option>
                    <option value="10" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Top 10 {!user?.is_premium ? '🔒' : ''}</option>
                    <option value="20" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Top 20 {!user?.is_premium ? '🔒' : ''}</option>
                    <option value="50" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Top 50 {!user?.is_premium ? '🔒' : ''}</option>
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={isSearching}
                  className="px-8 py-4 bg-black dark:bg-white text-white dark:text-black font-black uppercase tracking-widest rounded-xl hover:scale-105 active:scale-95 transition-all text-sm flex items-center gap-3 disabled:opacity-50 disabled:scale-100"
                >
                  {isSearching ? (
                    <div className="flex flex-col items-center">
                      <div className="flex items-center gap-3">
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>{scanningSteps[scanningStep]}</span>
                      </div>
                    </div>
                  ) : (
                    <><Sparkles className="w-5 h-5" /> Scout Talent</>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* AI Processing Overlay */}
          <AnimatePresence>
            {isSearching && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="py-12 text-center space-y-8"
              >
                <div className="relative w-32 h-32 mx-auto">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                    className="absolute inset-0 rounded-full border-2 border-dashed border-cyan-500/30"
                  />
                  <motion.div
                    animate={{ rotate: -360 }}
                    transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
                    className="absolute inset-2 rounded-full border-2 border-dashed border-indigo-500/20"
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Sparkles className="w-10 h-10 text-cyan-500 animate-pulse" />
                  </div>
                </div>
                <div className="space-y-4">
                  <h2 className="text-xl font-black uppercase tracking-widest text-slate-400">Deep Scanning Database</h2>
                  <div className="flex justify-center gap-2">
                    {scanningSteps.map((_, i) => (
                      <div
                        key={i}
                        className={`w-2 h-2 rounded-full transition-all duration-500 ${i <= scanningStep ? 'bg-cyan-500 w-8' : 'bg-slate-200 dark:bg-white/10'}`}
                      />
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Results */}
          {hasSearched && !isSearching && (
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-white/10 pb-4">
                <div className="flex items-center gap-6">
                  <h2 className="text-2xl font-black uppercase tracking-tighter italic">
                    {candidates.length} Elite Matches
                  </h2>
                  {candidates.length > 0 && (
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={selectedIds.length === candidates.length && candidates.length > 0}
                        onChange={(e) => {
                          if (e.target.checked) setSelectedIds(candidates.map(c => c.user_id))
                          else setSelectedIds([])
                        }}
                        className="w-4 h-4 rounded border-slate-300 dark:border-white/10 accent-cyan-500 cursor-pointer"
                      />
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Select All</span>
                    </div>
                  )}
                </div>
                <div className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                  Sorted by AI Match Confidence
                </div>
              </div>

              {/* Bulk Action Bar */}
              <AnimatePresence>
                {selectedIds.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                    className="sticky top-24 z-30 flex items-center justify-between p-4 bg-black text-white dark:bg-white dark:text-black rounded-2xl shadow-2xl border border-white/10"
                  >
                    <div className="flex items-center gap-4 px-2">
                      <div className="w-8 h-8 rounded-full bg-cyan-500 flex items-center justify-center text-black font-black text-xs">
                        {selectedIds.length}
                      </div>
                      <span className="text-xs font-black uppercase tracking-widest">Candidates Selected</span>
                    </div>
                    <button
                      onClick={() => handleOpenOutreach(null)}
                      className="px-6 py-2 bg-cyan-500 text-black font-black uppercase tracking-widest rounded-xl text-[10px] hover:scale-105 transition-all flex items-center gap-2"
                    >
                      <Send className="w-4 h-4" /> Bulk Message
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {candidates.map((candidate) => (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    key={candidate.id}
                    className={`bg-white dark:bg-white/5 border ${selectedIds.includes(candidate.user_id) ? 'border-cyan-500 shadow-[0_0_20px_rgba(6,182,212,0.1)]' : 'border-slate-200 dark:border-white/10'} p-6 rounded-[2rem] hover:border-cyan-500/50 transition-all group flex flex-col justify-between relative`}
                  >
                    <div className="space-y-4">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-4">
                          <div className="flex flex-col items-center gap-3">
                            <input
                              type="checkbox"
                              checked={selectedIds.includes(candidate.user_id)}
                              onChange={(e) => {
                                if (e.target.checked) setSelectedIds([...selectedIds, candidate.user_id])
                                else setSelectedIds(selectedIds.filter(id => id !== candidate.user_id))
                              }}
                              className="w-5 h-5 rounded-lg border-slate-300 dark:border-white/20 accent-cyan-500 cursor-pointer"
                            />
                            <div className="w-14 h-14 rounded-full bg-slate-200 dark:bg-white/10 overflow-hidden flex items-center justify-center border-2 border-transparent group-hover:border-cyan-500/30 transition-colors">
                              {candidate.profile_picture ? (
                                <img src={candidate.profile_picture} alt={candidate.username} className="w-full h-full object-cover" />
                              ) : (
                                <User className="w-6 h-6 text-slate-400" />
                              )}
                            </div>
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-bold text-lg">{String(candidate.full_name || candidate.username)}</h3>
                              <div className="px-2 py-0.5 rounded-full bg-cyan-500 text-black text-[9px] font-black uppercase tracking-widest">
                                {String(candidate.match_score)}% Match
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="text-[10px] font-black uppercase tracking-widest text-cyan-500/80 flex items-center gap-1">
                                <ShieldCheck className="w-3 h-3" /> Trust: {candidate.trust_score}%
                              </div>
                              <div className="text-[10px] font-black uppercase tracking-widest text-indigo-500/80 flex items-center gap-1">
                                <Sparkles className="w-3 h-3" /> Prowess: {candidate.elite_rating}%
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <p className="font-medium text-slate-700 dark:text-slate-300">{candidate.headline}</p>

                        {candidate.location && (
                          <div className="flex items-center gap-2 text-sm text-slate-500">
                            <MapPin className="w-4 h-4" /> {candidate.location}
                          </div>
                        )}
                      </div>

                      <div className="p-4 bg-cyan-500/5 border border-cyan-500/10 rounded-xl">
                        <div className="text-[10px] font-black uppercase tracking-widest text-cyan-600 dark:text-cyan-400 mb-1 flex items-center gap-1">
                          <Sparkles className="w-3 h-3" /> AI Match Reason
                        </div>
                        <p className="text-sm text-slate-600 dark:text-slate-400 italic">
                          "{String(candidate.match_reason)}"
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => handleOpenOutreach(candidate)}
                      className="w-full mt-6 py-4 bg-slate-900 dark:bg-white/10 hover:bg-black dark:hover:bg-cyan-500 text-white dark:hover:text-black font-black uppercase tracking-widest rounded-xl transition-all text-xs flex items-center justify-center gap-2"
                    >
                      <Send className="w-4 h-4" /> Message Candidate
                    </button>
                  </motion.div>
                ))}
              </div>

              {candidates.length === 0 && (
                <div className="text-center py-20">
                  <Filter className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                  <h3 className="text-xl font-bold mb-2">No perfect matches found</h3>
                  <p className="text-slate-500">Try lowering the minimum Trust Score or adjusting your prompt.</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Outreach Modal */}
        <AnimatePresence>
          {outreachModalOpen && selectedCandidate && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" data-lenis-prevent="true">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-[2rem] p-6 md:p-8 border border-slate-200 dark:border-white/10 shadow-2xl relative"
              >
                <h2 className="text-2xl font-black uppercase tracking-tighter mb-2">Send Outreach</h2>
                <p className="text-slate-500 mb-6 text-sm">
                  Directly contacting {Array.isArray(selectedCandidate)
                    ? (selectedCandidate.length === 1
                      ? (selectedCandidate[0].full_name || selectedCandidate[0].username)
                      : `${selectedCandidate.length} selected candidates`)
                    : "selected talent"}
                </p>

                <div className="space-y-4">
                  <textarea
                    value={outreachMessage}
                    onChange={(e) => setOutreachMessage(e.target.value)}
                    className="w-full p-6 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl min-h-[250px] text-sm focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 font-medium whitespace-pre-wrap overflow-y-auto custom-scrollbar"
                    style={{ scrollbarWidth: 'thin', scrollbarColor: '#06b6d4 transparent' }}
                  />

                  <div className="flex gap-4 pt-4">
                    <button
                      onClick={() => setOutreachModalOpen(false)}
                      className="flex-1 py-4 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 font-bold rounded-xl transition-colors text-sm"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSendOutreach}
                      disabled={isSending}
                      className="flex-1 flex items-center justify-center gap-2 py-4 bg-cyan-500 hover:bg-cyan-400 text-black font-black uppercase tracking-widest rounded-xl transition-colors text-sm disabled:opacity-50"
                    >
                      {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                      Send Now
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>

      <Footer onSupportClick={() => setShowSupportModal(true)} />

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        initialMode={authModalMode}
      />

      <DashboardModal
        isOpen={showDashboard}
        onClose={() => setShowDashboard(false)}
      />

      <SupportModal
        isOpen={showSupportModal}
        onClose={() => setShowSupportModal(false)}
      />
    </div>
  )
}
