import { Inter, Plus_Jakarta_Sans } from 'next/font/google'
import { Metadata } from 'next'
import './globals.css'
import ClientProviders from '../components/ClientProviders'
import SmoothScroll from '../components/SmoothScroll'
import Script from 'next/script'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-plus-jakarta',
  display: 'swap',
})

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NODE_ENV === 'production'
    ? 'https://skillvibe.entrext.com'
    : 'http://localhost:3000'
  ),
  title: {
    default: 'SkillVibe AI | The Elite Reputation Protocol & Trust Layer',
    template: '%s | SkillVibe Protocol'
  },
  description: 'SkillVibe is the AI-powered reputation protocol for the top 1% of talent. Verify your professional prowess through real-world proof of work and get discovered by founders.',
  keywords: ['SkillVibe', 'SkillVibe AI', 'SkillVibe Protocol', 'AI talent verification', 'reputation layer for developers', 'founder hiring AI', 'elite talent ranking', 'proof of work verification', 'professional trust score', 'talent discovery engine', 'verified portfolios'],
  authors: [{ name: 'Entrext Labs', url: 'https://entrextlabs.entrext.com/' }],
  creator: 'Entrext Labs',
  publisher: 'Entrext Labs',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: '/',
    siteName: 'SkillVibe',
    title: 'SkillVibe AI | The Elite Reputation Protocol',
    description: 'The definitive reputation layer for modern talent. Verify your professional prowess through real-world proof of work and get discovered by founders.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'SkillVibe - Elite Talent Verification',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SkillVibe Protocol | Proof of Work, Verified by AI',
    description: 'The elite AI reputation protocol. Showcase your real-world proof of work and qualify for top-tier opportunities.',
    creator: '@skillvibe',
    images: ['/twitter-image.png'],
  },
  alternates: {
    canonical: '/',
  },
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    shortcut: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
  manifest: '/site.webmanifest',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* CRITICAL: Theme Script - Must be first to prevent flash */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var root = document.documentElement;
                  root.classList.add('dark');
                  root.style.colorScheme = 'dark';
                  root.style.setProperty('--bg-color', '#111827');
                  root.style.setProperty('--text-color', '#ffffff');
                  
                  var metaThemeColor = document.querySelector('meta[name="theme-color"]');
                  if (metaThemeColor) {
                    metaThemeColor.setAttribute('content', '#111827');
                  }
                  
                  setTimeout(function() {
                    root.classList.add('theme-loaded');
                  }, 50);
                } catch (e) {
                  // Fallback
                }
              })();
            `
          }}
        />


        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/favicon-32x32.png" type="image/png" sizes="32x32" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
      </head>
      <body className={`${inter.variable} ${plusJakarta.variable} font-sans`}>
        {/* Google Analytics */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-0YNCEFQQ80"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());

            gtag('config', 'G-0YNCEFQQ80');
          `}
        </Script>

        {/* Structured Data for SEO/AI-SEO/AEO */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "SoftwareApplication",
              "name": "SkillVibe AI",
              "alternateName": ["SkillVibe", "SkillVibe Protocol", "SV Protocol"],
              "description": "SkillVibe is an AI-powered reputation layer for elite talent. Verify your expertise through autonomous proof-of-work analysis and rank among the top 1% globally.",
              "url": "https://skillvibe.entrext.com",
              "applicationCategory": "BusinessApplication, RecruitmentApplication",
              "operatingSystem": "Web, iOS, Android",
              "keywords": "talent ranking, skill verification, recruitment protocol, AI hiring, proof of work, reputation layer",
              "creator": {
                "@type": "Organization",
                "name": "Entrext Labs",
                "url": "https://entrextlabs.entrext.com/",
                "logo": {
                  "@type": "ImageObject",
                  "url": "https://skillvibe.entrext.com/logo.png"
                }
              },
              "author": {
                "@type": "Organization",
                "name": "Entrext Labs"
              },
              "offers": {
                "@type": "AggregateOffer",
                "priceCurrency": "USD",
                "lowPrice": "0",
                "highPrice": "29.00",
                "offerCount": "2"
              },
              "featureList": [
                "AI-Autonomous Skill Verification",
                "Dynamic Reputation Scoring",
                "Founder-Direct Discovery Channel",
                "Industry-Standard Proof of Work Analysis",
                "Global Elite Talent Leaderboard"
              ],
              "screenshot": "https://skillvibe.entrext.com/og-image.png",
              "softwareVersion": "2.1.0"
            })
          }}
        />

        <ClientProviders>
          <SmoothScroll />
          {children}
        </ClientProviders>
      </body>
    </html>
  )
}
