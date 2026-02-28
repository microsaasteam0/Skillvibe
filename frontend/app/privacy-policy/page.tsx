import { Metadata } from 'next'
import PrivacyContent from './PrivacyContent'

export const metadata: Metadata = {
    title: 'Privacy Policy | SkillVibe',
    description: 'How SkillVibe handles and protects your personal data.',
    openGraph: {
        title: 'Privacy Policy | SkillVibe',
        description: 'How SkillVibe handles and protects your personal data.',
    }
}

export default function PrivacyPage() {
    return <PrivacyContent />
}
