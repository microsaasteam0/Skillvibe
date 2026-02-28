'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import {
    ShieldCheck,
    Sparkles,
    Link as LinkIcon,
    Cpu,
    TrendingUp,
    CheckCircle2,
    AlertTriangle,
    Zap,
    Star,
    UserCheck,
    Search,
    ArrowRight
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import AuthModal from '@/components/AuthModal'
import DashboardModal from '@/components/DashboardModal.jsx'
import Footer from '@/components/Footer'
import { useAuth } from '@/contexts/AuthContext'

export default function VibeTrustPage() {
    const { user, isAuthenticated } = useAuth()
    const [showAuthModal, setShowAuthModal] = useState(false)
    const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>('login')
    const [authModalRole, setAuthModalRole] = useState<'candidate' | 'recruiter' | undefined>(undefined)
    const [showDashboard, setShowDashboard] = useState(false)
    const router = useRouter()

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.1, delayChildren: 0.2 }
        }
    }

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 }
    }

    return (
        <div className="dark min-h-screen bg-[#050505] text-white selection:bg-indigo-500/30 overflow-hidden">
            <Navbar
                isAuthenticated={isAuthenticated}
                user={user}
                onSignIn={() => { setShowAuthModal(true); setAuthModalMode('login') }}
                onSignUp={() => { setShowAuthModal(true); setAuthModalMode('register') }}
                onUserDashboard={() => setShowDashboard(true)}
            />

            <AuthModal
                isOpen={showAuthModal}
                onClose={() => setShowAuthModal(false)}
                initialMode={authModalMode}
                defaultRole={authModalRole}
            />

            <DashboardModal
                isOpen={showDashboard}
                onClose={() => setShowDashboard(false)}
            />

            {/* Background Ambience */}
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-500/10 blur-[120px] rounded-full" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-500/10 blur-[120px] rounded-full" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.03] pointer-events-none" />
            </div>

            <main className="relative z-10 max-w-7xl mx-auto px-6 pt-40 pb-24">
                {/* Hero Section */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="text-center mb-24"
                >
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.6, delay: 0.1 }}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 mb-8 backdrop-blur-sm hover:bg-white/10 hover:border-indigo-400/30 transition-all"
                    >
                        <motion.div animate={{ rotate: [0, 5, -5, 0] }} transition={{ duration: 2, repeat: Infinity }}>
                            <ShieldCheck className="w-4 h-4 text-indigo-400" />
                        </motion.div>
                        <span className="text-xs font-bold tracking-widest uppercase text-indigo-200">The Vibe Protocol - Verified Professional Ranking</span>
                    </motion.div>
                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                        className="text-6xl md:text-8xl font-black mb-8 tracking-tight bg-gradient-to-b from-white via-white to-white/40 bg-clip-text text-transparent"
                    >
                        Vibe Protocol <br /> Progression Stages.
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.3 }}
                        className="text-xl text-zinc-400 max-w-3xl mx-auto leading-relaxed"
                    >
                        SkillVibe's <strong>Vibe Protocol</strong> uses advanced AI verification to authenticate professional credentials and skills.
                        Get your verified trust score (Max 5.0) and Elite Prowess (Max 100%)—no fake resumes, no buzzword inflation. Just authentic talent recognition backed by AI-powered verification.
                    </motion.p>
                </motion.div>

                {/* The Three Pillars */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-32">
                    {[
                        {
                            title: "AI Elite Rating & Skill Verification",
                            desc: "AI-powered professional assessment analyzing career trajectory, achievement complexity, and verified skill rarity. Advanced AI verification ensures authentic talent evaluation.",
                            icon: Cpu,
                            color: "text-indigo-400",
                            bg: "from-indigo-500/20 to-transparent"
                        },
                        {
                            title: "Trust Score (Max 5.0)",
                            desc: "Real-world execution proof through verified data sources and social velocity. Calculated via professional integrity audit, LinkedIn linkage, and community validation markers.",
                            icon: ShieldCheck,
                            color: "text-emerald-400",
                            bg: "from-emerald-500/20 to-transparent"
                        },
                        {
                            title: "Verified Professional Reputation",
                            desc: "Industry-backed proof of work enhanced by verified recruiter endorsements. Top-tier professionals get recognized through authentic vibe notes and peer verification.",
                            icon: Star,
                            color: "text-amber-400",
                            bg: "from-amber-500/20 to-transparent"
                        }
                    ].map((pillar, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            whileHover={{ y: -15, boxShadow: "0 40px 60px -15px rgba(99, 102, 241, 0.2)" }}
                            transition={{ duration: 0.6, delay: i * 0.15 }}
                            viewport={{ once: true }}
                            className="p-8 rounded-[2rem] bg-white/5 border border-white/10 backdrop-blur-md relative group overflow-hidden"
                        >
                            <div className={`absolute inset-0 bg-gradient-to-br ${pillar.bg} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
                            <motion.div whileHover={{ scale: 1.2, rotate: 10 }} transition={{ type: "spring", stiffness: 200 }}>
                                <pillar.icon className={`w-12 h-12 ${pillar.color} mb-6 relative z-10`} />
                            </motion.div>
                            <h3 className="text-2xl font-bold mb-4 relative z-10">{pillar.title}</h3>
                            <p className="text-zinc-400 leading-relaxed relative z-10">{pillar.desc}</p>
                        </motion.div>
                    ))}
                </div>

                {/* Deep Dive Section */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-24 items-center mb-32">
                    <motion.div
                        initial={{ opacity: 0, x: -50 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8 }}
                    >
                        <motion.h2
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="text-4xl font-bold mb-8"
                        >
                            Increase Your Elite Rating <br /> <motion.span animate={{ color: ["#6366f1", "#4f46e5", "#6366f1"] }} transition={{ duration: 3, repeat: Infinity }} className="text-indigo-500 text-glow">to Climb the Stages</motion.span>
                        </motion.h2>
                        <div className="space-y-6">
                            {[
                                { title: "Build Elite Career Experience", desc: "Work at top-tier firms (Google, OpenAI, Meta). Access to complex, high-stakes projects significantly boosts your Elite Rating." },
                                { title: "Collect Social Validation", desc: "Gain Signal Boosts (+0.5% Prowess) and Shortlists (+1.0% Prowess) from verified recruiters to push your rating to the max 100%." },
                                { title: "Demonstrate Achievement Complexity", desc: "Build systems, ship products, lead teams. Complex technical work rates higher than maintenance tasks or junior-level responsibilities." },
                                { title: "Quantify Your Impact", desc: "Concrete metrics beat vague descriptions. Users/revenue generated, systems shipped, team size led—numbers prove your value." },
                                { title: "Social Trust Signals", desc: "Every Vibe Note (+0.5 Trust) and Shortlist (+0.2 Trust) contributes to your verified status. Maximize your trust cap at 5.0." },
                                { title: "Develop Rare Technical Skills", desc: "Specialize in high-demand areas: AI/ML, System Design, Infrastructure. Rare skills command higher Elite Ratings than commodity knowledge." },
                            ].map((item, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, x: -20 }}
                                    whileInView={{ opacity: 1, x: 0 }}
                                    transition={{ duration: 0.5, delay: i * 0.1 }}
                                    viewport={{ once: true }}
                                    whileHover={{ x: 10 }}
                                    className="flex gap-4 p-4 rounded-2xl hover:bg-white/5 transition-colors border border-transparent hover:border-white/10 group cursor-pointer"
                                >
                                    <div className="mt-1">
                                        <motion.div whileHover={{ scale: 1.5, rotate: 360 }} transition={{ type: "spring", stiffness: 300, damping: 15 }}>
                                            <CheckCircle2 className="w-5 h-5 text-indigo-500" />
                                        </motion.div>
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-white mb-1">{item.title}</h4>
                                        <p className="text-sm text-zinc-500">{item.desc}</p>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>

                    {/* Verification Badge Preview */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        className="relative"
                    >
                        <motion.div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-[3rem] blur opacity-30 animate-pulse" />
                        <motion.div className="relative p-12 rounded-[3rem] bg-zinc-900/50 border border-white/10 backdrop-blur-2xl" whileHover={{ boxShadow: "0 40px 80px -20px rgba(79, 70, 229, 0.3)" }}>
                            <div className="flex flex-col items-center text-center">
                                <motion.div
                                    animate={{ scale: [1, 1.05, 1], rotate: [0, 2, -2, 0] }}
                                    transition={{ duration: 3, repeat: Infinity }}
                                    className="w-24 h-24 rounded-full bg-gradient-to-br from-indigo-600 to-purple-700 flex items-center justify-center mb-6 shadow-[0_0_50px_rgba(79,70,229,0.4)]"
                                >
                                    <ShieldCheck className="w-12 h-12 text-white" />
                                </motion.div>
                                <motion.h3
                                    initial={{ opacity: 0, y: 10 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.2 }}
                                    className="text-3xl font-black mb-4"
                                >
                                    VERIFIED PROFESSIONAL
                                </motion.h3>
                                <motion.p
                                    initial={{ opacity: 0 }}
                                    whileInView={{ opacity: 1 }}
                                    transition={{ delay: 0.3 }}
                                    className="text-zinc-400 mb-8 max-w-xs"
                                >
                                    Become verified by achieving an <strong>Elite Rating ≥ 90</strong> OR by collecting Vibe Notes with a <strong>Trust Score ≥ 3.5</strong>.
                                </motion.p>
                                <div className="grid grid-cols-2 gap-4 w-full">
                                    <motion.div
                                        initial={{ opacity: 0, y: 20 }}
                                        whileInView={{ opacity: 1, y: 0 }}
                                        whileHover={{ y: -5, boxShadow: "0 20px 40px -15px rgba(99, 102, 241, 0.3)" }}
                                        transition={{ delay: 0.4 }}
                                        className="p-4 rounded-2xl bg-white/5 border border-white/5 flex flex-col items-center cursor-pointer"
                                    >
                                        <motion.span className="text-2xl font-black text-indigo-400" animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 2, repeat: Infinity }}>100%</motion.span>
                                        <span className="text-[10px] uppercase font-bold text-zinc-500">Max Prowess</span>
                                    </motion.div>
                                    <motion.div
                                        initial={{ opacity: 0, y: 20 }}
                                        whileInView={{ opacity: 1, y: 0 }}
                                        whileHover={{ y: -5, boxShadow: "0 20px 40px -15px rgba(16, 185, 129, 0.3)" }}
                                        transition={{ delay: 0.5 }}
                                        className="p-4 rounded-2xl bg-white/5 border border-white/5 flex flex-col items-center cursor-pointer"
                                    >
                                        <motion.span className="text-2xl font-black text-emerald-400" animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 2, repeat: Infinity, delay: 0.1 }}>5.0</motion.span>
                                        <span className="text-[10px] uppercase font-bold text-zinc-500">Max Trust</span>
                                    </motion.div>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                </div>

                {/* AI Integrity Explanation */}
                <section className="mb-32">
                    <motion.div
                        initial={{ opacity: 0, y: 40 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8 }}
                        className="p-12 rounded-[3.5rem] bg-gradient-to-r from-indigo-900/20 to-purple-900/20 border border-indigo-500/30 relative overflow-hidden"
                    >
                        <div className="absolute top-0 right-0 p-12 opacity-10">
                            <motion.div animate={{ rotate: 360 }} transition={{ duration: 20, repeat: Infinity, ease: "linear" }}>
                                <Zap className="w-64 h-64 text-white" />
                            </motion.div>
                        </div>
                        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
                            <div className="lg:col-span-12 mb-8">
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    whileInView={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: 0.1 }}
                                    className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-400 text-[10px] font-black uppercase tracking-widest mb-4"
                                >
                                    AI Elite Rating System
                                </motion.div>
                                <motion.h2
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.2 }}
                                    className="text-4xl font-bold mb-6"
                                >
                                    How Elite Ratings Are Calculated
                                </motion.h2>
                                <motion.p
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.3 }}
                                    className="text-xl text-zinc-400 leading-relaxed max-w-4xl"
                                >
                                    Your Elite Rating is determined by our advanced AI analyzer that reads your resume and evaluates six critical dimensions: <strong>Company Prestige</strong> (top-tier firms signal access to complex problems), <strong>Achievement Complexity</strong> (building ML systems vs. basic tasks), <strong>Proof of Impact</strong> (shipped products, user metrics, concrete results), <strong>Career Trajectory</strong> (IC → Lead → Principal progression), <strong>Integrity Signals</strong> (consistent narrative, specific examples, no gaps), and <strong>Skill Rarity</strong> (specialized AI/ML skills vs. commodity knowledge). The AI is brutal—most resumes score 30-55. It detects buzzwords, AI-generated content, resume gaps, and vague descriptions, automatically deducting 15 points for these red flags.
                                </motion.p>
                            </div>
                        </div>
                    </motion.div>
                </section>

                {/* Scoring Breakdown Table */}
                <section className="mb-32">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        className="p-10 md:p-14 bg-white/[0.03] border border-white/10 rounded-[4rem] relative overflow-hidden"
                    >
                        <div className="absolute inset-0 bg-cyber-grid opacity-5 pointer-events-none" />
                        <h3 className="text-3xl font-black mb-12 tracking-tighter uppercase italic text-center relative z-10">Verification Weighting System</h3>

                        <div className="overflow-x-auto relative z-10">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-white/10">
                                        <th className="py-6 px-4 text-xs font-black uppercase tracking-widest text-slate-500">Action Type</th>
                                        <th className="py-6 px-4 text-xs font-black uppercase tracking-widest text-indigo-400 text-center">Trust Impact</th>
                                        <th className="py-6 px-4 text-xs font-black uppercase tracking-widest text-cyan-400 text-center">Prowess Boost</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {[
                                        { action: 'Signal Boost (Upvote)', trust: '+0.10', prowess: '+0.50%' },
                                        { action: 'Shortlisted (Star)', trust: '+0.20', prowess: '+1.00%' },
                                        { action: 'Peer Vibe Note', trust: '+0.50', prowess: '-' },
                                        { action: 'Market View (Per 10)', trust: '+0.10', prowess: '+0.50%' },
                                        { action: 'Base AI Eval', trust: 'Up to 2.0', prowess: 'Base 30-55%' },
                                        { action: 'Report/Flag Penalty', trust: '-0.50', prowess: '-2.50%' },
                                    ].map((row, i) => (
                                        <motion.tr
                                            key={i}
                                            className="border-b border-white/5 hover:bg-white/[0.02] transition-colors"
                                            initial={{ opacity: 0, x: -10 }}
                                            whileInView={{ opacity: 1, x: 0 }}
                                            transition={{ delay: i * 0.05 }}
                                        >
                                            <td className="py-5 px-4 font-bold text-sm text-white uppercase tracking-tight">{row.action}</td>
                                            <td className="py-5 px-4 text-center font-black text-indigo-400">{row.trust}</td>
                                            <td className="py-5 px-4 text-center font-black text-cyan-400">{row.prowess}</td>
                                        </motion.tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="mt-12 text-center relative z-10">
                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                                Note: Trust is capped at <strong>5.00</strong> and Prowess is capped at <strong>100.0%</strong>.
                            </p>
                        </div>
                    </motion.div>
                </section>

                {/* FAQ Toggles (Simplified) */}
                <div className="max-w-3xl mx-auto mb-32">
                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-3xl font-bold mb-12 text-center"
                    >
                        Vibe Protocol FAQ
                    </motion.h2>
                    <div className="space-y-4">
                        {[
                            { q: "What's the difference between Elite Rating and Trust Score?", a: "Elite Rating (Prowess, 0-100%) is your professional horsepower—based on your resume and boosted by social signals (+0.5% per upvote). Trust Score (0-5) measures verification—do you have Vibe Notes from recruiters (+0.5 per note), linked social profiles, and integrity signals. You need EITHER Prowess ≥90% OR (Trust Score ≥3.5 AND Vibe Notes) to be verified." },
                            { q: "How are the points weighted?", a: "Every Signal Boost (Upvote) adds +0.5% Prowess and +0.1 Trust. Every Shortlist (Star) adds +1.0% Prowess and +0.2 Trust. Every Vibe Note adds a significant +0.5 Trust boost. Every 10 views adds +0.5% Prowess and +0.1 Trust." },
                            { q: "What causes Elite Rating deductions?", a: "The AI is strict. Generic summaries (-15 pts), buzzword-heavy descriptions without proof (-15 pts), significant resume gaps (-15 pts), and detected AI-generated content (-15 pts). Specificity is your best friend." },
                            { q: "Can my points decrease?", a: "Yes. Getting flagged/reported by others can deduct up to 20 points from your overall internal Ranking Score, and negative AI Integrity audits can reduce your Trust Score." },
                        ].map((faq, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                whileHover={{ boxShadow: "0 20px 40px -15px rgba(99, 102, 241, 0.15)" }}
                                transition={{ duration: 0.5, delay: i * 0.1 }}
                                viewport={{ once: true }}
                                className="p-6 rounded-2xl bg-white/5 border border-white/10"
                            >
                                <motion.h4 className="font-bold mb-2 flex items-center gap-2" whileHover={{ color: "#c7d2fe" }}>
                                    <Sparkles className="w-4 h-4 text-indigo-400" /> {faq.q}
                                </motion.h4>
                                <p className="text-zinc-500 text-sm">{faq.a}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>

                {/* Stage Method - Progression Levels */}
                <section className="mb-32">
                    <div className="text-center mb-16">
                        <motion.h2
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.8 }}
                            className="text-5xl font-black mb-6"
                        >
                            The Stage Method <motion.span animate={{ color: ["#06b6d4", "#0891b2", "#06b6d4"] }} transition={{ duration: 3, repeat: Infinity }} className="text-cyan-400">- Seed, Pillar, Titan</motion.span>
                        </motion.h2>
                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.8, delay: 0.1 }}
                            className="text-xl text-zinc-400 max-w-3xl mx-auto"
                        >
                            Your stage is determined by your Elite Rating—a single metric from 0-100. As your resume reflects better career experiences, achievements, and impact, your Elite Rating climbs and you progress through stages.
                        </motion.p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-16">
                        {[
                            {
                                stage: 'SEED',
                                minPoints: '0',
                                maxPoints: '54',
                                color: 'from-emerald-600 to-emerald-400',
                                lightBg: 'bg-emerald-500/10',
                                icon: '🌱',
                                perks: ['Basic Profile Setup', 'Community Visibility', 'Start Building Record', 'Build Reputation'],
                                earning: 'Entry-level roles or limited professional proof'
                            },
                            {
                                stage: 'PILLAR',
                                minPoints: '55',
                                maxPoints: '85',
                                color: 'from-cyan-500 to-blue-400',
                                lightBg: 'bg-cyan-500/10',
                                icon: '🏛️',
                                perks: ['Verified Badge', 'Recruiter Direct Access', 'Featured Ranking', 'High Visibility'],
                                earning: 'Senior roles with proven impact & team leadership'
                            },
                            {
                                stage: 'TITAN',
                                minPoints: '86',
                                maxPoints: '100',
                                color: 'from-indigo-600 to-purple-500',
                                lightBg: 'bg-indigo-500/10',
                                icon: '⚡',
                                perks: ['Elite Status', 'Top Recruiter Priority', 'Premium Opportunities', 'Industry Recognition'],
                                earning: 'Elite firms + complex achievements + high-stakes impact'
                            }
                        ].map((level, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 20, scale: 0.9 }}
                                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                                whileHover={{ y: -5, scale: 1.05 }}
                                transition={{ duration: 0.5, delay: i * 0.15 }}
                                viewport={{ once: true }}
                                className={`relative group`}
                            >
                                <motion.div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${level.color} opacity-0 group-hover:opacity-20 transition-opacity blur`} />
                                <div className={`relative p-6 rounded-2xl ${level.lightBg} border border-white/10 hover:border-white/20 transition-all h-full flex flex-col`}>
                                    <motion.div animate={{ y: [0, -5, 0] }} transition={{ duration: 2, repeat: Infinity }} className="text-4xl mb-3">{level.icon}</motion.div>
                                    <motion.h3 className="text-xl font-black mb-2" whileHover={{ color: "#c7d2fe" }}>{level.stage}</motion.h3>
                                    <motion.p className="text-xs text-zinc-400 mb-4" initial={{ opacity: 0.6 }} whileHover={{ opacity: 1 }}>
                                        {level.minPoints} - {level.maxPoints} Points
                                    </motion.p>
                                    <div className="flex-1 mb-4">
                                        <p className="text-sm font-bold text-white mb-2">How to Earn:</p>
                                        <p className="text-xs text-zinc-500">{level.earning}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-indigo-400 mb-2">Perks:</p>
                                        <ul className="text-xs text-zinc-400 space-y-1">
                                            {level.perks.map((perk, j) => (
                                                <motion.li
                                                    key={j}
                                                    initial={{ opacity: 0, x: -10 }}
                                                    whileInView={{ opacity: 1, x: 0 }}
                                                    transition={{ delay: i * 0.1 + j * 0.05 }}
                                                    viewport={{ once: true }}
                                                    className="flex gap-2"
                                                >
                                                    <span className="text-indigo-500">✓</span>
                                                    <span>{perk}</span>
                                                </motion.li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    <div className="max-w-6xl mx-auto">
                        <div className="p-8 rounded-3xl bg-gradient-to-r from-indigo-900/30 to-purple-900/30 border border-indigo-500/30 mb-8">
                            <h3 className="text-2xl font-bold mb-8">Elite Rating Scoring Rubric</h3>
                            <div className="space-y-4">
                                {[
                                    {
                                        range: '86-100 ⚡ TITAN',
                                        tag: 'Industry Titan',
                                        criteria: 'Worked at elite firms (Google, OpenAI, Meta, Microsoft) AND has complex, rare technical achievements with high-stakes proof of impact. Top-tier talent that shapes industry standards.',
                                        stage: 'TITAN'
                                    },
                                    {
                                        range: '55-85 🏛️ PILLAR',
                                        tag: 'Strategic Architect',
                                        criteria: 'Senior level with proven impact at established mid-to-large firms. Clear career progression from IC to Lead roles with significant contributions and measurable results.',
                                        stage: 'PILLAR'
                                    },
                                    {
                                        range: '0-54 🌱 SEED',
                                        tag: 'Rising Specialist / Junior Talent',
                                        criteria: 'Entry-level to mid-level professionals building their careers. Either early in career or demonstrating growth potential. Limited high-stakes proof but showing promise.',
                                        stage: 'SEED'
                                    },
                                ].map((item, idx) => (
                                    <motion.div
                                        key={idx}
                                        initial={{ opacity: 0, x: -20 }}
                                        whileInView={{ opacity: 1, x: 0 }}
                                        whileHover={{ x: 5, boxShadow: "0 20px 40px -15px rgba(99, 102, 241, 0.15)" }}
                                        transition={{ duration: 0.5, delay: idx * 0.1 }}
                                        viewport={{ once: true }}
                                        className="p-5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all cursor-pointer"
                                    >
                                        <div className="flex items-start justify-between mb-2">
                                            <h4 className="font-bold text-lg text-indigo-300">{item.range}</h4>
                                            <motion.span
                                                whileHover={{ scale: 1.1 }}
                                                className="text-xs font-bold px-3 py-1 rounded-full bg-indigo-500/30 text-indigo-200"
                                            >
                                                {item.tag}
                                            </motion.span>
                                        </div>
                                        <p className="text-sm text-zinc-400">{item.criteria}</p>
                                    </motion.div>
                                ))}
                            </div>
                            <div className="mt-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30">
                                <p className="text-sm text-red-200">
                                    ⚠️ <strong>Rating Deductions:</strong> -15 points each for: generic summaries, buzzword-overload without proof, unexplained resume gaps, or AI-generated content detected. Being dishonest costs you significantly.
                                </p>
                            </div>
                        </div>

                        <div className="p-8 rounded-3xl bg-gradient-to-r from-cyan-900/30 to-emerald-900/30 border border-cyan-500/30">
                            <motion.h3
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: 0.1 }}
                                className="text-2xl font-bold mb-8"
                            >
                                What the AI Evaluates
                            </motion.h3>
                            <motion.p
                                initial={{ opacity: 0 }}
                                whileInView={{ opacity: 1 }}
                                viewport={{ once: true }}
                                transition={{ delay: 0.2 }}
                                className="text-zinc-400 mb-6 max-w-4xl"
                            >
                                Your Elite Rating is determined by analyzing these six critical dimensions of your career and resume:
                            </motion.p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                {[
                                    {
                                        factor: '1️⃣ Company Prestige',
                                        desc: 'Working at Google, OpenAI, Meta, Microsoft, or similar elite firms. This signals access to complex technical problems and collaboration with world-class talent.'
                                    },
                                    {
                                        factor: '2️⃣ Achievement Complexity',
                                        desc: 'Technical difficulty of your work. Building ML systems, system architecture, or scaling infrastructure rates higher than maintaining legacy code or junior-level tasks.'
                                    },
                                    {
                                        factor: '3️⃣ Proof of Impact',
                                        desc: 'Quantifiable, concrete results. "Shipped feature used by 1M+ users" or "Led team of 5 engineers to reduce latency by 40%" beats vague descriptions.'
                                    },
                                    {
                                        factor: '4️⃣ Career Trajectory',
                                        desc: 'Clear progression demonstrates exponential growth. IC → Tech Lead → Manager → Director shows increasing responsibility and skill development.'
                                    },
                                    {
                                        factor: '5️⃣ Integrity Signals',
                                        desc: 'Consistent narrative with no red flags. Specific examples, no 5-year gaps, no copy-paste descriptions across roles. Honesty and coherence matter.'
                                    },
                                    {
                                        factor: '6️⃣ Skill Rarity',
                                        desc: 'Specialized skills in high-demand areas (AI/ML, System Design, Distributed Systems) valued higher than commodity skills (basic web dev, Word/Excel).'
                                    },
                                ].map((item, idx) => (
                                    <motion.div
                                        key={idx}
                                        initial={{ opacity: 0, y: 20 }}
                                        whileInView={{ opacity: 1, y: 0 }}
                                        whileHover={{ y: -8, boxShadow: "0 30px 50px -15px rgba(99, 102, 241, 0.2)" }}
                                        transition={{ duration: 0.5, delay: idx * 0.08 }}
                                        viewport={{ once: true }}
                                        className="p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all cursor-pointer"
                                    >
                                        <motion.h4 className="font-bold text-white mb-2" whileHover={{ color: "#c7d2fe" }}>{item.factor}</motion.h4>
                                        <p className="text-sm text-zinc-500">{item.desc}</p>
                                    </motion.div>
                                ))}
                            </div>
                            <div className="p-4 rounded-xl bg-cyan-500/20 border border-cyan-500/30">
                                <p className="text-sm text-cyan-200">
                                    <strong>💡 Reality Check:</strong> Most resumes score 30-55. Scores 60+ are rare and require top-tier experience. The AI is brutal about detecting inflation, buzzwords, and fabrication. Be honest.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* CTA */}
                <motion.div
                    initial={{ opacity: 0, y: 40, scale: 0.95 }}
                    whileInView={{ opacity: 1, y: 0, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8 }}
                    className="text-center"
                >
                    <motion.div
                        whileHover={{ boxShadow: "0 80px 120px -30px rgba(99, 102, 241, 0.3)" }}
                        className="p-16 rounded-[4rem] bg-white border border-white/10 text-black relative overflow-hidden group"
                    >
                        <div className="absolute inset-0 bg-indigo-600 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
                        <motion.div className="relative z-10">
                            <motion.h2
                                initial={{ opacity: 0 }}
                                whileInView={{ opacity: 1 }}
                                className="text-4xl md:text-5xl font-black mb-8 group-hover:text-white transition-colors tracking-tight"
                            >
                                Get Your Verified Professional Credentials Today
                            </motion.h2>
                            <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                <motion.button
                                    onClick={() => {
                                        if (!isAuthenticated) {
                                            setAuthModalRole('candidate')
                                            setAuthModalMode('register')
                                            setShowAuthModal(true)
                                        } else {
                                            router.push('/pricing')
                                        }
                                    }}
                                    whileHover={{ scale: 1.08, y: -2 }}
                                    whileTap={{ scale: 0.95 }}
                                    className="px-10 py-5 bg-black text-white rounded-full font-bold text-lg hover:scale-105 transition-all flex items-center gap-3"
                                >
                                    Start Verification
                                    <motion.div animate={{ x: [0, 5, 0] }} transition={{ duration: 1.5, repeat: Infinity }}>
                                        <ArrowRight className="w-5 h-5" />
                                    </motion.div>
                                </motion.button>
                                <Link href="/leaderboard">
                                    <motion.button
                                        whileHover={{ scale: 1.08, y: -2 }}
                                        whileTap={{ scale: 0.95 }}
                                        className="px-10 py-5 border border-black/10 text-black rounded-full font-bold text-lg hover:bg-black/5 transition-all group-hover:text-white group-hover:border-white"
                                    >
                                        View Verified Rankings
                                    </motion.button>
                                </Link>
                            </div>
                        </motion.div>
                    </motion.div>
                </motion.div>
            </main>

            <Footer />

            {/* Schema.org Structured Data for SEO */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify({
                        '@context': 'https://schema.org',
                        '@type': 'SoftwareApplication',
                        name: 'SkillVibe Vibe Protocol',
                        description: 'AI-powered professional verification and credential verification system for authentic talent ranking.',
                        applicationCategory: 'Professional Network',
                        url: 'https://skillvibe.com/vibe-protocol',
                        offers: {
                            '@type': 'Offer',
                            price: '0',
                            priceCurrency: 'USD'
                        },
                        aggregateRating: {
                            '@type': 'AggregateRating',
                            ratingValue: '4.8',
                            ratingCount: '5000+'
                        }
                    })
                }}
            />

            <style jsx>{`
        .text-glow {
          text-shadow: 0 0 30px rgba(99, 102, 241, 0.4);
        }
      `}</style>
        </div>
    )
}
