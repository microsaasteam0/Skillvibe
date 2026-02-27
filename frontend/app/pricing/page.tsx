import { Metadata } from 'next'
import PricingClient from './PricingClient'

export const metadata: Metadata = {
  title: 'Pricing - Elite_Access & Skill_Engine Tiers | SkillVibe',
  description: 'Choose the best Reputation Layer configuration for your journey. Compare SkillVibe tiers for high-velocity talent scouting and elite portfolio automation.',
  keywords: 'SkillVibe pricing, talent scouting cost, elite portfolio plans, reputation layer tool, AI talent analysis, Reputation Layer',
  openGraph: {
    title: 'SkillVibe AI - Professional Reputation Layer Plans',
    description: 'Affordable AI-powered reputation verification for creators and recruiters.',
    type: 'website',
  },
}

export default function Pricing() {
  return <PricingClient />
}