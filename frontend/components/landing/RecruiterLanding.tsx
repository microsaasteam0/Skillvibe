'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Search, Zap, Target, Star, ArrowRight, ShieldCheck, Users } from 'lucide-react'
import Link from 'next/link'

export default function RecruiterLanding() {
    return (
        <div className="max-w-6xl mx-auto p-12 bg-white dark:bg-zinc-950 rounded-[3rem] border border-zinc-200 dark:border-white/5 shadow-2xl relative overflow-hidden group/container">
            {/* Background Decor */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

            <div className="relative z-10 flex flex-col lg:flex-row items-center gap-16">
                <div className="flex-1 text-center lg:text-left">
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-cyan-500/10 border border-cyan-500/20 text-cyan-500 rounded-full mb-6">
                        <ShieldCheck className="w-4 h-4" />
                        <span className="text-[10px] font-black uppercase tracking-widest">Recruiter mode on</span>
                    </div>

                    <h2 className="text-5xl md:text-6xl font-black text-slate-950 dark:text-white tracking-tighter leading-[0.85] uppercase mb-6">
                        HIRE THE <span className="text-cyan-500 italic">BEST.</span>
                    </h2>

                    <p className="text-lg text-zinc-500 dark:text-zinc-500 font-medium leading-relaxed mb-10 max-w-xl">
                        Stop reading bad resumes. Our smart system has already found the best workers for you based on their real skills.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start">
                        <Link
                            href="/recruiter"
                            className="px-10 py-5 bg-slate-950 dark:bg-white text-white dark:text-slate-950 font-black rounded-2xl text-[11px] uppercase tracking-[0.2em] shadow-2xl hover:scale-105 transition-all flex items-center gap-3"
                        >
                            See All People <ArrowRight className="w-4 h-4" />
                        </Link>
                        <Link
                            href="/leaderboard"
                            className="px-10 py-5 bg-white dark:bg-white/5 border border-zinc-200 dark:border-white/10 text-slate-950 dark:text-white font-black rounded-2xl text-[11px] uppercase tracking-[0.2em] hover:bg-zinc-50 transition-all flex items-center gap-3"
                        >
                            Best Scores <Star className="w-4 h-4 text-cyan-500" />
                        </Link>
                    </div>
                </div>

                {/* Visual Teaser */}
                <div className="flex-1 w-full max-w-md bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-white/5 rounded-[2.5rem] p-8 relative shadow-inner">
                    <div className="flex items-center gap-4 mb-8">
                        <div className="w-12 h-12 bg-cyan-500 rounded-xl flex items-center justify-center text-white">
                            <Zap className="w-6 h-6 fill-current" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-cyan-500 uppercase tracking-widest">Smart Matching</p>
                            <h4 className="font-black text-slate-950 dark:text-white uppercase italic">Perfect People Found</h4>
                        </div>
                    </div>

                    <div className="space-y-4">
                        {[
                            { name: 'Alex Rivera', role: 'Fullstack Lead', score: 98, vibe: 'Visionary' },
                            { name: 'Sarah Chen', role: 'Product Designer', score: 95, vibe: 'Minimalist' },
                            { name: 'James Wilson', role: 'DevOps Architect', score: 92, vibe: 'Scalability' },
                        ].map((candidate, i) => (
                            <motion.div
                                key={i}
                                initial={{ x: 20, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                transition={{ delay: 0.5 + (i * 0.1) }}
                                className="p-4 bg-white dark:bg-white/5 border border-zinc-100 dark:border-white/5 rounded-2xl flex items-center justify-between group cursor-default"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-zinc-200 dark:bg-zinc-800 rounded-full flex items-center justify-center font-black text-xs text-zinc-500">
                                        {candidate.name.charAt(0)}
                                    </div>
                                    <div>
                                        <p className="font-black text-slate-900 dark:text-white text-xs uppercase italic">{candidate.name}</p>
                                        <p className="text-[9px] font-medium text-zinc-500 uppercase tracking-widest">{candidate.role}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] font-black text-cyan-500">{candidate.score}%</p>
                                    <p className="text-[8px] font-bold text-zinc-400 uppercase tracking-tighter">{candidate.vibe}</p>
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    <div className="mt-8 pt-8 border-t border-zinc-200 dark:border-white/5">
                        <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-zinc-400">
                            <span>Looking for workers...</span>
                            <span className="text-cyan-500 animate-pulse">Live</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
