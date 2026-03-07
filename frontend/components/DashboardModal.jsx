"use client";

import React, { useState, useEffect } from 'react'
import { useScrollLock } from '../hooks/useScrollLock'
import { createPortal } from 'react-dom'
import { useRouter } from 'next/navigation'
import {
  User,
  Settings,
  BarChart3,
  Crown,
  LogOut,
  X,
  Zap,
  Briefcase,
  Clock,
  Sparkles,
  Trophy,
  ShieldCheck,
  Quote,
  Dna,
  Lock,
  MessageSquare
} from 'lucide-react'
import { motion } from 'framer-motion'
import { useAuth } from '../contexts/AuthContext'
import { useFeatureGate } from '../hooks/useFeatureGate'
import { useUserPreferences } from '../contexts/UserPreferencesContext'
import { useSubscription } from '../contexts/SubscriptionContext'
import { FormattedText } from './FormattedText'
import LoadingSpinner from './LoadingSpinner'
import ImageEditor from './ImageEditor'
import { requestCache } from '../lib/cache-util'
import { API_URL } from '../lib/api-config'
import axios from 'axios'
import toast from 'react-hot-toast'

/**
 * @param {{ isOpen: boolean; onClose: () => void; externalUsageStats?: any }} props
 */
export default function DashboardModal({ isOpen, onClose, externalUsageStats = null }) {
  const { user, logout, updateUser, refreshUser } = useAuth()
  const featureGate = useFeatureGate()
  const router = useRouter()
  const { autoSaveEnabled, setAutoSaveEnabled, emailNotificationsEnabled, setEmailNotificationsEnabled } = useUserPreferences()
  const { isProcessing } = useSubscription()

  // State management
  const [mounted, setMounted] = useState(false)
  const [activeSection, setActiveSection] = useState('overview')
  const [usageStats, setUsageStats] = useState(externalUsageStats || null)
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingApplications, setIsLoadingApplications] = useState(false)
  const [appliedJobs, setAppliedJobs] = useState([])
  const [myVibeNotes, setMyVibeNotes] = useState([])
  const [isLoadingVibeNotes, setIsLoadingVibeNotes] = useState(false)
  const [hasLoadedVibeNotes, setHasLoadedVibeNotes] = useState(false)

  // Profile editing state
  const [isEditingProfile, setIsEditingProfile] = useState(false)
  const [editedUsername, setEditedUsername] = useState('')
  const [editedFullName, setEditedFullName] = useState('')
  const [editedProfilePicture, setEditedProfilePicture] = useState('')
  const [isSavingProfile, setIsSavingProfile] = useState(false)
  const [showProfilePictureModal, setShowProfilePictureModal] = useState(false)
  const [selectedFile, setSelectedFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState('')
  const [isUploading, setIsUploading] = useState(false)
  const [showImageEditor, setShowImageEditor] = useState(false)
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [cancelLoading, setCancelLoading] = useState(false)

  const canViewApplications = user?.role === 'candidate' || user?.role === 'admin'

  useEffect(() => {
    setMounted(true)
  }, [])

  // Lock background scrolling completely (stop Lenis) and allow modal internal scroll
  useScrollLock(isOpen, { stopLenis: true })

  // Refresh basic user data once per open
  useEffect(() => {
    if (isOpen) {
      refreshUser()
    }
  }, [isOpen])

  // Load dashboard data when modal opens (per user)
  useEffect(() => {
    if (!isOpen || !user) return

    loadUsageStats()
    if (canViewApplications) {
      loadAppliedJobs()
    }
    if (user.role !== 'recruiter' && !hasLoadedVibeNotes) {
      loadVibeNotes()
    }

    setEditedUsername(user.username || '')
    setEditedFullName(user.full_name || '')
    setEditedProfilePicture(user.profile_picture || '')
  }, [isOpen, user, canViewApplications, hasLoadedVibeNotes])

  const loadUsageStats = async () => {
    try {
      if (externalUsageStats) {
        setUsageStats(externalUsageStats)
        return
      }

      const cacheKey = `usage-stats-${user?.id}`
      const stats = await requestCache.get(
        cacheKey,
        async () => {
          const response = await axios.get(`${API_URL}/api/v1/auth/usage-stats`, { timeout: 10000 })
          return response.data
        },
        60 * 1000
      )
      setUsageStats(stats)
    } catch (error) {
      console.error('Error loading usage stats:', error)
    }
  }

  const loadAppliedJobs = async () => {
    if (!canViewApplications || !user?.id) return
    setIsLoadingApplications(true)
    try {
      const cacheKey = `dashboard-applied-jobs-${user.id}`
      const jobs = await requestCache.get(
        cacheKey,
        async () => {
          const response = await axios.get(`${API_URL}/api/v1/jobs/candidate/me`, { timeout: 15000 })
          return response.data || []
        },
        30 * 1000
      )
      setAppliedJobs(jobs)
    } catch (error) {
      console.error('Error loading applications:', error)
    } finally {
      setIsLoadingApplications(false)
    }
  }

  const loadVibeNotes = async () => {
    if (user?.role === 'recruiter') return
    if (isLoadingVibeNotes) return
    setIsLoadingVibeNotes(true)
    try {
      const response = await axios.get(`${API_URL}/api/v1/skillvibe/vibe-notes/me`, { timeout: 15000 })
      setMyVibeNotes(response.data || [])
      setHasLoadedVibeNotes(true)
    } catch (error) {
      console.error('Error loading vibe notes:', error)
    } finally {
      setIsLoadingVibeNotes(false)
    }
  }

  const handleUpdateProfile = async () => {
    if (!editedUsername.trim()) {
      toast.error('Username is required')
      return
    }
    setIsSavingProfile(true)
    try {
      const response = await axios.put(`${API_URL}/api/v1/auth/profile`, {
        username: editedUsername.trim(),
        full_name: editedFullName.trim() || null,
        profile_picture: editedProfilePicture.trim() || null
      })
      if (response.data) {
        updateUser({
          username: response.data.username,
          full_name: response.data.full_name,
          profile_picture: response.data.profile_picture
        })
        setIsEditingProfile(false)
        toast.success('Profile updated successfully')
      }
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to update profile')
    } finally {
      setIsSavingProfile(false)
    }
  }

  const handleFileSelect = (event) => {
    const file = event.target.files?.[0]
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file')
        return
      }
      setSelectedFile(file)
      const reader = new FileReader()
      reader.onload = (e) => {
        setPreviewUrl(e.target?.result)
        setShowImageEditor(true)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleImageCrop = async (canvas) => {
    canvas.toBlob(async (blob) => {
      if (blob) {
        const reader = new FileReader()
        reader.onload = async (e) => {
          const base64 = e.target?.result
          setEditedProfilePicture(base64)
          setShowImageEditor(false)
          setShowProfilePictureModal(false)

          // Auto-save
          try {
            setIsUploading(true)
            await axios.put(`${API_URL}/api/v1/auth/profile`, { profile_picture: base64 })
            updateUser({ profile_picture: base64 })
            toast.success('Profile picture updated')
          } catch (error) {
            toast.error('Failed to save picture')
          } finally {
            setIsUploading(false)
          }
        }
        reader.readAsDataURL(blob)
      }
    }, 'image/jpeg', 0.8)
  }

  const handleCancelSubscription = async () => {
    setCancelLoading(true)
    try {
      const response = await axios.post(`${API_URL}/api/v1/payment/cancel`)
      if (response.data.success) {
        updateUser({ is_premium: false })
        await featureGate.refreshLimits()
        loadUsageStats()
        toast.success('Subscription cancelled')
        setShowCancelModal(false)
      } else {
        toast.error(response.data.message || 'Could not cancel')
      }
    } catch (error) {
      toast.error('Cancellation failed')
    } finally {
      setCancelLoading(false)
    }
  }

  const isValidImageUrl = (url) => {
    if (!url) return false
    return url.startsWith('data:image/') || url.startsWith('http')
  }

  if (!mounted) return null

  const elitePercent = Math.round(Number(usageStats?.elite_rating ?? usageStats?.ranking_score ?? 0))
  const derivedTrust = Math.min(5, Math.max(0, (elitePercent / 100) * 5))
  const trustValue = typeof usageStats?.trust_score === 'number' ? usageStats.trust_score : derivedTrust
  const trustBarPct = Math.min(100, Math.max(0, (trustValue / 5) * 100))

  const computedStageRaw =
    typeof usageStats?.verification_stage === 'number'
      ? usageStats.verification_stage
      : (elitePercent >= 86 ? 3 : elitePercent >= 55 ? 2 : 1)

  const computedStage = computedStageRaw === 3 ? 3 : computedStageRaw === 2 ? 2 : 1
  const stageLabel = computedStage === 3 ? 'TITAN STAGE' : computedStage === 2 ? 'PILLAR STAGE' : 'SEED STAGE'
  const stageColor = computedStage === 3 ? 'text-purple-400' : computedStage === 2 ? 'text-cyan-400' : 'text-emerald-400'

  if (!isOpen) return null

  return createPortal(
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-0 sm:p-4 overflow-hidden pointer-events-none">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/80 backdrop-blur-2xl pointer-events-auto cursor-pointer"
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="relative w-full max-w-7xl max-h-[90vh] bg-slate-950/50 sm:h-[90vh] sm:rounded-[4rem] border border-white/10 shadow-2xl overflow-hidden flex flex-col lg:flex-row pointer-events-auto"
        data-lenis-exclude
      >
        {/* Sidebar */}
        <div
          className="w-full lg:w-96 border-r border-white/5 bg-slate-900/40 p-10 flex flex-col relative z-30 overflow-y-auto min-h-0 pointer-events-auto touch-auto"
          data-lenis-exclude
          onWheel={(e) => e.stopPropagation()}
          onTouchMove={(e) => e.stopPropagation()}
        >
          <div className="flex items-center gap-5 mb-12">
            <div className="w-14 h-14 bg-gradient-to-br from-cyan-500 to-indigo-600 rounded-[1.5rem] flex items-center justify-center shadow-2xl">
              <BarChart3 className="w-7 h-7 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-white italic tracking-tighter uppercase">DASHBOARD</h2>
              <p className="text-[10px] font-black text-cyan-500/60 uppercase tracking-widest font-mono">Vibe Protocol v4.0</p>
            </div>
          </div>

          <nav className="space-y-3 flex-1">
            {[
              { id: 'overview', name: 'Overview', icon: BarChart3, color: 'text-cyan-500', bg: 'bg-cyan-500/10' },
              { id: 'messages', name: 'Messages', icon: MessageSquare, color: 'text-indigo-400', bg: 'bg-indigo-400/10' },
              ...(canViewApplications ? [{ id: 'applications', name: 'Applied Jobs', icon: Briefcase, count: appliedJobs.length, color: 'text-indigo-500', bg: 'bg-indigo-500/10' }] : []),
              { id: 'settings', name: 'Settings', icon: Settings, color: 'text-slate-500', bg: 'bg-white/5' },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  if (item.id === 'messages') {
                    onClose();
                    router.push('/messages');
                  } else {
                    setActiveSection(item.id);
                  }
                }}
                className={`w-full flex items-center gap-5 px-6 py-4 rounded-2xl transition-all duration-500 border border-transparent group relative ${activeSection === item.id
                  ? 'bg-white/10 border-white/10 text-white shadow-xl translate-x-1'
                  : 'text-slate-500 hover:text-white hover:bg-white/5'
                  }`}
              >
                <div className={`p-2.5 rounded-xl transition-all duration-500 ${activeSection === item.id ? item.bg : 'group-hover:bg-white/5'}`}>
                  <item.icon className={`w-5 h-5 ${activeSection === item.id ? item.color + ' glow-cyan' : ''}`} />
                </div>
                <span className="flex-1 text-left text-[11px] font-black uppercase tracking-[0.2em]">{item.name}</span>
                {item.count !== undefined && item.count > 0 && (
                  <span className="px-3 py-1 bg-white/10 rounded-lg text-[9px] font-black font-mono">{item.count}</span>
                )}
              </button>
            ))}
          </nav>

          <div className="mt-12 space-y-4">
            <div className="glass-panel p-6 rounded-[2rem] border border-white/5 bg-white/[0.03]">
              <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-3 font-mono">Vibe Status</p>
              <div className="flex items-center gap-3">
                <ShieldCheck className="w-4 h-4 text-cyan-500" />
                <span className={`text-xs font-black uppercase tracking-widest italic ${stageColor}`}>{stageLabel}</span>
              </div>
            </div>

            <button
              onClick={() => { logout(); onClose(); }}
              className="w-full flex items-center justify-center gap-4 px-6 py-4 text-slate-600 hover:text-white hover:bg-red-500/10 rounded-2xl transition-all border border-transparent hover:border-red-500/20 italic"
            >
              <LogOut className="w-5 h-5" />
              <span className="text-[11px] font-black uppercase tracking-[0.2em]">LOG OUT</span>
            </button>
          </div>
        </div>

        {/* Main Content Area */}
        <div
          className="flex-1 overflow-y-auto bg-black/40 backdrop-blur-3xl relative z-20 p-8 sm:p-12 min-h-0 pointer-events-auto touch-auto"
          data-lenis-exclude
          onWheel={(e) => e.stopPropagation()}
          onTouchMove={(e) => e.stopPropagation()}
        >
          <div className="w-full max-w-5xl mx-auto space-y-12">
            {activeSection === 'overview' && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-12">
                {/* Payment Processing Banner */}
                {isProcessing && (
                  <div className="bg-indigo-500/20 border border-indigo-500/30 p-8 rounded-[2.5rem] flex items-center gap-6 relative overflow-hidden group">
                    <div className="absolute inset-0 bg-indigo-500/5 blur-3xl group-hover:bg-indigo-500/10 transition-colors" />
                    <div className="w-16 h-16 rounded-2xl bg-indigo-500/20 flex items-center justify-center animate-pulse relative z-10">
                      <Clock className="w-8 h-8 text-indigo-400" />
                    </div>
                    <div className="flex-1 relative z-10">
                      <h4 className="text-lg font-black text-white italic tracking-tighter uppercase mb-1">Payment is Processing</h4>
                      <p className="text-sm text-indigo-300 font-medium">Your upgrade is being verified. Please wait a few moments. If it takes longer than 5 minutes, please contact support for immediate assistance.</p>
                    </div>
                    <button
                      onClick={() => { onClose(); router.push('/support'); }}
                      className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white font-black text-[10px] uppercase tracking-widest rounded-xl transition-all border border-white/10 relative z-10"
                    >
                      Contact Support
                    </button>
                  </div>
                )}

                {/* Minimal Overview: Full Score + Recent Vibe Notes */}
                <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
                  {/* Full Score Panel */}
                  <div className="xl:col-span-5">
                    <div className="glass-panel rounded-[3rem] border border-white/10 bg-black/40 overflow-hidden shadow-2xl relative">
                      <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 blur-[100px] pointer-events-none" />
                      <div className="p-10 border-b border-white/5 bg-white/[0.02]">
                        <div className="flex items-start justify-between gap-6">
                          <div>
                            <h3 className="text-xs font-black text-white uppercase tracking-[0.3em] flex items-center gap-3 italic">
                              <BarChart3 className="w-4 h-4 text-indigo-400" />
                              FULL SCORE
                            </h3>
                            <p className="text-[9px] text-slate-500 font-mono uppercase tracking-[0.2em] mt-2">Your current protocol metrics</p>
                          </div>
                          <div className="flex items-center gap-3">
                            <ShieldCheck className="w-4 h-4 text-cyan-500" />
                            <span className={`text-[10px] font-black uppercase tracking-widest italic ${user?.is_premium ? stageColor : 'text-emerald-400'}`}>{user?.is_premium ? stageLabel : 'SEED STAGE'}</span>
                          </div>
                        </div>
                      </div>

                      <div className={`p-10 space-y-10 ${!user?.is_premium ? 'opacity-30 blur-sm pointer-events-none' : ''}`}>
                        <div className="rounded-[2.5rem] bg-white/[0.03] border border-white/10 p-8">
                          <div className="flex items-center justify-between gap-6">
                            <div>
                              <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.35em] font-mono italic">Global Rank</p>
                              <div className="mt-3 flex items-end gap-3">
                                <Trophy className="w-5 h-5 text-amber-400" />
                                <span className="text-4xl font-black text-white italic tracking-tighter uppercase">
                                  {user?.is_premium ? ((usageStats?.leaderboard_rank && usageStats.leaderboard_rank !== '0') ? usageStats.leaderboard_rank : '#---') : '?'}
                                </span>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.35em] font-mono italic">Ranking Score</p>
                              <p className="mt-3 text-3xl font-black text-white italic tracking-tighter uppercase">
                                {user?.is_premium ? Math.round(usageStats?.ranking_score || 0) : '?'}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-8">
                          <div className="rounded-[2.5rem] bg-white/[0.03] border border-white/10 p-8">
                            <p className="text-[10px] font-black text-cyan-500 uppercase tracking-[0.4em] mb-6 font-mono italic">Elite Prowess</p>
                            <div className="flex items-baseline gap-2">
                              <span className="text-6xl font-black text-white italic tracking-tighter uppercase">{user?.is_premium ? elitePercent : '?'}</span>
                              <span className="text-xl font-black text-white/20 italic">%</span>
                            </div>
                            <div className="mt-6 w-full h-1 bg-white/5 rounded-full overflow-hidden">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: user?.is_premium ? `${Math.min(100, Math.max(0, elitePercent))}%` : '0%' }}
                                className="h-full bg-cyan-500 shadow-[0_0_15px_rgba(6,182,212,0.5)]"
                              />
                            </div>
                          </div>

                          <div className="rounded-[2.5rem] bg-white/[0.03] border border-white/10 p-8">
                            <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.4em] mb-6 font-mono italic">Trust Score</p>
                            <div className="flex items-baseline gap-2">
                              <span className="text-6xl font-black text-white italic tracking-tighter uppercase">{user?.is_premium ? trustValue.toFixed(1) : '?'}</span>
                              <span className="text-xl font-black text-white/20 italic font-mono uppercase">/ 5.0</span>
                            </div>
                            <div className="mt-6 w-full h-1 bg-white/5 rounded-full overflow-hidden">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: user?.is_premium ? `${trustBarPct}%` : '0%' }}
                                className="h-full bg-indigo-400 shadow-[0_0_15px_rgba(99,102,241,0.45)]"
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      {!user?.is_premium && (
                        <div className="absolute inset-0 bg-gradient-to-br from-black/40 to-black/60 backdrop-blur-sm flex flex-col items-center justify-center z-20 rounded-[3rem] p-8">
                          <Lock className="w-16 h-16 text-indigo-400/80 mb-6" />
                          <h4 className="text-xl font-black text-white text-center mb-3 italic">ANALYTICS LOCKED</h4>
                          <p className="text-sm text-slate-300 text-center mb-6">Access your ranking, prowess score, and trust metrics with Pillar Elite.</p>
                          <button
                            onClick={() => { onClose(); router.push('/pricing'); }}
                            className="px-6 py-3 bg-indigo-500 hover:bg-indigo-600 text-white font-black text-[10px] uppercase tracking-widest rounded-xl transition-colors whitespace-nowrap"
                          >
                            UNLOCK ANALYTICS →
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Vibe Notes Panel */}
                  {user?.role !== 'recruiter' && (
                    <div className="xl:col-span-7">
                      <div className="glass-panel rounded-[3rem] border border-white/10 bg-black/40 overflow-hidden shadow-2xl relative">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/5 blur-[100px] pointer-events-none" />
                        <div className="p-10 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                          <div>
                            <h3 className="text-xs font-black text-white uppercase tracking-[0.3em] flex items-center gap-3 italic">
                              <Sparkles className="w-4 h-4 text-cyan-500" />
                              RECENT VIBE NOTES
                            </h3>
                            <p className="text-[9px] text-slate-500 font-mono uppercase tracking-[0.2em] mt-2">Direct endorsements from verified peers</p>
                          </div>
                          <div className="px-5 py-2.5 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-500 font-black text-[10px] uppercase tracking-widest glow-cyan">
                            {user?.is_premium ? myVibeNotes.length : '?'} SIGNALS
                          </div>
                        </div>

                        <div className={`p-10 ${!user?.is_premium ? 'opacity-30 blur-sm pointer-events-none' : ''}`}>
                          {user?.is_premium ? (
                            <>
                              {isLoadingVibeNotes ? (
                                <div className="py-20 flex justify-center"><LoadingSpinner /></div>
                              ) : myVibeNotes.length > 0 ? (
                                <>
                                  <div className="space-y-4 max-h-[520px] overflow-y-auto pr-2">
                                    {myVibeNotes.slice(0, 12).map((note, idx) => (
                                      <div key={idx} className="p-6 rounded-[2rem] bg-white/[0.03] border border-white/10 hover:border-cyan-500/40 transition-all duration-500 group relative">
                                        <Quote className="absolute top-6 right-6 w-10 h-10 text-white/5 group-hover:text-cyan-500/10 transition-colors" />
                                        <div className="flex items-start gap-4">
                                          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-indigo-500/20 flex items-center justify-center text-sm font-black text-white border border-white/5 shadow-inner flex-shrink-0">
                                            {note.author_name?.charAt(0) || '?'}
                                          </div>
                                          <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between gap-4">
                                              <div className="min-w-0">
                                                <p className="text-sm font-black text-white truncate uppercase italic tracking-tighter">{note.author_name}</p>
                                                <p className="text-[10px] text-cyan-500 font-bold uppercase tracking-widest mt-1">{note.author_role}</p>
                                              </div>
                                              <span className="px-3 py-1 bg-white/5 rounded-lg text-[9px] font-black text-slate-500 uppercase tracking-widest border border-white/5 flex-shrink-0">
                                                {note.vibe_type}
                                              </span>
                                            </div>
                                            <div className="mt-4 text-slate-300 text-sm leading-relaxed italic font-medium">
                                              <FormattedText text={`"${note.content}"`} className="inline" />
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                  {user?.is_premium && (
                                    <div className="mt-8 p-6 rounded-2xl bg-cyan-500/10 border border-cyan-500/20">
                                      <p className="text-[10px] font-black text-cyan-400 uppercase tracking-widest mb-2">📊 VIBE NOTES ANALYTICS (PRO)</p>
                                      <div className="grid grid-cols-2 gap-4">
                                        <div className="bg-black/40 rounded-xl p-4">
                                          <p className="text-[9px] text-slate-500 uppercase font-black tracking-widest">Total Signals</p>
                                          <p className="text-2xl font-black text-cyan-400 mt-2">{myVibeNotes.length}</p>
                                        </div>
                                        <div className="bg-black/40 rounded-xl p-4">
                                          <p className="text-[9px] text-slate-500 uppercase font-black tracking-widest">Avg Trust Boost</p>
                                          <p className="text-2xl font-black text-cyan-400 mt-2">+{(myVibeNotes.length * 0.5).toFixed(1)}</p>
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                </>
                              ) : (
                                <div className="py-24 text-center">
                                  <Dna className="w-12 h-12 text-white/5 mx-auto mb-6" />
                                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em]">NO VIBE SIGNALS DETECTED</p>
                                </div>
                              )}
                            </>
                          ) : (
                            <div className="py-24 text-center">
                              <Sparkles className="w-12 h-12 text-white/10 mx-auto mb-6" />
                              <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em]">Vibe Notes hidden</p>
                            </div>
                          )}
                        </div>

                        {!user?.is_premium && (
                          <div className="absolute inset-0 bg-gradient-to-br from-black/40 to-black/60 backdrop-blur-sm flex flex-col items-center justify-center z-20 rounded-[3rem] p-8">
                            <Lock className="w-16 h-16 text-cyan-400/80 mb-6" />
                            <h4 className="text-xl font-black text-white text-center mb-3 italic">VIBE NOTES LOCKED</h4>
                            <p className="text-sm text-slate-300 text-center mb-6">View recruiter endorsements and track professional signals with Pillar Elite.</p>
                            <button
                              onClick={() => { onClose(); router.push('/pricing'); }}
                              className="px-6 py-3 bg-cyan-500 hover:bg-cyan-600 text-black font-black text-[10px] uppercase tracking-widest rounded-xl transition-colors whitespace-nowrap"
                            >
                              UNLOCK SIGNALS →
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {activeSection === 'applications' && canViewApplications && (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-2xl font-black text-white italic tracking-tighter uppercase">APPLICATIONS</h3>
                </div>

                {/* Resume Upload Limit */}
                {!user?.is_premium && (
                  <div className="mb-8 p-6 rounded-2xl bg-amber-500/10 border border-amber-500/20">
                    <div className="flex items-start gap-4">
                      <Lock className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-[10px] font-black text-amber-400 uppercase tracking-widest mb-2">📄 RESUME UPLOAD LIMIT</p>
                        <p className="text-sm text-amber-300/80 mb-4">You can upload up to <span className="font-black">2 resumes</span> on the free tier. Upgrade to Pillar Elite for unlimited uploads.</p>
                        <button onClick={() => { onClose(); router.push('/pricing'); }} className="px-4 py-2 bg-amber-500 text-black font-black text-[9px] uppercase tracking-widest rounded-lg hover:bg-amber-400 transition-colors">
                          UNLOCK UNLIMITED →
                        </button>
                      </div>
                    </div>
                  </div>
                )}
                {user?.is_premium && (
                  <div className="mb-8 p-6 rounded-2xl bg-cyan-500/10 border border-cyan-500/20">
                    <div className="flex items-start gap-4">
                      <Crown className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-[10px] font-black text-cyan-400 uppercase tracking-widest">👑 UNLIMITED RESUMES</p>
                        <p className="text-sm text-cyan-300/80">You have unlimited resume uploads with Pillar Elite!</p>
                      </div>
                    </div>
                  </div>
                )}
                {isLoadingApplications ? (
                  <div className="py-20 flex justify-center"><LoadingSpinner /></div>
                ) : appliedJobs.length === 0 ? (
                  <div className="text-center py-24 bg-white/[0.02] border border-white/10 rounded-[3rem]">
                    <Briefcase className="w-12 h-12 text-white/5 mx-auto mb-6" />
                    <h4 className="text-xl font-black text-white mb-2 italic">NO ACTIVE APPLICATIONS</h4>
                    <p className="text-slate-500 mb-8">Ready to build your career legacy?</p>
                    <button onClick={() => { onClose(); router.push('/jobs'); }} className="px-8 py-4 bg-cyan-500 text-black font-black text-[10px] uppercase tracking-widest rounded-2xl">Browse Elite Jobs</button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {appliedJobs.map((job) => (
                      <div key={job.application_id} className="p-8 bg-white/[0.03] border border-white/10 rounded-[2rem] hover:bg-white/[0.05] transition-all flex flex-col md:flex-row md:items-center justify-between gap-6 group">
                        <div>
                          <h4 className="text-xl font-black text-white italic tracking-tighter uppercase group-hover:text-cyan-500 transition-colors">{job.job.title}</h4>
                          <p className="text-slate-400 text-sm mt-1">{job.job.company_name} • {job.job.location || 'Remote'}</p>
                          <div className="mt-4 flex items-center gap-3 text-[10px] text-slate-500 font-black uppercase tracking-widest">
                            <Clock className="w-3 h-3" />
                            <span>Applied {new Date(job.created_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                        <div className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border ${job.status === 'hired' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' :
                          job.status === 'rejected' ? 'bg-red-500/10 border-red-500/20 text-red-500' :
                            'bg-white/5 border-white/10 text-slate-300'
                          }`}>
                          {job.status}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {activeSection === 'settings' && (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-12">
                <div className="glass-panel p-12 rounded-[4rem] border border-white/10 bg-white/[0.02] relative overflow-hidden group">
                  <Settings className="absolute top-10 right-10 w-32 h-32 text-white/5 group-hover:rotate-45 transition-transform duration-1000" />

                  <div className="relative z-10">
                    <div className="flex flex-wrap items-center justify-between gap-8 mb-12">
                      <div>
                        <p className="text-[10px] font-black text-cyan-500 uppercase tracking-[0.4em] mb-3 italic">ACCOUNT & PROFILE</p>
                        <h3 className="text-3xl font-black text-white italic tracking-tighter uppercase">Your Profile</h3>
                      </div>
                      <div className="flex gap-3">
                        {!isEditingProfile ? (
                          <button onClick={() => setIsEditingProfile(true)} className="px-6 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl border border-white/10 text-[10px] font-black uppercase tracking-widest transition-all">Edit ID</button>
                        ) : (
                          <>
                            <button onClick={handleUpdateProfile} disabled={isSavingProfile} className="px-6 py-3 bg-cyan-500 text-black rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg glow-cyan">{isSavingProfile ? 'Saving...' : 'Confirm'}</button>
                            <button onClick={() => setIsEditingProfile(false)} className="px-6 py-3 bg-white/5 text-slate-400 rounded-xl text-[10px] font-black uppercase tracking-widest border border-white/10">Cancel</button>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-12 gap-10">
                      <div className="md:col-span-4 lg:col-span-3 flex flex-col items-center gap-6">
                        <div className="relative group/avatar cursor-pointer" onClick={() => setShowProfilePictureModal(true)}>
                          <div className="w-40 h-40 rounded-[3rem] overflow-hidden bg-white/5 border-2 border-dashed border-white/20 flex items-center justify-center relative shadow-inner">
                            {user?.profile_picture && isValidImageUrl(user.profile_picture) ? (
                              <img src={user.profile_picture} alt="Avatar" className="w-full h-full object-cover transition-transform duration-700 group-hover/avatar:scale-110" />
                            ) : (
                              <User className="w-12 h-12 text-white/20" />
                            )}
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover/avatar:opacity-100 transition-opacity flex items-center justify-center">
                              <Camera className="w-6 h-6 text-white" />
                            </div>
                          </div>
                        </div>
                        <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest text-center">Profile Picture</p>
                      </div>

                      <div className="md:col-span-8 lg:col-span-9 space-y-8">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                          <div className="space-y-3">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Username</label>
                            <input
                              disabled={!isEditingProfile}
                              value={editedUsername}
                              onChange={(e) => setEditedUsername(e.target.value)}
                              className="w-full bg-black/40 border border-white/10 rounded-2xl px-6 py-4 text-white focus:outline-none focus:border-cyan-500/50 transition-all font-mono"
                            />
                          </div>
                          <div className="space-y-3">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Full Name</label>
                            <input
                              disabled={!isEditingProfile}
                              value={editedFullName}
                              onChange={(e) => setEditedFullName(e.target.value)}
                              className="w-full bg-black/40 border border-white/10 rounded-2xl px-6 py-4 text-white focus:outline-none focus:border-cyan-500/50 transition-all font-mono"
                            />
                          </div>
                        </div>

                        <div className="pt-8 border-t border-white/5">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-white font-black uppercase text-xs tracking-widest italic">Preferences</p>
                              <p className="text-slate-500 text-[10px] uppercase font-mono mt-1">Customize your experience</p>
                            </div>
                            <div className="flex gap-4">
                              <button className="p-3 bg-white/5 rounded-xl border border-white/5 hover:bg-cyan-500/10 transition-all group">
                                <Zap className="w-4 h-4 text-slate-600 group-hover:text-cyan-500" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Subscription Card */}
                <div className="glass-panel p-12 rounded-[4rem] border border-white/10 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 relative group overflow-hidden">
                  <Crown className="absolute top-10 right-10 w-24 h-24 text-indigo-500/10 group-hover:scale-110 transition-transform duration-1000" />
                  <div className="relative z-10 flex flex-col md:flex-row items-center gap-10">
                    <div className="w-20 h-20 bg-indigo-500/10 rounded-3xl flex items-center justify-center border border-indigo-500/20 ">
                      <Zap className="w-10 h-10 text-indigo-500 glow-indigo" />
                    </div>
                    <div className="flex-1 text-center md:text-left">
                      <h4 className="text-2xl font-black text-white italic tracking-tighter uppercase mb-2">Your Plan: {user?.is_premium ? 'Pillar Elite Pro' : 'Free'}</h4>
                      <p className="text-slate-500 text-sm italic font-medium">Your plan determines what features you can access and your visibility on the leaderboard.</p>
                    </div>
                    <div className="flex flex-col gap-3 min-w-[200px]">
                      {user?.is_premium ? (
                        <button onClick={() => setShowCancelModal(true)} className="w-full px-8 py-4 bg-white/5 hover:bg-red-500/10 text-slate-400 hover:text-red-400 rounded-2xl border border-white/10 transition-all text-[10px] font-black uppercase tracking-widest">Cancel Subscription</button>
                      ) : (
                        <button onClick={() => router.push('/pricing')} className="w-full px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-700 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-2xl hover:scale-105 active:scale-95 transition-all">Upgrade to Pro</button>
                      )
                      }
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </div>

        {/* Close Button UI - Top Right */}
        <button
          onClick={onClose}
          className="absolute top-12 right-12 w-14 h-14 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/10 flex items-center justify-center transition-all z-50 group active:scale-90"
        >
          <X className="w-6 h-6 text-slate-400 group-hover:text-white transition-colors" />
        </button>
      </motion.div>
    </div>,
    document.body
  )
}

function Camera(props) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
      <circle cx="12" cy="13" r="3" />
    </svg>
  )
}
