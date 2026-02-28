import { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'Your Professional Portfolio | SkillVibe',
    description: 'Manage your SkillVibe verified portfolio, settings, and Elite rating.',
}

export default function Layout({ children }: { children: React.ReactNode }) {
    return <>{children}</>
}
