import { Metadata } from 'next'
import { getPostBySlug } from '@/lib/blog-data'
import Script from 'next/script'

interface Props {
    params: { slug: string }
    children: React.ReactNode
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
    const post = getPostBySlug(params.slug)
    const baseUrl = 'https://skillvibe.entrext.com'

    if (!post) {
        return {
            title: 'Protocol Not Found | SkillVibe',
        }
    }

    return {
        title: `${post.title} | SkillVibe Blog`,
        description: post.excerpt,
        keywords: post.tags.join(', '),
        alternates: {
            canonical: `${baseUrl}/blog/${post.slug}`,
        },
        openGraph: {
            title: post.title,
            description: post.excerpt,
            url: `${baseUrl}/blog/${post.slug}`,
            siteName: 'SkillVibe',
            locale: 'en_US',
            type: 'article',
            publishedTime: post.publishedAt,
            authors: [post.author.name],
            images: [
                {
                    url: post.image,
                    width: 1200,
                    height: 630,
                    alt: post.title,
                },
            ],
        },
        twitter: {
            card: 'summary_large_image',
            title: post.title,
            description: post.excerpt,
            images: [post.image],
            site: '@SkillVibe',
            creator: '@MohitSharma',
        },
    }
}

export default function BlogPostLayout({ children, params }: Props) {
    const post = getPostBySlug(params.slug)

    if (!post) return <>{children}</>

    const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'BlogPosting',
        headline: post.title,
        description: post.excerpt,
        image: post.image,
        datePublished: post.publishedAt,
        author: {
            '@type': 'Person',
            name: post.author.name,
            jobTitle: post.author.role,
        },
        publisher: {
            '@type': 'Organization',
            name: 'SkillVibe',
            logo: {
                '@type': 'ImageObject',
                url: 'https://skillvibe.entrext.com/logo.png',
            },
        },
        mainEntityOfPage: {
            '@type': 'WebPage',
            '@id': `https://skillvibe.entrext.com/blog/${post.slug}`,
        },
        keywords: post.tags.join(','),
    }

    return (
        <>
            <Script
                id="blog-jsonld"
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />
            {children}
        </>
    )
}
