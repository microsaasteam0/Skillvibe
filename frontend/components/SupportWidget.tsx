'use client'

import React, { useState, useRef, useEffect } from 'react'
import { MessageCircle, X, Send, ChevronRight, HelpCircle, ChevronDown, ChevronUp, Search, Home, Rocket, Zap } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import axios from 'axios'
import toast from 'react-hot-toast'
import Image from 'next/image'
import { useAuth } from '../contexts/AuthContext'
import { API_URL } from '@/lib/api-config'
import { supportClient } from '../lib/support/client'

interface FAQ {
  question: string
  answer: string
  category?: string
}

const SupportWidget = () => {
  const { user, isAuthenticated } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<'home' | 'messages' | 'faq'>('home')
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [category, setCategory] = useState<"feedback" | "bug" | "feature" | "support">('support')
  const [isSending, setIsSending] = useState(false)
  const [expandedFAQ, setExpandedFAQ] = useState<number | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  // Pre-fill email when user is authenticated
  useEffect(() => {
    if (user?.email) {
      setEmail(user.email)
    }
  }, [user])

  // Common FAQs
  const faqs: FAQ[] = [
    {
      question: "How does the credit system work?",
      answer: "Free users get 2 generations per day. Pro users get 20 generations per day. Credits reset every 24 hours.",
      category: "Billing"
    },
    {
      question: "Can I cancel my subscription?",
      answer: "Yes, you can cancel anytime from your dashboard settings. You'll keep access until the end of your billing period.",
      category: "Billing"
    },
    {
      question: "Do you support video content?",
      answer: "Currently we support text and URL-based content transformation for social media. Video support is on our roadmap.",
      category: "Features"
    },
    {
      question: "How do I export my content?",
      answer: "Pro users can export content to various formats (TXT, JSON, CSV) from the dashboard or directly after generation.",
      category: "Features"
    },
    {
      question: "Is my data secure?",
      answer: "We use enterprise-grade encryption and do not store your original content permanently unless you explicitly save it.",
      category: "Security"
    }
  ]

  const filteredFAQs = faqs.filter(faq =>
    faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
    faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!email.trim() || !message.trim()) {
      toast.error('Please fill in both fields')
      return
    }

    setIsSending(true)

    try {
      await supportClient.submitTicket({
        product: "BuildInPublic", // Micro-saas name
        category: category,
        user_email: email,
        message: message,
        metadata: {
          page: typeof window !== 'undefined' ? window.location.pathname : 'unknown',
          isAuthenticated: isAuthenticated,
          username: user?.username || 'Guest'
        }
      })

      toast.success('Message sent! We\'ll get back to you shortly.')
      setMessage('')
      setIsOpen(false)
    } catch (error) {
      console.error('Support submission error:', error)
      toast.error('Failed to send message. Please try again.')
    } finally {
      setIsSending(false)
    }
  }

  // Helper to render the footer tab button
  const TabButton = ({ tab, icon: Icon, label }: { tab: typeof activeTab, icon: any, label: string }) => (
    <button
      onClick={() => setActiveTab(tab)}
      className={`relative flex flex-col items-center justify-center gap-1.5 transition-all h-full flex-1 ${activeTab === tab
        ? 'text-indigo-600 dark:text-indigo-400'
        : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
        }`}
    >
      <Icon className={`w-5 h-5 transition-all ${activeTab === tab ? 'scale-110' : 'scale-100'}`} strokeWidth={activeTab === tab ? 3 : 2} />
      <span className={`text-[10px] font-black uppercase tracking-[0.15em] ${activeTab === tab ? '' : 'opacity-60'}`}>
        {label}
      </span>
      {activeTab === tab && (
        <motion.div
          layoutId="activeTabIndicator"
          className="absolute -top-[1px] w-12 h-0.5 bg-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.8)]"
        />
      )}
    </button>
  )

  // Lock body scroll when widget is open
  // Lock body scroll only on mobile when widget is open
  useEffect(() => {
    if (isOpen) {
      // Check if mobile width
      if (typeof window !== 'undefined' && window.innerWidth < 768) {
        document.body.style.overflow = 'hidden'
      }
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  return (
    <>
      {/* Backdrop for mobile only */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="md:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-[9998]"
            onClick={() => setIsOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Widget Window Container - Decoupled */}
      <div className={`fixed z-[9999] transition-all duration-300 ${isOpen
        ? 'inset-0 flex items-center justify-center pointer-events-auto md:inset-auto md:bottom-24 md:right-6'
        : 'pointer-events-none'
        } print:hidden`}>
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="bg-white dark:bg-slate-950 rounded-[2rem] shadow-2xl border border-slate-200 dark:border-slate-800 w-[calc(100vw-2rem)] sm:w-[400px] h-[620px] max-h-[calc(100vh-6rem)] overflow-hidden flex flex-col relative selection:bg-indigo-500/30"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header - Industrial Schematic */}
              <div className="bg-slate-50 dark:bg-slate-900 px-6 py-8 text-slate-900 dark:text-white relative flex-shrink-0 border-b border-slate-200 dark:border-slate-800 overflow-hidden">
                <div className="absolute inset-0 bg-grid-blueprint opacity-[0.4] dark:opacity-[0.1] pointer-events-none" />
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-slate-50/50 dark:to-slate-900/50 pointer-events-none" />

                <button
                  onClick={() => setIsOpen(false)}
                  className="absolute top-6 right-6 text-slate-400 hover:text-slate-900 dark:hover:text-white p-2 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-800 transition-all z-20"
                >
                  <X className="w-5 h-5" />
                </button>

                <div className="relative z-10">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="bg-indigo-600 rounded-xl shadow-xl shadow-indigo-600/20 p-2 flex items-center justify-center w-11 h-11 border border-indigo-400/30">
                      <MessageCircle className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-black tracking-tighter uppercase font-display leading-none">Support Hub</h3>
                      <div className="flex items-center gap-1.5 mt-1">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Online</span>
                      </div>
                    </div>
                  </div>
                  <p className="text-slate-600 dark:text-slate-400 text-[11px] font-black uppercase tracking-[0.2em] leading-relaxed max-w-[240px]">
                    From Building to Trending.
                  </p>
                </div>
              </div>

              {/* Content Area - Scrollable */}
              <div className="flex-1 overflow-y-auto p-5 custom-scrollbar pb-28 bg-gray-50/50 dark:bg-black/20">

                {/* HOME VIEW */}
                <AnimatePresence mode="wait">
                  {activeTab === 'home' && (
                    <motion.div
                      key="home"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 10 }}
                      transition={{ duration: 0.2 }}
                      className="space-y-4"
                    >
                      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200/50 dark:border-slate-800/50 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-2 opacity-[0.05] grayscale group-hover:grayscale-0 group-hover:opacity-10 transition-all duration-500">
                          <Rocket className="w-12 h-12 text-indigo-500" />
                        </div>
                        <h4 className="font-black text-slate-900 dark:text-white mb-2 uppercase tracking-tight">Need Help?</h4>
                        <p className="text-slate-600 dark:text-slate-400 text-sm font-medium leading-[1.6]">
                          Get the help you need. Select an option below to get started.
                        </p>
                      </div>

                      <div className="grid gap-3">
                        <button
                          onClick={() => setActiveTab('messages')}
                          className="bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-sm border border-slate-200/50 dark:border-slate-800/50 hover:border-indigo-500/50 dark:hover:border-indigo-500/50 hover:shadow-xl hover:shadow-indigo-500/5 transition-all group text-left flex items-center justify-between"
                        >
                          <div className="flex items-center gap-4">
                            <div className="w-11 h-11 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300">
                              <Send className="w-5 h-5" />
                            </div>
                            <div>
                              <div className="font-black text-slate-900 dark:text-white text-[13px] uppercase tracking-wide">Contact Us</div>
                              <div className="text-[11px] text-slate-500 dark:text-slate-400 font-bold">Email our support team</div>
                            </div>
                          </div>
                          <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-500 group-hover:translate-x-1 transition-all" />
                        </button>

                        <button
                          onClick={() => setActiveTab('faq')}
                          className="bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-sm border border-slate-200/50 dark:border-slate-800/50 hover:border-violet-500/50 dark:hover:border-violet-500/50 hover:shadow-xl hover:shadow-violet-500/5 transition-all group text-left flex items-center justify-between"
                        >
                          <div className="flex items-center gap-4">
                            <div className="w-11 h-11 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400 group-hover:bg-violet-600 group-hover:text-white transition-all duration-300">
                              <HelpCircle className="w-5 h-5" />
                            </div>
                            <div>
                              <div className="font-black text-slate-900 dark:text-white text-[13px] uppercase tracking-wide">FAQ</div>
                              <div className="text-[11px] text-slate-500 dark:text-slate-400 font-bold">Find answers instantly</div>
                            </div>
                          </div>
                          <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-violet-500 group-hover:translate-x-1 transition-all" />
                        </button>
                      </div>

                      <div className="bg-slate-100/50 dark:bg-slate-800/20 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 relative group overflow-hidden">
                        <div className="absolute inset-0 bg-grid-blueprint-light dark:bg-grid-blueprint opacity-[0.03] pointer-events-none" />
                        <h5 className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-[0.3em] mb-3 flex items-center">
                          <Zap className="w-3.5 h-3.5 mr-2 fill-current" />
                          Pro Tip
                        </h5>
                        <p className="text-[12px] text-slate-600 dark:text-slate-300 font-medium leading-relaxed">
                          Optimize your workflow: convert your <span className="text-slate-900 dark:text-white font-black underline decoration-indigo-500/30">content</span> into high-impact X threads with one click.
                        </p>
                      </div>
                    </motion.div>
                  )}

                  {/* MESSAGE VIEW */}
                  {activeTab === 'messages' && (
                    <motion.div
                      key="messages"
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      transition={{ duration: 0.2 }}
                      className="space-y-4"
                    >
                      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl shadow-sm border border-slate-200/50 dark:border-slate-800/50 text-center">
                        <p className="text-slate-600 dark:text-slate-400 text-xs font-black uppercase tracking-widest leading-relaxed">
                          Secure Contact. <br />
                          We will respond to your email.
                        </p>
                      </div>

                      <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] pl-1">Email Address</label>
                          <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="your@email.com"
                            className="w-full px-5 py-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all dark:text-white font-medium text-sm"
                          />

                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] pl-1 mt-4 block">Category</label>
                          <div className="relative">
                            <select
                              value={category}
                              onChange={(e) => setCategory(e.target.value as any)}
                              className="w-full px-5 py-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all dark:text-white font-black text-xs uppercase tracking-widest appearance-none cursor-pointer"
                            >
                              <option value="support">General Support</option>
                              <option value="feedback">Feedback</option>
                              <option value="bug">Bug Report</option>
                              <option value="feature">Feature Request</option>
                            </select>
                            <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] pl-1">Message</label>
                          <textarea
                            required
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            rows={5}
                            placeholder="How can we help?"
                            className="w-full px-5 py-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all resize-none custom-scrollbar dark:text-white font-medium text-sm"
                          />
                        </div>

                        <button
                          type="submit"
                          disabled={isSending}
                          className="w-full py-5 px-6 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black rounded-2xl flex items-center justify-center gap-3 shadow-2xl hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-70 disabled:cursor-not-allowed group uppercase tracking-[0.2em] text-[11px]"
                        >
                          {isSending ? (
                            <div className="w-5 h-5 border-2 border-slate-500/30 border-t-slate-500 rounded-full animate-spin" />
                          ) : (
                            <>
                              <span>Send Message</span>
                              <Send className="w-4 h-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                            </>
                          )}
                        </button>
                      </form>
                    </motion.div>
                  )}

                  {/* FAQ VIEW */}
                  {activeTab === 'faq' && (
                    <motion.div
                      key="faq"
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      transition={{ duration: 0.2 }}
                      className="space-y-4"
                    >
                      <div className="relative group">
                        <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-purple-500 transition-colors" />
                        <input
                          type="text"
                          autoFocus
                          placeholder="Search for answers..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="w-full pl-10 pr-4 py-3 bg-white dark:bg-gray-800 border-2 border-gray-100 dark:border-gray-700 rounded-xl focus:ring-0 focus:border-purple-500 outline-none transition-all dark:text-white shadow-sm"
                        />
                      </div>

                      <div className="space-y-2">
                        {filteredFAQs.map((faq, index) => (
                          <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden bg-white dark:bg-gray-800"
                          >
                            <button
                              onClick={() => setExpandedFAQ(expandedFAQ === index ? null : index)}
                              className="w-full p-4 flex items-start justify-between text-left hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors gap-3"
                            >
                              <span className="font-medium text-gray-900 dark:text-white text-sm pt-0.5">
                                {faq.question}
                              </span>
                              {expandedFAQ === index ? (
                                <div className="p-1 bg-purple-100 dark:bg-purple-900/30 rounded-lg text-purple-600 dark:text-purple-400 rotate-180 transition-transform">
                                  <ChevronDown className="w-3.5 h-3.5" />
                                </div>
                              ) : (
                                <div className="p-1 bg-gray-100 dark:bg-gray-800 rounded-lg text-gray-500 dark:text-gray-400 transition-transform">
                                  <ChevronDown className="w-3.5 h-3.5" />
                                </div>
                              )}
                            </button>

                            <AnimatePresence>
                              {expandedFAQ === index && (
                                <motion.div
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: 'auto', opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  transition={{ duration: 0.2 }}
                                  className="px-4 pb-4"
                                >
                                  <div className="pt-2 text-sm text-gray-600 dark:text-gray-300 border-t border-gray-100 dark:border-gray-700/50 leading-relaxed">
                                    {faq.answer}
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </motion.div>
                        ))}

                        {filteredFAQs.length === 0 && (
                          <div className="text-center py-10 opacity-60">
                            <Search className="w-10 h-10 mx-auto text-gray-300 mb-2" />
                            <p className="text-gray-500 text-sm">No answers found.</p>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Bottom Tab Bar (Fixed) */}
              <div className="absolute bottom-0 left-0 right-0 bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl border-t border-slate-200 dark:border-slate-800 flex items-center justify-between px-2 pb-safe-area shadow-[0_-10px_30px_rgba(0,0,0,0.05)] z-20 h-[75px]">
                <TabButton tab="home" icon={Home} label="Status" />
                <TabButton tab="messages" icon={Send} label="Dispatch" />
                <TabButton tab="faq" icon={HelpCircle} label="Manual" />
              </div>

            </motion.div>
          )}
        </AnimatePresence>

      </div>

      {/* Toggle Button Container - Separated to prevent layout shifts */}
      <div className="fixed bottom-4 right-4 md:bottom-8 md:right-8 z-[9990] print:hidden">
        <motion.button
          layout
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsOpen(!isOpen)}
          className={`w-16 h-16 rounded-[1.5rem] shadow-2xl shadow-indigo-600/30 flex items-center justify-center transition-all duration-500 ${isOpen
            ? 'hidden md:flex bg-slate-900 dark:bg-slate-800 text-white rotate-90 scale-90'
            : 'flex bg-slate-900 border border-slate-700/50 text-white hover:shadow-indigo-500/40 relative overflow-hidden group'
            }`}
        >
          {!isOpen && (
            <>
              <div className="absolute inset-0 bg-grid-blueprint opacity-[0.2] pointer-events-none" />
              <div className="absolute inset-0 bg-gradient-to-tr from-indigo-600/20 to-transparent group-hover:opacity-100 transition-opacity" />
            </>
          )}
          {isOpen ? (
            <ChevronDown className="w-8 h-8" />
          ) : (
            <MessageCircle className="w-8 h-8 relative z-10" />
          )}
        </motion.button>
      </div>
    </>
  )
}

export default SupportWidget
