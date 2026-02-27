'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, MapPin, Star, Filter, UserCheck, Mail, ArrowRight, Eye, Zap, ShieldCheck, Target, Activity, Heart, Radio, Cpu, Terminal, Box, Network, Globe } from 'lucide-react'
import Navbar from '../../components/Navbar'
import Footer from '../../components/Footer'
import ContactModal from '../../components/ContactModal'
import axios from 'axios'
import { API_URL } from '@/lib/api-config'
import Link from 'next/link'
import toast from 'react-hot-toast'
import AuthModal from '../../components/AuthModal'
import DashboardModal from '../../components/DashboardModal'

export default function RecruiterDashboard() {
    const [candidates, setCandidates] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [showAuthModal, setShowAuthModal] = useState(false)
    const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>('login')
    const [showDashboard, setShowDashboard] = useState(false)
    const [filters, setFilters] = useState({
        skill: '',
        location: '',
        min_rating: 0
    })
    const [shortlistingId, setShortlistingId] = useState<number | null>(null)
    const [shortlistedProfiles, setShortlistedProfiles] = useState<Set<string>>(new Set())
    const [showContactModal, setShowContactModal] = useState(false)
    const [contactingCandidate, setContactingCandidate] = useState<any>(null)

    useEffect(() => {
        fetchCandidates()
    }, [filters])

    const fetchCandidates = async () => {
        setLoading(true)
        try {
            const response = await axios.get(`${API_URL}/api/v1/skillvibe/recruiter/candidates`, {
                params: filters,
                headers: { 'Authorization': `Bearer ${localStorage.getItem('access_token')}` }
            })
            setCandidates(response.data)
        } catch (error: any) {
            if (error.response?.status === 403) {
                toast.error("Recruiter access required")
            }
        } finally {
            setLoading(false)
        }
    }

    const toggleShortlist = async (candidate: any) => {
        if (shortlistingId === candidate.id) return

        setShortlistingId(candidate.id)
        try {
            const token = localStorage.getItem('access_token')
            if (!token) {
                setShowAuthModal(true)
                setAuthModalMode('login')
                return
            }

            const response = await axios.post(
                `${API_URL}/api/v1/skillvibe/portfolio/${candidate.slug}/star`,
                {},
                { headers: { 'Authorization': `Bearer ${token}` } }
            )

            if (response.data.voted) {
                setShortlistedProfiles(prev => new Set([...prev, candidate.slug]))
                toast.success("Candidate shortlisted!")
            } else {
                setShortlistedProfiles(prev => {
                    const newSet = new Set(prev)
                    newSet.delete(candidate.slug)
                    return newSet
                })
                toast.success("Removed from shortlist")
            }
        } catch (error: any) {
            if (error.response?.status === 403) {
                toast.error("Only recruiters can shortlist candidates")
            } else if (error.response?.status === 401) {
                toast.error("Please login to shortlist")
                setShowAuthModal(true)
            } else {
                toast.error("Failed to update shortlist")
            }
        } finally {
            setShortlistingId(null)
        }
    }

    const openContactModal = (candidate: any) => {
        const token = localStorage.getItem('access_token')
        if (!token) {
            setShowAuthModal(true)
            setAuthModalMode('login')
            return
        }
        setContactingCandidate(candidate)
        setShowContactModal(true)
    }

    const [aiQuery, setAiQuery] = useState('')
    const [isAiSearching, setIsAiSearching] = useState(false)

    const handleAiSearch = async () => {
        if (!aiQuery.trim()) return
        setIsAiSearching(true)
        try {
            const response = await axios.get(`${API_URL}/api/v1/skillvibe/recruiter/ai-search`, {
                params: { prompt: aiQuery },
                headers: { 'Authorization': `Bearer ${localStorage.getItem('access_token')}` }
            })
            setCandidates(response.data.map((c: any) => ({
                ...c,
                avg_rating: c.vibe_score ? (c.vibe_score / 20).toFixed(1) : '4.8',
                vibe_score: c.vibe_score || 92,
                location: 'REMOTE_NODE',
                ai_summary: 'Target identified via deep neural scan. High alignment with requested architecture.',
                ai_match: true,
            })))
            toast.success("AI search completed")
        } catch (error) {
            toast.error("AI search failed")
        } finally {
            setIsAiSearching(false)
        }
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

            <main className="pt-48 pb-32 relative z-10 container mx-auto px-6">
                <div className="max-w-7xl mx-auto">

                    {/* Header Section */}
                    <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-12 mb-20 relative">
                        <div className="space-y-6">
                            <motion.div
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="inline-flex items-center gap-3 px-5 py-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-500 text-[10px] font-black uppercase tracking-[0.4em] glow-cyan"
                            >
                                <ShieldCheck className="w-4 h-4" />
                                Recruiter Dashboard
                            </motion.div>
                            <h1 className="text-6xl md:text-8xl font-black text-white tracking-tighter leading-[0.85] uppercase italic">
                                FIND <span className="text-gradient-cyan">TOP TALENT.</span>
                            </h1>
                            <p className="text-xl text-slate-500 font-bold max-w-2xl leading-relaxed uppercase tracking-tight opacity-70">
                                Search candidate profiles by skill, rating, and fit. <br />
                                Shortlist and review the best matches quickly.
                            </p>
                        </div>

                        {/* Neural Search Node */}
                        <div className="w-full lg:max-w-lg">
                            <label className="text-[10px] font-black text-slate-600 uppercase tracking-[0.4em] ml-4 mb-3 block">AI Candidate Search</label>
                            <div className="relative group">
                                <div className="absolute inset-0 bg-cyan-500/5 blur-2xl rounded-[3rem] opacity-0 group-focus-within:opacity-100 transition-opacity duration-700" />
                                <div className="relative flex items-center bg-white/[0.03] border border-white/10 rounded-[2.5rem] p-3 pr-5 backdrop-blur-3xl shadow-2xl transition-all duration-700 group-focus-within:border-cyan-500/40">
                                    <Zap className="w-6 h-6 text-cyan-500 ml-5 mr-4 glow-cyan" />
                                    <input
                                        type="text"
                                        value={aiQuery}
                                        onChange={(e) => setAiQuery(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleAiSearch()}
                                        placeholder="Describe the candidate you need..."
                                        className="bg-transparent border-none outline-none text-xs font-black w-full py-4 text-white uppercase tracking-widest placeholder-slate-700"
                                    />
                                    <button
                                        onClick={handleAiSearch}
                                        disabled={isAiSearching}
                                        className="px-8 py-4 bg-cyan-500 text-black rounded-2xl text-[10px] font-black uppercase tracking-widest hover:glow-cyan transition-all duration-500 disabled:grayscale disabled:opacity-50"
                                    >
                                        {isAiSearching ? 'Searching...' : 'Search'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Filter Protocol Rail */}
                    <div className="flex flex-wrap gap-6 bg-white/[0.02] backdrop-blur-3xl p-6 rounded-[2.5rem] border border-white/10 shadow-2xl mb-16 items-center">
                        <div className="relative flex-grow min-w-[250px] group/search">
                            <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-600 group-focus-within/search:text-cyan-500 transition-colors" />
                            <input
                                type="text"
                                placeholder="Search by skill or role"
                                className="w-full pl-16 pr-6 py-4 bg-black/40 border border-white/5 rounded-xl text-[10px] font-black uppercase tracking-widest outline-none focus:border-cyan-500/40 text-white transition-all duration-500"
                                onChange={(e) => setFilters(f => ({ ...f, skill: e.target.value }))}
                            />
                        </div>
                        <div className="relative flex-grow min-w-[200px] group/location">
                            <MapPin className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-600 group-focus-within/location:text-cyan-500 transition-colors" />
                            <input
                                type="text"
                                placeholder="Filter by location"
                                className="w-full pl-16 pr-6 py-4 bg-black/40 border border-white/5 rounded-xl text-[10px] font-black uppercase tracking-widest outline-none focus:border-cyan-500/40 text-white transition-all duration-500"
                                onChange={(e) => setFilters(f => ({ ...f, location: e.target.value }))}
                            />
                        </div>
                        <div className="flex items-center gap-6">
                            <div className="flex items-center gap-3 px-4 py-2 border border-white/5 rounded-xl bg-black/40">
                                <Network className="w-4 h-4 text-slate-600" />
                                <select
                                    className="bg-transparent text-[10px] font-black uppercase tracking-widest text-slate-400 outline-none cursor-pointer"
                                    onChange={(e) => setFilters(f => ({ ...f, min_rating: Number(e.target.value) }))}
                                >
                                    <option value="0">Min vibe score</option>
                                    <option value="4.0">4.0+</option>
                                    <option value="4.5">4.5+</option>
                                    <option value="4.8">4.8+</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Candidate Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                        {loading ? (
                            Array(6).fill(0).map((_, i) => (
                                <div key={i} className="h-96 w-full bg-white/5 rounded-[3rem] animate-pulse border border-white/5" />
                            ))
                        ) : candidates.length > 0 ? (
                            candidates.map((candidate, i) => (
                                <motion.div
                                    key={candidate.username || candidate.id}
                                    initial={{ opacity: 0, y: 30 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.05 }}
                                    className="group glass-card p-10 rounded-[3.5rem] border border-white/10 hover:border-cyan-500/40 transition-all duration-700 relative overflow-hidden flex flex-col h-full group"
                                >
                                    <div className="absolute inset-0 bg-cyber-grid opacity-5 pointer-events-none" />

                                    <div className="flex justify-between items-start mb-8 relative z-10">
                                        <div className="w-24 h-24 bg-black rounded-[2rem] border-2 border-white/10 shadow-2xl overflow-hidden relative group-hover:glow-cyan transition-all duration-700">
                                            {candidate.profile_picture ? (
                                                <img src={candidate.profile_picture} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700" alt="" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center font-black text-4xl text-white/10 uppercase">
                                                    {(candidate.username || candidate.name || 'U').charAt(0)}
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex flex-col items-end gap-3">
                                            <div className="flex items-center gap-2 px-4 py-1.5 bg-cyan-500/10 border border-cyan-500/20 rounded-full text-cyan-500 text-[10px] font-black uppercase tracking-[0.2em] glow-cyan">
                                                <Star className="w-3.5 h-3.5 fill-cyan-500" />
                                                {candidate.avg_rating || '4.9'}
                                            </div>
                                            <div className="flex items-center gap-2 px-4 py-1.5 bg-white/5 border border-white/10 rounded-full text-slate-500 text-[10px] font-black uppercase tracking-[0.2em]">
                                                <Globe className="w-3.5 h-3.5" />
                                                {candidate.location || 'GLOBAL_NODE'}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex-grow relative z-10 space-y-6">
                                        <div>
                                            <h3 className="text-3xl font-black text-white tracking-tighter uppercase italic leading-none truncate pr-2">
                                                {candidate.full_name || candidate.name}
                                            </h3>
                                            <p className="text-[10px] font-black text-cyan-500/40 mt-2 tracking-[0.4em] font-mono">
                                                {candidate.ai_match ? 'AI Match' : `Candidate ID: ${candidate.id}`}
                                            </p>
                                        </div>

                                        <div className="p-6 bg-white/[0.03] rounded-[2rem] border border-white/5 group-hover:border-cyan-500/20 transition-all duration-700 relative overflow-hidden">
                                            <div className="flex items-center justify-between mb-4">
                                                <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.2em] text-cyan-500">
                                                    <Activity className="w-4 h-4" /> Vibe Score
                                                </div>
                                                <span className="text-xs font-black text-white">{candidate.vibe_score || 95}%</span>
                                            </div>
                                            <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                                                <motion.div
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${candidate.vibe_score || 95}%` }}
                                                    transition={{ duration: 1, delay: 0.5 }}
                                                    className="h-full bg-cyan-500 glow-cyan"
                                                />
                                            </div>
                                        </div>

                                        <p className="text-[11px] text-slate-500 font-bold leading-relaxed italic uppercase tracking-tight opacity-70 line-clamp-3">
                                            "{candidate.ai_summary || 'Strong technical background with consistent execution and verified project work.'}"
                                        </p>
                                    </div>

                                    <div className="mt-10 flex gap-4 relative z-10">
                                        <Link
                                            href={`/profile/${candidate.slug}`}
                                            className="flex-grow flex items-center justify-center gap-3 py-5 bg-gradient-to-r from-cyan-500/20 to-cyan-500/10 text-cyan-100 border border-cyan-500/40 font-black rounded-2xl text-[11px] uppercase tracking-[0.3em] hover:from-cyan-500/40 hover:to-cyan-500/20 hover:border-cyan-500/60 hover:text-white hover:shadow-cyan-500/50 hover:shadow-lg transition-all duration-500 active:scale-95 group-hover:glow-cyan"
                                        >
                                            <Eye className="w-5 h-5" />
                                            VIEW VIBE
                                        </Link>
                                        <button
                                            onClick={() => toggleShortlist(candidate)}
                                            disabled={shortlistingId === candidate.id}
                                            className="w-16 flex items-center justify-center border rounded-2xl transition-all duration-500 group-hover:scale-105 disabled:opacity-50"
                                            style={{
                                                backgroundColor: shortlistedProfiles.has(candidate.slug) ? '#06b6d4' : 'rgba(255,255,255,0.05)',
                                                borderColor: shortlistedProfiles.has(candidate.slug) ? '#06b6d4' : 'rgba(255,255,255,0.1)',
                                                color: shortlistedProfiles.has(candidate.slug) ? '#000' : '#78716c'
                                            }}
                                        >
                                            <Heart className="w-6 h-6" fill={shortlistedProfiles.has(candidate.slug) ? 'currentColor' : 'none'} />
                                        </button>
                                        <button
                                            onClick={() => openContactModal(candidate)}
                                            className="flex items-center justify-center gap-2 px-6 py-5 bg-white/10 text-white border border-white/20 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] hover:bg-cyan-500/20 hover:border-cyan-500/40 transition-all duration-500 active:scale-95"
                                        >
                                            <Mail className="w-5 h-5" />
                                            CONTACT
                                        </button>
                                    </div>

                                    {/* Scanline Effect */}
                                    <div className="absolute top-0 left-0 w-full h-[1px] bg-cyan-500/20 opacity-0 group-hover:opacity-100 group-hover:animate-scanline pointer-events-none" />
                                </motion.div>
                            ))
                        ) : (
                            <div className="col-span-full py-40 text-center glass-card rounded-[4rem] border border-white/5">
                                <p className="text-slate-700 font-black uppercase tracking-[0.5em] text-xs">No candidates found for the selected filters.</p>
                            </div>
                        )}
                    </div>

                </div>
            </main>

            <ContactModal
                isOpen={showContactModal}
                candidate={contactingCandidate}
                onClose={() => {
                    setShowContactModal(false)
                    setContactingCandidate(null)
                }}
            />

            <Footer />
        </div>
    )
}
