'use client'

import { motion, useInView, useAnimationControls } from 'framer-motion'
import { Database, Cpu, Radio, ArrowRight } from 'lucide-react'
import { useRef, useEffect } from 'react'

const steps = [
    {
        icon: Database,
        step: '01',
        title: 'UPLOAD WORK',
        description: 'Simply upload your resume or link your portfolio. We make it easy to put all your best work in one place.',
        color: 'cyan',
        gradient: 'from-cyan-500/20 to-transparent',
        border: 'border-cyan-500/30',
        glow: 'shadow-[0_0_40px_rgba(6,182,212,0.15)]',
        iconBg: 'bg-cyan-500/10',
        iconBorder: 'border-cyan-500/20',
        iconGlow: 'rgba(6,182,212,0.4)',
    },
    {
        icon: Cpu,
        step: '02',
        title: 'GET A SCORE',
        description: 'Our smart system looks at your work and gives you a score. This shows everyone how good you really are.',
        color: 'indigo',
        gradient: 'from-indigo-500/20 to-transparent',
        border: 'border-indigo-500/30',
        glow: 'shadow-[0_0_40px_rgba(99,102,241,0.15)]',
        iconBg: 'bg-indigo-500/10',
        iconBorder: 'border-indigo-500/20',
        iconGlow: 'rgba(99,102,241,0.4)',
    },
    {
        icon: Radio,
        step: '03',
        title: 'GET HIRED',
        description: 'Companies can see your score and find you easily. No more long applications—let your work speak for you.',
        color: 'blue',
        gradient: 'from-blue-500/20 to-transparent',
        border: 'border-blue-500/30',
        glow: 'shadow-[0_0_40px_rgba(59,130,246,0.15)]',
        iconBg: 'bg-blue-500/10',
        iconBorder: 'border-blue-500/20',
        iconGlow: 'rgba(59,130,246,0.4)',
    },
]

function StepCard({ step, index }: { step: typeof steps[0]; index: number }) {
    const ref = useRef(null)
    const isInView = useInView(ref, { once: true, margin: '-80px' })
    const Icon = step.icon

    return (
        <motion.div
            ref={ref}
            initial={{ opacity: 0, y: 60, scale: 0.92 }}
            animate={isInView ? { opacity: 1, y: 0, scale: 1 } : {}}
            transition={{ delay: index * 0.18, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="relative group"
        >
            {/* Card */}
            <div
                className={`relative glass-card rounded-[2rem] p-10 border ${step.border} transition-all duration-700 
        hover:${step.glow} hover:scale-[1.02] overflow-hidden flex flex-col items-center text-center`}
            >
                {/* Background gradient bloom */}
                <div className={`absolute inset-0 bg-gradient-to-b ${step.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none`} />

                {/* Animated corner accent */}
                <motion.div
                    className={`absolute top-0 right-0 w-24 h-24 rounded-bl-[2rem] bg-gradient-to-bl ${step.gradient} opacity-30`}
                    animate={{ opacity: [0.2, 0.5, 0.2] }}
                    transition={{ duration: 3, repeat: Infinity, delay: index * 0.5 }}
                />

                {/* Step number */}
                <motion.div
                    className={`absolute top-6 left-7 text-[11px] font-black font-mono tracking-[0.3em] text-${step.color}-500 opacity-50`}
                    initial={{ opacity: 0, x: -10 }}
                    animate={isInView ? { opacity: 0.5, x: 0 } : {}}
                    transition={{ delay: index * 0.18 + 0.4, duration: 0.5 }}
                >
                    STEP_{step.step}
                </motion.div>

                {/* Icon with pulsing halo */}
                <div className="relative mb-8 mt-4">
                    {/* Outer pulsing ring */}
                    <motion.div
                        className={`absolute inset-0 rounded-2xl ${step.iconBg}`}
                        animate={{ scale: [1, 1.35, 1], opacity: [0.4, 0, 0.4] }}
                        transition={{ duration: 2.5, repeat: Infinity, delay: index * 0.4 }}
                    />
                    {/* Inner icon box */}
                    <motion.div
                        className={`relative w-20 h-20 rounded-2xl ${step.iconBg} ${step.iconBorder} border-2 flex items-center justify-center`}
                        whileHover={{ rotate: [0, -6, 6, 0], transition: { duration: 0.4 } }}
                    >
                        <Icon className={`w-9 h-9 text-${step.color}-500`} />
                    </motion.div>
                </div>

                {/* Title */}
                <motion.h3
                    className="text-2xl md:text-3xl font-black text-white tracking-tight uppercase italic mb-4"
                    initial={{ opacity: 0 }}
                    animate={isInView ? { opacity: 1 } : {}}
                    transition={{ delay: index * 0.18 + 0.3 }}
                >
                    {step.title}
                </motion.h3>

                {/* Description */}
                <p className="text-slate-400 leading-relaxed font-medium text-sm max-w-xs">
                    {step.description}
                </p>

                {/* Hover CTA */}
                <motion.div
                    className={`mt-8 flex items-center gap-2 text-${step.color}-400`}
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 0 }}
                    whileHover={{ opacity: 1, y: 0 }}
                >
                    <span className="text-[9px] font-black uppercase tracking-widest">Learn more</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                </motion.div>

                {/* Bottom progress bar (fills on hover) */}
                <div className={`absolute bottom-0 left-0 right-0 h-[2px] bg-white/5`}>
                    <motion.div
                        className={`h-full bg-${step.color}-500 w-0 group-hover:w-full transition-all duration-700`}
                    />
                </div>
            </div>
        </motion.div>
    )
}

