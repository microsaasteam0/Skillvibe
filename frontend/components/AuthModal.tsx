import { useState, useEffect } from 'react'
import { useScrollLock } from '../hooks/useScrollLock'
import { X, Mail, Lock, User, Eye, EyeOff, Loader2, Shield, Activity, Zap, Cpu, Terminal, Rocket, CheckCircle2 } from 'lucide-react'
import { createPortal } from 'react-dom'
import { useAuth } from '../contexts/AuthContext'
import { motion, AnimatePresence } from 'framer-motion'

// Declare global google object
declare global {
  interface Window {
    google: any
  }
}

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
  initialMode?: 'login' | 'register' | 'forgot-password'
  defaultRole?: 'candidate' | 'recruiter'
}

export default function AuthModal({ isOpen, onClose, initialMode = 'login', defaultRole }: AuthModalProps) {
  const [mode, setMode] = useState<'login' | 'register' | 'forgot-password'>(initialMode)
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    username: '',
    password: '',
    fullName: '',
    role: 'candidate',
    companyInfo: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)
  const [isSuccessAction, setIsSuccessAction] = useState(false) // Replaces isRegisteredSuccessfully
  const [mounted, setMounted] = useState(false)

  const { login, register, googleAuth, requestPasswordReset } = useAuth()

  useEffect(() => {
    setMounted(true)
  }, [])

  // Load Google Identity Services
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const script = document.createElement('script')
      script.src = 'https://accounts.google.com/gsi/client'
      script.async = true
      script.defer = true

      script.onload = () => {
        if (window.google) {
          window.google.accounts.id.initialize({
            client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
            callback: handleGoogleResponse,
          })
        }
      }

      // Only add script if it doesn't exist
      if (!document.querySelector('script[src="https://accounts.google.com/gsi/client"]')) {
        document.head.appendChild(script)
      } else if (window.google) {
        // Script already loaded, just initialize
        window.google.accounts.id.initialize({
          client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
          callback: handleGoogleResponse,
        })
      }
    }
  }, [])

  // Lock page scroll but keep Lenis running so nested modal scrolling works.
  useScrollLock(isOpen, { stopLenis: false })

  // Sync mode when parent changes initialMode (e.g. URL-driven open)
  useEffect(() => {
    if (isOpen) setMode(initialMode)
  }, [initialMode, isOpen])

  // Pre-select role when defaultRole is passed (e.g. from redirect)
  useEffect(() => {
    if (isOpen && defaultRole) {
      setFormData(prev => ({ ...prev, role: defaultRole }))
    }
  }, [defaultRole, isOpen])

  const handleGoogleResponse = async (response: any) => {
    setIsGoogleLoading(true)
    try {
      if (response.credential) {
        const success = await googleAuth(response.credential, formData.role)
        if (success) {
          onClose()
          setFormData({ email: '', username: '', password: '', fullName: '', role: 'candidate', companyInfo: '' })
          setErrors({})
        } else {
          console.error('❌ GoogleAuth returned false')
        }
      } else {
        console.error('❌ No credential in Google response')
      }
    } catch (error) {
      console.error('❌ Google auth error in AuthModal:', error)
    } finally {
      setIsGoogleLoading(false)
    }
  }

  const handleGoogleSignIn = () => {
    const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID
    const redirectUri = `${window.location.origin}/auth/google/callback`
    const scope = 'openid email profile'
    const responseType = 'code'
    const state = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`

    sessionStorage.setItem('google_oauth_state', state)
    sessionStorage.setItem('google_oauth_role', formData.role)

    const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${googleClientId}&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `scope=${encodeURIComponent(scope)}&` +
      `response_type=${responseType}&` +
      `state=${state}&` +
      `access_type=offline&` +
      `prompt=consent`

    window.location.href = googleAuthUrl
  }

  if (!isOpen) return null

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.email) {
      newErrors.email = 'Email is required'
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Invalid email format'
    }

    if (mode !== 'forgot-password') {
      if (!formData.password) {
        newErrors.password = 'Password is required'
      } else if (formData.password.length < 8) {
        newErrors.password = 'Password must be at least 8 characters'
      } else if (!/(?=.*[a-zA-Z])(?=.*\d)/.test(formData.password)) {
        newErrors.password = 'Password must contain letters and numbers'
      }
    }

    if (mode === 'register') {
      if (!formData.username) {
        newErrors.username = 'Username is required'
      } else if (formData.username.length < 3) {
        newErrors.username = 'Username must be at least 3 characters'
      } else if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
        newErrors.username = 'Username can only contain letters, numbers, and underscores'
      }

      if (formData.role === 'recruiter' && !formData.companyInfo) {
        newErrors.companyInfo = 'Company information is required for recruiters'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm()) return
    setIsSubmitting(true)

    try {
      let success = false
      if (mode === 'login') {
        success = await login(formData.email, formData.password, formData.role)
      } else if (mode === 'register') {
        success = await register(
          formData.email,
          formData.username,
          formData.password,
          formData.fullName || undefined,
          formData.role,
          formData.role === 'recruiter' ? formData.companyInfo : undefined
        )
      } else if (mode === 'forgot-password') {
        success = await requestPasswordReset(formData.email)
      }

      if (success) {
        if (mode === 'register' || mode === 'forgot-password') {
          setIsSuccessAction(true)
        } else {
          onClose()
          setFormData({ email: '', username: '', password: '', fullName: '', role: 'candidate', companyInfo: '' })
          setErrors({})
        }
      }
    } catch (error) {
      console.error('Auth error:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const switchMode = () => {
    if (mode === 'forgot-password') {
      setMode('login')
    } else {
      setMode(mode === 'login' ? 'register' : 'login')
    }
    setErrors({})
    setFormData({ email: '', username: '', password: '', fullName: '', role: 'candidate', companyInfo: '' })
    setIsSuccessAction(false)
  }

  if (isSuccessAction) {
    return createPortal(
      <div className="fixed inset-0 bg-black/95 backdrop-blur-3xl z-[999999] flex items-center justify-center p-4">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="glass-card rounded-[3rem] p-10 md:p-14 max-w-lg w-full border border-white/10 shadow-4xl text-center relative overflow-hidden group"
        >
          <div className="absolute inset-0 bg-cyber-grid opacity-10 pointer-events-none" />
          <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-cyan-500 to-transparent animate-scanline" />

          <div className="relative z-10">
            <div className="w-24 h-24 bg-cyan-500/10 rounded-[2rem] flex items-center justify-center mx-auto mb-10 border border-cyan-500/20 group-hover:glow-cyan transition-all duration-700">
              <CheckCircle2 className="w-12 h-12 text-cyan-500" />
            </div>

            <div className="inline-flex items-center gap-3 px-4 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-500 text-[10px] font-black uppercase tracking-[0.4em] border border-emerald-500/20 mb-8">
              SUCCESS
            </div>

            <h2 className="text-4xl font-black text-white mb-6 uppercase tracking-tighter italic">CHECK YOUR EMAIL</h2>
            <p className="text-slate-400 mb-12 text-sm font-bold leading-relaxed uppercase tracking-tight opacity-70">
              We've dispatched a {mode === 'register' ? 'verification' : 'password reset'} link to <br />
              <span className="text-cyan-500 font-black">{formData.email}</span>. <br />
              Please check your inbox.
            </p>

            <button
              onClick={() => {
                onClose();
                setIsSuccessAction(false);
                setFormData({ email: '', username: '', password: '', fullName: '', role: 'candidate', companyInfo: '' });
                setMode('login');
              }}
              className="w-full py-6 bg-cyan-500 hover:bg-cyan-400 text-black font-black rounded-2xl transition-all duration-500 shadow-xl shadow-cyan-500/30 hover:glow-cyan uppercase tracking-[0.3em] text-[11px]"
            >
              OKAY
            </button>
          </div>
        </motion.div>
      </div>,
      document.body
    )
  }

  return createPortal(
    <div data-lenis-prevent="true" className="fixed inset-0 bg-black/90 backdrop-blur-2xl z-[999999] flex items-center justify-center p-4">
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        data-lenis-prevent="true"
        className="glass-card rounded-[3.5rem] p-10 md:p-14 max-w-lg w-full max-h-[90vh] overflow-x-hidden overflow-y-auto overscroll-contain shadow-6xl group relative border border-white/10 hide-scrollbar"
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        <div className="absolute inset-0 bg-cyber-grid opacity-10" />
        <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-cyan-500 to-transparent opacity-0 group-hover:opacity-100 group-hover:animate-scanline" />

        <div className="relative z-10 space-y-8 mb-12">
          <div className="flex items-center justify-between">
            <div className="inline-flex items-center gap-3 px-5 py-2 rounded-xl bg-cyan-500/10 text-cyan-500 text-[10px] font-black uppercase tracking-[0.4em] border border-cyan-500/20 glow-cyan">
              <Shield className="w-4 h-4" />
              {mode === 'login' ? 'LOGIN' : mode === 'forgot-password' ? 'RESET PASSWORD' : 'SIGN UP'}
            </div>
            <button
              onClick={onClose}
              className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-slate-500 hover:text-white transition-all hover:scale-110 active:scale-95 border border-white/5 hover:border-cyan-500/30"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="space-y-4">
            <h2 className="text-5xl md:text-6xl font-black text-white uppercase tracking-tighter italic leading-none">
              {mode === 'login' ? 'WELCOME BACK' : mode === 'forgot-password' ? 'RECOVER ACCOUNT' : 'CREATE ACCOUNT'}
            </h2>
            <div className="h-1.5 w-20 bg-cyan-500 rounded-full shadow-[0_0_15px_rgba(6,182,212,0.8)]"></div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8 relative z-10">
          {mode !== 'forgot-password' && (
            <div className="space-y-4">
              <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 ml-2">I AM A...</label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => handleInputChange('role', 'candidate')}
                  className={`py-5 px-4 rounded-2xl border text-[11px] font-black uppercase tracking-widest transition-all ${formData.role === 'candidate'
                    ? 'border-cyan-500 bg-cyan-500/10 text-cyan-500 shadow-[0_0_20px_rgba(6,182,212,0.2)]'
                    : 'border-white/10 text-slate-600 hover:border-white/20 bg-white/5'}`}
                >
                  CANDIDATE
                </button>
                <button
                  type="button"
                  onClick={() => handleInputChange('role', 'recruiter')}
                  className={`py-5 px-4 rounded-2xl border text-[11px] font-black uppercase tracking-widest transition-all ${formData.role === 'recruiter'
                    ? 'border-cyan-500 bg-cyan-500/10 text-cyan-500 shadow-[0_0_20px_rgba(6,182,212,0.2)]'
                    : 'border-white/10 text-slate-600 hover:border-white/20 bg-white/5'}`}
                >
                  RECRUITER/SCOUT
                </button>
              </div>
            </div>
          )}

          <div className="space-y-3">
            <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 ml-2">EMAIL ADDRESS</label>
            <div className="relative group/input">
              <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within/input:text-cyan-500 transition-colors w-5 h-5" />
              <input
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                className={`w-full pl-14 pr-5 py-5 bg-white/[0.03] border rounded-[1.5rem] focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 text-white placeholder-slate-700 transition-all font-bold uppercase text-xs tracking-widest ${errors.email ? 'border-red-500' : 'border-white/10'}`}
                placeholder="name@email.com"
                disabled={isSubmitting}
              />
            </div>
            {errors.email && <p className="text-red-500 text-[10px] font-black uppercase tracking-widest mt-2 ml-2">{errors.email}</p>}
          </div>

          {mode === 'register' && (
            <div className="space-y-3">
              <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 ml-2">USERNAME</label>
              <div className="relative group/input">
                <User className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within/input:text-cyan-500 transition-colors w-5 h-5" />
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => handleInputChange('username', e.target.value)}
                  className={`w-full pl-14 pr-5 py-5 bg-white/[0.03] border rounded-[1.5rem] focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 text-white placeholder-slate-700 transition-all font-bold uppercase text-xs tracking-widest ${errors.username ? 'border-red-500' : 'border-white/10'}`}
                  placeholder="your_username"
                  disabled={isSubmitting}
                />
              </div>
              {errors.username && <p className="text-red-500 text-[10px] font-black uppercase tracking-widest mt-2 ml-2">{errors.username}</p>}
            </div>
          )}

          {mode === 'register' && formData.role === 'recruiter' && (
            <div className="space-y-3">
              <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 ml-2">COMPANY INFO / ORG NAME</label>
              <div className="relative group/input">
                <Rocket className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within/input:text-cyan-500 transition-colors w-5 h-5" />
                <input
                  type="text"
                  value={formData.companyInfo}
                  onChange={(e) => handleInputChange('companyInfo', e.target.value)}
                  className={`w-full pl-14 pr-5 py-5 bg-white/[0.03] border rounded-[1.5rem] focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 text-white placeholder-slate-700 transition-all font-bold uppercase text-xs tracking-widest ${errors.companyInfo ? 'border-red-500' : 'border-white/10'}`}
                  placeholder="ACME Corp"
                  disabled={isSubmitting}
                />
              </div>
              {errors.companyInfo && <p className="text-red-500 text-[10px] font-black uppercase tracking-widest mt-2 ml-2">{errors.companyInfo}</p>}
            </div>
          )}

          {mode !== 'forgot-password' && (
            <div className="space-y-3">
              <div className="flex justify-between items-center ml-2">
                <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">PASSWORD</label>
              </div>
              <div className="relative group/input">
                <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within/input:text-cyan-500 transition-colors w-5 h-5" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  className={`w-full pl-14 pr-14 py-5 bg-white/[0.03] border rounded-[1.5rem] focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 text-white placeholder-slate-700 transition-all font-bold uppercase text-xs tracking-widest ${errors.password ? 'border-red-500' : 'border-white/10'}`}
                  placeholder="••••••••"
                  disabled={isSubmitting}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-600 hover:text-cyan-500 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {mode === 'login' && (
                <div className="flex justify-end mt-2">
                  <button
                    type="button"
                    onClick={() => { setMode('forgot-password'); setErrors({}); }}
                    className="text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-cyan-500 transition-colors"
                  >
                    FORGOT PASSWORD?
                  </button>
                </div>
              )}
              {errors.password && <p className="text-red-500 text-[10px] font-black uppercase tracking-widest mt-2 ml-2">{errors.password}</p>}
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-6 bg-cyan-500 hover:bg-cyan-400 text-black font-black rounded-2xl transition-all duration-500 flex items-center justify-center gap-4 shadow-xl shadow-cyan-500/30 hover:glow-cyan disabled:grayscale disabled:opacity-50 group/btn relative overflow-hidden"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span className="uppercase tracking-[0.3em] text-[11px]">LOADING...</span>
              </>
            ) : (
              <>
                <Activity className="w-5 h-5 group-hover/btn:animate-pulse" />
                <span className="uppercase tracking-[0.3em] text-[11px]">
                  {mode === 'login' ? 'LOGIN' : mode === 'forgot-password' ? 'SEND RESET LINK' : 'SIGN UP'}
                </span>
              </>
            )}
          </button>
        </form>

        {mode !== 'forgot-password' && (
          <div className="mt-12 mb-10 relative z-10">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/5"></div>
              </div>
              <div className="relative flex justify-center text-[10px]">
                <span className="px-6 bg-[#0a0a0a] text-slate-700 font-black uppercase tracking-[0.5em]">OR CONTINUE WITH</span>
              </div>
            </div>
          </div>
        )}

        {mode !== 'forgot-password' && (
          <div className="mb-12 relative z-10">
            <button
              onClick={handleGoogleSignIn}
              disabled={isSubmitting || isGoogleLoading}
              className="w-full py-6 bg-white/5 hover:bg-white/10 text-white font-black rounded-2xl transition-all duration-500 flex items-center justify-center border border-white/10 shadow-sm gap-4 hover:scale-[1.02] active:scale-95 uppercase tracking-[0.2em] text-[10px]"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              GOOGLE
            </button>
          </div>
        )}

        <div className="mt-6 text-center relative z-10 border-t border-white/5 pt-10 pb-4">
          <p className="text-slate-500 font-bold text-[10px] uppercase tracking-widest flex items-center justify-center gap-4">
            {mode === 'login' ? "Need an account?" : mode === 'forgot-password' ? "Remember password?" : 'Already have an account?'}
            <button
              onClick={switchMode}
              className="text-cyan-500 hover:text-cyan-400 font-black uppercase tracking-[0.2em] transition-colors glow-cyan"
              disabled={isSubmitting}
            >
              {mode === 'login' ? 'Sign Up' : mode === 'forgot-password' ? 'Login' : 'Login'}
            </button>
          </p>
        </div>

        <div className="absolute bottom-6 right-12 opacity-30 pointer-events-none hidden md:block">
          <span className="text-[10px] font-mono font-black text-cyan-500 uppercase tracking-widest animate-pulse">CONNECTION SECURE</span>
        </div>
      </motion.div>
    </div>,
    document.body
  )
}
