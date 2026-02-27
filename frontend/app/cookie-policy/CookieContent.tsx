'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { Cookie, ArrowLeft, Info, Settings, Database, ChevronRight } from 'lucide-react'
import Navbar from '../../components/Navbar'
import { useAuth } from '../../contexts/AuthContext'
import Footer from '../../components/Footer'
import AuthModal from '../../components/AuthModal'
import DashboardModal from '../../components/DashboardModal'

export default function CookiePolicy() {
    const { isAuthenticated, isLoading } = useAuth()
    const [showAuthModal, setShowAuthModal] = useState(false)
    const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>('login')
    const [showDashboard, setShowDashboard] = useState(false)
    const lastUpdated = 'February 27, 2026'

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 selection:bg-indigo-500/30 font-sans overflow-x-hidden">
            {/* Industrial Background Schematic */}
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="absolute inset-0 bg-grid-blueprint-light dark:bg-grid-blueprint opacity-[0.4] dark:opacity-[0.1]" />
                <div className="absolute top-[-5%] right-[-5%] w-[45%] h-[45%] bg-indigo-500/5 rounded-full blur-[120px]" />

                {/* Dynamic Scanline Overlay */}
                <div className="absolute inset-0 overflow-hidden opacity-[0.05]">
                    <div className="w-full h-1 bg-indigo-500 animate-scanline" />
                </div>
            </div>

            {/* Navigation Schematic */}
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

            {/* Header - Cookie Schematic Identity */}
            <main className="relative z-10 pt-40 pb-24 px-6">
                <div className="max-w-4xl mx-auto">
                    <div className="text-center mb-24">
                        <div className="inline-flex items-center gap-3 mb-10 px-6 py-2.5 bg-slate-100 dark:bg-slate-900/80 text-slate-900 dark:text-amber-500 rounded-xl text-[10px] font-black uppercase tracking-[0.4em] font-mono border border-slate-200 dark:border-slate-800 shadow-2xl relative overflow-hidden group">
                            <div className="absolute inset-0 bg-grid-blueprint opacity-[0.2] pointer-events-none" />
                            <Cookie className="w-3.5 h-3.5 relative z-10 animate-pulse" />
                            <span className="relative z-10">COOKIE_TRACK_OS_V1.0</span>
                        </div>
                        <h1 className="text-5xl lg:text-8xl font-display font-black text-slate-900 dark:text-white mb-8 tracking-tighter uppercase leading-[0.85]">
                            Cookie <br /> <span className="text-amber-600 dark:text-amber-500 underline decoration-amber-500/20">Schematic</span>
                        </h1>
                        <p className="text-lg text-slate-600 dark:text-slate-400 font-bold uppercase tracking-wide max-w-2xl mx-auto mb-10 opacity-80">
                            The micro-data architecture of your browser interaction. We utilize <span className="text-slate-900 dark:text-white">Authorized Nodes</span> to optimize the engine performance.
                        </p>
                        <div className="flex items-center justify-center gap-4 text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 dark:text-slate-500 border-t border-slate-200 dark:border-slate-800 pt-8 mt-8">
                            <span>LAST_COMMITTED:</span>
                            <span className="text-slate-900 dark:text-white px-3 py-1 bg-slate-100 dark:bg-slate-900 rounded-md">{lastUpdated}</span>
                        </div>
                    </div>

                    {/* Cookie Schematic Sections */}
                    <div className="space-y-12">
                        {/* Schematic Card */}
                        <div className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] shadow-2xl overflow-hidden relative group">
                            <div className="absolute inset-0 bg-grid-blueprint opacity-[0.02] pointer-events-none" />
                            <div className="p-10 lg:p-14 space-y-16">

                                {/* 01. DEFINITION */}
                                <div className="space-y-6">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 flex items-center justify-center font-black text-sm shadow-xl">01</div>
                                        <h2 className="text-sm font-black uppercase tracking-[0.3em] text-slate-900 dark:text-white">_TERMINAL_COOKIE_LOGIC</h2>
                                    </div>
                                    <div className="text-slate-600 dark:text-slate-400 leading-relaxed font-bold text-[15px] space-y-6 max-w-3xl">
                                        <p>
                                            Cookies are discrete data packets stored within your local architecture. They are critical for the Reputation Engine to maintain session persistence and operational continuity.
                                        </p>
                                    </div>
                                </div>

                                {/* 02. TYPES */}
                                <div className="space-y-8">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-xl bg-amber-600 text-white flex items-center justify-center font-black text-sm shadow-xl shadow-amber-600/20">02</div>
                                        <h2 className="text-sm font-black uppercase tracking-[0.3em] text-slate-900 dark:text-white">_AUTHORIZED_NODE_CLASSIFICATION</h2>
                                    </div>
                                    <div className="grid md:grid-cols-2 gap-6">
                                        {[
                                            { title: "ESSENTIAL_CORE", icon: Settings, desc: "Critical for authentication and session shielding. Cannot be decommissioned." },
                                            { title: "PERFORMANCE_METRICS", icon: Database, desc: "Anonymized logs for platform optimization and latency management." }
                                        ].map((item, i) => (
                                            <div key={i} className="p-8 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl group hover:border-amber-500/30 transition-all">
                                                <div className="w-12 h-12 bg-white dark:bg-slate-900 rounded-xl flex items-center justify-center text-amber-600 mb-6 border border-slate-100 dark:border-slate-800 shadow-xl group-hover:scale-110 transition-transform">
                                                    <item.icon className="w-6 h-6" />
                                                </div>
                                                <h3 className="text-[12px] font-black text-slate-900 dark:text-white mb-3 uppercase tracking-widest">{item.title}</h3>
                                                <p className="text-[13px] text-slate-500 dark:text-slate-400 font-bold leading-relaxed">{item.desc}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* 03. THIRD PARTY */}
                                <div className="space-y-8">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 flex items-center justify-center font-black text-sm">03</div>
                                        <h2 className="text-sm font-black uppercase tracking-[0.3em] text-slate-900 dark:text-white">_EXTERNAL_DATA_SYNC</h2>
                                    </div>
                                    <div className="p-8 bg-slate-950 rounded-[2rem] border border-slate-800 relative overflow-hidden group">
                                        <div className="absolute inset-0 bg-grid-blueprint opacity-[0.05] pointer-events-none" />
                                        <div className="relative z-10 space-y-6">
                                            <p className="text-slate-400 text-[14px] font-bold leading-relaxed max-w-2xl">
                                                Select third-party nodes are authorized to process micro-data on our behalf for high-fidelity service delivery:
                                            </p>
                                            <div className="flex flex-wrap gap-4">
                                                {["GOOGLE_ANALYTICS_V4", "DODO_PAYMENTS_GATEWAY"].map((node, i) => (
                                                    <div key={i} className="px-5 py-3 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] text-white">
                                                        {node}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* 04. MANAGEMENT */}
                                <div className="space-y-6">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 flex items-center justify-center font-black text-sm shadow-xl">04</div>
                                        <h2 className="text-sm font-black uppercase tracking-[0.3em] text-slate-900 dark:text-white">_NODE_MANAGEMENT_POLICY</h2>
                                    </div>
                                    <div className="text-slate-600 dark:text-slate-400 leading-relaxed font-bold text-[15px] space-y-6 max-w-3xl">
                                        <p>
                                            Users can terminal-kill cookie storage via browser local settings. WARNING: Decommissioning essential cookies results in total operational failure of the Distribution Engine.
                                        </p>
                                        <div className="p-6 bg-slate-50 dark:bg-slate-950/80 border-l-4 border-amber-600 rounded-r-2xl flex items-start gap-5">
                                            <Info className="w-6 h-6 text-amber-600 mt-1 flex-shrink-0" />
                                            <p className="text-[12px] uppercase tracking-wide leading-relaxed font-black">
                                                PROTOCOL_RECOMMENDATION: RETAIN ALL COKIE NODES FOR OPTIMAL ENGINE RESONANCE.
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* CONTACT FOOTER */}
                                <div className="pt-16 border-t border-slate-200 dark:border-slate-800">
                                    <div className="flex flex-col md:flex-row items-center justify-between gap-10">
                                        <div className="text-center md:text-left">
                                            <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-3 uppercase tracking-tighter">TECHNICAL_DISPATCH</h3>
                                            <p className="text-slate-500 dark:text-slate-400 font-bold text-xs uppercase tracking-widest">Submit an inquiry regarding the cookie schematic.</p>
                                        </div>
                                        <a href="mailto:business@entrext.in" className="group px-10 py-5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] shadow-2xl hover:scale-105 active:scale-95 transition-all flex items-center gap-3">
                                            Contact_Core_Tech
                                            <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                                        </a>
                                    </div>
                                </div>

                            </div>
                        </div>

                        {/* Back Home Protocol */}
                        <div className="text-center pt-8">
                            <Link href="/" className="inline-flex items-center gap-3 text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 font-black uppercase tracking-[0.3em] text-[10px] transition-all group">
                                <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
                                Terminate_Schematic_View
                            </Link>
                        </div>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    )
}
