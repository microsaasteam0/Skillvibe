import { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'Vibe Protocol & Trust Scoring | SkillVibe',
    description: 'Understand the SkillVibe Vibe Protocol, Elite Ratings, and Trust Scores. Learn how we verify and rank the top 1% of tech talent.',
}

export default function Layout({ children }: { children: React.ReactNode }) {
    return <>{children}</>
}
