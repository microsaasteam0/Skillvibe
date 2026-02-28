import { Metadata } from 'next'
import CookieContent from './CookieContent'

export const metadata: Metadata = {
    title: 'Cookie Policy | SkillVibe',
    description: 'Information about how SkillVibe uses cookies and similar technologies.',
    openGraph: {
        title: 'Cookie Policy | SkillVibe',
        description: 'Information about how SkillVibe uses cookies and similar technologies.',
    }
}

export default function CookiePage() {
    return <CookieContent />
}
