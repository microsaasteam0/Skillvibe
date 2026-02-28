import { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'Recruiter Dashboard | SkillVibe',
    description: 'Access the elite talent pool. Find top 1% tech professionals verified by AI and backed by proof of work.',
}

export default function Layout({ children }: { children: React.ReactNode }) {
    return <>{children}</>
}