// Animated connector line between steps
function Connector({ index }: { index: number }) {
    const ref = useRef(null)
    const isInView = useInView(ref, { once: true, margin: '-60px' })

    return (
        <div ref={ref} className="hidden md:flex items-center justify-center relative -mx-4 z-20">
            <div className="relative w-full h-[2px] bg-white/5 overflow-hidden rounded-full">
                <motion.div
                    className="absolute top-0 left-0 h-full bg-gradient-to-r from-cyan-500/60 via-indigo-500/60 to-blue-500/60"
                    initial={{ width: '0%' }}
                    animate={isInView ? { width: '100%' } : {}}
                    transition={{ delay: index * 0.2 + 0.6, duration: 0.8, ease: 'easeInOut' }}
                />
                {/* Moving shimmer dot */}
                <motion.div
                    className="absolute top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.8)]"
                    animate={{ x: ['-8px', '120px', '-8px'] }}
                    transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut', delay: index * 0.3 }}
                />
            </div>
            <ArrowRight className="absolute right-0 w-4 h-4 text-cyan-500/40 translate-x-2" />
        </div>
    )
}

export default function HowItWorks() {
    const headerRef = useRef(null)
    const headerInView = useInView(headerRef, { once: true, margin: '-60px' })

    return (
        <section className="py-32 relative overflow-hidden bg-background" id="how-it-works">
            {/* Top / Bottom rule lines */}
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-500/20 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-indigo-500/20 to-transparent" />

            {/* Background orbs */}
            <div className="absolute top-1/2 left-1/4 w-[500px] h-[500px] -translate-y-1/2 bg-cyan-500/5 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute top-1/2 right-1/4 w-[400px] h-[400px] -translate-y-1/2 bg-indigo-500/5 rounded-full blur-[120px] pointer-events-none" />

            <div className="container mx-auto px-4 relative z-10">
                {/* Header */}
                <div ref={headerRef} className="text-center mb-24">
                    <motion.div
                        initial={{ opacity: 0, y: -16 }}
                        animate={headerInView ? { opacity: 1, y: 0 } : {}}
                        transition={{ duration: 0.5 }}
                        className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-500 text-[10px] font-black uppercase tracking-[0.3em] mb-8"
                    >
                        <motion.span
                            className="w-1.5 h-1.5 rounded-full bg-cyan-500"
                            animate={{ opacity: [1, 0.2, 1] }}
                            transition={{ duration: 1.2, repeat: Infinity }}
                        />
                        3 SIMPLE STEPS
                    </motion.div>

                    <motion.h2
                        initial={{ opacity: 0, y: 30 }}
                        animate={headerInView ? { opacity: 1, y: 0 } : {}}
                        transition={{ duration: 0.7, delay: 0.1 }}
                        className="text-5xl md:text-7xl font-black text-slate-900 dark:text-white mb-6 uppercase tracking-tighter"
                    >
                        HOW IT <span className="text-gradient-cyan">WORKS</span>
                    </motion.h2>

                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={headerInView ? { opacity: 1 } : {}}
                        transition={{ delay: 0.3 }}
                        className="text-slate-500 max-w-2xl mx-auto text-lg font-bold"
                    >
                        Follow these simple steps to start proving your skills.
                    </motion.p>
                </div>

                {/* Steps grid with animated connectors */}
                <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr_auto_1fr] gap-4 md:gap-0 max-w-6xl mx-auto items-center">
                    {steps.map((step, i) => (
                        <div key={`step-wrap-${step.step}`} className="contents">
                            <StepCard key={step.step} step={step} index={i} />
                            {i < steps.length - 1 && <Connector key={`conn-${i}`} index={i} />}
                        </div>
                    ))}
                </div>
            </div>
        </section>
    )
}
