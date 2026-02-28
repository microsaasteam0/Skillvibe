'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { getPostBySlug, getAllPosts } from '@/lib/blog-data';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import DashboardModal from '@/components/DashboardModal.jsx';

import { useAuth } from '@/contexts/AuthContext';
import AuthModal from '@/components/AuthModal';
import { motion, useScroll, useSpring } from 'framer-motion';
import { ChevronLeft, Share2, MessageSquare, Twitter, Linkedin, Copy, Check, Clock, ChevronRight } from 'lucide-react';

export default function BlogPostPage() {
    const { isAuthenticated } = useAuth();
    const params = useParams();
    const router = useRouter();
    const [showAuthModal, setShowAuthModal] = useState(false);
    const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>('register');
    const [showDashboard, setShowDashboard] = useState(false);
    const [copied, setCopied] = useState(false);

    const { scrollYProgress } = useScroll();
    const scaleX = useSpring(scrollYProgress, {
        stiffness: 100,
        damping: 30,
        restDelta: 0.001
    });

    const slug = params?.slug as string;
    const post = getPostBySlug(slug);
    const allPosts = getAllPosts();
    const relatedPosts = allPosts.filter(p => p.id !== post?.id && p.category === post?.category).slice(0, 3);

    const handleCopyLink = () => {
        navigator.clipboard.writeText(window.location.href);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleGetStarted = () => {
        if (isAuthenticated) {
            router.push('/pricing');
        } else {
            setAuthModalMode('register');
            setShowAuthModal(true);
        }
    };

    if (!post) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-black">
                <div className="text-center">
                    <h1 className="text-4xl font-bold mb-4">Post Not Found</h1>
                    <Link href="/blog" className="text-primary hover:underline font-bold">
                        ← Back to Blog
                    </Link>
                </div>
            </div>
        );
    }

    const fadeInUp = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 }
    };

    const stagger = {
        visible: {
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    return (
        <div className="bg-white dark:bg-black selection:bg-primary/30 min-h-screen">
            {/* Reading Progress Bar */}
            <motion.div
                className="fixed top-0 left-0 right-0 h-1.5 bg-primary z-[100] origin-left"
                style={{ scaleX }}
            />

            <Navbar
                onSignIn={() => {
                    setAuthModalMode('login');
                    setShowAuthModal(true);
                }}
                onSignUp={() => {
                    setAuthModalMode('register');
                    setShowAuthModal(true);
                }}
                onUserDashboard={() => setShowDashboard(true)}
            />

            <DashboardModal
                isOpen={showDashboard}
                onClose={() => setShowDashboard(false)}
            />

            <AuthModal
                isOpen={showAuthModal}
                onClose={() => setShowAuthModal(false)}
                initialMode={authModalMode}
            />

            <main className="pt-28 pb-32">
                {/* Header Section */}
                <header className="px-6 mb-16 relative">
                    <div className="max-w-4xl mx-auto">
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="mb-12"
                        >
                            <Link
                                href="/blog"
                                className="group inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors font-bold text-sm"
                            >
                                <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all">
                                    <ChevronLeft className="w-4 h-4" />
                                </div>
                                Back to library
                            </Link>
                        </motion.div>

                        <motion.div
                            variants={stagger}
                            initial="hidden"
                            animate="visible"
                        >
                            <motion.div variants={fadeInUp} className="flex flex-wrap items-center gap-3 mb-8">
                                <span className="px-4 py-1.5 bg-primary/10 text-primary rounded-full text-xs font-black uppercase tracking-widest border border-primary/20">
                                    {post.category}
                                </span>
                                <span className="text-muted-foreground text-xs font-bold flex items-center gap-2">
                                    <Clock className="w-3.5 h-3.5" />
                                    {post.readTime}
                                </span>
                                {post.featured && (
                                    <span className="px-4 py-1.5 bg-amber-400/10 text-amber-600 dark:text-amber-400 rounded-full text-xs font-black uppercase tracking-widest border border-amber-400/20">
                                        ⭐ Featured
                                    </span>
                                )}
                            </motion.div>

                            <motion.h1
                                variants={fadeInUp}
                                className="text-4xl md:text-6xl lg:text-7xl font-display font-bold mb-10 tracking-tight leading-[1.1]"
                            >
                                {post.title}
                            </motion.h1>

                            <motion.div variants={fadeInUp} className="flex items-center justify-between mb-12 flex-wrap gap-6">
                                <div className="flex items-center gap-4">
                                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-violet-600 p-0.5 shadow-xl shadow-primary/20">
                                        <div className="w-full h-full rounded-[14px] bg-white dark:bg-slate-900 overflow-hidden flex items-center justify-center text-primary font-black text-xl">
                                            {post.author.name.charAt(0)}
                                        </div>
                                    </div>
                                    <div>
                                        <p className="font-black text-foreground">
                                            {post.author.name}
                                        </p>
                                        <p className="text-xs text-muted-foreground uppercase tracking-widest font-bold">
                                            {post.author.role} • {new Date(post.publishedAt).toLocaleDateString('en-US', {
                                                month: 'long',
                                                day: 'numeric',
                                                year: 'numeric'
                                            })}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={handleCopyLink}
                                        className="w-10 h-10 rounded-xl bg-secondary hover:bg-primary hover:text-white transition-all flex items-center justify-center"
                                        title="Copy Link"
                                    >
                                        {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                    </button>
                                    <button className="w-10 h-10 rounded-xl bg-secondary hover:bg-[#1DA1F2] hover:text-white transition-all flex items-center justify-center">
                                        <Twitter className="w-4 h-4" />
                                    </button>
                                    <button className="w-10 h-10 rounded-xl bg-secondary hover:bg-[#0A66C2] hover:text-white transition-all flex items-center justify-center">
                                        <Linkedin className="w-4 h-4" />
                                    </button>
                                </div>
                            </motion.div>

                            <motion.div
                                variants={fadeInUp}
                                className="relative aspect-[21/9] rounded-[2.5rem] overflow-hidden mb-20 shadow-2xl border border-border/50 group"
                            >
                                {post.image && (
                                    <Image
                                        src={post.image}
                                        alt={post.title}
                                        fill
                                        className="object-cover group-hover:scale-105 transition-transform duration-[2s] ease-out"
                                        priority
                                    />
                                )}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                            </motion.div>
                        </motion.div>
                    </div>
                </header>

                {/* Content Section */}
                <article className="px-6 mb-32">
                    <div className="max-w-3xl mx-auto">
                        <motion.div
                            initial={{ opacity: 0 }}
                            whileInView={{ opacity: 1 }}
                            viewport={{ once: true, margin: "-100px" }}
                            transition={{ duration: 0.8 }}
                            className="prose prose-lg dark:prose-invert max-w-none
                                prose-headings:font-display prose-headings:font-black prose-headings:tracking-tight
                                prose-h2:text-4xl prose-h2:mt-20 prose-h2:mb-8 prose-h2:text-foreground
                                prose-p:text-muted-foreground prose-p:leading-relaxed prose-p:mb-8 prose-p:text-lg
                                prose-strong:text-foreground prose-strong:font-black
                                prose-blockquote:border-l-4 prose-blockquote:border-primary prose-blockquote:bg-primary/5 prose-blockquote:p-8 prose-blockquote:rounded-2xl prose-blockquote:not-italic prose-blockquote:text-xl prose-blockquote:text-foreground
                                prose-img:rounded-[2rem] prose-img:shadow-2xl prose-img:border prose-img:border-border/50
                                prose-a:text-primary prose-a:font-bold prose-a:no-underline hover:prose-a:underline
                            "
                        >
                            <ReactMarkdown
                                remarkPlugins={[remarkGfm]}
                                components={{
                                    ul: ({ children }) => (
                                        <ul className="space-y-4 my-8 pl-2">{children}</ul>
                                    ),
                                    li: ({ children }) => (
                                        <li className="flex items-start gap-3">
                                            <span className="flex-shrink-0 mt-2.5 w-2 h-2 rounded-full bg-primary" />
                                            <span className="flex-1 text-lg leading-relaxed">{children}</span>
                                        </li>
                                    ),
                                }}
                            >
                                {post.content}
                            </ReactMarkdown>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className="mt-20 pt-12 border-t border-border/50 flex flex-wrap gap-3"
                        >
                            {post.tags.map((tag) => (
                                <span
                                    key={tag}
                                    className="px-6 py-2 bg-secondary/50 dark:bg-white/5 border border-border/50 text-muted-foreground rounded-full text-sm font-bold hover:bg-primary hover:text-white transition-all cursor-pointer"
                                >
                                    #{tag}
                                </span>
                            ))}
                        </motion.div>
                    </div>
                </article>

                {/* Related Posts */}
                {relatedPosts.length > 0 && (
                    <section className="px-6 py-24 bg-slate-50 dark:bg-white/5 overflow-hidden">
                        <div className="max-w-6xl mx-auto">
                            <motion.h2
                                initial={{ opacity: 0, x: -20 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                                className="text-3xl font-black mb-12 tracking-tight"
                            >
                                More from <span className="text-primary">{post.category}</span>
                            </motion.h2>

                            <div className="grid md:grid-cols-3 gap-8">
                                {relatedPosts.map((relatedPost, idx) => (
                                    <motion.div
                                        key={relatedPost.id}
                                        initial={{ opacity: 0, y: 20 }}
                                        whileInView={{ opacity: 1, y: 0 }}
                                        viewport={{ once: true }}
                                        transition={{ delay: idx * 0.1 }}
                                    >
                                        <Link href={`/blog/${relatedPost.slug}`}>
                                            <article className="group bg-white dark:bg-black rounded-3xl overflow-hidden border border-border/50 hover:border-primary/50 transition-all duration-500 shadow-sm hover:shadow-xl">
                                                <div className="relative h-48 overflow-hidden bg-secondary">
                                                    {relatedPost.image && (
                                                        <Image
                                                            src={relatedPost.image}
                                                            alt={relatedPost.title}
                                                            fill
                                                            className="object-cover group-hover:scale-110 transition-transform duration-700"
                                                        />
                                                    )}
                                                </div>
                                                <div className="p-6">
                                                    <h3 className="font-black text-foreground line-clamp-2 mb-4 group-hover:text-primary transition-colors leading-tight">
                                                        {relatedPost.title}
                                                    </h3>
                                                    <div className="flex items-center justify-between text-[10px] uppercase font-black tracking-widest text-muted-foreground">
                                                        <span>{relatedPost.readTime}</span>
                                                        <ChevronRight className="w-4 h-4 text-primary opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all" />
                                                    </div>
                                                </div>
                                            </article>
                                        </Link>
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    </section>
                )}

                {/* High Converting CTA */}
                <section className="px-6 pt-32">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        className="max-w-5xl mx-auto relative group"
                    >
                        <div className="absolute inset-0 bg-gradient-to-r from-primary to-violet-600 rounded-[3rem] blur-3xl opacity-20 group-hover:opacity-30 transition-opacity" />

                        <div className="relative bg-white dark:bg-slate-900 border border-border/50 rounded-[3rem] p-12 md:p-20 text-center overflow-hidden">
                            <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                                <Share2 className="w-40 h-40" />
                            </div>

                            <h2 className="text-4xl md:text-6xl font-display font-black mb-8 tracking-tighter text-foreground">
                                Ready to scale your <br /> <span className="text-gradient">personal brand?</span>
                            </h2>
                            <p className="text-lg text-muted-foreground mb-12 max-w-2xl mx-auto leading-relaxed">
                                Join 5,000+ talent architects who use SkillVibe to turn their daily work into verified trust signals.
                            </p>

                            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                                <button
                                    onClick={handleGetStarted}
                                    className="px-10 py-5 bg-primary text-primary-foreground rounded-2xl font-black shadow-2xl shadow-primary/30 hover:scale-105 active:scale-95 transition-all text-lg"
                                >
                                    Get Started For Free
                                </button>
                                <button className="px-10 py-5 bg-secondary text-foreground rounded-2xl font-black hover:bg-border transition-all text-lg">
                                    View Pricing
                                </button>
                            </div>

                            <p className="mt-8 text-xs text-muted-foreground font-bold flex items-center justify-center gap-2">
                                <Check className="w-4 h-4 text-green-500" /> No credit card required • 14-day free trial
                            </p>
                        </div>
                    </motion.div>
                </section>
            </main>

            <Footer />
        </div>
    );
}
