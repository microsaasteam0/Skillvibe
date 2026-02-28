import { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'Terms of Service | SkillVibe',
    description: 'Terms of Service and user agreements for the SkillVibe platform.',
}

export default function Layout({ children }: { children: React.ReactNode }) {
    return <>{children}</>
}
