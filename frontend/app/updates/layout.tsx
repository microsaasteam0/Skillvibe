import { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'Updates & Releaes | SkillVibe',
    description: 'Stay up to date with the latest features, improvements, and news from SkillVibe.',
}

export default function Layout({ children }: { children: React.ReactNode }) {
    return <>{children}</>
}
