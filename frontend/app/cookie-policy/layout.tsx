import { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'Cookie Policy | SkillVibe',
    description: 'How we use cookies and tracking technologies on the SkillVibe platform.',
}

export default function Layout({ children }: { children: React.ReactNode }) {
    return <>{children}</>
}
