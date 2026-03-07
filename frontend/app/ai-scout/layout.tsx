import { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'AI Talent Scout | SkillVibe',
    description: 'Find the top 1% of tech talent using SkillVibe AI. Scan portfolios and verify trust scores instantly.',
}

export default function Layout({ children }: { children: React.ReactNode }) {
    return <>{children}</>
}
