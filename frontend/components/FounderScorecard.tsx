'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Activity, Target, Zap, Rocket, Shield, AlertCircle, Loader2, ArrowRight, CheckCircle2 } from 'lucide-react'
import axios from 'axios'
import { API_URL } from '../lib/api-config'
import toast from 'react-hot-toast'

interface ScorecardData {
    founder_score: number
    metrics: {
        market_fit: number
        technical_depth: number
        execution_velocity: number
        ops_readiness: number
    }
    insights: string[]
    roadmap: string[]
}

const MetricCard = ({ label, value, icon: Icon, color }: { label: string, value: number, icon: any, color: 'pink' | 'amber' | 'blue' | 'emerald' }) => {
    const colorClasses = {
        pink: 'bg-pink-500/10 text-pink-500 bg-pink-500 shadow-pink-500/50',
        amber: 'bg-amber-500/10 text-amber-500 bg-amber-500 shadow-amber-500/50',
        blue: 'bg-blue-500/10 text-blue-500 bg-blue-500 shadow-blue-500/50',
        emerald: 'bg-emerald-500/10 text-emerald-500 bg-emerald-500 shadow-emerald-500/50'
    }

    const bgLight = {
        pink: 'bg-pink-500/10', amber: 'bg-amber-500/10', blue: 'bg-blue-500/10', emerald: 'bg-emerald-500/10'
    }
    const textBase = {
        pink: 'text-pink-500', amber: 'text-amber-500', blue: 'text-blue-500', emerald: 'text-emerald-500'
    }
    const bgBase = {
        pink: 'bg-pink-500', amber: 'bg-amber-500', blue: 'bg-blue-500', emerald: 'bg-emerald-500'
    }

    return (
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 transition-all hover:border-white/20 group">
            <div className="flex items-center justify-between mb-4">
                <div className={`p-2 rounded-xl ${bgLight[color]} ${textBase[color]}`}>
                    <Icon className="w-5 h-5" />
                </div>
                <span className="text-2xl font-black text-white">{value}%</span>
            </div>
            <div className="space-y-2">
                <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-zinc-500">
                    <span>{label}</span>
                </div>
                <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${value}%` }}
                        transition={{ duration: 1, ease: "easeOut" }}
                        className={`h-full ${bgBase[color]} shadow-[0_0_10px_rgba(255,255,255,0.2)]`}
                    />
                </div>
            </div>
        </div>
    )
}

export default function FounderScorecard() {
    const [data, setData] = useState<ScorecardData | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const fetchScorecard = async () => {
        setIsLoading(true)
        setError(null)
        try {
            const response = await axios.get(`${API_URL}/api/v1/skillvibe/founder-scorecard`)
            setData(response.data)
        } catch (err: any) {
            console.error('Error fetching founder scorecard:', err)
            setError(err.response?.data?.detail || 'Failed to analyze candidate profile. Have you uploaded a background yet?')
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchScorecard()
    }, [])

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center py-20 animate-in fade-in duration-500">
                <div className="relative w-20 h-20 mb-6">
                    <div className="absolute inset-0 border-4 border-pink-500/20 rounded-full" />
                    <div className="absolute inset-0 border-4 border-t-pink-500 rounded-full animate-spin" />
                </div>
                <h3 className="text-xl font-black text-white italic tracking-tight">Recalculating Candidate-Market Fit...</h3>
                <p className="text-sm text-zinc-500 font-medium mt-2">Analyzing your operational trajectory.</p>
            </div>
        )
    }

    if (error || !data) {
        return (
            <div className="bg-pink-500/5 border border-pink-500/20 rounded-[2.5rem] p-12 text-center max-w-2xl mx-auto mt-10">
                <div className="w-16 h-16 bg-pink-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <AlertCircle className="w-8 h-8 text-pink-500" />
                </div>
                <h3 className="text-2xl font-black text-white mb-4 uppercase tracking-tighter">Analysis Required</h3>
                <p className="text-zinc-400 font-medium mb-8 leading-relaxed">
                    {error || "We need your background data to generate a candidate scorecard. Upload your CV or deck to see your insights."}
                </p>
                <button
                    onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                    className="px-8 py-4 bg-pink-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-105 transition-all shadow-xl shadow-pink-500/20"
                >
                    Upload Background
                </button>
            </div>
        )
    }

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Main Score & Big Metrics */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-4 bg-gradient-to-br from-pink-500 to-rose-600 rounded-[3rem] p-10 text-white shadow-2xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-bl-full -mr-10 -mt-10 blur-2xl group-hover:scale-150 transition-transform duration-1000"></div>

                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] mb-8 font-mono opacity-80">Your Skill Score</h3>

                    <div className="flex flex-col items-center">
                        <div className="relative">
                            <svg className="w-48 h-48 transform -rotate-90">
                                <circle cx="96" cy="96" r="80" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="8" />
                                <motion.circle
                                    cx="96" cy="96" r="80"
                                    fill="none"
                                    stroke="white"
                                    strokeWidth="12"
                                    strokeLinecap="round"
                                    initial={{ strokeDasharray: "0 502" }}
                                    animate={{ strokeDasharray: `${(data.founder_score / 100) * 502} 502` }}
                                    transition={{ duration: 2, ease: "easeOut" }}
                                />
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <span className="text-6xl font-black">{data.founder_score}</span>
                                <span className="text-xs font-bold opacity-60 uppercase tracking-widest">Global Pctl</span>
                            </div>
                        </div>

                        <div className="mt-10 text-center">
                            <p className="text-sm font-bold leading-relaxed mb-6 italic opacity-90">
                                {`Your profile shows strong ${data.metrics.execution_velocity > 80 ? 'execution skills' : 'market alignment'} with a focus on ${data.metrics.ops_readiness > 70 ? 'operational growth' : 'product vision'}.`}
                            </p>
                            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 rounded-full text-[10px] font-black uppercase tracking-widest backdrop-blur-md">
                                <Rocket className="w-3 h-3" /> Scale Readiness: High
                            </div>
                        </div>
                    </div>
                </div>

                <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <MetricCard label="Market Fit" value={data.metrics.market_fit} icon={Target} color="pink" />
                    <MetricCard label="Technical Depth" value={data.metrics.technical_depth} icon={Zap} color="amber" />
                    <MetricCard label="Execution Velocity" value={data.metrics.execution_velocity} icon={Rocket} color="blue" />
                    <MetricCard label="Ops Readiness" value={data.metrics.ops_readiness} icon={Shield} color="emerald" />
                </div>
            </div>

            {/* Insights & Roadmap */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white/5 border border-white/10 rounded-[2.5rem] p-10 group hover:border-pink-500/30 transition-all">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="w-10 h-10 bg-pink-500/10 rounded-xl flex items-center justify-center text-pink-500">
                            <Activity className="w-5 h-5 font-bold" />
                        </div>
                        <h3 className="text-xl font-black text-white uppercase tracking-tight">Candidate Insights</h3>
                    </div>
                    <div className="space-y-4">
                        {data.insights.map((insight, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.1 * i }}
                                className="flex items-start gap-4 p-4 rounded-2xl bg-white/[0.02] border border-white/5 group/insight hover:bg-white/[0.05] transition-all"
                            >
                                <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-pink-500 shrink-0 shadow-[0_0_5px_rgba(236,72,153,0.5)]" />
                                <p className="text-sm text-zinc-400 font-medium leading-relaxed group/insight:text-white transition-colors">{insight}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>

                <div className="bg-white/5 border border-white/10 rounded-[2.5rem] p-10 group hover:border-emerald-500/30 transition-all">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-500">
                            <Target className="w-5 h-5" />
                        </div>
                        <h3 className="text-xl font-black text-white uppercase tracking-tight">Ops Roadmap</h3>
                    </div>
                    <div className="space-y-4">
                        {data.roadmap.map((step, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, x: 10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.1 * i }}
                                className="flex items-start gap-4 p-4 rounded-2xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.05] transition-all group/step"
                            >
                                <div className="flex items-center justify-center w-6 h-6 rounded-lg bg-emerald-500/10 text-emerald-500 text-[10px] font-black shrink-0 mt-0.5 border border-emerald-500/20">
                                    {i + 1}
                                </div>
                                <p className="text-sm text-zinc-400 font-medium leading-relaxed group/step:text-white transition-colors">{step}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>

            {/* CTA */}
            <div className="bg-gradient-to-r from-zinc-900 to-black border border-white/10 rounded-[2rem] p-8 flex flex-col md:flex-row items-center justify-between gap-6 overflow-hidden relative">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(219,39,119,0.1),transparent)]" />
                <div className="relative z-10 text-center md:text-left">
                    <h4 className="text-lg font-black text-white tracking-tight">Scale your candidate brand to the next level.</h4>
                    <p className="text-xs text-zinc-500 font-medium">Get personalized introductions & investor readiness feedback.</p>
                </div>
                <button className="relative z-10 px-6 py-3 bg-white text-black rounded-xl font-black text-[10px] uppercase tracking-widest hover:scale-105 transition-all flex items-center gap-2 group">
                    Get Started <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
            </div>
        </div>
    )
}
