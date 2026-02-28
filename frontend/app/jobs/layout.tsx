import { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'Elite Tech Jobs | SkillVibe',
    description: 'Find elite technical roles from top-tier companies looking for verified builders on SkillVibe.',
}

export default function Layout({ children }: { children: React.ReactNode }) {
    return <>{children}</>
}
