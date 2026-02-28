import { MetadataRoute } from 'next';
import { blogPosts } from '../lib/blog-data';
import { API_URL } from '../lib/api-config';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const baseUrl = 'https://skillvibe.entrext.com';

    const baseRoutes: MetadataRoute.Sitemap = [
        {
            url: `${baseUrl}/`,
            lastModified: new Date(),
            changeFrequency: 'daily',
            priority: 1.0,
        },
        {
            url: `${baseUrl}/leaderboard`,
            lastModified: new Date(),
            changeFrequency: 'daily',
            priority: 0.9,
        },
        {
            url: `${baseUrl}/vibe-trust`,
            lastModified: new Date(),
            changeFrequency: 'weekly',
            priority: 0.9,
        },
        {
            url: `${baseUrl}/pricing`,
            lastModified: new Date(),
            changeFrequency: 'weekly',
            priority: 0.9,
        },
        {
            url: `${baseUrl}/blog`,
            lastModified: new Date(),
            changeFrequency: 'daily',
            priority: 0.8,
        },
        {
            url: `${baseUrl}/jobs`,
            lastModified: new Date(),
            changeFrequency: 'daily',
            priority: 0.8,
        },
        {
            url: `${baseUrl}/about`,
            lastModified: new Date(),
            changeFrequency: 'monthly',
            priority: 0.7,
        },
        {
            url: `${baseUrl}/updates`,
            lastModified: new Date(),
            changeFrequency: 'weekly',
            priority: 0.7,
        },
        {
            url: `${baseUrl}/community`,
            lastModified: new Date(),
            changeFrequency: 'daily',
            priority: 0.8,
        },
        {
            url: `${baseUrl}/privacy-policy`,
            lastModified: new Date(),
            changeFrequency: 'monthly',
            priority: 0.5,
        },
        {
            url: `${baseUrl}/terms-of-service`,
            lastModified: new Date(),
            changeFrequency: 'monthly',
            priority: 0.5,
        },
        {
            url: `${baseUrl}/cookie-policy`,
            lastModified: new Date(),
            changeFrequency: 'monthly',
            priority: 0.5,
        },
    ];

    // Blog posts
    const blogRoutes: MetadataRoute.Sitemap = blogPosts.map((post) => ({
        url: `${baseUrl}/blog/${post.slug}`,
        lastModified: new Date(post.publishedAt),
        changeFrequency: 'weekly',
        priority: 0.7,
    }));

    // Dynamic User Profilers
    let profileRoutes: MetadataRoute.Sitemap = [];
    try {
        const res = await fetch(`${API_URL}/api/v1/public/profiles/sitemap`, {
            next: { revalidate: 0 } // Cache bypassed so slug updates reflect instantly
        });

        if (res.ok) {
            const profiles = await res.json();
            profileRoutes = profiles.map((profile: any) => ({
                url: `${baseUrl}/profile/${profile.slug}`,
                lastModified: new Date(profile.updated_at),
                changeFrequency: 'always',
                priority: 0.8,
            }));
        }
    } catch (error) {
        console.error("Failed to fetch profiles for dynamic sitemap:", error);
    }

    return [...baseRoutes, ...blogRoutes, ...profileRoutes];
}
