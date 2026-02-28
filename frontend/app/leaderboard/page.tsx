'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Trophy, Star, MapPin, Search, ArrowUpRight, Crown, Medal, Activity, Zap, Shield, Target, Radio, Cpu, Terminal, Box } from 'lucide-react'
import Navbar from '../../components/Navbar'
import Footer from '../../components/Footer'
import axios from 'axios'
import { API_URL } from '@/lib/api-config'
import Link from 'next/link'
import AuthModal from '../../components/AuthModal'
import DashboardModal from '../../components/DashboardModal'

export default function LeaderboardPage() {
    const [leaderboard, setLeaderboard] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [filterBy, setFilterBy] = useState('rating')
    const [searchTerm, setSearchTerm] = useState('')
    const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({})
    const [showAuthModal, setShowAuthModal] = useState(false)
    const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>('login')
    const [showDashboard, setShowDashboard] = useState(false)

    useEffect(() => {
        fetchLeaderboard()
    }, [filterBy])

    const fetchLeaderboard = async () => {
        setLoading(true)
        try {
            const response = await axios.get(`${API_URL}/api/v1/skillvibe/leaderboard`, {
                params: { by: filterBy }
            })
            setLeaderboard(response.data)
        } catch (error) {
            console.error("Failed to fetch leaderboard")
        } finally {
            setLoading(false)
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

            <main className="pt-40 pb-40 relative z-10 container mx-auto px-6">
                <div className="max-w-6xl mx-auto">

                    {/* Header Section */}
                    <div className="text-center mb-24 relative">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="inline-flex items-center gap-3 px-6 py-2 rounded-full glass-panel border border-cyan-500/30 text-cyan-500 text-[10px] font-black uppercase tracking-[0.4em] mb-10 glow-cyan"
                        >
                            <Activity className="w-4 h-4" />
                            GLOBAL TALENT RANKINGS
                        </motion.div>

                        <h1 className="text-6xl md:text-9xl font-black text-white tracking-tighter mb-8 leading-[0.85] uppercase italic">
                            THE <span className="text-gradient-cyan">TOP TALENT.</span>
                        </h1>

                        <p className="text-xl text-slate-500 font-bold max-w-2xl mx-auto leading-relaxed uppercase tracking-tight opacity-80">
                            Real professionals ranked by skills, <br />
                            achievements, and verified work experience.
                        </p>
                    </div>

                    {/* Controls */}
                    <div className="flex flex-col lg:flex-row gap-8 mb-20 items-center justify-between">
                        <div className="flex flex-wrap gap-4 glass-panel p-2 rounded-2xl border border-white/10 backdrop-blur-3xl w-full lg:w-auto overflow-x-auto no-scrollbar">
                            {[
                                { id: 'rating', label: 'TOP RANKED', icon: Target },
                                { id: 'skill', label: 'TOP SKILLS', icon: Zap },
                                { id: 'location', label: 'BY LOCATION', icon: MapPin }
                            ].map((f) => (
                                <button
                                    key={f.id}
                                    onClick={() => setFilterBy(f.id)}
                                    className={`px-8 py-4 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-500 flex items-center gap-3 whitespace-nowrap ${filterBy === f.id
                                        ? 'bg-cyan-500 text-black shadow-xl shadow-cyan-500/30 glow-cyan'
                                        : 'text-slate-500 hover:text-white hover:bg-white/5'
                                        }`}
                                >
                                    <f.icon className="w-4 h-4" />
                                    {f.label}
                                </button>
                            ))}
                        </div>

                        <div className="relative w-full lg:w-96 group">
                            <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-600 group-focus-within:text-cyan-500 transition-colors" />
                            <input
                                type="text"
                                placeholder="Search by name or username..."
                                className="w-full pl-16 pr-6 py-5 bg-white/[0.03] border border-white/10 rounded-2xl text-[11px] font-black uppercase tracking-widest focus:ring-2 ring-cyan-500/20 transition-all outline-none text-white transition-all duration-500 group-hover:border-cyan-500/30"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Rankings List */}
                    <div className="space-y-8">
                        <AnimatePresence mode="popLayout">
                            {loading ? (
                                Array(5).fill(0).map((_, i) => (
                                    <div key={i} className="h-40 w-full bg-white/5 rounded-[3rem] animate-pulse border border-white/5" />
                                ))
                            ) : (
                                leaderboard.filter(u =>
                                    (u.username || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                                    (u.full_name || '').toLowerCase().includes(searchTerm.toLowerCase())
                                ).map((user, index) => (
                                    <motion.div
                                        key={user.username}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: index * 0.05 }}
                                        className="group glass-card p-10 md:p-12 rounded-[4rem] border border-white/10 hover:border-cyan-500/40 transition-all duration-700 flex flex-col md:row items-center gap-10 relative overflow-hidden md:flex-row"
                                    >
                                        <div className="absolute inset-0 bg-cyber-grid opacity-5 pointer-events-none" />

                                        {/* Rank Identifier */}
                                        <div className="flex-shrink-0 w-24 h-24 flex items-center justify-center font-black text-5xl text-white/5 italic relative">
                                            {index === 0 ? <Crown className="w-16 h-16 text-amber-500 glow-amber" /> :
                                                index === 1 ? <Medal className="w-14 h-14 text-slate-400 opacity-50" /> :
                                                    index === 2 ? <Medal className="w-14 h-14 text-amber-700 opacity-50" /> :
                                                        <span className="group-hover:text-cyan-500 transition-colors duration-700">#{index + 1}</span>}
                                        </div>

                                        {/* Profile Core */}
                                        <div className="w-28 h-28 bg-black rounded-[2rem] flex-shrink-0 border-2 border-white/10 shadow-2xl overflow-hidden relative group-hover:glow-cyan group-hover:scale-105 transition-all duration-700">
                                            {user.profile_picture && !imageErrors[user.username] ? (
                                                <img
                                                    src={user.profile_picture}
                                                    onError={() => setImageErrors(prev => ({ ...prev, [user.username]: true }))}
                                                    className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700"
                                                    alt=""
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center font-black text-white/20 text-4xl uppercase">
                                                    {(user.full_name || user.username || 'U').charAt(0)}
                                                </div>
                                            )}
                                        </div>

                                        {/* Signal Metadata */}
                                        <div className="flex-grow text-center md:text-left space-y-4">
                                            <div>
                                                <h3 className="text-3xl md:text-4xl font-black text-white tracking-tighter flex flex-col md:flex-row items-center gap-3 uppercase italic">
                                                    {user.full_name}
                                                    <span className="text-[10px] font-black text-cyan-500/40 uppercase tracking-[0.3em] font-mono not-italic">[@{user.username}]</span>
                                                </h3>
                                            </div>

                                            <div className="flex flex-wrap items-center justify-center md:justify-start gap-8">
                                                <div className="flex items-center gap-3 text-white font-black text-[10px] uppercase tracking-[0.2em] bg-cyan-500/10 px-4 py-2 rounded-xl border border-cyan-500/20 glow-cyan">
                                                    <Radio className="w-4 h-4 text-cyan-500" />
                                                    {user.ranking_score.toLocaleString()} POINTS
                                                </div>
                                                <div className="flex items-center gap-3 text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] px-4 py-2 border border-white/5 rounded-xl">
                                                    <Shield className="w-4 h-4 text-slate-600" />
                                                    VERIFIED
                                                </div>
                                            </div>
                                        </div>

                                        {/* Action Node */}
                                        <Link
                                            href={`/profile/${user.slug}`}
                                            className="w-full md:w-auto px-10 py-6 bg-white text-black font-black rounded-2xl shadow-xl hover:bg-cyan-500 transition-all duration-500 text-[11px] uppercase tracking-[0.3em] flex items-center justify-center gap-4 relative z-10 hover:glow-cyan"
                                        >
                                            VIEW PROFILE
                                            <ArrowUpRight className="w-5 h-5" />
                                        </Link>

                                        {/* Scanline Effect */}
                                        <div className="absolute top-0 left-0 w-full h-[2px] bg-cyan-500/20 blur-sm opacity-0 group-hover:opacity-100 group-hover:animate-scanline pointer-events-none" />
                                    </motion.div>
                                ))
                            )}
                        </AnimatePresence>
                    </div>

                </div>
            </main>

            <Footer />
        </div>
    )
}
