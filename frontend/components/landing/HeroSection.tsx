import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Sparkles, Shield, Zap, ArrowRight, Cpu, Users, Target, Globe, Terminal } from 'lucide-react'

interface HeroSectionProps {
    isAuthenticated: boolean
    user?: any
    onStartCreating: () => void
    onSignIn: () => void
    onSignUp: () => void
}

export default function HeroSection({ isAuthenticated, user, onStartCreating, onSignIn, onSignUp }: HeroSectionProps) {
    const isRecruiter = user?.role === 'recruiter'
    const [binaryData, setBinaryData] = useState('')

    useEffect(() => {
        setBinaryData(Array(2000).fill(0).map(() => Math.random() > 0.5 ? '1' : '0').join(''))
    }, [])

    return (
        <div className="relative min-h-[90vh] flex items-center justify-center overflow-hidden pt-20 pb-16 selection:bg-cyan-500/30">

            {/* Cinematic Background Layer */}
            <div className="absolute inset-0 z-0">
                <div className="absolute inset-0 bg-cyber-grid opacity-20 dark:opacity-30" />
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/50 to-background" />

                {/* Pulsing Orbs */}
                <div className="absolute top-[-10%] left-[-5%] w-[40%] h-[40%] bg-cyan-500/10 rounded-full blur-[120px] bg-pulse-cyan" />
                <div className="absolute bottom-[-10%] right-[-5%] w-[40%] h-[40%] bg-indigo-500/10 rounded-full blur-[120px] bg-pulse-cyan" style={{ animationDelay: '2s' }} />

                {/* Binary Stream (Client side only) */}
                <div className="absolute top-[15%] right-[5%] w-[30%] h-[50%] opacity-5 select-none font-mono text-[8px] text-cyan-500 break-all pointer-events-none transition-opacity duration-1000">
                    {binaryData}
                </div>
            </div>

            <div className="container relative z-10 px-4 mx-auto text-center">

                {/* Elite Badge */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="inline-flex items-center gap-2 px-6 py-2 mb-10 glass-panel rounded-full border border-cyan-500/30 glow-cyan backdrop-blur-xl group cursor-help transition-all hover:border-cyan-500/50"
                >
                    <div className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse shadow-[0_0_10px_rgba(6,182,212,1)]" />
                    <span className="text-[10px] sm:text-[11px] font-black text-cyan-500 tracking-[0.3em] uppercase">
                        Proof of Work, Verified by AI
                    </span>
                    <Terminal className="w-3.5 h-3.5 text-cyan-500 opacity-50 group-hover:opacity-100 transition-opacity" />
                </motion.div>

                {/* Massive Headline */}
                <motion.div
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
                    className="mb-8"
                >
                    <h1 className="sr-only">SkillVibe AI Protocol - Elite Proof of Work Verification & Talent Reputation Layer</h1>
                    <div className="text-5xl sm:text-7xl md:text-8xl lg:text-9xl font-black leading-[0.85] tracking-tighter text-slate-900 dark:text-white drop-shadow-2xl">
                        {isRecruiter ? 'FIND THE' : 'YOUR NEW'} <br />
                        <span className="text-gradient-cyan drop-shadow-[0_0_30px_rgba(6,182,212,0.3)]">TRUST</span> <br />
                        <span className="italic outline-text dark:text-transparent dark:[-webkit-text-stroke:2px_rgba(255,255,255,0.1)]">SCORE</span>
                    </div>
                </motion.div>

                {/* Narrative */}
                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 1.5, delay: 0.5 }}
                    className="text-lg sm:text-xl md:text-2xl text-slate-600 dark:text-slate-400 mb-12 max-w-3xl mx-auto leading-relaxed font-bold tracking-tight px-4"
                >
                    {isRecruiter
                        ? 'SkillVibe is the elite reputation layer for modern talent. Find the top 1% using real-world proof of work and intelligent trust scores.'
                        : 'Elevate your visibility. Showcase your real-world proof of work, rank against the global best, and get discovered by top founders.'
                    }
                </motion.p>

                {/* Actions */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.7 }}
                    className="flex flex-col sm:flex-row items-center justify-center gap-6 mb-24"
                >
                    {isAuthenticated ? (
                        <button
                            onClick={() => isRecruiter ? window.location.href = '/recruiter' : onStartCreating()}
                            className="group relative px-10 py-5 bg-cyan-500 text-slate-950 font-black rounded-2xl shadow-[0_0_40px_-5px_rgba(6,182,212,0.5)] transition-all hover:scale-105 active:scale-95 overflow-hidden"
                        >
                            <div className="absolute inset-x-0 bottom-0 h-1 bg-white/20" />
                            <div className="flex items-center gap-3 relative z-10 uppercase tracking-widest text-xs">
                                <Target className="w-5 h-5" />
                                <span>{isRecruiter ? 'Find Best Talent' : 'Improve My Vibe'}</span>
                                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                            </div>
                        </button>
                    ) : (
                        <>
                            <button
                                onClick={onSignUp}
                                className="group relative px-10 py-5 bg-cyan-500 text-slate-950 font-black rounded-2xl shadow-[0_0_40px_-5px_rgba(6,182,212,0.5)] transition-all hover:scale-105 active:scale-95 overflow-hidden"
                            >
                                <div className="absolute inset-x-0 bottom-0 h-1 bg-white/20" />
                                <div className="flex items-center gap-3 relative z-10 uppercase tracking-widest text-xs">
                                    <Sparkles className="w-5 h-5" />
                                    <span>Make My Page</span>
                                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                </div>
                            </button>

                            <button
                                onClick={onSignIn}
                                className="group px-10 py-5 glass-card dark:text-white font-black rounded-2xl border border-white/10 transition-all hover:scale-105 hover:bg-white/10 active:scale-95 uppercase tracking-widest text-xs flex items-center gap-3"
                            >
                                <Users className="w-5 h-5 text-cyan-500" />
                                <span>I am a Boss</span>
                            </button>
                        </>
                    )}
                </motion.div>

                {/* Features */}
                <motion.div
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 1.2, delay: 0.8, ease: "easeOut" }}
                    className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 max-w-6xl mx-auto px-4"
                >
                    {[
                        { icon: Globe, label: "EVERYWHERE", desc: "Show off your skills to people all over the world." },
                        { icon: Shield, label: "REAL PROOF", desc: "No more fake resumes. We check everything for you." },
                        { icon: Cpu, label: "SMART SCORE", desc: "Get an easy score that shows how good you are." }
                    ].map((item, idx) => (
                        <div key={idx} className="glass-card p-10 rounded-card text-left transition-all hover:glow-cyan-strong hover:bg-white/5 border border-white/5 group">
                            <div className="w-16 h-16 bg-cyan-500/10 rounded-2xl flex items-center justify-center mb-6 text-cyan-500 group-hover:scale-110 transition-transform">
                                <item.icon className="w-8 h-8" />
                            </div>
                            <h3 className="text-xl font-black mb-3 tracking-tighter text-slate-800 dark:text-white uppercase">{item.label}</h3>
                            <p className="text-sm font-bold text-slate-500 dark:text-slate-500 leading-relaxed">{item.desc}</p>
                        </div>
                    ))}
                </motion.div>

            </div>
        </div>
    )
}
