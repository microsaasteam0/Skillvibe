import { motion } from 'framer-motion'
import { Terminal, Github, Linkedin, Globe, Cpu, Save, Share2, ShieldCheck, Sparkles } from 'lucide-react'
import EditableText from './EditableText'
import { useState, useEffect } from 'react'

export default function TerminalVoidTemplate({
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
        <div className="min-h-screen bg-black text-green-500 font-mono selection:bg-green-500/30 selection:text-green-200 relative overflow-hidden">
            {/* CRT Effect Overlay */}
            <div className="fixed inset-0 pointer-events-none z-50 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.1)_50%),linear-gradient(90deg,rgba(255,0,0,0.03),rgba(0,255,0,0.01),rgba(0,0,255,0.03))] bg-[length:100%_4px,3px_100%] opacity-20" />
            <div className="fixed inset-0 pointer-events-none z-50 bg-[radial-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_100%),radial-gradient(rgba(0,0,0,0.1)_50%,rgba(0,0,0,0.5)_100%)]" />

            {/* Matrix-like Background Particles (Subtle) */}
            <div className="fixed inset-0 opacity-10 pointer-events-none">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]" />
            </div>

            {/* Editing Controls */}
            {isEditing && (
                <div className="fixed top-8 right-8 z-[100]">
                    <button
                        onClick={() => onSave?.(localData)}
                        className="group flex items-center gap-2 px-6 py-3 bg-green-900/50 text-green-400 border border-green-500/30 rounded-none hover:bg-green-500 hover:text-black transition-all duration-300 shadow-[0_0_20px_rgba(34,197,94,0.2)] active:scale-95"
                    >
                        <Save className="w-4 h-4" />
                        <span className="text-[10px] uppercase tracking-[0.3em] font-black">SAVE PROFILE</span>
                    </button>
                </div>
            )}

            <main className="max-w-5xl mx-auto px-6 py-12 md:py-24 relative z-10">
                {/* System Header */}
                <header className="mb-20 border-b border-green-500/20 pb-12">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-10">
                        <div className="space-y-4">
                            <div className="flex items-center gap-3 text-xs mb-2 opacity-60">
                                <Terminal className="w-4 h-4" />
                                <span className="tracking-[0.2em]">IDENTITY VERIFIED</span>
                                <span className="animate-pulse">_</span>
                            </div>
                            <div className="flex items-center gap-6">
                                <EditableText
                                    as="h1"
                                    value={full_name}
                                    isEditing={isEditing}
                                    onSave={(v) => setLocalData({ ...localData, full_name: v })}
                                    className="text-5xl md:text-7xl font-black uppercase tracking-tighter text-green-400 drop-shadow-[0_0_10px_rgba(74,222,128,0.5)]"
                                />
                                {localData.is_verified_trust && (
                                    <div className="px-3 py-1 border border-green-500/50 text-[10px] uppercase font-black tracking-widest bg-green-500/20 text-green-400 flex items-center gap-2">
                                        <ShieldCheck className="w-3 h-3" /> VERIFIED
                                    </div>
                                )}
                            </div>
                            <div className="flex flex-wrap gap-4">
                                <EditableText
                                    as="span"
                                    value={vibe_data.elite_tag}
                                    isEditing={isEditing}
                                    onSave={(v) => updateNestedData('vibe_data.elite_tag', v)}
                                    className="px-3 py-1 bg-green-500/10 border border-green-500/30 text-[10px] uppercase tracking-widest text-green-300"
                                />
                                <span className="px-3 py-1 bg-green-500/10 border border-green-500/30 text-[10px] uppercase tracking-widest text-green-300">
                                    STAGE::{localData.verification_stage === 3 ? 'Titan' : localData.verification_stage === 2 ? 'Pillar' : 'Seed'}
                                </span>
                                <span className="px-3 py-1 bg-green-500/10 border border-green-500/30 text-[10px] uppercase tracking-widest text-green-300">
                                    PROWESS::{elite_rating}
                                </span>
                                {localData.trust_score > 0 && (
                                    <span className="px-3 py-1 bg-green-500/10 border border-green-500/50 text-[10px] uppercase tracking-widest text-green-400 font-bold">
                                        TRUST::{localData.trust_score}
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Status Grid */}
                        <div className="grid grid-cols-2 gap-4 text-[10px] opacity-60 font-bold tracking-widest">
                            <div className="space-y-1">
                                <div>LOCAL::27.02.2026</div>
                                <div>OS::SKILLVIBE_v2</div>
                            </div>
                            <div className="space-y-1 text-right">
                                <div>STATUS::ACTIVE</div>
                                <div>USER::SKILLVIBE_01</div>
                            </div>
                        </div>
                    </div>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-12">
                    {/* Left Side: Summary & Log */}
                    <div className="md:col-span-8 space-y-16">
                        <section>
                            <div className="flex items-center gap-4 mb-8 opacity-40">
                                <h2 className="text-xs uppercase tracking-[0.4em] font-black">01_SUMMARY</h2>
                                <div className="h-px flex-1 bg-green-500/30" />
                            </div>
                            <div className="bg-green-500/5 border border-green-500/20 p-8 relative">
                                <div className="absolute top-0 right-0 p-2 border-b border-l border-green-500/20 opacity-30">
                                    <Cpu className="w-4 h-4" />
                                </div>
                                <EditableText
                                    multiline
                                    as="p"
                                    value={vibe_data.bio_summary}
                                    isEditing={isEditing}
                                    onSave={(v) => updateNestedData('vibe_data.bio_summary', v)}
                                    className="text-lg md:text-xl text-green-200 leading-relaxed font-medium"
                                />
                            </div>
                        </section>

                        <section>
                            <div className="flex items-center gap-4 mb-8 opacity-40">
                                <h2 className="text-xs uppercase tracking-[0.4em] font-black">02_EXPERIENCE</h2>
                                <div className="h-px flex-1 bg-green-500/30" />
                            </div>
                            <div className="space-y-10">
                                {vibe_data.experience.map((exp: any, i: number) => (
                                    <div key={i} className="group relative">
                                        <div className="flex items-baseline gap-4 mb-2">
                                            <span className="text-xs opacity-50 font-bold tracking-tighter">[{exp.duration}]</span>
                                            <EditableText
                                                as="h3"
                                                value={exp.role}
                                                isEditing={isEditing}
                                                onSave={(v) => {
                                                    const newExp = [...vibe_data.experience];
                                                    newExp[i].role = v;
                                                    updateNestedData('vibe_data.experience', newExp);
                                                }}
                                                className="text-xl font-bold text-green-400 uppercase"
                                            />
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
                                            className="text-sm border-l-2 border-green-500/40 pl-4 mb-4 text-green-300/80 font-bold"
                                        />
                                        <ul className="space-y-3 pl-4">
                                            {exp.bullets.map((b: string, bi: number) => (
                                                <li key={bi} className="text-xs md:text-sm text-green-100/60 leading-relaxed flex gap-3">
                                                    <span className="text-green-500/50 mt-0.5">{">"}</span>
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
                                ))}
                            </div>
                        </section>
                    </div>

                    {/* Right Side: Data Modules */}
                    <div className="md:col-span-4 space-y-12">
                        {/* AI Kernel Logic */}
                        <div className="p-6 bg-green-900/10 border border-green-500/30">
                            <div className="text-[10px] uppercase tracking-widest mb-4 opacity-50 flex items-center justify-between">
                                <span>AI_VERDICT</span>
                                <div className="flex gap-1">
                                    <div className="w-1 h-1 bg-green-500 animate-pulse" />
                                    <div className="w-1 h-1 bg-green-500 animate-pulse animation-delay-200" />
                                    <div className="w-1 h-1 bg-green-500 animate-pulse animation-delay-500" />
                                </div>
                            </div>
                            <EditableText
                                multiline
                                as="p"
                                value={vibe_data.ai_verdict}
                                isEditing={isEditing}
                                onSave={(v) => updateNestedData('vibe_data.ai_verdict', v)}
                                className="text-xs leading-relaxed text-green-400/80 italic font-medium"
                            />
                        </div>

                        {/* Tech Stack Module */}
                        <div>
                            <h3 className="text-[10px] uppercase font-black tracking-[0.3em] mb-4 opacity-60">MODULE::SKILLS</h3>
                            <div className="space-y-4">
                                {vibe_data.skills.map((skill: any, i: number) => (
                                    <div key={i} className="border border-green-500/10 p-4">
                                        <div className="text-[10px] font-bold text-green-500/60 mb-3 border-b border-green-500/10 pb-2">{skill.category}</div>
                                        <div className="flex flex-wrap gap-2">
                                            {skill.tags.map((tag: string, ti: number) => (
                                                <span key={ti} className="text-[9px] font-bold border border-green-500/30 px-2 py-1 bg-green-500/5">
                                                    {tag}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Education Trace */}
                        <div>
                            <h3 className="text-[10px] uppercase font-black tracking-[0.3em] mb-4 opacity-60">MODULE::EDUCATION</h3>
                            <div className="space-y-6">
                                {vibe_data.education.map((edu: any, i: number) => (
                                    <div key={i} className="text-[10px] leading-tight">
                                        <div className="text-green-500/60 mb-1">{edu.year}</div>
                                        <div className="font-bold text-green-300 mb-1 uppercase tracking-tighter">{edu.degree}</div>
                                        <div className="opacity-50 uppercase tracking-widest">{edu.school}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {vibeNotes.length > 0 && (
                    <section className="mt-24">
                        <div className="flex items-center gap-4 mb-12 opacity-40 text-center justify-center">
                            <div className="h-px w-20 bg-green-500/30" />
                            <h2 className="text-xs uppercase tracking-[0.4em] font-black whitespace-nowrap">VIBE_CHECK // SOCIAL_LOGS</h2>
                            <div className="h-px w-20 bg-green-500/30" />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {vibeNotes.map((note: any, i: number) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, scale: 0.98 }}
                                    whileInView={{ opacity: 1, scale: 1 }}
                                    viewport={{ once: true }}
                                    className="p-8 border border-green-500/20 bg-green-500/[0.02] relative group hover:bg-green-500/5 transition-all"
                                >
                                    <Sparkles className="absolute top-4 right-4 w-4 h-4 opacity-20" />
                                    <div className="text-[10px] font-bold opacity-40 uppercase tracking-widest mb-4">
                                        SOURCE::{note.author_role} :: {note.vibe_type}
                                    </div>
                                    <p className="text-green-200 text-sm leading-relaxed mb-6 italic">
                                        "{note.content}"
                                    </p>
                                    <div className="text-[10px] font-bold text-green-400/60 uppercase tracking-tighter">
                                        AUTHORED_BY::{note.author_name}
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </section>
                )}

                {/* Footer Data */}
                <footer className="mt-24 pt-12 border-t border-green-500/20 flex flex-col md:flex-row justify-between items-center gap-10">
                    <div className="text-[10px] opacity-40 uppercase tracking-widest">
                        TERMINAL_VOID_V1 // {full_name} // 2026.bin
                    </div>
                    <div className="flex gap-6">
                        {social_links.linkedin && (
                            <a href={social_links.linkedin} target="_blank" className="opacity-60 hover:opacity-100 hover:text-green-400 transition-all">
                                <Linkedin className="w-5 h-5" />
                            </a>
                        )}
                        {social_links.github && (
                            <a href={social_links.github} target="_blank" className="opacity-60 hover:opacity-100 hover:text-green-400 transition-all">
                                <Github className="w-5 h-5" />
                            </a>
                        )}
                        {social_links.portfolio && (
                            <a href={social_links.portfolio} target="_blank" className="opacity-60 hover:opacity-100 hover:text-green-400 transition-all">
                                <Share2 className="w-5 h-5" />
                            </a>
                        )}
                    </div>
                </footer>
            </main>
        </div>
    )
}
