import { motion } from 'framer-motion'
import { Crown, Github, Linkedin, ExternalLink, ShieldCheck, Save, Award, Sparkles, ShieldAlert } from 'lucide-react'
import EditableText from './EditableText'
import { useState, useEffect } from 'react'

export default function ExecutiveGoldTemplate({
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
        <div className="min-h-screen bg-[#050505] text-[#e5e5e5] font-sans selection:bg-[#c6a052] selection:text-black">
            {/* Background Texture */}
            <div className="fixed inset-0 pointer-events-none opacity-[0.03] bg-[url('https://www.transparenttextures.com/patterns/asfalt-dark.png')]" />
            <div className="fixed top-0 left-0 w-full h-[500px] bg-gradient-to-b from-[#c6a052]/10 to-transparent pointer-events-none" />

            {/* Editing Controls */}
            {isEditing && (
                <div className="fixed top-8 right-8 z-[100]">
                    <button
                        onClick={() => onSave?.(localData)}
                        className="group flex items-center gap-2 px-8 py-3 bg-gradient-to-br from-[#c6a052] to-[#a6823d] text-black rounded-lg hover:brightness-110 transition-all duration-300 shadow-2xl active:scale-95"
                    >
                        <Save className="w-5 h-5" />
                        <span className="text-[10px] uppercase tracking-[0.3em] font-black">Persist Legacy</span>
                    </button>
                </div>
            )}

            <main className="max-w-6xl mx-auto px-8 py-20 lg:py-40 relative z-10">
                {/* Executive Header */}
                <header className="mb-32 border-l-4 border-[#c6a052] pl-10 md:pl-20">
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="space-y-6"
                    >
                        <div className="flex items-center gap-3">
                            <Crown className="w-6 h-6 text-[#c6a052]" />
                            <EditableText
                                as="span"
                                value={vibe_data.elite_tag}
                                isEditing={isEditing}
                                onSave={(v) => updateNestedData('vibe_data.elite_tag', v)}
                                className="text-xs uppercase tracking-[0.5em] font-black text-[#c6a052]"
                            />
                        </div>
                        <div className="flex flex-col gap-4">
                            <EditableText
                                as="h1"
                                value={full_name}
                                isEditing={isEditing}
                                onSave={(v) => setLocalData({ ...localData, full_name: v })}
                                className="text-7xl md:text-9xl font-black uppercase tracking-tighter leading-[0.85] text-white"
                            />
                            {localData.is_verified_trust && (
                                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.5em] text-[#c6a052] bg-[#c6a052]/10 w-fit px-6 py-2 border border-[#c6a052]/30">
                                    <ShieldAlert className="w-4 h-4" /> Platinum Verified
                                </div>
                            )}
                        </div>
                        <div className="flex items-center gap-8 pt-4">
                            <div className="flex flex-col">
                                <span className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold mb-1">Profile Grade</span>
                                <span className="text-3xl font-black text-[#c6a052]">{elite_rating}%</span>
                            </div>
                            <div className="h-10 w-px bg-zinc-800" />
                            <div className="flex flex-col">
                                <span className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold mb-1">Current Stage</span>
                                <span className={`text-2xl font-black ${localData.verification_stage === 3 ? 'text-purple-500' : localData.verification_stage === 2 ? 'text-cyan-500' : 'text-[#c6a052]'}`}>
                                    {localData.verification_stage === 3 ? 'Titan' : localData.verification_stage === 2 ? 'Pillar' : 'Seed'}
                                </span>
                            </div>
                            {localData.trust_score > 0 && (
                                <>
                                    <div className="h-10 w-px bg-zinc-800" />
                                    <div className="flex flex-col">
                                        <span className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold mb-1">Trust Score</span>
                                        <span className="text-3xl font-black text-[#c6a052]">+{localData.trust_score}</span>
                                    </div>
                                </>
                            )}
                            <div className="h-10 w-px bg-zinc-800" />
                            <div className="flex gap-6">
                                {social_links.linkedin && (
                                    <a href={social_links.linkedin} target="_blank" className="text-zinc-500 hover:text-[#c6a052] transition-colors">
                                        <Linkedin className="w-6 h-6" />
                                    </a>
                                )}
                                {social_links.github && (
                                    <a href={social_links.github} target="_blank" className="text-zinc-500 hover:text-[#c6a052] transition-colors">
                                        <Github className="w-6 h-6" />
                                    </a>
                                )}
                            </div>
                        </div>
                    </motion.div>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-24">
                    {/* Left: Biography & Experience */}
                    <div className="lg:col-span-8 space-y-32">
                        <section>
                            <h2 className="flex items-center gap-4 text-[10px] uppercase tracking-[0.4em] font-black text-zinc-500 mb-12">
                                <span className="w-10 h-px bg-[#c6a052]/30" /> Executive Statement
                            </h2>
                            <EditableText
                                multiline
                                as="p"
                                value={vibe_data.bio_summary}
                                isEditing={isEditing}
                                onSave={(v) => updateNestedData('vibe_data.bio_summary', v)}
                                className="text-2xl md:text-3xl font-light leading-relaxed text-zinc-300"
                            />
                        </section>

                        <section>
                            <h2 className="flex items-center gap-4 text-[10px] uppercase tracking-[0.4em] font-black text-zinc-500 mb-16">
                                <span className="w-10 h-px bg-[#c6a052]/30" /> Career Milestones
                            </h2>
                            <div className="space-y-20">
                                {vibe_data.experience.map((exp: any, i: number) => (
                                    <div key={i} className="group relative">
                                        <div className="absolute -left-12 lg:-left-20 top-0 text-[#c6a052]/20 font-black text-6xl italic select-none">
                                            0{i + 1}
                                        </div>
                                        <div className="relative">
                                            <div className="flex flex-col md:flex-row md:items-baseline justify-between mb-4 gap-2">
                                                <EditableText
                                                    as="h3"
                                                    value={exp.role}
                                                    isEditing={isEditing}
                                                    onSave={(v) => {
                                                        const newExp = [...vibe_data.experience];
                                                        newExp[i].role = v;
                                                        updateNestedData('vibe_data.experience', newExp);
                                                    }}
                                                    className="text-3xl font-bold text-white tracking-tight"
                                                />
                                                <EditableText
                                                    as="span"
                                                    value={exp.duration}
                                                    isEditing={isEditing}
                                                    onSave={(v) => {
                                                        const newExp = [...vibe_data.experience];
                                                        newExp[i].duration = v;
                                                        updateNestedData('vibe_data.experience', newExp);
                                                    }}
                                                    className="text-xs uppercase tracking-widest font-black text-[#c6a052]/60"
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
                                                className="text-lg font-bold text-[#c6a052] mb-8"
                                            />
                                            <ul className="space-y-5 border-l border-zinc-900 pl-8">
                                                {exp.bullets.map((b: string, bi: number) => (
                                                    <li key={bi} className="text-zinc-400 leading-relaxed text-sm italic relative">
                                                        <div className="absolute -left-[33px] top-3 w-1.5 h-1.5 rounded-full bg-zinc-800 border border-zinc-700" />
                                                        <EditableText
                                                            multiline
                                                            value={b}
                                                            isEditing={isEditing}
                                                            onSave={(v) => {
                                                                const newExp = [...vibe_data.experience];
                                                                newExp[i].bullets[bi] = v;
                                                                updateNestedData('vibe_data.experience', newExp);
                                                            }}
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

                    {/* Right: Expertise & Stats */}
                    <div className="lg:col-span-4 space-y-20">
                        {/* Elite Status Card */}
                        <div className="p-10 bg-gradient-to-br from-[#c6a052]/5 to-transparent border border-[#c6a052]/10 rounded-2xl relative overflow-hidden group">
                            <Award className="absolute -right-8 -bottom-8 w-32 h-32 text-[#c6a052]/5 group-hover:scale-110 group-hover:rotate-12 transition-transform duration-700" />
                            <h3 className="text-[10px] uppercase tracking-[0.2em] font-black text-[#c6a052] mb-6 flex items-center gap-2">
                                <ShieldCheck className="w-4 h-4" /> Professional Verdict
                            </h3>
                            <EditableText
                                multiline
                                as="p"
                                value={vibe_data.ai_verdict}
                                isEditing={isEditing}
                                onSave={(v) => updateNestedData('vibe_data.ai_verdict', v)}
                                className="text-sm italic leading-relaxed text-zinc-400 relative z-10"
                            />
                        </div>

                        {/* Proficiencies */}
                        <section>
                            <h3 className="text-[10px] uppercase font-black tracking-[0.3em] text-zinc-500 mb-8 pb-4 border-b border-zinc-900">
                                Strategic Focus
                            </h3>
                            <div className="space-y-10">
                                {vibe_data.skills.map((skill: any, i: number) => (
                                    <div key={i}>
                                        <h4 className="text-[10px] font-black text-zinc-600 uppercase tracking-widest mb-4 italic">{skill.category}</h4>
                                        <div className="flex flex-wrap gap-3">
                                            {skill.tags.map((tag: string, ti: number) => (
                                                <span key={ti} className="text-[10px] font-bold px-4 py-2 bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-[#c6a052] hover:border-[#c6a052]/30 transition-all rounded-full">
                                                    {tag}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>

                        {/* Education Trace */}
                        <section>
                            <h3 className="text-[10px] uppercase font-black tracking-[0.3em] text-zinc-500 mb-8 pb-4 border-b border-zinc-900">
                                Academic Pedigree
                            </h3>
                            <div className="space-y-8">
                                {vibe_data.education.map((edu: any, i: number) => (
                                    <div key={i}>
                                        <div className="text-[10px] font-black text-[#c6a052]/50 mb-1">{edu.year}</div>
                                        <EditableText
                                            as="h4"
                                            value={edu.degree}
                                            isEditing={isEditing}
                                            onSave={(v) => {
                                                const newEdu = [...vibe_data.education];
                                                newEdu[i].degree = v;
                                                updateNestedData('vibe_data.education', newEdu);
                                            }}
                                            className="text-lg font-bold text-white mb-1"
                                        />
                                        <div className="text-xs font-medium text-zinc-500 uppercase tracking-widest">{edu.school}</div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    </div>
                </div>

                {vibeNotes.length > 0 && (
                    <section className="mt-40">
                        <h2 className="flex items-center gap-4 text-[10px] uppercase tracking-[0.4em] font-black text-zinc-500 mb-16 justify-center text-center">
                            <span className="w-20 h-px bg-[#c6a052]/30" /> Social Proof & Endorsements <span className="w-20 h-px bg-[#c6a052]/30" />
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                            {vibeNotes.map((note: any, i: number) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    whileInView={{ opacity: 1, scale: 1 }}
                                    viewport={{ once: true }}
                                    className="p-10 border border-[#c6a052]/10 bg-gradient-to-br from-[#c6a052]/5 to-transparent rounded-2xl relative group"
                                >
                                    <Sparkles className="absolute top-6 right-6 w-4 h-4 text-[#c6a052]/40" />
                                    <div className="text-[10px] font-black uppercase tracking-[0.2em] text-[#c6a052] mb-6">
                                        Endorsed by {note.author_role}
                                    </div>
                                    <p className="text-zinc-300 font-light leading-relaxed mb-8 italic">
                                        "{note.content}"
                                    </p>
                                    <div className="flex items-center gap-4 pt-6 border-t border-zinc-800">
                                        <div className="w-10 h-10 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-[10px] font-black text-[#c6a052]">
                                            {note.author_name.charAt(0)}
                                        </div>
                                        <div>
                                            <div className="text-sm font-bold text-white">{note.author_name}</div>
                                            <div className="text-[10px] uppercase tracking-widest text-zinc-500">{note.vibe_type} Vibe</div>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </section>
                )}

                <footer className="mt-40 pt-16 border-t border-zinc-900 flex flex-col md:flex-row justify-between items-center gap-10">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 border border-[#c6a052]/20 rounded-full flex items-center justify-center">
                            <Crown className="w-4 h-4 text-[#c6a052]" />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-zinc-600 italic">
                            SkillVibe Prestige Module // 2026 // {full_name}
                        </span>
                    </div>
                    <div className="flex gap-10 opacity-30 text-[8px] uppercase tracking-widest">
                        <span>Elite Network</span>
                        <span>Verified Profile</span>
                    </div>
                </footer>
            </main>
        </div>
    )
}
