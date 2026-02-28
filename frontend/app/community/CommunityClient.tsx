'use client'

import { useState, useEffect } from 'react'
import { AuthProvider, useAuth } from '../../contexts/AuthContext'
import { UserPreferencesProvider } from '../../contexts/UserPreferencesContext'
import { ThemeProvider } from '../../contexts/ThemeContext'
import Navbar from '../../components/Navbar'
import DashboardModal from '../../components/DashboardModal.jsx'
import AuthModal from '../../components/AuthModal'
import LoadingSpinner from '../../components/LoadingSpinner'
import Footer from '../../components/Footer'
import CommunityTemplatesPage from '../../components/CommunityTemplatesPage'
import { useRouter } from 'next/navigation'

function CommunityContent() {
  const { user, isAuthenticated, isLoading } = useAuth()
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>('login')
  const [showDashboard, setShowDashboard] = useState(false)
  const router = useRouter()

  // Redirect non-authenticated users to home (but wait for auth to load)
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/')
      return
    }
  }, [isAuthenticated, isLoading, router])

  const handleTemplateSelect = (template: any) => {
    localStorage.setItem('pendingTemplate', JSON.stringify({
      template: template,
      timestamp: Date.now()
    }))

    const templateEvent = new CustomEvent('template-selected', {
      detail: {
        template: template,
        timestamp: Date.now()
      }
    })

    window.dispatchEvent(templateEvent)
    router.push('/')
  }

  const handleUpgradeClick = () => {
    router.push('/pricing')
  }

  // Don't render content for non-authenticated users (they'll be redirected)
  if (!isLoading && !isAuthenticated) {
    return <div className="min-h-screen flex items-center justify-center dark:bg-black">Redirecting...</div>
  }

  // Show loading while auth is being determined
  if (isLoading) {
    return <LoadingSpinner message="Loading community..." variant="community" fullScreen />
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-black selection:bg-primary/30 selection:text-primary-foreground font-sans">

      {/* Background Gradients */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-[500px] bg-primary/5 blur-[100px] -z-10" />
      </div>

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        initialMode={authModalMode}
      />

      <Navbar
        isAuthenticated={isAuthenticated}
        user={user}
        activeMainTab="community"
        onSignIn={() => { setShowAuthModal(true); setAuthModalMode('login') }}
        onSignUp={() => { setShowAuthModal(true); setAuthModalMode('register') }}
        onUserDashboard={() => setShowDashboard(true)}
      />

      <main className="pt-28 pb-20 px-4">
        <div className="max-w-7xl mx-auto">
          <CommunityTemplatesPage
            onBack={() => router.push('/')}
            onTemplateSelect={handleTemplateSelect}
            onUpgradeClick={handleUpgradeClick}
          />
        </div>
      </main>

      <Footer />

      <DashboardModal
        isOpen={showDashboard}
        onClose={() => setShowDashboard(false)}
      />
    </div>
  )
}

export default function CommunityClient() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <UserPreferencesProvider>
          <CommunityContent />
        </UserPreferencesProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}