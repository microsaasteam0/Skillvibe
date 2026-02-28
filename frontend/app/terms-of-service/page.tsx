import { Metadata } from 'next'
import TermsContent from './TermsContent'

export const metadata: Metadata = {
    title: 'Terms of Service | SkillVibe',
    description: 'The terms and conditions for using the SkillVibe platform.',
    openGraph: {
        title: 'Terms of Service | SkillVibe',
        description: 'The terms and conditions for using the SkillVibe platform.',
    }
}

export default function TermsPage() {
    return <TermsContent />
}
