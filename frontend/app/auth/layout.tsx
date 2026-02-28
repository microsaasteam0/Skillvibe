import { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'Authentication | SkillVibe',
    description: 'Login or create your SkillVibe account to access your portfolio and verifiable reputation.',
}

export default function Layout({ children }: { children: React.ReactNode }) {
    return <>{children}</>
}
