'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { Shield, ArrowLeft, Lock, Eye, FileText, ChevronRight } from 'lucide-react'
import Navbar from '../../components/Navbar'
import { useAuth } from '../../contexts/AuthContext'
import Footer from '../../components/Footer'
import AuthModal from '../../components/AuthModal'
import DashboardModal from '../../components/DashboardModal.jsx'

export default function PrivacyPolicy() {
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

            {/* Header - Manifesto Identity */}
            <main className="relative z-10 pt-40 pb-24 px-6">
                <div className="max-w-4xl mx-auto">
                    <div className="text-center mb-24">
                        <div className="inline-flex items-center gap-3 mb-10 px-6 py-2.5 bg-slate-100 dark:bg-slate-900/80 text-slate-900 dark:text-indigo-400 rounded-xl text-[10px] font-black uppercase tracking-[0.4em] font-mono border border-slate-200 dark:border-slate-800 shadow-2xl relative overflow-hidden group">
                            <div className="absolute inset-0 bg-grid-blueprint opacity-[0.2] pointer-events-none" />
                            <Shield className="w-3.5 h-3.5 relative z-10 animate-pulse" />
                            <span className="relative z-10">PRIVACY_1.0</span>
                        </div>
                        <h1 className="text-5xl lg:text-8xl font-display font-black text-slate-900 dark:text-white mb-8 tracking-tighter uppercase leading-[0.85]">
                            Privacy <br /> <span className="text-indigo-600 dark:text-indigo-500 underline decoration-indigo-500/20">Policy</span>
                        </h1>
                        <p className="text-lg text-slate-600 dark:text-slate-400 font-bold uppercase tracking-wide max-w-2xl mx-auto mb-10 opacity-80">
                            We respect your privacy and protect your data. This page explains how we handle personal information.
                        </p>
                        <div className="flex items-center justify-center gap-4 text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 dark:text-slate-500 border-t border-slate-200 dark:border-slate-800 pt-8 mt-8">
                            <span>LAST_COMMITTED:</span>
                            <span className="text-slate-900 dark:text-white px-3 py-1 bg-slate-100 dark:bg-slate-900 rounded-md">{lastUpdated}</span>
                        </div>
                    </div>

                    {/* Manifesto Schematic Sections */}
                    <div className="space-y-12">
                        {/* Intro Card */}
                        <div className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] shadow-2xl overflow-hidden relative group">
                            <div className="absolute inset-0 bg-grid-blueprint opacity-[0.02] pointer-events-none" />
                            <div className="p-10 lg:p-14 space-y-16">

                                {/* 01. INTRO */}
                                <div className="space-y-6">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 flex items-center justify-center font-black text-sm shadow-xl">01</div>
                                        <h2 className="text-sm font-black uppercase tracking-[0.3em] text-slate-900 dark:text-white">Introduction</h2>
                                    </div>
