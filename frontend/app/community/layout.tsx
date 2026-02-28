import { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'Community | SkillVibe',
    description: 'Join the SkillVibe community. Connect with verified builders, interact with founders, and boost your Prowess and Trust score.',
}

export default function Layout({ children }: { children: React.ReactNode }) {
    return <>{children}</>
}
