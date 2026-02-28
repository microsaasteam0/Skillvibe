'use client'

import { useState } from 'react'
import PricingPage from '../../components/PricingPage'
import { AuthProvider, useAuth } from '../../contexts/AuthContext'
import { UserPreferencesProvider } from '../../contexts/UserPreferencesContext'
import { ThemeProvider } from '../../contexts/ThemeContext'
import Navbar from '../../components/Navbar'
import DashboardModal from '../../components/DashboardModal.jsx'
import AuthModal from '../../components/AuthModal'
import Footer from '../../components/Footer'
import { useRouter } from 'next/navigation'
import { Terminal } from 'lucide-react'

function PricingContent() {
  const { user, isAuthenticated } = useAuth()
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>('login')
  const [showDashboard, setShowDashboard] = useState(false)
  const router = useRouter()

  const handleSignUp = (plan: string) => {
    if (plan === 'free') {
      router.push('/')
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-black selection:bg-indigo-500/30 overflow-x-hidden font-sans">

      {/* Revolutionary 'Builder' Background Matrix */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 bg-grid-blueprint-light opacity-30 dark:opacity-10" />
        <div className="absolute top-[10%] right-[-5%] w-[45%] h-[45%] bg-indigo-500/5 dark:bg-indigo-500/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[10%] left-[-5%] w-[45%] h-[45%] bg-purple-500/5 dark:bg-purple-500/10 rounded-full blur-[120px]" />

        {/* Static Global Scanline Overlay */}
        <div className="absolute inset-0 overflow-hidden opacity-5">
          <div className="w-full h-[1px] bg-indigo-500/50 top-1/2 absolute" />
        </div>
      </div>

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        initialMode={authModalMode}
      />

      <Navbar
        isAuthenticated={isAuthenticated}
        user={user}
        activeMainTab="pricing"
        onSignIn={() => {
          setShowAuthModal(true)
          setAuthModalMode('login')
        }}
        onSignUp={() => {
          setShowAuthModal(true)
          setAuthModalMode('register')
        }}
        onUserDashboard={() => setShowDashboard(true)}
      />

      <main className="container mx-auto px-4 pt-28 pb-24 relative z-10">
        <PricingPage onSignUp={handleSignUp} />
      </main>

      <Footer />

      <DashboardModal
        isOpen={showDashboard}
        onClose={() => setShowDashboard(false)}
      />
    </div>
  )
}

export default function PricingClient() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <UserPreferencesProvider>
          <PricingContent />
        </UserPreferencesProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}