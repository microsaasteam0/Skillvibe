'use client'

import React, { useState, useEffect } from 'react'
import { useScrollLock } from '../hooks/useScrollLock'
import { createPortal } from 'react-dom'
import { X, Crown, Check, Loader2, ExternalLink, ShieldCheck, Terminal, Box, Lock, Activity } from 'lucide-react'
import axios from 'axios'
import toast from 'react-hot-toast'
import { useAuth } from '../contexts/AuthContext'
import { API_URL } from '@/lib/api-config'

interface PaymentModalProps {
  isOpen: boolean
  onClose: () => void
  selectedPlan?: string
  billingCycle?: 'monthly' | 'yearly'
}

const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  selectedPlan = 'pro',
  billingCycle = 'monthly'
}) => {
  const { updateUser } = useAuth()
  const [loading, setLoading] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const pricing = {
    pro: { monthly: 15, yearly: 144 }
  }

  const planNames = {
    pro: 'Pro Plan'
  }

  const amount = pricing[selectedPlan as keyof typeof pricing]?.[billingCycle] || 0
  const savings = billingCycle === 'yearly' ? Math.round(((pricing[selectedPlan as keyof typeof pricing]?.monthly * 12 - amount) / (pricing[selectedPlan as keyof typeof pricing]?.monthly * 12)) * 100) : 0

  const handleCheckout = async () => {
    setLoading(true)

    try {
      const requestData = {
        plan_id: selectedPlan,
        billing_cycle: billingCycle
      }

      const response = await axios.post(
        `${API_URL}/api/v1/payment/create-checkout`,
        requestData
      )

      if (response.data && response.data.success) {
        window.location.href = response.data.checkout_url
      } else {
        throw new Error('Failed to create checkout session')
      }
    } catch (error: any) {
      let message = 'Failed to start checkout'
      if (error.response?.data?.detail) message = String(error.response.data.detail)
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  // Lock scroll (CSS + Lenis) when modal is open
  useScrollLock(isOpen)

  if (!isOpen || !mounted) return null

  return createPortal(
    <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-xl z-[2000000] flex items-center justify-center p-4">
      <div className="relative bg-slate-900 dark:bg-[#020617] rounded-[2.5rem] border border-indigo-500/30 max-w-md w-full max-h-[90vh] overflow-y-auto shadow-3xl overflow-hidden animate-kinetic-glow">

        {/* Background */}
        <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
          <div className="absolute inset-0 bg-grid-blueprint-light opacity-[0.15]" />
          <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/10 via-transparent to-transparent pointer-events-none" />

          {/* Moving Scanline */}
          <div className="absolute inset-0 overflow-hidden opacity-10">
            <div className="w-full h-1 bg-indigo-500 animate-scanline" />
          </div>
        </div>

        {/* Header */}
        <div className="relative p-8 pb-0 flex items-center justify-between z-10">
          <div className="flex flex-col gap-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-500/10 text-indigo-400 rounded-full text-[10px] font-black uppercase tracking-[0.2em] border border-indigo-500/20 mb-2">
              <Activity className="w-3 h-3 animate-pulse" />
              SECURE CHECKOUT
            </div>
            <div className="flex items-center gap-3 text-white">
              <div className="p-2.5 bg-indigo-500/20 rounded-xl border border-indigo-500/30">
                <Crown className="w-5 h-5 text-indigo-400" />
              </div>
              <h2 className="text-xl font-black tracking-tight">Upgrade to Pro</h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white hover:bg-white/10 rounded-full p-2.5 transition-all active:scale-90"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="relative p-8 z-10">

          {/* Plan Summary Card - Builder Style */}
          <div className="relative bg-white/5 backdrop-blur-3xl border border-indigo-500/20 rounded-[2rem] p-8 mb-8 overflow-hidden group transition-all duration-500">
            <div className="absolute inset-0 bg-grid-blueprint-light opacity-5 group-hover:opacity-20 transition-opacity" />

            <div className="relative flex justify-between items-start mb-6">
              <div>
                <p className="text-indigo-400/60 text-[10px] font-black uppercase tracking-widest mb-1">SELECTED PLAN</p>
                <h3 className="text-2xl font-black text-white tracking-tight">{planNames[selectedPlan as keyof typeof planNames] || selectedPlan}</h3>
              </div>
              <div className="text-right">
                <div className="flex items-baseline gap-1 justify-end">
                  <span className="text-4xl font-black text-white tracking-tighter">${amount}</span>
                  <span className="text-slate-500 font-bold text-sm">/{billingCycle}</span>
                </div>
                {savings > 0 && (
                  <span className="inline-block mt-2 px-3 py-1 bg-emerald-500/10 text-emerald-400 text-[10px] font-black rounded-full border border-emerald-500/20 uppercase tracking-widest">
                    Save {savings}%
                  </span>
                )}
              </div>
            </div>

            <div className="h-px bg-gradient-to-r from-transparent via-indigo-500/20 to-transparent my-6"></div>

            {/* Features */}
            <ul className="grid gap-4">
              {[
                "20 Daily Posts",
                "Advanced URL Processing",
                "Unlimited Saved Posts",
                "AI Learns Your Voice",
                "Fast Processing"
              ].map((feature, i) => (
                <li key={i} className="flex items-center gap-4 text-sm text-slate-300 font-medium group/item">
                  <div className="flex-shrink-0 w-6 h-6 rounded-lg bg-indigo-500/10 flex items-center justify-center border border-indigo-500/30 group-hover/item:bg-indigo-500/20 transition-colors">
                    <Check className="w-3.5 h-3.5 text-indigo-400" />
                  </div>
                  {feature}
                </li>
              ))}
            </ul>
          </div>

          {/* Action Module */}
          <div className="space-y-6">
            <button
              onClick={handleCheckout}
              disabled={loading}
              className="w-full group relative py-5 px-8 bg-indigo-600 text-white rounded-2xl font-black text-md shadow-2xl shadow-indigo-600/30 transition-all hover:scale-[1.02] hover:bg-indigo-700 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden"
            >
              <div className="absolute inset-0 shimmer-text opacity-30" />
              <span className="relative flex items-center justify-center gap-3 tracking-tight uppercase">
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    Continue to Checkout
                    <Box className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                  </>
                )}
              </span>
            </button>

            <div className="flex items-center justify-center gap-6">
              <div className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-widest bg-slate-800/50 px-3 py-1.5 rounded-lg border border-slate-700/50">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                SECURE
              </div>
              <div className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-widest bg-slate-800/50 px-3 py-1.5 rounded-lg border border-slate-700/50">
                <Lock className="w-3.5 h-3.5 text-indigo-500" />
                ENCRYPTED
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>,
    document.body
  )
}

export default PaymentModal
