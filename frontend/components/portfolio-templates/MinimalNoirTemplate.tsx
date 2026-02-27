import { motion } from 'framer-motion'
import { Github, Linkedin, ArrowRight, Save, Command, ShieldCheck } from 'lucide-react'
import EditableText from './EditableText'
import { useState, useEffect } from 'react'

export default function MinimalNoirTemplate({
    data,
    isEditing = false,
    onSave
}: {
    data: any,
    isEditing?: boolean,
    onSave?: (updatedData: any) => void
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
        <div className="min-h-screen bg-white text-zinc-900 font-sans selection:bg-black selection:text-white pb-20">
            {/* Editing Controls */}
            {isEditing && (
                <div className="fixed top-8 right-8 z-[100]">
                    <button
                        onClick={() => onSave?.(localData)}
                        className="group flex items-center gap-2 px-6 py-3 bg-black text-white rounded-full hover:bg-zinc-800 transition-all duration-300 shadow-xl active:scale-95"
                    >
                        <Save className="w-4 h-4" />
                        <span className="text-[10px] uppercase tracking-[0.2em] font-black">Archive Identity</span>
                    </button>
                </div>
            )}

            <main className="max-w-screen-xl mx-auto px-6 md:px-12 lg:px-20 pt-20 md:pt-40">
                {/* Hero Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 mb-40">
                    <div className="lg:col-span-8">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="space-y-8"
                        >
                            <div className="flex items-center gap-4">
                                <span className="h-px w-12 bg-zinc-200" />
                                <EditableText
                                    as="span"
                                    value={vibe_data.elite_tag}
                                    isEditing={isEditing}
                                    onSave={(v) => updateNestedData('vibe_data.elite_tag', v)}
                                    className="text-[10px] uppercase tracking-[0.4em] font-black text-zinc-400"
                                />
                            </div>
                            <EditableText
                                as="h1"
                                value={full_name}
                                isEditing={isEditing}
                                onSave={(v) => setLocalData({ ...localData, full_name: v })}
                                className="text-7xl md:text-9xl font-bold tracking-tight text-black leading-[0.85]"
                            />
                            <div className="max-w-xl">
                                <EditableText
                                    as="p"
                                    value={localData.headline}
                                    isEditing={isEditing}
                                    onSave={(v) => setLocalData({ ...localData, headline: v })}
                                    className="text-2xl md:text-3xl text-zinc-500 font-medium leading-tight"
                                />
                            </div>
                        </motion.div>
                    </div>
                    <div className="lg:col-span-4 flex flex-col justify-end">
                        <div className="flex flex-col gap-10">
                            <div className="p-10 border border-zinc-100 rounded-2xl bg-zinc-50/50">
                                <div className="text-[10px] uppercase tracking-widest text-zinc-400 mb-6 flex items-center gap-2">
                                    <ShieldCheck className="w-4 h-4" /> Verification Status
                                </div>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-6xl font-black">{elite_rating}%</span>
                                    <span className="text-xs font-bold text-zinc-400">Match</span>
                                </div>
                                <p className="mt-4 text-[11px] text-zinc-400 leading-relaxed font-medium">Verified professional data assessed via SkillVibe Assessment.</p>
                            </div>
                            <div className="flex gap-4">
                                {social_links.linkedin && (
                                    <a href={social_links.linkedin} target="_blank" className="w-14 h-14 border border-zinc-200 rounded-full flex items-center justify-center hover:bg-black hover:text-white transition-all">
                                        <Linkedin className="w-5 h-5" />
                                    </a>
                                )}
                                {social_links.github && (
                                    <a href={social_links.github} target="_blank" className="w-14 h-14 border border-zinc-200 rounded-full flex items-center justify-center hover:bg-black hover:text-white transition-all">
                                        <Github className="w-5 h-5" />
                                    </a>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-24">
                    {/* Primary Content */}
                    <div className="lg:col-span-7 space-y-32">
                        {/* Summary */}
                        <section>
                            <EditableText
                                multiline
                                as="h2"
                                value={vibe_data.bio_summary}
                                isEditing={isEditing}
                                onSave={(v) => updateNestedData('vibe_data.bio_summary', v)}
                                className="text-3xl md:text-5xl font-medium leading-[1.1] tracking-tight text-black"
                            />
                        </section>

                        {/* Experience */}
                        <section className="space-y-16">
                            <h3 className="text-[10px] uppercase tracking-[0.4em] font-black text-zinc-300">Selected Works</h3>
                            <div className="space-y-24">
                                {vibe_data.experience.map((exp: any, i: number) => (
                                    <div key={i} className="group flex flex-col md:flex-row gap-8 md:gap-16">
                                        <div className="w-32 pt-2">
                                            <EditableText
                                                as="span"
                                                value={exp.duration}
                                                isEditing={isEditing}
                                                onSave={(v) => {
                                                    const newExp = [...vibe_data.experience];
                                                    newExp[i].duration = v;
                                                    updateNestedData('vibe_data.experience', newExp);
                                                }}
                                                className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest"
                                            />
                                        </div>
                                        <div className="flex-1 space-y-6">
                                            <div>
                                                <EditableText
                                                    as="h4"
                                                    value={exp.role}
                                                    isEditing={isEditing}
                                                    onSave={(v) => {
                                                        const newExp = [...vibe_data.experience];
                                                        newExp[i].role = v;
                                                        updateNestedData('vibe_data.experience', newExp);
                                                    }}
                                                    className="text-4xl font-bold text-black mb-2"
                                                />
                                                <div className="flex items-center gap-3">
                                                    <EditableText
                                                        as="span"
                                                        value={exp.company}
                                                        isEditing={isEditing}
                                                        onSave={(v) => {
                                                            const newExp = [...vibe_data.experience];
                                                            newExp[i].company = v;
                                                            updateNestedData('vibe_data.experience', newExp);
                                                        }}
                                                        className="text-lg font-medium text-zinc-500"
                                                    />
                                                </div>
                                            </div>
                                            <ul className="space-y-4">
                                                {exp.bullets.map((b: string, bi: number) => (
                                                    <li key={bi} className="text-zinc-600 leading-relaxed max-w-lg flex gap-4">
                                                        <ArrowRight className="w-4 h-4 mt-1.5 flex-shrink-0 text-zinc-300" />
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

                    {/* Meta Content */}
                    <div className="lg:col-span-5 space-y-20 pt-4">
                        {/* Expertise */}
                        <section className="p-12 bg-zinc-900 text-white rounded-[2.5rem]">
                            <h3 className="text-[10px] uppercase tracking-[0.3em] font-black opacity-40 mb-10">Expertise Fields</h3>
                            <div className="space-y-12">
                                {vibe_data.skills.map((skill: any, i: number) => (
                                    <div key={i}>
                                        <h4 className="text-xs font-bold text-zinc-400 mb-6 uppercase tracking-widest border-l-2 border-white/20 pl-4">{skill.category}</h4>
                                        <div className="flex flex-wrap gap-x-6 gap-y-4">
                                            {skill.tags.map((tag: string, ti: number) => (
                                                <span key={ti} className="text-sm font-medium hover:text-white/60 cursor-default transition-colors">
                                                    {tag}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>

                        {/* AI Analysis */}
                        <section className="p-10 border border-zinc-100 rounded-[2.5rem]">
                            <h3 className="text-[10px] uppercase tracking-[0.3em] font-black text-zinc-400 mb-6">Autonomous Verdict</h3>
                            <EditableText
                                multiline
                                as="p"
                                value={vibe_data.ai_verdict}
                                isEditing={isEditing}
                                onSave={(v) => updateNestedData('vibe_data.ai_verdict', v)}
                                className="text-base text-zinc-600 font-medium leading-relaxed italic"
                            />
                        </section>

                        {/* Academic Summary */}
                        <section className="px-10">
                            <h3 className="text-[10px] uppercase tracking-[0.3em] font-black text-zinc-400 mb-8">Academic Trajectory</h3>
                            <div className="space-y-8">
                                {vibe_data.education.map((edu: any, i: number) => (
                                    <div key={i} className="group">
                                        <div className="text-[10px] font-black mb-2 text-zinc-300">{edu.year}</div>
                                        <EditableText
                                            as="h4"
                                            value={edu.degree}
                                            isEditing={isEditing}
                                            onSave={(v) => {
                                                const newEdu = [...vibe_data.education];
                                                newEdu[i].degree = v;
                                                updateNestedData('vibe_data.education', newEdu);
                                            }}
                                            className="text-lg font-bold text-black mb-1"
                                        />
                                        <div className="text-xs font-medium text-zinc-400 uppercase tracking-widest">{edu.school}</div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    </div>
                </div>

                <footer className="mt-60 pt-10 border-t border-zinc-100 flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="text-[10px] font-black text-zinc-300 uppercase tracking-[0.3em]">
                        {full_name} // 2026 // Noir Module v1
                    </div>
                    <div className="flex gap-4 items-center">
                        <Command className="w-4 h-4 text-zinc-200" />
                        <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">SkillVibe</span>
                    </div>
                </footer>
            </main>
        </div>
    )
}
