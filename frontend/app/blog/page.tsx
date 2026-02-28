'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { getAllPosts, BlogPost } from '@/lib/blog-data';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import AuthModal from '@/components/AuthModal';
import DashboardModal from '@/components/DashboardModal.jsx';

import { useAuth } from '@/contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, User, Clock, ChevronRight, BookOpen, Tag } from 'lucide-react';
import Script from 'next/script';

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1
        }
    }
};

const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
        opacity: 1,
        y: 0,
        transition: {
            type: "spring",
            stiffness: 100,
            damping: 20
        }
    }
};

export default function BlogPage() {
    const { user, isAuthenticated } = useAuth();
    const allPosts = getAllPosts();
    const [selectedCategory, setSelectedCategory] = useState<string>('All');
    const [showAuthModal, setShowAuthModal] = useState(false);
    const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>('login');
    const [showDashboard, setShowDashboard] = useState(false);

    const categories = ['All', ...Array.from(new Set(allPosts.map(post => post.category)))];

    const filteredPosts = selectedCategory === 'All'
        ? allPosts
        : allPosts.filter(post => post.category === selectedCategory);

    const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'ItemList',
        itemListElement: filteredPosts.map((post, index) => ({
            '@type': 'ListItem',
            position: index + 1,
            url: `https://skillvibe.entrext.com/blog/${post.slug}`,
            name: post.title,
        })),
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-black font-sans selection:bg-primary/30 selection:text-primary-foreground overflow-x-hidden">
            <Script
                id="blog-list-jsonld"
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />
            <Navbar
                isAuthenticated={isAuthenticated}
                user={user}
                activeMainTab="blog"
                onSignIn={() => { setShowAuthModal(true); setAuthModalMode('login') }}
                onSignUp={() => { setShowAuthModal(true); setAuthModalMode('register') }}
                onUserDashboard={() => setShowDashboard(true)}
            />

            {/* Auth Component Handling */}
            <AuthModal
                isOpen={showAuthModal}
                onClose={() => setShowAuthModal(false)}
                initialMode={authModalMode}
            />
            <DashboardModal
                isOpen={showDashboard}
                onClose={() => setShowDashboard(false)}
            />

            <main className="pt-28 pb-20 relative">
                {/* Decorative background elements */}
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] -z-10 animate-pulse-slow" />
                <div className="absolute bottom-1/4 left-0 w-[400px] h-[400px] bg-violet-500/5 rounded-full blur-[100px] -z-10 animate-pulse-slow" style={{ animationDelay: '2s' }} />

                {/* Hero Section */}
                <section className="relative px-6 mb-20 text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, ease: "easeOut" }}
                        className="max-w-4xl mx-auto"
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: 0.2, duration: 0.5 }}
                            className="inline-flex items-center gap-2 mb-6 px-4 py-1.5 bg-white/50 dark:bg-white/5 backdrop-blur-md text-foreground rounded-full text-xs font-bold uppercase tracking-wider border border-border/50 shadow-sm"
                        >
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                            </span>
                            Building SkillVibe 2026
                        </motion.div>

                        <h1 className="text-5xl md:text-7xl font-display font-bold mb-8 tracking-tight text-foreground">
                            The Ultimate <span className="text-gradient">Founder's Journal</span>
                        </h1>

                        <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed mb-12">
                            Transforming daily work into magnetic content. Explore our collection of guides, tools, and frameworks.
                        </p>

                        <div className="flex flex-wrap gap-2 justify-center max-w-3xl mx-auto p-1 bg-white/40 dark:bg-white/5 backdrop-blur-md rounded-2xl border border-border/40 shadow-xl overflow-hidden">
                            {categories.map((category) => (
                                <button
                                    key={category}
                                    onClick={() => setSelectedCategory(category)}
                                    className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-500 relative ${selectedCategory === category
                                        ? 'text-primary-foreground'
                                        : 'text-muted-foreground hover:text-foreground'
                                        }`}
                                >
                                    {selectedCategory === category && (
                                        <motion.div
                                            layoutId="activeCategory"
                                            className="absolute inset-0 bg-primary shadow-lg shadow-primary/25 rounded-xl"
                                            transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                        />
                                    )}
                                    <span className="relative z-10">{category}</span>
                                </button>
                            ))}
                        </div>
                    </motion.div>
                </section>

                {/* Blog Posts Grid */}
                <section className="px-6">
                    <div className="max-w-7xl mx-auto">
                        <AnimatePresence mode='wait'>
                            <motion.div
                                key={selectedCategory}
                                variants={containerVariants}
                                initial="hidden"
                                animate="visible"
                                exit={{ opacity: 0, transition: { duration: 0.2 } }}
                                className="grid md:grid-cols-2 lg:grid-cols-3 gap-10"
                            >
                                {filteredPosts.map((post, idx) => (
                                    <BlogCard key={post.id} post={post} index={idx} variants={itemVariants} />
                                ))}
                            </motion.div>
                        </AnimatePresence>

                        {filteredPosts.length === 0 && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="text-center py-32"
                            >
                                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-secondary mb-6">
                                    <BookOpen className="w-10 h-10 text-muted-foreground" />
                                </div>
                                <h3 className="text-2xl font-bold mb-2">No articles found</h3>
                                <p className="text-muted-foreground">Try selecting a different category or check back later.</p>
                            </motion.div>
                        )}
                    </div>
                </section>
            </main>

            <Footer />
        </div>
    );
}

function BlogCard({ post, index, variants }: { post: BlogPost, index: number, variants: any }) {
    return (
        <motion.div
            variants={variants}
            whileHover={{ y: -8 }}
            className="h-full"
        >
            <Link href={`/blog/${post.slug}`} className="block h-full">
                <article className="group h-full bg-white dark:bg-slate-900 rounded-[2.5rem] overflow-hidden border border-border/50 hover:border-primary/50 transition-all duration-500 hover:shadow-[0_22px_70px_4px_rgba(0,0,0,0.06)] dark:hover:shadow-[0_22px_70px_4px_rgba(0,0,0,0.4)] flex flex-col relative">
                    {/* Hover Glow Effect */}
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-violet-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />

                    {/* Image */}
                    <div className="relative h-64 overflow-hidden">
                        {post.image ? (
                            <Image
                                src={post.image}
                                alt={post.title}
                                fill
                                className="object-cover group-hover:scale-110 transition-transform duration-1000 ease-out"
                            />
                        ) : (
                            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-violet-500/10" />
                        )}

                        {/* Top Overlays */}
                        <div className="absolute top-6 left-6 flex items-center gap-2">
                            <span className="px-4 py-1.5 bg-white/90 dark:bg-black/80 backdrop-blur-md text-foreground text-[10px] font-black uppercase tracking-widest rounded-full shadow-xl border border-border/50">
                                {post.category}
                            </span>
                        </div>

                        {post.featured && (
                            <div className="absolute top-6 right-6">
                                <div className="bg-amber-400 text-amber-950 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-tighter shadow-lg flex items-center gap-1 border border-amber-300">
                                    <span className="animate-spin-slow">⭐</span> Featured
                                </div>
                            </div>
                        )}

                        {/* Bottom Fade */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-80 group-hover:opacity-60 transition-opacity duration-500" />

                        <div className="absolute bottom-6 left-6 right-6">
                            <div className="flex items-center gap-3 text-white/90 text-xs font-bold">
                                <span className="flex items-center gap-1.5">
                                    <Calendar className="w-3.5 h-3.5 text-primary-foreground/70" />
                                    {new Date(post.publishedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                </span>
                                <span className="w-1 h-1 rounded-full bg-white/30" />
                                <span className="flex items-center gap-1.5">
                                    <Clock className="w-3.5 h-3.5 text-primary-foreground/70" />
                                    {post.readTime}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="p-8 flex-1 flex flex-col relative z-10">
                        <h2 className="text-2xl font-bold mb-4 text-foreground group-hover:text-primary transition-colors duration-300 line-clamp-2 leading-tight">
                            {post.title}
                        </h2>

                        <p className="text-muted-foreground text-sm line-clamp-3 mb-8 flex-1 leading-relaxed">
                            {post.excerpt}
                        </p>

                        <div className="flex items-center justify-between pt-6 border-t border-border/30">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full border-2 border-primary/20 p-0.5 group-hover:border-primary/50 transition-colors duration-500">
                                    <div className="w-full h-full rounded-full bg-gradient-to-br from-primary to-violet-600 flex items-center justify-center text-white text-sm font-black">
                                        {post.author.name.charAt(0)}
                                    </div>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-sm font-bold text-foreground">
                                        {post.author.name}
                                    </span>
                                    <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">
                                        Author
                                    </span>
                                </div>
                            </div>

                            <motion.div
                                whileHover={{ scale: 1.1, x: 5 }}
                                className="w-10 h-10 rounded-2xl bg-secondary flex items-center justify-center text-muted-foreground group-hover:bg-primary group-hover:text-white transition-all duration-500 group-hover:shadow-lg group-hover:shadow-primary/30"
                            >
                                <ChevronRight className="w-5 h-5" />
                            </motion.div>
                        </div>
                    </div>
                </article>
            </Link>
        </motion.div>
    );
}