<div className="text-slate-600 dark:text-slate-400 leading-relaxed font-bold text-[15px] space-y-6 max-w-3xl">
                                        <p>
                                            We collect information when you use SkillVibe so we can provide and improve the service. This policy explains what data we collect and how we use it.
                                        </p>
                                        <p>
                                            When you sign up or log in, you agree to this policy. We do not sell your personal data or use it for anything other than running the platform and providing support.
                                        </p>
                                    </div>
                                </div>

                                {/* 02. COLLECTION */}
                                <div className="space-y-8">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-black text-sm shadow-xl shadow-indigo-600/20">02</div>
                                        <h2 className="text-sm font-black uppercase tracking-[0.3em] text-slate-900 dark:text-white">Identity Acquisition</h2>
                                    </div>
                                    <div className="grid md:grid-cols-2 gap-6">
                                        {[
                                            { title: "Account info", desc: "Your name, email, and login tokens." },
                                            { title: "Device info", desc: "IP address, browser type, and how you use the site." },
                                            { title: "Content you add", desc: "Text, links or files you submit." },
                                            { title: "Payment info", desc: "Transaction details from our payment partner. We never store your card numbers." }
                                        ].map((item, i) => (
                                            <div key={i} className="p-6 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-2xl group hover:border-indigo-500/30 transition-all">
                                                <h3 className="text-[11px] font-black text-slate-900 dark:text-white mb-2 uppercase tracking-widest flex items-center gap-2">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                                                    {item.title}
                                                </h3>
                                                <p className="text-[12px] text-slate-500 dark:text-slate-400 font-bold leading-relaxed">{item.desc}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* 03. LOGIC */}
                                <div className="space-y-6">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 flex items-center justify-center font-black text-sm">03</div>
                                        <h2 className="text-sm font-black uppercase tracking-[0.3em] text-slate-900 dark:text-white">Operational Directives</h2>
                                    </div>
                                    <ul className="grid md:grid-cols-2 gap-4">
                                        {[
                                            "Run and maintain the website",
                                            "Send you updates and alerts",
                                            "Provide customer support",
                                            "Improve our features using usage data",
                                            "Monitor site performance",
                                            "Protect against abuse and fraud"
                                        ].map((log, i) => (
                                            <li key={i} className="flex items-center gap-3 text-xs font-bold text-slate-500 uppercase tracking-tight">
                                                <ChevronRight className="w-3 h-3 text-indigo-500" />
                                                {log}
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                {/* AI SAFETY SHIELD */}
                                <div className="p-8 bg-slate-950 rounded-[2rem] border border-slate-800 relative overflow-hidden group">
                                    <div className="absolute inset-0 bg-grid-blueprint opacity-[0.05] pointer-events-none" />
                                    <div className="relative z-10 flex items-start gap-6">
                                        <div className="w-12 h-12 rounded-xl bg-indigo-600 flex items-center justify-center text-white flex-shrink-0 shadow-2xl">
                                            <Lock className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-black text-white mb-2 uppercase tracking-tighter">Data Protection</h3>
                                            <p className="text-slate-400 text-sm font-bold leading-relaxed max-w-xl">
                                                We use industry-standard security to keep your data safe. We do not train our AI models on your private content.
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* 04. SHARING */}
                                <div className="space-y-6">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 flex items-center justify-center font-black text-sm">04</div>
                                        <h2 className="text-sm font-black uppercase tracking-[0.3em] text-slate-900 dark:text-white">Third-Party Sync</h2>
                                    </div>
                                    <div className="space-y-4">
<p className="text-slate-500 dark:text-slate-400 font-bold uppercase text-[12px] tracking-widest">We share information with:</p>
                                        <div className="flex flex-wrap gap-4">
                                            {['OpenAI (for AI features)', 'Google Analytics', 'Dodo Payments'].map((node, i) => (
                                                <div key={i} className="px-5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-700 dark:text-slate-300">
                                                    {node}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* CONTACT FOOTER */}
                                <div className="pt-16 border-t border-slate-200 dark:border-slate-800">
                                    <div className="flex flex-col md:flex-row items-center justify-between gap-10">
                                        <div className="text-center md:text-left">
                                            <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-3 uppercase tracking-tighter">Need Help?</h3>
                                            <p className="text-slate-500 dark:text-slate-400 font-bold text-xs uppercase tracking-widest">Email us at business@entrext.in.</p>
                                        </div>
                                        <a href="mailto:business@entrext.in" className="group px-10 py-5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] shadow-2xl hover:scale-105 active:scale-95 transition-all flex items-center gap-3">
                                            Contact_Legal_OS
                                            <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                                        </a>
                                    </div>
                                </div>

                            </div>
                        </div>

                        {/* Back Home Protocol */}
                        <div className="text-center pt-8">
                            <Link href="/" className="inline-flex items-center gap-3 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 font-black uppercase tracking-[0.3em] text-[10px] transition-all group">
                                <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
                                Return Home
                            </Link>
                        </div>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    )
}
