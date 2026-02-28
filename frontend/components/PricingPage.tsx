import React, { useState } from 'react'
import { Check, X, Crown, Users, Sparkles, BarChart3, Heart, Plus, Minus, Zap, Shield, ArrowRight, Star, Quote, Terminal, Box, Cpu, Workflow, Database, Brackets, Activity, Lock, Rocket, Network, ShieldCheck, Target, Radio } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import PaymentModal from './PaymentModal'
import AuthModal from './AuthModal'
import DowngradeModal from './DowngradeModal'
import axios from 'axios'
import toast from 'react-hot-toast'
import { API_URL } from '@/lib/api-config'
import { motion, AnimatePresence } from 'framer-motion'

interface PricingPageProps {
  onSignUp: (plan: string) => void
}

interface FAQItemProps {
  faq: {
    question: string
    answer: string
  }
  index: number
}

function FAQItem({ faq, index }: FAQItemProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <div className="glass-card rounded-2xl overflow-hidden border border-white/5 bg-white/[0.02] backdrop-blur-3xl transition-all duration-500 group">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-8 py-7 text-left flex items-center justify-between hover:bg-cyan-500/[0.05] transition-colors"
      >
        <div className="flex items-center gap-6">
          <span className="text-cyan-500 font-mono text-[10px] opacity-40">[0{index + 1}]</span>
          <span className="text-xl font-black text-white pr-6 tracking-tight uppercase italic group-hover:text-cyan-400 transition-colors">
            {faq.question}
          </span>
        </div>
        <div className={`flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-500 ${isExpanded ? "bg-cyan-500 text-black shadow-[0_0_20px_rgba(6,182,212,0.4)]" : "bg-white/5 text-slate-500 hover:text-white"
          }`}>
          {isExpanded ? <Minus className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
        </div>
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-t border-white/5"
          >
            <div className="px-8 pb-10 pt-8 text-slate-400 leading-relaxed text-lg font-medium">
              <div className="flex gap-6">
                <div className="w-1.5 h-auto bg-cyan-500/20 rounded-full shrink-0 group-hover:bg-cyan-500 transition-colors" />
                <p className="opacity-80">{faq.answer}</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default function PricingPage({ onSignUp }: PricingPageProps) {
  const { isAuthenticated, user, updateUser, refreshUser } = useAuth()
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly')

  React.useEffect(() => {
    if (isAuthenticated) {
      refreshUser()
    }
  }, [isAuthenticated])
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState<string>('pro')
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>('register')
  const [isDowngrading, setIsDowngrading] = useState(false)
  const [showDowngradeModal, setShowDowngradeModal] = useState(false)

  const handleDowngradeToFree = async () => {
    if (!user?.is_premium) return

    setIsDowngrading(true)
    try {
      sessionStorage.setItem('manual_cancellation', 'true')
      const response = await axios.post(`${API_URL}/api/v1/payment/cancel`)

      if (response.data.success) {
        updateUser({ is_premium: false })
        const keys = Object.keys(sessionStorage)
        keys.forEach(key => {
          if (key.includes('usage_stats') || key.includes('dashboard_stats')) {
            sessionStorage.removeItem(key)
          }
        })
        window.dispatchEvent(new CustomEvent('subscription-cancelled', {
          detail: { is_premium: false }
        }))
        toast.success('Subscription cancelled successfully.')
        setShowDowngradeModal(false)
        onSignUp('free')
      } else {
        toast.error(response.data.message || 'Failed to cancel subscription. Please try again.')
      }
    } catch (error: any) {
      console.error('Error downgrading subscription:', error)
      if (error.response?.status === 400) {
        toast.error('No active subscription found.')
      } else {
        toast.error('Failed to cancel subscription. Please try again.')
      }
    } finally {
      setIsDowngrading(false)
    }
  }

  const handlePlanSelection = (planId: string) => {
    if (planId === 'free') {
      if (user?.is_premium) {
        setShowDowngradeModal(true)
      } else {
        onSignUp(planId)
      }
    } else {
      if (!isAuthenticated) {
        setSelectedPlan(planId)
        setAuthModalMode('register')
        setShowAuthModal(true)
        return
      }
      setSelectedPlan(planId)
      setShowPaymentModal(true)
    }
  }

  const handleAuthModalClose = () => {
    setShowAuthModal(false)
    if (isAuthenticated) {
      setTimeout(() => {
        setShowPaymentModal(true)
      }, 100)
    }
  }

  const plans = [
    {
      id: 'free',
      name: 'SEED STAGE',
      description: 'Free verification for emerging professionals',
      price: { monthly: 0, yearly: 0 },
      badge: 'STARTER',
      features: [
        'AI Elite Rating Analysis',
        'Leaderboard Access',
        'Vibe Notes Reception',
        'Trust Score Calculation',
        'Email Support'
      ],
      limitations: [],
      cta: 'GET STARTED',
      popular: false,
    },
    {
      id: 'pro',
      name: 'PILLAR ELITE PASS',
      description: 'Accelerated verification for ambitious professionals',
      price: { monthly: 19, yearly: 180 },
      badge: 'PROFESSIONAL',
      features: [
        'Unlimited Resume Uploads',
        'AI Resume Analysis',
        'Priority Recruiter Access',
        'Featured on Leaderboard',
        'Profile View Analytics',
        'Vibe Notes Analytics',
        'Premium Support',
        'Advanced Profile Dashboard'
      ],
      limitations: [],
      cta: 'UPGRADE TO PILLAR',
      popular: true,
    }
  ]

  const faqs = [
    {
      question: 'How is my Elite Rating calculated?',
      answer: "Our AI analyzer evaluates your resume across 6 dimensions: Company Prestige, Achievement Complexity, Proof of Impact, Career Trajectory, Integrity Signals, and Skill Rarity."
    },
    {
      question: "What's included with Pillar Elite Pass?",
      answer: "Unlimited resume uploads, AI resume analysis, priority recruiter discovery, featured leaderboard position, profile analytics, and priority support."
    },
    {
      question: 'How can I improve my Elite Rating?',
      answer: "Build experience at prestigious firms, demonstrate complex technical achievements, collect Vibe Notes from recruiters, and maintain a clear professional narrative."
    },
    {
      question: 'Can I cancel anytime?',
      answer: "Yes. You can cancel your Pillar Elite Pass anytime. Your profile remains on the leaderboard, but premium features are removed immediately."
    },
    {
      question: 'Is there a refund policy?',
      answer: "You get a 7-day money-back guarantee. If not satisfied within 7 days of purchase, contact support for a full refund."
    }
  ]

  return (
    <div className="space-y-40 py-16">
      {/* Background Decor */}
      <div className="fixed inset-0 bg-cyber-grid opacity-10 pointer-events-none" />

      {/* Header Section */}
      <div className="text-center space-y-8 max-w-5xl mx-auto px-6 relative z-10">
        <div className="inline-flex items-center px-6 py-2.5 rounded-full glass-panel border border-cyan-500/30 text-cyan-500 text-[10px] font-black uppercase tracking-[0.4em] glow-cyan">
          <Activity className="w-4 h-4 mr-3" />
          {user?.is_premium ? 'PRO ACTIVE' : 'FREE ACTIVE'}
        </div>

        <h1 className="text-6xl md:text-9xl font-black text-white tracking-tighter leading-none uppercase italic">
          SELECT YOUR <br />
          <span className="text-gradient-cyan">PLAN</span>
        </h1>

        <p className="text-xl text-slate-500 font-bold max-w-2xl mx-auto leading-relaxed group">
          Choose a plan that matches your current momentum. <br />
          <span className="text-cyan-500/60 font-mono text-sm">[ ENCRYPTION: SECURE ]</span>
        </p>

        {/* Improved Billing Toggle */}
        <div className="flex justify-center pt-10">
          <div className="glass-panel p-2 rounded-2xl border border-white/10 flex gap-2 relative group max-w-full hover:glow-cyan transition-all duration-700">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`px-10 py-4 rounded-xl font-black text-xs uppercase tracking-[0.2em] transition-all duration-500 relative z-10 ${billingCycle === 'monthly'
                ? 'bg-cyan-500 text-black shadow-xl shadow-cyan-500/40'
                : 'text-slate-500 hover:text-white'
                }`}
            >
              MONTHLY
            </button>
            <button
              onClick={() => setBillingCycle('yearly')}
              className={`px-10 py-4 rounded-xl font-black text-xs uppercase tracking-[0.2em] transition-all duration-500 flex items-center gap-3 relative z-10 ${billingCycle === 'yearly'
                ? 'bg-cyan-500 text-black shadow-xl shadow-cyan-500/40'
                : 'text-slate-500 hover:text-white'
                }`}
            >
              YEARLY
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-black">
                -20%
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="grid md:grid-cols-2 gap-12 max-w-7xl mx-auto px-6 relative z-10">
        {plans.map((plan) => (
          <div
            key={plan.id}
            className={`relative p-10 md:p-14 rounded-[4rem] flex flex-col group overflow-hidden transition-all duration-700 ${plan.popular
              ? 'bg-black border-2 border-cyan-500/60 shadow-4xl shadow-cyan-500/20 md:scale-105 z-20'
              : 'bg-white/[0.03] backdrop-blur-3xl border border-white/10 shadow-3xl'
              }`}
          >
            {/* Visual Deco */}
            <div className="absolute inset-0 bg-cyber-grid opacity-5 pointer-events-none" />
            <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent opacity-0 group-hover:opacity-100 group-hover:animate-scanline" />

            <div className="flex justify-between items-start mb-10 gap-4">
              <div className="space-y-4">
                <span className={`px-4 py-1.5 rounded-lg text-[10px] font-black tracking-[0.3em] border uppercase ${plan.popular ? "bg-cyan-500/20 text-cyan-400 border-cyan-500/30" : "bg-white/5 text-slate-500 border-white/10"
                  }`}>
                  {plan.badge}
                </span>
                <h3 className="text-4xl md:text-5xl font-black text-white tracking-tighter uppercase italic">{plan.name}</h3>
                <p className="text-slate-500 font-bold text-xs tracking-[0.1em] uppercase">{plan.description}</p>
              </div>

              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-500 ${plan.popular ? "bg-cyan-500 text-black shadow-xl shadow-cyan-500/30 group-hover:rotate-12" : "bg-white/5 text-slate-600 border border-white/5"}`}>
                {plan.id === 'pro' ? <Cpu className="w-8 h-8" /> : <Target className="w-8 h-8" />}
              </div>
            </div>

            <div className="mb-10 p-10 rounded-[3rem] bg-white/5 border border-white/5 relative overflow-hidden group/price flex flex-col items-center">
              <div className="flex items-end gap-1">
                <span className="text-3xl font-black text-white/20 mb-3">$</span>
                <span className="text-8xl font-black text-white tracking-tighter transition-transform group-hover/price:scale-110 duration-700">
                  {plan.price[billingCycle]}
                </span>
              </div>
              <span className="text-slate-500 font-black text-xs tracking-[0.3em] uppercase mt-4">
                / {billingCycle === 'monthly' ? 'PER MONTH' : 'PER YEAR'}
              </span>
            </div>

            <ul className="space-y-5 mb-12 flex-1 relative z-10">
              {plan.features.map((feature, i) => (
                <li key={i} className="flex items-center text-sm group/feat">
                  <div className={`mr-5 p-2 rounded-lg border transition-all duration-500 ${plan.popular ? "bg-cyan-500/10 border-cyan-500/20 text-cyan-400" : "bg-white/5 border-white/10 text-slate-500"
                    }`}>
                    <Check className="w-4 h-4" />
                  </div>
                  <span className="text-slate-300 font-bold transition-colors group-hover/feat:text-cyan-400 uppercase tracking-tight">{feature}</span>
                </li>
              ))}
              {plan.limitations.map((limitation, i) => (
                <li key={i} className="flex items-center text-sm opacity-20 grayscale blur-[0.5px]">
                  <div className="mr-5 p-2 rounded-lg bg-white/5 border border-white/10 text-slate-600">
                    <X className="w-4 h-4" />
                  </div>
                  <span className="text-slate-600 font-black text-[10px] tracking-widest uppercase">{limitation}</span>
                </li>
              ))}
            </ul>

            <button
              onClick={() => handlePlanSelection(plan.id)}
              disabled={isAuthenticated && (
                (plan.id === 'free' && !user?.is_premium) ||
                (plan.id === 'pro' && user?.is_premium)
              )}
              className={`w-full py-6 rounded-2xl font-black text-sm uppercase tracking-[0.3em] transition-all duration-500 relative overflow-hidden flex items-center justify-center gap-4 ${isAuthenticated && ((plan.id === 'free' && !user?.is_premium) || (plan.id === 'pro' && user?.is_premium))
                ? 'bg-emerald-500/10 text-emerald-400 border-2 border-emerald-500/20 cursor-not-allowed shadow-[0_0_20px_rgba(16,185,129,0.1)]'
                : plan.popular
                  ? 'bg-cyan-500 hover:bg-cyan-400 text-black shadow-2xl shadow-cyan-500/30 hover:glow-cyan group/btn'
                  : 'bg-white/5 text-white border-2 border-white/10 hover:bg-white/10 group/btn'
                }`}
            >
              {isAuthenticated && ((plan.id === 'free' && !user?.is_premium) || (plan.id === 'pro' && user?.is_premium)) ? (
                <span className="flex items-center justify-center gap-3">
                  <ShieldCheck className="w-5 h-5 shrink-0" />
                  CURRENT PLAN
                </span>
              ) : (
                <>
                  {plan.popular && <Rocket className="w-6 h-6 group-hover/btn:translate-x-2 group-hover/btn:-translate-y-2 transition-transform" />}
                  {plan.cta}
                </>
              )}
            </button>
          </div>
        ))}
      </div>

      {/* Feature Comparison - Full Redesign */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 relative z-10">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-3 px-5 py-2 rounded-full bg-cyan-500/10 text-cyan-500 text-[11px] font-black uppercase tracking-[0.4em] border border-cyan-500/20 mb-6">
            <Sparkles className="w-4 h-4" />
            COMPARE PLANS
          </div>
          <h2 className="text-4xl md:text-6xl font-black text-white tracking-tighter uppercase italic leading-[0.85]">
            FULL FEATURE <span className="text-gradient-cyan">BREAKDOWN</span>
          </h2>
          <p className="text-slate-400 mt-4 text-lg font-medium">Everything you get — no surprises</p>
        </div>

        {/* Sticky Column Headers */}
        <div className="grid grid-cols-3 mb-4 sticky top-20 z-20">
          <div className="col-span-1" />
          <div className="col-span-1 text-center py-4 px-6">
            <div className="text-xs font-black text-slate-400 uppercase tracking-widest">SEED STAGE</div>
            <div className="text-2xl font-black text-white mt-1">$0<span className="text-sm font-medium text-slate-500">/mo</span></div>
          </div>
          <div className="col-span-1 text-center py-4 px-6 bg-cyan-500/5 rounded-2xl border border-cyan-500/20 relative">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-cyan-500 text-black text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-widest whitespace-nowrap">Most Popular</div>
            <div className="text-xs font-black text-cyan-500 uppercase tracking-widest">PILLAR ELITE</div>
            <div className="text-2xl font-black text-white mt-1">$19<span className="text-sm font-medium text-slate-500">/mo</span></div>
          </div>
        </div>

        {/* Feature Categories */}
        {[
          {
            category: '🎯 VIBE PROTOCOL CORE',
            features: [
              { name: 'AI Elite Rating Analysis', free: true, pro: true, type: 'bool' },
              { name: 'Trust Score Calculation', free: true, pro: true, type: 'bool' },
              { name: 'Vibe Notes Reception', free: true, pro: true, type: 'bool' },
              { name: 'Leaderboard Access', free: true, pro: true, type: 'bool' },
              { name: 'Stage Classification (Seed/Pillar/Titan)', free: true, pro: true, type: 'bool' },
            ]
          },
          {
            category: '📝 PROFILE & RESUME',
            features: [
              { name: 'Monthly Resume Uploads', free: 'Limited', pro: 'Unlimited', type: 'value' },
              { name: 'AI Resume Analysis', free: false, pro: true, type: 'bool' },
              { name: 'Profile Dashboard Access', free: true, pro: true, type: 'bool' },
              { name: 'View Your Rankings', free: true, pro: true, type: 'bool' },
            ]
          },
          {
            category: '👥 RECRUITER DISCOVERY',
            features: [
              { name: 'Listed on Public Leaderboard', free: true, pro: true, type: 'bool' },
              { name: 'Priority Recruiter Access', free: false, pro: true, type: 'bool' },
              { name: 'Featured Leaderboard Position', free: false, pro: true, type: 'bool' },
              { name: 'Premium Profile Badge', free: false, pro: true, type: 'bool' },
            ]
          },
          {
            category: '📊 ANALYTICS',
            features: [
              { name: 'View Your Profile Stats', free: false, pro: true, type: 'bool' },
              { name: 'Vibe Note Analytics', free: false, pro: true, type: 'bool' },
              { name: 'Ranking Progress Tracking', free: false, pro: true, type: 'bool' },
            ]
          },
          {
            category: '🛡️ SUPPORT',
            features: [
              { name: 'Email Support', free: true, pro: true, type: 'bool' },
              { name: 'Priority Support', free: false, pro: true, type: 'bool' },
            ]
          },
        ].map((section, si) => (
          <div key={si} className="mb-6">
            {/* Category Label */}
            <div className="py-3 px-4 mb-2">
              <span className="text-[11px] font-black text-slate-500 uppercase tracking-[0.3em]">{section.category}</span>
            </div>

            {/* Rows */}
            <div className="rounded-2xl overflow-hidden border border-white/[0.06] bg-white/[0.01]">
              {section.features.map((feat, fi) => (
                <div
                  key={fi}
                  className={`grid grid-cols-3 items-center border-b border-white/[0.04] last:border-0 hover:bg-white/[0.03] transition-colors group ${fi % 2 === 0 ? '' : 'bg-white/[0.01]'}`}
                >
                  {/* Feature Name */}
                  <div className="col-span-1 px-5 py-5 text-sm font-semibold text-slate-300 group-hover:text-white transition-colors">
                    {feat.name}
                  </div>

                  {/* Free Value */}
                  <div className="col-span-1 flex items-center justify-center px-4 py-5">
                    {feat.type === 'bool' ? (
                      feat.free ? (
                        <div className="w-6 h-6 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        </div>
                      ) : (
                        <div className="w-6 h-6 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                          <X className="w-3.5 h-3.5 text-slate-600" />
                        </div>
                      )
                    ) : (
                      <span className="text-xs font-bold text-slate-500 bg-white/5 px-3 py-1 rounded-full">
                        {feat.free as string}
                      </span>
                    )}
                  </div>

                  {/* Pro Value */}
                  <div className="col-span-1 flex items-center justify-center px-4 py-5 bg-cyan-500/[0.02] border-l border-cyan-500/10 relative">
                    {feat.type === 'bool' ? (
                      feat.pro ? (
                        <div className="w-6 h-6 rounded-full bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center shadow-[0_0_10px_rgba(6,182,212,0.2)]">
                          <Check className="w-3.5 h-3.5 text-cyan-400" />
                        </div>
                      ) : (
                        <div className="w-6 h-6 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                          <X className="w-3.5 h-3.5 text-slate-600" />
                        </div>
                      )
                    ) : (
                      <span className="text-xs font-black text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 px-3 py-1 rounded-full shadow-[0_0_10px_rgba(6,182,212,0.1)]">
                        {feat.pro as string}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* CTA Strip */}
        <div className="mt-10 grid grid-cols-3">
          <div className="col-span-1" />
          <div className="col-span-1 px-4 py-6 flex items-center justify-center">
            <span className="text-slate-500 text-sm font-bold">Always free</span>
          </div>
          <div className="col-span-1 px-4 py-6 flex items-center justify-center bg-cyan-500/5 rounded-2xl border border-cyan-500/20">
            <button
              onClick={() => handlePlanSelection('pro')}
              className="px-8 py-3 bg-cyan-500 text-black font-black text-xs uppercase tracking-widest rounded-xl hover:bg-cyan-400 transition-all hover:scale-105 shadow-[0_0_20px_rgba(6,182,212,0.3)] flex items-center gap-2"
            >
              <Rocket className="w-4 h-4" />
              Get Pro
            </button>
          </div>
        </div>
      </div>




      {/* Testimonials */}
      <div className="max-w-7xl mx-auto px-6 py-24 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              name: "Alex Rivera",
              role: "FOUNDER",
              initials: "AR",
              content: "The profile generation is flawless. It captured 8 years of engineering complexity into a single high-quality brand in minutes.",
              color: "cyan"
            },
            {
              name: "Sarah Chen",
              role: "STRATEGIST",
              initials: "SC",
              content: "Traditional vibes are dead. Custom premium templates on SkillVibe are the only way to stand out now.",
              color: "blue"
            },
            {
              name: "David Park",
              role: "DEVELOPER",
              initials: "DP",
              content: "Reached #4 on the global leaderboard and got 3 recruiter messages in 48 hours. Pro pays for itself instantly.",
              color: "indigo"
            }
          ].map((t, i) => (
            <div key={i} className="glass-card p-12 rounded-[3rem] border border-white/10 bg-white/[0.02] relative overflow-hidden group hover:border-cyan-500/40 hover:glow-cyan transition-all duration-700">
              <Quote className="absolute top-8 right-8 w-14 h-14 text-cyan-500 opacity-5 group-hover:opacity-20 transition-all" />
              <div className="relative z-10">
                <div className="flex gap-1.5 mb-8">
                  {[1, 2, 3, 4, 5].map(s => <Star key={s} className="w-4 h-4 text-cyan-500 fill-current shadow-cyan-500" />)}
                </div>
                <p className="text-xl font-bold text-white mb-10 leading-relaxed italic opacity-90">
                  "{t.content}"
                </p>
                <div className="flex items-center gap-5">
                  <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-500 font-black text-xs">
                    {t.initials}
                  </div>
                  <div className="text-left">
                    <h4 className="font-black text-white leading-none text-sm tracking-widest">{t.name}</h4>
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-2">{t.role}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div >

      {/* FAQ Section */}
      < div className="max-w-5xl mx-auto px-6 pb-40 relative z-10" >
        <div className="text-center mb-24 space-y-8">
          <div className="inline-flex items-center gap-4 px-6 py-2 rounded-lg bg-cyan-500/10 text-cyan-500 text-[11px] font-black uppercase tracking-[0.4em] border border-cyan-500/20">
            <Workflow className="w-4 h-4" />
            HELP CENTER
          </div>
          <h2 className="text-5xl md:text-7xl font-black text-white tracking-tighter uppercase italic leading-[0.9]">QUESTIONS & ANSWERS</h2>
        </div>
        <div className="space-y-6">
          {faqs.map((faq, index) => (
            <FAQItem key={index} faq={faq} index={index} />
          ))}
        </div>
      </div >

      {/* Modals */}
      < PaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)
        }
        selectedPlan={selectedPlan}
        billingCycle={billingCycle}
      />

      <AuthModal
        isOpen={showAuthModal}
        onClose={handleAuthModalClose}
        initialMode={authModalMode}
      />

      <DowngradeModal
        isOpen={showDowngradeModal}
        onClose={() => setShowDowngradeModal(false)}
        onConfirm={handleDowngradeToFree}
        isLoading={isDowngrading}
      />
    </div >
  )
}
