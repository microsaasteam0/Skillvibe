import { Metadata } from 'next'
import UpdatesClient from './UpdatesClient'

export const metadata: Metadata = {
  title: 'SkillVibe Product Updates & Changelog',
  description: 'Stay informed about the latest SkillVibe features, Elite Rating improvements, and platform updates. Watch as we refine professional verification and trust scoring.',
  keywords: 'SkillVibe updates, Elite Rating changelog, professional verification platform, AI trust score',
  openGraph: {
    title: 'SkillVibe Updates - What\'s New in Professional Verification',
    description: 'Latest releases and improvements for the SkillVibe platform.',
    type: 'website',
  },
}

export default function UpdatesPage() {
  return <UpdatesClient />
}