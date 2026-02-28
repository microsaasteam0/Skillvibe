import { Metadata, ResolvingMetadata } from 'next'
import { API_URL } from '@/lib/api-config'

type Props = {
    params: { slug: string }
}

export async function generateMetadata(
    { params }: Props,
    parent: ResolvingMetadata
): Promise<Metadata> {
    const slug = params.slug

    try {
        const res = await fetch(`${API_URL}/api/v1/skillvibe/portfolio/${slug}/data`, {
            next: { revalidate: 60 } // Revalidate every 60 seconds
        })

        if (!res.ok) {
            return {
                title: 'Verified Portfolio | SkillVibe',
                description: 'Elite technical talent verified by SkillVibe.',
            }
        }

        const data = await res.json()
        const name = data.full_name || slug
        const title = data.vibe_data?.elite_tag || data.elite_tag || 'Verified Professional'
        const bio = data.vibe_data?.bio_summary || `View ${name}'s verified professional portfolio on SkillVibe.`
        const eliteRating = data.elite_rating ? ` | Elite Rating: ${data.elite_rating}%` : ''

        return {
            title: `${name} | ${title} | SkillVibe${eliteRating}`,
            description: bio,
            openGraph: {
                title: `${name} - ${title} | SkillVibe`,
                description: bio,
                type: 'profile',
                url: `https://skillvibe.entrext.com/profile/${slug}`,
            },
            twitter: {
                card: 'summary',
                title: `${name} | ${title} | SkillVibe`,
                description: bio,
            }
        }
    } catch (error) {
        return {
            title: 'Verified Portfolio | SkillVibe',
            description: 'Elite technical talent verified by SkillVibe.',
        }
    }
}

export default function ProfileLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>
}
