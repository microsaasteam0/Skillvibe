'use client'

import { motion } from 'framer-motion'
import { Quote, Star, ShieldCheck, Zap } from 'lucide-react'

const testimonials = [
    {
        name: "ALEX RIVERA",
        role: "FOUNDER",
        content: "SkillVibe makes it so easy to find good people. I don't have to read long resumes anymore. I just look at their score and I know they are good.",
        initials: "AR",
        color: "cyan"
    },
    {
        name: "SARAH CHEN",
        role: "MANAGER",
        content: "Now I can finally trust the people I hire. Everything is verified and real. No more guessing if someone is telling the truth or not.",
        initials: "SC",
        color: "blue"
    },
    {
        name: "DAVID PARK",
        role: "TEAM LEAD",
        content: "Building my team is much faster now. I just check the leaderboard and find the best person for the job. It saves me so much time.",
        initials: "DP",
        color: "indigo"
    },
    {
        name: "ELENA RODRIGUEZ",
        role: "EXPERT",
        content: "I didn't even have to apply for my new job. Once my score went up, companies started calling me. It's like magic!",
        initials: "ER",
        color: "emerald"
    },
    {
        name: "MARCUS THORNE",
        role: "BUILDER",
        content: "My trust score is the most important thing I have. It shows everyone that I can do the job and get things done.",
        initials: "MT",
        color: "amber"
    },
    {
        name: "JAMES WILSON",
        role: "RECRUITER",
        content: "SkillVibe is the best way to see who is actually good at their job. It's simple, fast, and it just works.",
        initials: "JW",
        color: "rose"
    }
]

export default function Testimonials() {
    return (
        <section className="py-32 relative overflow-hidden bg-black" id="testimonials">
            {/* Background Decor */}
            <div className="absolute inset-0 bg-cyber-grid opacity-10 pointer-events-none" />
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-gradient-to-b from-cyan-500/5 to-transparent pointer-events-none" />

            <div className="container mx-auto px-6 relative z-10">
                <div className="text-center mb-24">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        className="inline-flex items-center gap-3 px-6 py-2 rounded-xl glass-panel border border-cyan-500/30 text-cyan-500 text-[10px] font-black uppercase tracking-[0.4em] mb-10 glow-cyan bg-cyan-500/5"
                    >
                        <ShieldCheck className="w-4 h-4" />
                        HAPPY PEOPLE
                    </motion.div>
                    <motion.h2
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-6xl md:text-8xl font-black tracking-tighter text-white mb-8 uppercase italic leading-none"
                    >
                        THE TRUST <span className="text-gradient-cyan">SCORE.</span>
                    </motion.h2>
                    <motion.p
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.2 }}
                        className="text-slate-500 font-bold text-xl max-w-2xl mx-auto uppercase tracking-tight opacity-80"
                    >
                        Join the best bosses and experts who use our trust system every day.
                    </motion.p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-7xl mx-auto">
                    {testimonials.map((t, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 40 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.1, duration: 0.8 }}
                            className="glass-panel p-12 rounded-[3.5rem] border border-white/10 relative group hover:border-cyan-500/40 transition-all duration-700 bg-white/[0.02]"
                        >
                            <div className="absolute inset-0 bg-cyber-grid opacity-5 pointer-events-none" />
                            <Quote className="absolute top-12 right-12 w-16 h-16 text-cyan-500/5 group-hover:text-cyan-500/10 transition-colors" />

                            <div className="flex items-center gap-6 mb-10">
                                <div className="w-20 h-20 rounded-[2rem] bg-black border border-white/10 flex items-center justify-center text-white font-black text-2xl shadow-2xl group-hover:glow-cyan group-hover:scale-105 transition-all duration-700 italic">
                                    {t.initials}
                                </div>
                                <div>
                                    <h4 className="font-black text-white text-2xl tracking-tighter leading-none uppercase italic">{t.name}</h4>
                                    <p className="text-[10px] text-cyan-500 mt-3 uppercase tracking-[0.3em] font-black font-mono">{t.role}</p>
                                </div>
                            </div>

                            <div className="flex gap-2 mb-8">
                                {[...Array(5)].map((_, i) => (
                                    <Zap key={i} className="w-3.5 h-3.5 text-cyan-500 glow-cyan fill-cyan-500" />
                                ))}
                            </div>

                            <p className="text-slate-400 font-bold leading-relaxed text-lg italic mb-10">
                                "{t.content}"
                            </p>

                            <div className="pt-10 border-t border-white/5 flex items-center justify-between">
                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] font-mono">STATUS: 100% REAL</span>
                                <div className="w-2 h-2 rounded-full bg-cyan-500 shadow-[0_0_12px_rgba(6,182,212,1)] glow-cyan" />
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    )
}
