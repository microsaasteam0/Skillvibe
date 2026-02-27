'use client'

import { useEffect, useState, useRef, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '../../../../contexts/AuthContext'
import { API_URL } from '@/lib/api-config'
import axios from 'axios'
import toast from 'react-hot-toast'
import { motion, AnimatePresence } from 'framer-motion'
import { Rocket, ShieldCheck, AlertOctagon, Terminal, Cpu } from 'lucide-react'

function GoogleCallbackContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { login } = useAuth()
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing')
  const [message, setMessage] = useState('Connecting with Google...')
  const hasProcessedRef = useRef(false)
  const processingRef = useRef(false)

  useEffect(() => {
    if (hasProcessedRef.current || processingRef.current) return

    const handleGoogleCallback = async () => {
      processingRef.current = true
      try {
        let code = searchParams.get('code')
        let state = searchParams.get('state')
        const error = searchParams.get('error')

        if (!code && typeof window !== 'undefined') {
          const urlParams = new URLSearchParams(window.location.search)
          code = urlParams.get('code')
          state = state || urlParams.get('state')
        }

        hasProcessedRef.current = true
        if (error) throw new Error(`Sign-in was cancelled or failed: ${error}`)
        if (!code) throw new Error('No authorization code received from Google.')

        const existingToken = localStorage.getItem('access_token')
        const existingUser = localStorage.getItem('user')

        if (existingToken && existingUser) {
          setStatus('success')
          setMessage('Already signed in. Taking you home...')
          setTimeout(() => window.location.replace('/'), 800)
          return
        }

        setMessage('Verifying your Google account...')

        const formData = new FormData()
        formData.append('code', String(code))
        formData.append('state', String(state || 'dev-mode'))

        const authResponse = await axios.post(`${API_URL}/api/v1/auth/google/callback`, formData, {
          timeout: 15000
        })

        if (authResponse.data && authResponse.data.access_token) {
          const accessToken = authResponse.data.access_token
          const refreshToken = authResponse.data.refresh_token || ''
          const selectedRole = sessionStorage.getItem('google_oauth_role')
          let finalUser = authResponse.data.user

          axios.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`

          if ((selectedRole === 'candidate' || selectedRole === 'recruiter') && finalUser?.role !== selectedRole) {
            try {
              const roleResponse = await axios.put(
                `${API_URL}/api/v1/auth/role`,
                { role: selectedRole },
                { headers: { Authorization: `Bearer ${accessToken}` } }
              )
              finalUser = roleResponse.data
            } catch (roleErr) {
              console.error('Role update after Google callback failed:', roleErr)
              toast.error('Signed in, but role update failed. Please switch role again.')
            }
          }

          localStorage.setItem('access_token', accessToken)
          localStorage.setItem('refresh_token', refreshToken)
          localStorage.setItem('user', JSON.stringify(finalUser))
          sessionStorage.removeItem('google_oauth_role')
          sessionStorage.removeItem('google_oauth_state')

          window.dispatchEvent(new CustomEvent('auth-success', {
            detail: { user: finalUser }
          }))

          setStatus('success')
          setMessage('Signed in! Taking you home...')
          toast.success('🎉 Welcome back!')
          setTimeout(() => window.location.replace('/'), 1200)
        } else {
          throw new Error('Sign-in response was invalid. Please try again.')
        }
      } catch (error: any) {
        if (error.response?.status === 400) {
          setTimeout(() => {
            const storedToken = localStorage.getItem('access_token')
            const storedUser = localStorage.getItem('user')
            if (storedToken && storedUser) {
              setStatus('success')
              setMessage('Session restored. Taking you home...')
              axios.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`
              window.dispatchEvent(new CustomEvent('auth-success', {
                detail: { user: JSON.parse(storedUser) }
              }))
              setTimeout(() => window.location.replace('/'), 800)
            } else {
              setStatus('error')
              setMessage('Could not restore session. Please sign in again.')
              setTimeout(() => router.push('/'), 3000)
            }
          }, 200)
        } else {
          setStatus('error')
          setMessage(error.message || 'Something went wrong. Please try again.')
          setTimeout(() => router.push('/'), 3000)
        }
      } finally {
        processingRef.current = false
      }
    }
    handleGoogleCallback()
  }, [searchParams, login, router])

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-black flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background Matrix */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-grid-blueprint-light opacity-20 dark:opacity-10" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[120px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-3xl border border-slate-200/50 dark:border-slate-800/50 rounded-[3rem] p-12 md:p-16 max-w-md w-full text-center shadow-4xl group relative overflow-hidden"
      >
        {/* Kinetic Scanline */}
        <div className="absolute top-0 left-0 w-full h-1 bg-indigo-500/50 blur-sm animate-scanline pointer-events-none" />

        <div className="relative z-10 space-y-10">
          <div className="flex justify-center">
            <AnimatePresence mode="wait">
              {status === 'processing' && (
                <motion.div
                  key="processing"
                  initial={{ opacity: 0, rotate: -180 }}
                  animate={{ opacity: 1, rotate: 0 }}
                  exit={{ opacity: 0, scale: 0.5 }}
                  className="w-24 h-24 bg-indigo-500/10 rounded-3xl flex items-center justify-center relative shadow-inner"
                >
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                    className="absolute inset-2 border-2 border-dashed border-indigo-500/30 rounded-2xl"
                  />
                  <Cpu className="w-10 h-10 text-indigo-500" />
                </motion.div>
              )}

              {status === 'success' && (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="w-24 h-24 bg-emerald-500/10 rounded-3xl flex items-center justify-center shadow-inner border border-emerald-500/20"
                >
                  <ShieldCheck className="w-10 h-10 text-emerald-500" />
                </motion.div>
              )}

              {status === 'error' && (
                <motion.div
                  key="error"
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="w-24 h-24 bg-red-500/10 rounded-3xl flex items-center justify-center shadow-inner border border-red-500/20"
                >
                  <AlertOctagon className="w-10 h-10 text-red-500" />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-[10px] font-black uppercase tracking-widest text-slate-500">
              <Terminal className="w-3 h-3" />
              GOOGLE SIGN IN
            </div>
            <h1 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">
              {status === 'processing' && 'Signing You In...'}
              {status === 'success' && 'You\'re In!'}
              {status === 'error' && 'Sign In Failed'}
            </h1>
          </div>

          <div className="p-6 rounded-2xl bg-slate-100/50 dark:bg-black/20 border border-slate-200/50 dark:border-white/5 font-mono text-[11px] font-bold text-slate-500 dark:text-slate-400 break-all leading-relaxed uppercase tracking-wider">
            {message}
          </div>

          <div className="flex justify-center gap-2">
            {[1, 2, 3].map(i => (
              <motion.div
                key={i}
                animate={{
                  opacity: [0.3, 1, 0.3],
                  scale: [1, 1.2, 1]
                }}
                transition={{
                  duration: 1,
                  repeat: Infinity,
                  delay: i * 0.2
                }}
                className={`w-1.5 h-1.5 rounded-full ${status === 'error' ? 'bg-red-500' : 'bg-indigo-500'}`}
              />
            ))}
          </div>

          {status === 'error' && (
            <button
              onClick={() => router.push('/')}
              className="w-full py-4 bg-slate-900 text-white font-black rounded-2xl hover:scale-[1.02] active:scale-95 transition-all text-xs uppercase tracking-[0.2em]"
            >
              Go Back Home
            </button>
          )}
        </div>
      </motion.div>
    </div>
  )
}

export default function GoogleCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="relative w-12 h-12">
          <div className="absolute inset-0 border-4 border-indigo-500/20 rounded-xl" />
          <div className="absolute inset-0 border-4 border-indigo-500 border-t-transparent rounded-xl animate-spin" />
        </div>
      </div>
    }>
      <GoogleCallbackContent />
    </Suspense>
  )
}
