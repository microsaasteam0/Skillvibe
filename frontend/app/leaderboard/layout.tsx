import { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'Elite Protocol Leaderboard | SkillVibe',
    description: 'View the elite ranking of the top 1% tech professionals. Verified by AI and backed by proof of work.',
}

export default function Layout({ children }: { children: React.ReactNode }) {
    return <>{children}</>
}
