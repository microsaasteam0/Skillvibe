'use client'

import { motion } from 'framer-motion'
import {
    ShieldCheck,
    Sparkles,
    ArrowUp,
    Award,
    Cpu,
    Globe,
    Github,
    Linkedin,
    Save,
    Zap,
    Terminal,
    MapPin,
    Briefcase,
    GraduationCap,
    Clock
} from 'lucide-react'
import EditableText from './EditableText'
import { useState, useEffect } from 'react'

export default function ObsidianEliteTemplate({
    data,
    isEditing = false,
    onSave,
    vibeNotes = []
}: {
    data: any,
    isEditing?: boolean,
    onSave?: (updatedData: any) => void,
    vibeNotes?: any[]
}) {
    const [localData, setLocalData] = useState<any>(data)

    useEffect(() => {
        setLocalData(data)
    }, [data])

    const updateNestedData = (path: string, value: any) => {
        const newData = { ...localData }
        const keys = path.split('.')
        let current: any = newData
        for (let i = 0; i < keys.length - 1; i++) {
            current = current[keys[i]]
        }
        current[keys[keys.length - 1]] = value
        setLocalData(newData)
    }

    const { vibe_data, social_links, full_name, elite_rating } = localData

    return (
        <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-cyan-500/30 overflow-hidden pb-40">
            {/* Ambient Background */}
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="absolute top-[-10%] right-[-10%] w-[60%] h-[60%] bg-cyan-500/10 blur-[150px] rounded-full" />
                <div className="absolute bottom-[-10%] left-[-10%] w-[60%] h-[60%] bg-purple-500/10 blur-[150px] rounded-full" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.03]" />
            </div>

            {/* Editing Controls */}
            {isEditing && (
                <div className="fixed top-24 right-8 z-[200]">
                    <button
                        onClick={() => onSave?.(localData)}
                        className="group flex items-center gap-3 px-8 py-4 bg-cyan-500 text-black rounded-2xl hover:bg-cyan-400 transition-all duration-300 shadow-[0_0_30px_rgba(6,182,212,0.4)] font-black uppercase tracking-widest text-xs active:scale-95"
                    >
                        <Save className="w-5 h-5" />
                        <span>Commit to Grid</span>
                    </button>
                </div>
            )}

            <main className="relative z-10 max-w-7xl mx-auto px-6 py-24 md:py-32">
                {/* Hero Header */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 mb-40">
                    <div className="lg:col-span-8">
                        <motion.div
                            initial={{ opacity: 0, x: -30 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.8 }}
                        >
                            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/5 border border-white/10 rounded-full mb-10 backdrop-blur-md">
                                <ShieldCheck className="w-3.5 h-3.5 text-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.5)]" />
                                <EditableText
                                    as="span"
                                    value={vibe_data.elite_tag || 'ELITE TALENT'}
                                    isEditing={isEditing}
                                    onSave={(v) => updateNestedData('vibe_data.elite_tag', v)}
                                    className="text-[10px] font-black uppercase tracking-[0.3em] text-cyan-200"
                                />
                            </div>

                            <EditableText
                                as="h1"
                                value={full_name}
                                isEditing={isEditing}
                                onSave={(v) => setLocalData({ ...localData, full_name: v })}
                                className="text-7xl md:text-9xl font-black uppercase tracking-tighter italic leading-[0.85] mb-10 bg-gradient-to-b from-white via-white to-white/40 bg-clip-text text-transparent"
                            />

                            <div className="max-w-2xl">
                                <EditableText
                                    as="p"
                                    value={localData.headline}
                                    isEditing={isEditing}
                                    onSave={(v) => setLocalData({ ...localData, headline: v })}
                                    className="text-2xl md:text-3xl text-zinc-400 font-medium leading-snug"
                                />
                            </div>

                            <div className="flex flex-wrap gap-6 mt-12 text-zinc-500">
                                {localData.location && (
                                    <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest">
                                        <MapPin className="w-3.5 h-3.5 text-cyan-500" />
                                        {localData.location}
                                    </div>
                                )}
                                {social_links.linkedin && (
                                    <a href={social_links.linkedin} target="_blank" className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest hover:text-white transition-colors">
                                        <Linkedin className="w-3.5 h-3.5" />
                                        Linked[in]
                                    </a>
                                )}
                                {social_links.github && (
                                    <a href={social_links.github} target="_blank" className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest hover:text-white transition-colors">
                                        <Github className="w-3.5 h-3.5" />
                                        Repo::Base
                                    </a>
                                )}
                            </div>
                        </motion.div>
                    </div>

                    {/* Stats Panel */}
                    <div className="lg:col-span-4 flex flex-col justify-end lg:items-end">
                        <div className="w-full max-w-[320px] p-10 bg-white/5 border border-white/10 rounded-[3rem] backdrop-blur-2xl relative group overflow-hidden shadow-2xl">
                            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 via-transparent to-purple-500/10 opacity-50 transition-opacity group-hover:opacity-100" />

                            <div className="relative z-10">
                                <div className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-8 flex items-center justify-between">
                                    <span>AI MATCH SCORE</span>
                                    <Zap className="w-3 h-3 text-cyan-500" />
                                </div>
                                <div className="flex items-baseline gap-2 mb-2">
                                    <span className="text-6xl font-black italic">{elite_rating}%</span>
                                </div>
                                <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden mb-8">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${elite_rating}%` }}
                                        className="h-full bg-gradient-to-r from-cyan-500 to-indigo-500 shadow-[0_0_15px_rgba(6,182,212,0.5)]"
                                    />
                                </div>

                                <div className="space-y-4 pt-4 border-t border-white/10">
                                    <div className="flex justify-between items-center">
                                        <span className="text-[8px] font-black uppercase tracking-widest text-zinc-500">CURRENT STAGE</span>
                                        <div className="flex items-center gap-1.5">
                                            <div className={`w-1.5 h-1.5 rounded-full ${localData.verification_stage === 3 ? 'bg-purple-500 glow-purple' : localData.verification_stage === 2 ? 'bg-cyan-500 glow-cyan' : 'bg-emerald-500 glow-emerald'}`} />
                                            <span className={`text-[10px] font-black uppercase tracking-widest ${localData.verification_stage === 3 ? 'text-purple-400' : localData.verification_stage === 2 ? 'text-cyan-400' : 'text-emerald-400'}`}>
                                                {localData.verification_stage === 3 ? 'Titan' : localData.verification_stage === 2 ? 'Pillar' : 'Seed'}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-[8px] font-black uppercase tracking-widest text-zinc-500">TRUST SCORE</span>
                                        <span className="text-xs font-black text-cyan-400">+{localData.trust_score || 0}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-[8px] font-black uppercase tracking-widest text-zinc-500">RANKING</span>
                                        <span className="text-xs font-black text-purple-400">TOP 1%</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Content Sections */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-20">
                    <div className="lg:col-span-8 space-y-32">
                        {/* Bio / Philosophy */}
                        <section>
                            <div className="flex items-center gap-4 mb-12">
                                <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-600">01_EXECUTIVE_SUMMARY</h2>
                                <div className="h-px flex-1 bg-white/5" />
                            </div>
                            <EditableText
                                multiline
                                as="p"
                                value={vibe_data.bio_summary}
                                isEditing={isEditing}
                                onSave={(v) => updateNestedData('vibe_data.bio_summary', v)}
                                className="text-3xl font-light leading-relaxed text-zinc-200"
                            />
                        </section>

                        {/* Experience */}
                        <section>
                            <div className="flex items-center gap-4 mb-20">
                                <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-600">02_PROVEN_TRAJECTORY</h2>
                                <div className="h-px flex-1 bg-white/5" />
                            </div>
                            <div className="space-y-24">
                                {vibe_data.experience.map((exp: any, i: number) => (
                                    <div key={i} className="group relative">
                                        <div className="absolute -left-10 top-0 text-white/5 text-7xl font-black italic whitespace-nowrap pointer-events-none group-hover:text-cyan-500/5 transition-colors">
                                            {exp.duration?.split('-')[0]?.trim() || i + 1}
                                        </div>
                                        <div className="relative z-10 pl-6 border-l border-white/10 hover:border-cyan-500/50 transition-colors">
                                            <div className="flex flex-col md:flex-row justify-between mb-2">
                                                <EditableText
                                                    as="h3"
                                                    value={exp.role}
                                                    isEditing={isEditing}
                                                    onSave={(v) => {
                                                        const newExp = [...vibe_data.experience];
                                                        newExp[i].role = v;
                                                        updateNestedData('vibe_data.experience', newExp);
                                                    }}
                                                    className="text-3xl font-bold uppercase tracking-tight text-white"
                                                />
                                                <div className="flex items-center gap-2 text-xs font-bold text-zinc-500 uppercase tracking-widest mt-2 md:mt-0">
                                                    <Clock className="w-3.5 h-3.5" />
                                                    {exp.duration}
                                                </div>
                                            </div>
                                            <EditableText
                                                as="div"
                                                value={exp.company}
                                                isEditing={isEditing}
                                                onSave={(v) => {
                                                    const newExp = [...vibe_data.experience];
                                                    newExp[i].company = v;
                                                    updateNestedData('vibe_data.experience', newExp);
                                                }}
                                                className="text-lg font-bold text-cyan-400/80 mb-8 flex items-center gap-3"
                                            />
                                            <ul className="space-y-6">
                                                {exp.bullets.map((b: string, bi: number) => (
                                                    <li key={bi} className="text-zinc-400 group/bullet flex gap-4 text-sm leading-relaxed">
                                                        <span className="text-cyan-600 group-hover/bullet:translate-x-1 transition-transform">→</span>
                                                        <EditableText
                                                            multiline
                                                            value={b}
                                                            isEditing={isEditing}
                                                            onSave={(v) => {
                                                                const newExp = [...vibe_data.experience];
                                                                newExp[i].bullets[bi] = v;
                                                                updateNestedData('vibe_data.experience', newExp);
                                                            }}
                                                            className="flex-grow"
                                                        />
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    </div>

                    <div className="lg:col-span-4 space-y-20">
                        {/* AI Analysis */}
                        <div className="p-8 rounded-[2rem] bg-indigo-500/5 border border-indigo-500/20 relative">
                            <div className="absolute top-4 right-6">
                                <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-ping" />
                            </div>
                            <h3 className="text-[10px] font-black uppercase tracking-widest text-indigo-400 mb-6 flex items-center gap-2">
                                <Terminal className="w-3.5 h-3.5" /> AI_ANALYSIS_MOD
                            </h3>
                            <EditableText
                                multiline
                                as="p"
                                value={vibe_data.ai_verdict}
                                isEditing={isEditing}
                                onSave={(v) => updateNestedData('vibe_data.ai_verdict', v)}
                                className="text-xs italic leading-relaxed text-zinc-400 font-medium"
                            />
                        </div>

                        {/* Skills */}
                        <section>
                            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-600 mb-8 flex items-center gap-3">
                                <Briefcase className="w-3.5 h-3.5" /> CORE_STACK
                            </h3>
                            <div className="space-y-10">
                                {vibe_data.skills.map((skill: any, i: number) => (
                                    <div key={i}>
                                        <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-4 opacity-50">{skill.category}</h4>
                                        <div className="flex flex-wrap gap-2">
                                            {skill.tags.map((tag: string, ti: number) => (
                                                <span key={ti} className="text-[10px] font-bold bg-white/5 border border-white/10 px-4 py-2 rounded-xl text-zinc-300 hover:border-cyan-500/50 hover:text-white transition-all">
                                                    {tag}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>

                        {/* Education */}
                        <section>
                            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-600 mb-8 flex items-center gap-3">
                                <GraduationCap className="w-4 h-4" /> ACADEMIC_TRACE
                            </h3>
                            <div className="space-y-8">
                                {vibe_data.education.map((edu: any, i: number) => (
                                    <div key={i} className="relative pl-6 border-l border-zinc-800">
                                        <div className="text-[10px] font-black text-cyan-400 mb-1">{edu.year}</div>
                                        <EditableText
                                            as="h4"
                                            value={edu.degree}
                                            isEditing={isEditing}
                                            onSave={(v) => {
                                                const newEdu = [...vibe_data.education];
                                                newEdu[i].degree = v;
                                                updateNestedData('vibe_data.education', newEdu);
                                            }}
                                            className="text-sm font-black text-white mb-1 uppercase tracking-tight"
                                        />
                                        <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{edu.school}</div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    </div>
                </div>

                {/* Vibe Notes */}
                {vibeNotes.length > 0 && (
                    <section className="mt-40">
                        <div className="flex items-center gap-4 mb-20 justify-center">
                            <div className="h-px w-20 bg-white/5" />
                            <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-600">SOCIAL_PROOF_SUBSYSTEM</h2>
                            <div className="h-px w-20 bg-white/5" />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {vibeNotes.map((note: any, i: number) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    className="p-10 rounded-[2.5rem] bg-white/5 border border-white/10 backdrop-blur-md relative group hover:border-cyan-500/30 transition-all"
                                >
                                    <Sparkles className="absolute top-6 right-8 w-5 h-5 text-cyan-400/20 group-hover:text-cyan-400/50 transition-colors" />
                                    <div className="text-[9px] font-black text-cyan-500 uppercase tracking-[0.2em] mb-6">
                                        {note.vibe_type} verification log
                                    </div>
                                    <p className="text-zinc-300 font-light leading-relaxed mb-8 italic text-lg">
                                        "{note.content}"
                                    </p>
                                    <div className="flex items-center justify-between pt-6 border-t border-white/5">
                                        <span className="text-[10px] font-black uppercase tracking-tighter text-white">{note.author_name}</span>
                                        <span className="text-[8px] font-bold text-zinc-500 uppercase tracking-[0.3em]">{note.author_role}</span>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </section>
                )}

                {/* Footer */}
                <footer className="mt-60 pt-20 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-10 opacity-30">
                    <div className="text-[10px] font-black uppercase tracking-[0.5em] flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center p-2">
                            <Zap className="w-full h-full text-white" />
                        </div>
                        {full_name} // OS_OBSIDIAN_V1
                    </div>
                    <div className="flex gap-8 text-[10px] font-bold uppercase tracking-widest">
                        <span>Prowess Protocol</span>
                        <span>Elite Network</span>
                        <span>SkillVibe // 2026</span>
                    </div>
                </footer>
            </main>
        </div>
    )
}
