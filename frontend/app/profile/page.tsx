'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Sparkles, Upload, ArrowRight, User, Settings, Edit2, Check, Eye, EyeOff, Globe, Lock, Shield, Zap, Activity, Cpu, Terminal, Radio, Network, Clock, ArrowUp, Star, MessageSquare, AlertTriangle } from 'lucide-react'
import Navbar from '../../components/Navbar'
import Footer from '../../components/Footer'
import { useAuth } from '../../contexts/AuthContext'
import axios from 'axios'
import { API_URL } from '@/lib/api-config'
import { requestCache } from '@/lib/cache-util'
import toast from 'react-hot-toast'
import AuthModal from '../../components/AuthModal'
import DashboardModal from '../../components/DashboardModal.jsx'

export default function ProfileRedirectPage() {
    const { user, isAuthenticated, isLoading } = useAuth()
    const router = useRouter()
    const [status, setStatus] = useState<'loading' | 'no-profile' | 'ready' | 'not-authenticated'>('loading')
    const [slug, setSlug] = useState<string | null>(null)
    const [isPublic, setIsPublic] = useState(true)
    const [isEditingSlug, setIsEditingSlug] = useState(false)
    const [newSlug, setNewSlug] = useState('')
    const [isUpdating, setIsUpdating] = useState(false)
    const [showAuthModal, setShowAuthModal] = useState(false)
    const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>('login')
    const [showDashboard, setShowDashboard] = useState(false)
    const [vibeHistory, setVibeHistory] = useState<any[]>([])
    const [vibeScores, setVibeScores] = useState({ trust_score: 0, elite_rating: 0, verification_stage: 1 })

    useEffect(() => {
        if (isLoading) return

        if (!isAuthenticated || !user) {
            setStatus('not-authenticated')
            return
        }

        const fetchMyProfile = async () => {
            try {
                const response = await requestCache.get('my-profile-slug', async () => {
                    const res = await axios.get(`${API_URL}/api/v1/skillvibe/my-profile`, {
                        headers: { 'Authorization': `Bearer ${localStorage.getItem('access_token')}` }
                    })
                    return res.data
                }, 60000)

                if (response?.slug) {
                    setSlug(response.slug)
                    setNewSlug(response.slug)
                    setIsPublic(response.is_public ?? true)
                    setStatus('ready')

                    // Only fetch vibe history for premium users
                    if (user?.is_premium) {
                        try {
                            const historyRes = await axios.get(`${API_URL}/api/v1/skillvibe/vibe-history/me`, {
                                headers: { 'Authorization': `Bearer ${localStorage.getItem('access_token')}` }
                            })
                            if (historyRes.data) {
                                setVibeHistory(historyRes.data.history || [])
                                setVibeScores({
                                    trust_score: historyRes.data.trust_score || 0,
                                    elite_rating: historyRes.data.elite_rating || 0,
                                    verification_stage: historyRes.data.verification_stage || 1
                                })
                            }
                        } catch (err) {
                            console.error("Could not load history", err)
                        }
                    }
                }
            } catch (error: any) {
                if (error.response?.status === 404) {
                    setStatus('no-profile')
                } else {
                    toast.error('Could not load your profile. Please try again.')
                    setStatus('no-profile')
                }
            }
        }

        fetchMyProfile()
    }, [isAuthenticated, user, isLoading])

    const updateSettings = async (updates: any) => {
        setIsUpdating(true)
        try {
            const token = localStorage.getItem('access_token')
            const response = await axios.patch(`${API_URL}/api/v1/skillvibe/profile/settings`, updates, {
                headers: { 'Authorization': `Bearer ${token}` }
            })
            if (response.data.slug) setSlug(response.data.slug)
            if (response.data.hasOwnProperty('is_public')) setIsPublic(response.data.is_public)

            requestCache.invalidate('my-profile-slug')
            toast.success('Settings saved!')
        } catch (error: any) {
            toast.error(error.response?.data?.detail || 'Failed to save settings. Please try again.')
        } finally {
            setIsUpdating(false)
        }
    }

    const toggleVisibility = () => {
        updateSettings({ is_public: !isPublic })
    }

    const saveSlug = () => {
        if (!newSlug.trim() || newSlug === slug) {
            setIsEditingSlug(false)
            return
        }
        updateSettings({ slug: newSlug })
        setIsEditingSlug(false)
    }

    return (
        <div className="min-h-screen bg-black font-sans selection:bg-cyan-500/30 overflow-x-hidden">
            <Navbar
                onSignIn={() => { setShowAuthModal(true); setAuthModalMode('login') }}
                onSignUp={() => { setShowAuthModal(true); setAuthModalMode('register') }}
                onUserDashboard={() => setShowDashboard(true)}
            />

            <AuthModal
                isOpen={showAuthModal}
                onClose={() => setShowAuthModal(false)}
                initialMode={authModalMode}
            />
            <DashboardModal
                isOpen={showDashboard}
                onClose={() => setShowDashboard(false)}
            />

            {/* Background Decor */}
            <div className="fixed inset-0 bg-cyber-grid opacity-10 pointer-events-none" />
            <div className="fixed inset-0 bg-gradient-to-b from-cyan-500/5 via-transparent to-transparent pointer-events-none" />

            <main className="pt-48 pb-48 relative z-10 container mx-auto px-6">
                <div className="max-w-3xl mx-auto text-center">

                    {/* Loading State */}
                    {status === 'loading' && (
                        <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-12">
                            <div className="relative">
                                <motion.div
                                    animate={{ rotate: 360 }}
                                    transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                                    className="w-32 h-32 border-2 border-cyan-500/20 border-t-cyan-500 rounded-[2.5rem] glow-cyan"
                                />
                                <Activity className="absolute inset-0 m-auto w-10 h-10 text-cyan-500 animate-pulse" />
                            </div>
                            <div className="space-y-4">
                                <p className="text-cyan-500 font-black uppercase tracking-[0.5em] animate-pulse italic">
                                    Loading your profile...
                                </p>
                                <div className="h-1 w-48 bg-white/5 rounded-full mx-auto overflow-hidden">
                                    <motion.div
                                        animate={{ x: [-192, 192] }}
                                        transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                                        className="h-full w-full bg-cyan-500 glow-cyan"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Not Authenticated */}
                    {status === 'not-authenticated' && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="glass-card rounded-[4rem] p-16 md:p-24 border border-white/10 relative overflow-hidden group"
                        >
                            <div className="absolute inset-0 bg-cyber-grid opacity-10" />
                            <div className="relative z-10">
                                <div className="w-24 h-24 bg-cyan-500/10 rounded-[2.5rem] flex items-center justify-center mx-auto mb-10 border border-cyan-500/20 group-hover:glow-cyan transition-all duration-700">
                                    <Shield className="w-12 h-12 text-cyan-500" />
                                </div>
                                <h1 className="text-5xl md:text-7xl font-black text-white tracking-tighter mb-8 uppercase italic leading-none">
                                    Sign In Required
                                </h1>
                                <p className="text-slate-500 mb-14 text-xl font-bold uppercase tracking-tight max-w-md mx-auto opacity-70">
                                    You need to be signed in to view your profile.
                                </p>
                                <button
                                    onClick={() => { setShowAuthModal(true); setAuthModalMode('login'); }}
                                    className="px-16 py-6 bg-cyan-500 text-black font-black rounded-2xl uppercase tracking-[0.3em] text-xs shadow-xl shadow-cyan-500/30 hover:glow-cyan transition-all duration-500 hover:scale-105 active:scale-95 italic"
                                >
                                    SIGN IN
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {/* Profile Ready */}
                    {status === 'ready' && slug && (
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="space-y-12"
                        >
                            {/* Main Status Panel */}
                            <div className="glass-card rounded-[4rem] p-10 md:p-16 border border-white/10 relative overflow-hidden group shadow-2xl">
                                <div className="absolute inset-0 bg-cyber-grid opacity-5 pointer-events-none" />
                                <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-cyan-500 to-transparent animate-scanline" />

                                <div className="relative z-10">
                                    <div className="inline-flex items-center gap-3 px-5 py-2 rounded-xl bg-cyan-500/10 text-cyan-500 text-[10px] font-black uppercase tracking-[0.4em] border border-cyan-500/20 glow-cyan mb-10">
                                        <Radio className="w-4 h-4" />
                                        PROFILE LIVE
                                    </div>

                                    <h2 className="text-4xl md:text-6xl font-black text-white tracking-tighter mb-6 uppercase italic">
                                        Your portfolio is ready.
                                    </h2>
                                    <p className="text-slate-500 mb-14 text-lg font-bold leading-relaxed uppercase tracking-tight max-w-xl mx-auto opacity-70">
                                        We've built a premium portfolio page for you.
                                        It's now live and visible to recruiters worldwide.
                                    </p>

                                    <div className="flex flex-col sm:flex-row gap-4 max-w-lg mx-auto">
                                        <div className="flex-1 p-8 bg-white/[0.02] border border-white/5 rounded-[2.5rem] text-left group/box hover:border-cyan-500/30 transition-all duration-700 relative overflow-hidden">
                                            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-transparent opacity-0 group-hover/box:opacity-100 transition-opacity" />
                                            <div className="relative z-10">
                                                <div className="flex items-center justify-between mb-4">
                                                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-cyan-500/60">YOUR LINK</span>
                                                    <div className="w-2 h-2 rounded-full bg-cyan-500 glow-cyan" />
                                                </div>
                                                <h3 className="text-xl font-black text-white mb-8 italic uppercase">PUBLIC PORTFOLIO</h3>

                                                <div className="flex flex-col gap-3">
                                                    <button
                                                        onClick={() => window.open(`/profile/${slug}`, '_blank')}
                                                        className="w-full py-4 bg-white text-black font-black rounded-xl text-[10px] uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-cyan-500 transition-all duration-500 hover:glow-cyan"
                                                    >
                                                        VIEW MY PAGE <ArrowRight className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            navigator.clipboard.writeText(`${window.location.origin}/profile/${slug}`)
                                                            toast.success('Link copied!')
                                                        }}
                                                        className="w-full py-4 bg-white/5 text-white/50 font-black rounded-xl text-[10px] uppercase tracking-widest hover:bg-white/10 hover:text-white transition-all duration-500"
                                                    >
                                                        COPY LINK
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Settings Panel */}
                            <div className="glass-card rounded-[3rem] p-10 md:p-14 border border-white/10 relative overflow-hidden group text-left">
                                <div className="absolute inset-0 bg-cyber-grid opacity-5 pointer-events-none" />

                                <div className="flex items-center gap-4 mb-12">
                                    <div className="p-3 bg-cyan-500/10 rounded-2xl border border-cyan-500/20 glow-cyan">
                                        <Cpu className="w-6 h-6 text-cyan-500" />
                                    </div>
                                    <h3 className="text-2xl font-black text-white tracking-tighter uppercase italic">PAGE SETTINGS</h3>
                                </div>

                                <div className="space-y-10">
                                    {/* Visibility Toggle */}
                                    <div className="flex items-center justify-between p-6 bg-white/[0.02] rounded-[2rem] border border-white/5 relative overflow-hidden group/item">
                                        <div className="flex items-center gap-6 relative z-10">
                                            <div className={`p-4 rounded-2xl border-2 transition-all duration-700 ${isPublic ? 'bg-cyan-500/10 border-cyan-500/20 text-cyan-500 glow-cyan' : 'bg-red-500/10 border-red-500/20 text-red-500 glow-red'}`}>
                                                {isPublic ? <Network className="w-6 h-6" /> : <Lock className="w-6 h-6" />}
                                            </div>
                                            <div>
                                                <p className="font-black text-white uppercase tracking-widest text-[11px] mb-1">VISIBILITY</p>
                                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">{isPublic ? 'PUBLIC — Anyone can find your profile' : 'HIDDEN — Not visible to others'}</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={toggleVisibility}
                                            disabled={isUpdating}
                                            className={`w-16 h-8 rounded-full transition-all duration-500 relative bg-black border-2 ${isPublic ? 'border-cyan-500 glow-cyan' : 'border-slate-800'} ${isUpdating ? 'opacity-50 cursor-not-allowed' : ''}`}
                                        >
                                            <motion.div
                                                animate={{ x: isPublic ? 32 : 0 }}
                                                className={`absolute top-1 left-1 w-4 h-4 rounded-full shadow-lg ${isPublic ? 'bg-cyan-500' : 'bg-slate-700'}`}
                                            />
                                        </button>
                                    </div>

                                    {/* Custom Slug Edit */}
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between px-2">
                                            <p className="font-black text-white uppercase tracking-widest text-[11px]">YOUR PROFILE URL</p>
                                            <span className={`text-[9px] font-black uppercase tracking-[0.3em] ${user?.is_premium ? 'text-emerald-500' : 'text-amber-500'}`}>
                                                {user?.is_premium ? 'CUSTOM LINK' : 'PRO FEATURE'}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-4 bg-white/[0.02] p-5 rounded-[1.5rem] border border-white/5 group/input focus-within:border-cyan-500/30 transition-all duration-700">
                                            <div className="text-slate-600 text-[10px] font-black uppercase tracking-widest pr-4 border-r border-white/5">
                                                skillvibe.entrext.com/profile/
                                            </div>
                                            {isEditingSlug && user?.is_premium ? (
                                                <input
                                                    value={newSlug}
                                                    onChange={(e) => setNewSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                                                    onKeyDown={(e) => e.key === 'Enter' && saveSlug()}
                                                    className="bg-transparent border-none outline-none text-xs font-black text-white flex-1 min-w-0 uppercase tracking-widest placeholder-white/10"
                                                    autoFocus
                                                    placeholder="your-name"
                                                />
                                            ) : (
                                                <span className="text-xs font-black text-white flex-1 truncate uppercase tracking-widest">{slug}</span>
                                            )}
                                            <button
                                                onClick={isEditingSlug ? saveSlug : () => user?.is_premium ? setIsEditingSlug(true) : toast.error('Upgrade to Pillar Elite to customize your portfolio URL')}
                                                disabled={isUpdating || !user?.is_premium}
                                                className={`p-3 rounded-xl transition-all duration-500 ${isEditingSlug ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : user?.is_premium ? 'bg-white/5 text-slate-500 border border-white/5 hover:text-cyan-500 hover:border-cyan-500/30' : 'bg-amber-500/10 text-amber-500 border border-amber-500/20 cursor-not-allowed opacity-50'}`}
                                            >
                                                {isEditingSlug ? (
                                                    <Check className="w-4 h-4" />
                                                ) : user?.is_premium ? (
                                                    <Edit2 className="w-4 h-4" />
                                                ) : (
                                                    <Lock className="w-4 h-4" />
                                                )}
                                            </button>
                                        </div>
                                        <p className="text-[9px] text-slate-700 font-bold uppercase tracking-tight pl-2 px-1">
                                            {user?.is_premium ? 'Only letters, numbers and hyphens allowed.' : '🔒 Custom URLs are available with Pillar Elite'}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Vibe History Panel */}
                            <div className="glass-card rounded-[3rem] p-10 md:p-14 border border-white/10 relative overflow-hidden group text-left mt-8">
                                <div className="absolute inset-0 bg-cyber-grid opacity-5 pointer-events-none" />

                                {/* Lock Overlay for Non-Premium Users */}
                                {!user?.is_premium && (
                                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-50 rounded-[3rem] flex items-center justify-center">
                                        <div className="text-center">
                                            <Lock className="w-12 h-12 text-amber-500 mx-auto mb-4" />
                                            <p className="text-[10px] font-black text-amber-400 uppercase tracking-widest mb-3">PREMIUM FEATURE</p>
                                            <p className="text-xs text-slate-300 mb-6 max-w-xs">Unlock your Vibe tracking history with Pillar Elite</p>
                                            <a href="/pricing" className="inline-block px-6 py-3 bg-amber-500 text-black font-black text-[10px] uppercase tracking-widest rounded-lg hover:bg-amber-400 transition-colors">
                                                UPGRADE TO PRO
                                            </a>
                                        </div>
                                    </div>
                                )}

                                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6 mb-12 relative z-10 w-full justify-between pr-4">
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 bg-indigo-500/10 rounded-2xl border border-indigo-500/20 shadow-[0_0_15px_rgba(99,102,241,0.2)]">
                                            <Clock className="w-6 h-6 text-indigo-500" />
                                        </div>
                                        <div>
                                            <h3 className="text-2xl font-black text-white tracking-tighter uppercase italic">Vibe History</h3>
                                            <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mt-1">Track your Trust & Prowess points</p>
                                        </div>
                                    </div>

                                    <div className="flex flex-row flex-wrap gap-3">
                                        <div className="px-4 py-2 bg-indigo-500/10 border border-indigo-500/30 rounded-xl text-indigo-400 text-xs font-black uppercase tracking-widest flex items-center gap-2 shadow-[0_0_15px_rgba(99,102,241,0.2)]">
                                            <span className="text-white text-lg">{vibeScores.trust_score}</span> <span className="opacity-70 text-[8px]">Trust</span>
                                        </div>
                                        <div className="px-4 py-2 bg-cyan-500/10 border border-cyan-500/30 rounded-xl text-cyan-400 text-xs font-black uppercase tracking-widest flex items-center gap-2 shadow-[0_0_15px_rgba(6,182,212,0.2)]">
                                            <span className="text-white text-lg">{vibeScores.elite_rating}%</span> <span className="opacity-70 text-[8px]">Prowess</span>
                                        </div>
                                        <div className={`px-4 py-2 border rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-2 shadow-xl ${vibeScores.verification_stage === 3 ? 'bg-purple-500/10 border-purple-500/30 text-purple-400' : vibeScores.verification_stage === 2 ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400' : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'}`}>
                                            <span className="text-white text-sm">STAGE {vibeScores.verification_stage}</span>
                                            <span className="opacity-70 text-[8px] tracking-tighter">
                                                {vibeScores.verification_stage === 3 ? 'TITAN' : vibeScores.verification_stage === 2 ? 'PILLAR' : 'SEED'}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div
                                    className="relative z-10 space-y-4 max-h-[400px] overflow-y-auto custom-scrollbar pr-4 overscroll-contain"
                                    data-lenis-prevent="true"
                                >
                                    {!user?.is_premium ? (
                                        <div className="text-center py-10 opacity-50">
                                            <p className="text-xs uppercase tracking-widest text-slate-400 font-bold">Content locked for free users.</p>
                                        </div>
                                    ) : vibeHistory.length === 0 ? (
                                        <div className="text-center py-10 opacity-50">
                                            <p className="text-xs uppercase tracking-widest text-slate-400 font-bold">No tracking history yet.</p>
                                        </div>
                                    ) : (
                                        vibeHistory.map((item, index) => (
                                            <div key={index} className="flex flex-col sm:flex-row gap-4 sm:items-center justify-between p-5 bg-white/[0.02] rounded-3xl border border-white/5 hover:border-indigo-500/30 transition-all duration-300">
                                                <div className="flex items-start gap-4">
                                                    <div className={`p-3 rounded-2xl border-2 ${item.type === 'interaction' ? 'bg-cyan-500/10 border-cyan-500/20 text-cyan-500' : item.type === 'vibe_note' ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-500' : 'bg-red-500/10 border-red-500/20 text-red-500'}`}>
                                                        {item.type === 'interaction' && item.action_label === 'Signal Boost' && <ArrowUp className="w-4 h-4" />}
                                                        {item.type === 'interaction' && item.action_label === 'Shortlisted' && <Star className="w-4 h-4" />}
                                                        {item.type === 'vibe_note' && <MessageSquare className="w-4 h-4" />}
                                                        {item.type === 'report' && <AlertTriangle className="w-4 h-4" />}
                                                    </div>
                                                    <div>
                                                        <h4 className="text-sm font-black text-white uppercase tracking-widest mb-1">{item.action_label}</h4>
                                                        <div className="flex flex-wrap items-center gap-2 text-[10px] uppercase font-bold text-slate-400">
                                                            <span className="text-white">{item.author_name}</span>
                                                            <span className="px-2 border border-white/10 rounded-full text-[8px] tracking-widest">{item.author_role}</span>
                                                            <span>•</span>
                                                            <span>{new Date(item.created_at).toLocaleDateString()}</span>
                                                        </div>
                                                        {item.content && (
                                                            <p className="mt-2 text-xs text-slate-300 italic">"{item.content}"</p>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="flex sm:flex-col gap-2 sm:gap-1 justify-end shrink-0 pl-16 sm:pl-0">
                                                    {item.points_prowess !== 0 && (
                                                        <div className={`px-3 py-1 bg-cyan-500/10 border border-cyan-500/30 rounded-full text-cyan-400 text-[10px] font-black uppercase tracking-widest text-center shadow-[0_0_10px_rgba(6,182,212,0.2)] ${item.points_prowess < 0 ? 'text-red-400 bg-red-500/10 border-red-500/30 shadow-red-500/20' : ''}`}>
                                                            {item.points_prowess > 0 ? '+' : ''}{item.points_prowess}% Prowess
                                                        </div>
                                                    )}
                                                    {item.points_trust !== 0 && (
                                                        <div className={`px-3 py-1 bg-indigo-500/10 border border-indigo-500/30 rounded-full text-indigo-400 text-[10px] font-black uppercase tracking-widest text-center shadow-[0_0_10px_rgba(99,102,241,0.2)] ${item.points_trust < 0 ? 'text-red-400 bg-red-500/10 border-red-500/30 shadow-red-500/20' : ''}`}>
                                                            {item.points_trust > 0 ? '+' : ''}{item.points_trust} Trust
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* No Profile Yet */}
                    {status === 'no-profile' && (
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="glass-card rounded-[4rem] p-16 md:p-24 border border-white/10 relative overflow-hidden group shadow-2xl"
                        >
                            <div className="absolute inset-0 bg-cyber-grid opacity-10" />
                            <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-cyan-500 to-transparent animate-scanline" />

                            <div className="relative z-10">
                                <div className="w-24 h-24 bg-cyan-500/10 rounded-[2.5rem] flex items-center justify-center mx-auto mb-10 border border-cyan-500/20 group-hover:glow-cyan transition-all duration-700">
                                    <Upload className="w-12 h-12 text-cyan-500" />
                                </div>
                                <h1 className="text-5xl md:text-7xl font-black text-white tracking-tighter mb-8 uppercase italic leading-none">
                                    No Profile Yet.
                                </h1>
                                <p className="text-slate-500 mb-14 text-xl font-bold uppercase tracking-tight max-w-md mx-auto opacity-70">
                                    You haven't created a portfolio yet.
                                    Upload your resume to get started.
                                </p>
                                <button
                                    onClick={() => router.push('/')}
                                    className="px-16 py-6 bg-cyan-500 text-black font-black rounded-2xl uppercase tracking-[0.3em] text-xs shadow-xl shadow-cyan-500/30 hover:glow-cyan transition-all duration-500 hover:scale-105 active:scale-95 italic"
                                >
                                    CREATE MY PORTFOLIO
                                </button>
                            </div>
                        </motion.div>
                    )}

                </div>
            </main>

            <Footer />
        </div>
    )
}
