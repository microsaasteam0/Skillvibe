import { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'SkillVibe Blog - The Future of Verified Reputation',
    description: 'Insights on the AI Reputation Economy, Vibe Protocol, and technical talent verification. Stay ahead with SkillVibe’s deep-signal matching and verification guides.',
    keywords: 'SkillVibe, Vibe Protocol, Reputation Economy, AI Verification, Talent Matching, Senior Engineering Hiring, Technical Vetting, SaaS Recruitment',
    openGraph: {
        title: 'SkillVibe Blog - Insights on Verified Professional Reputation',
        description: 'Discover how the Vibe Protocol is redefining talent verification and the global reputation economy.',
        type: 'website',
        url: 'https://skillvibe.entrext.com/blog',
    },
    twitter: {
        card: 'summary_large_image',
        title: 'SkillVibe Blog - Future of Talent Verification',
        description: 'Master the reputation economy with SkillVibe’s expert insights.',
    }
}

export default function BlogLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>
}
