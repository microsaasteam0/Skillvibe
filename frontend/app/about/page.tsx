import { Metadata } from 'next'
import AboutClient from './AboutClient'

export const metadata: Metadata = {
  title: 'About SkillVibe | The Elite Reputation Protocol',
  description: 'Learn about SkillVibe, the AI-powered reputation protocol for the top 1% of talent. We help professionals verify their prowess and get discovered by founders.',
  keywords: 'about SkillVibe, talent protocol, AI talent verification, Entrext Labs, elite developer network',
  openGraph: {
    title: 'About SkillVibe - Elite Talent Network',
    description: 'Learn about our mission to revolutionize professional verification with intelligent AI solutions.',
    type: 'website',
  },
}

export default function AboutPage() {
  return <AboutClient />
}