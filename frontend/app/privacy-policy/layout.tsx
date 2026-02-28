import { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'Privacy Policy | SkillVibe',
    description: 'Our privacy policy and data handling practices at SkillVibe.',
}

export default function Layout({ children }: { children: React.ReactNode }) {
    return <>{children}</>
}
