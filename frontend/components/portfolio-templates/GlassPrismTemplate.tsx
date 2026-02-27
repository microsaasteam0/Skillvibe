import { motion } from 'framer-motion'
import { Sparkles, Github, Linkedin, Globe, Wind, Save } from 'lucide-react'
import EditableText from './EditableText'
import { useState, useEffect } from 'react'

export default function GlassPrismTemplate({
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
        <div className="min-h-screen bg-[#fafafa] text-[#1a1a1a] font-sans selection:bg-indigo-500 selection:text-white relative overflow-hidden">
            {/* Background Orbs */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-200/40 rounded-full blur-[120px] animate-pulse" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-pink-200/40 rounded-full blur-[120px] animation-delay-2000" />
            </div>

            {/* Editing Controls */}
            {isEditing && (
                <div className="fixed top-8 right-8 z-[100]">
                    <button
                        onClick={() => onSave?.(localData)}
                        className="group flex items-center gap-2 px-8 py-3 bg-indigo-600 text-white rounded-2xl hover:bg-indigo-500 transition-all duration-300 shadow-xl shadow-indigo-200 active:scale-95"
                    >
                        <Save className="w-5 h-5" />
                        <span className="text-[10px] uppercase tracking-[0.3em] font-black">Persist Interface</span>
                    </button>
                </div>
            )}

            <main className="max-w-6xl mx-auto px-6 py-20 relative z-10">
                {/* Floating Header Card */}
                <header className="mb-24 bg-white/40 backdrop-blur-2xl border border-white/60 p-12 md:p-20 rounded-[4rem] shadow-2xl shadow-indigo-100/50">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="flex flex-col md:flex-row justify-between items-start md:items-center gap-12"
                    >
                        <div className="max-w-2xl">
                            <EditableText
                                as="span"
                                value={vibe_data.elite_tag}
                                isEditing={isEditing}
                                onSave={(v) => updateNestedData('vibe_data.elite_tag', v)}
                                className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.3em] text-indigo-500 font-bold mb-6"
                            />
                            <EditableText
                                as="h1"
                                value={full_name}
                                isEditing={isEditing}
                                onSave={(v) => setLocalData({ ...localData, full_name: v })}
                                className="text-6xl md:text-8xl font-black tracking-tight mb-8 text-transparent bg-clip-text bg-gradient-to-br from-indigo-900 via-indigo-700 to-indigo-500"
                            />
                            <EditableText
                                as="p"
                                value={localData.headline}
                                isEditing={isEditing}
                                onSave={(v) => setLocalData({ ...localData, headline: v })}
                                className="text-xl text-zinc-600 font-medium leading-relaxed"
                            />
                        </div>
                        <div className="relative group">
                            <div className="absolute inset-0 bg-gradient-to-br from-indigo-400 to-purple-400 rounded-full blur-2xl opacity-20 group-hover:opacity-40 transition-opacity" />
                            <div className="w-32 h-32 rounded-full border-4 border-white bg-white/80 backdrop-blur-xl flex flex-col items-center justify-center relative">
                                <span className="text-3xl font-black text-indigo-600">{elite_rating}%</span>
                                <span className="text-[8px] uppercase tracking-tighter text-zinc-400 font-bold">Prowess</span>
                            </div>
                        </div>
                    </motion.div>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                    {/* Bio, Experience & Projects */}
                    <div className="lg:col-span-8 space-y-12">
                        <section className="bg-white/40 backdrop-blur-xl border border-white/60 p-10 rounded-[3rem]">
                            <h2 className="text-xs uppercase tracking-[0.3em] font-black text-zinc-400 mb-8 flex items-center gap-4">
                                <Wind className="w-4 h-4 text-indigo-400" /> Professional Philosophy
                            </h2>
                            <EditableText
                                multiline
                                as="div"
                                value={vibe_data.bio_summary}
                                isEditing={isEditing}
                                onSave={(v) => updateNestedData('vibe_data.bio_summary', v)}
                                className="text-2xl font-semibold leading-snug text-zinc-800"
                            />
                            <div className="mt-8 pt-8 border-t border-zinc-100">
                                <EditableText
                                    multiline
                                    as="p"
                                    value={vibe_data.ai_verdict}
                                    isEditing={isEditing}
                                    onSave={(v) => updateNestedData('vibe_data.ai_verdict', v)}
                                    className="text-sm text-zinc-500 italic leading-relaxed"
                                />
                            </div>
                        </section>

                        <section className="bg-white/40 backdrop-blur-xl border border-white/60 p-10 rounded-[3rem]">
                            <h2 className="text-xs uppercase tracking-[0.3em] font-black text-zinc-400 mb-12">Career Trajectory</h2>
                            <div className="space-y-16">
                                {vibe_data.experience.map((exp: any, i: number) => (
                                    <motion.div
                                        key={i}
                                        initial={{ opacity: 0, x: -10 }}
                                        whileInView={{ opacity: 1, x: 0 }}
                                        viewport={{ once: true }}
                                        className="relative pl-12"
                                    >
                                        <div className="absolute left-0 top-1 w-6 h-6 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center">
                                            <div className="w-2 h-2 rounded-full bg-indigo-500" />
                                        </div>
                                        <EditableText
                                            as="div"
                                            value={exp.duration}
                                            isEditing={isEditing}
                                            onSave={(v) => {
                                                const newExp = [...vibe_data.experience];
                                                newExp[i].duration = v;
                                                updateNestedData('vibe_data.experience', newExp);
                                            }}
                                            className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-2"
                                        />
                                        <EditableText
                                            as="h3"
                                            value={exp.role}
                                            isEditing={isEditing}
                                            onSave={(v) => {
                                                const newExp = [...vibe_data.experience];
                                                newExp[i].role = v;
                                                updateNestedData('vibe_data.experience', newExp);
                                            }}
                                            className="text-2xl font-bold text-zinc-900 mb-1"
                                        />
                                        <EditableText
                                            as="div"
                                            value={exp.company}
                                            isEditing={isEditing}
                                            onSave={(v) => {
                                                const newExp = [...vibe_data.experience];
                                                newExp[i].company = v;
                                                updateNestedData('vibe_data.experience', newExp);
                                            }}
                                            className="text-sm font-medium text-zinc-500 mb-6"
                                        />
                                        <ul className="space-y-4">
                                            {exp.bullets.map((b: string, bi: number) => (
                                                <li key={bi} className="text-zinc-600 leading-relaxed text-sm flex gap-4">
                                                    <span className="text-indigo-300">✦</span>
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
                                    </motion.div>
                                ))}
                            </div>
                        </section>

                        {vibe_data.projects && vibe_data.projects.length > 0 && (
                            <section className="bg-white/40 backdrop-blur-xl border border-white/60 p-10 rounded-[3rem]">
                                <h2 className="text-xs uppercase tracking-[0.3em] font-black text-zinc-400 mb-12">High-Stakes Projects</h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    {vibe_data.projects.map((proj: any, i: number) => (
                                        <div key={i} className="group p-8 rounded-[2rem] bg-indigo-50/50 border border-indigo-100/50 hover:bg-white hover:shadow-xl transition-all">
                                            <EditableText
                                                as="h3"
                                                value={proj.title}
                                                isEditing={isEditing}
                                                onSave={(v) => {
                                                    const newProj = [...vibe_data.projects];
                                                    newProj[i].title = v;
                                                    updateNestedData('vibe_data.projects', newProj);
                                                }}
                                                className="text-lg font-bold text-zinc-900 mb-4"
                                            />
                                            <EditableText
                                                multiline
                                                as="p"
                                                value={proj.description}
                                                isEditing={isEditing}
                                                onSave={(v) => {
                                                    const newProj = [...vibe_data.projects];
                                                    newProj[i].description = v;
                                                    updateNestedData('vibe_data.projects', newProj);
                                                }}
                                                className="text-sm text-zinc-600 mb-6 leading-relaxed"
                                            />
                                            <div className="flex flex-wrap gap-2">
                                                {proj.tech_stack?.map((tech: string, ti: number) => (
                                                    <span key={ti} className="text-[10px] font-bold text-indigo-500 bg-white px-3 py-1 rounded-full border border-indigo-100">
                                                        {tech}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}
                    </div>

                    {/* Left Column: Skills, Certs, Education */}
                    <div className="lg:col-span-4 space-y-12">
                        <section className="bg-indigo-600 text-white p-10 rounded-[3rem] shadow-xl shadow-indigo-200">
                            <h2 className="text-[10px] uppercase tracking-[0.3em] font-black opacity-60 mb-8">Technical Stack</h2>
                            <div className="space-y-10">
                                {vibe_data.skills.map((skill: any, i: number) => (
                                    <div key={i}>
                                        <h4 className="text-sm font-bold mb-4 flex justify-between items-center">
                                            {skill.category}
                                            <span className="w-1 h-1 rounded-full bg-white opacity-40" />
                                        </h4>
                                        <div className="flex flex-wrap gap-2">
                                            {skill.tags.map((tag: string, ti: number) => (
                                                <span key={ti} className="text-[10px] font-bold bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/20 whitespace-nowrap">
                                                    {tag}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>

                        {vibe_data.certifications && vibe_data.certifications.length > 0 && (
                            <section className="bg-white/40 backdrop-blur-xl border border-white/60 p-8 rounded-[2.5rem]">
                                <h2 className="text-[10px] uppercase tracking-[0.3em] font-black text-zinc-400 mb-8">Certifications</h2>
                                <div className="space-y-6">
                                    {vibe_data.certifications.map((cert: any, i: number) => (
                                        <div key={i} className="flex gap-4">
                                            <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-1.5 ring-4 ring-indigo-50" />
                                            <div className="flex-grow">
                                                <EditableText
                                                    as="div"
                                                    value={cert.name}
                                                    isEditing={isEditing}
                                                    onSave={(v) => {
                                                        const newCerts = [...vibe_data.certifications];
                                                        newCerts[i].name = v;
                                                        updateNestedData('vibe_data.certifications', newCerts);
                                                    }}
                                                    className="text-sm font-bold text-zinc-800 leading-tight mb-1"
                                                />
                                                <div className="text-[10px] font-medium text-zinc-500">{cert.issuer} // {cert.date}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}

                        <section className="bg-white/40 backdrop-blur-xl border border-white/60 p-8 rounded-[2.5rem]">
                            <h2 className="text-[10px] uppercase tracking-[0.3em] font-black text-zinc-400 mb-8">Academic Blueprint</h2>
                            <div className="space-y-8">
                                {vibe_data.education.map((edu: any, i: number) => (
                                    <div key={i}>
                                        <div className="text-xs font-bold text-indigo-500 mb-1">{edu.year}</div>
                                        <EditableText
                                            as="div"
                                            value={edu.degree}
                                            isEditing={isEditing}
                                            onSave={(v) => {
                                                const newEdu = [...vibe_data.education];
                                                newEdu[i].degree = v;
                                                updateNestedData('vibe_data.education', newEdu);
                                            }}
                                            className="text-sm font-black text-zinc-800 mb-1"
                                        />
                                        <div className="text-xs text-zinc-500 font-medium">{edu.school}</div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    </div>
                </div>

                {/* Footer */}
                <footer className="mt-24 bg-white/40 backdrop-blur-2xl border border-white/60 p-12 rounded-[3rem] flex flex-col md:flex-row justify-between items-center gap-8">
                    <div className="text-sm font-bold text-zinc-400">
                        {full_name} // 2026
                    </div>
                    <div className="flex gap-4">
                        {social_links.linkedin && (
                            <a href={social_links.linkedin} target="_blank" className="w-12 h-12 flex items-center justify-center rounded-2xl bg-white border border-zinc-100 hover:border-indigo-200 hover:shadow-lg transition-all">
                                <Linkedin className="w-5 h-5 text-indigo-600" />
                            </a>
                        )}
                        {social_links.github && (
                            <a href={social_links.github} target="_blank" className="w-12 h-12 flex items-center justify-center rounded-2xl bg-white border border-zinc-100 hover:border-indigo-200 hover:shadow-lg transition-all">
                                <Github className="w-5 h-5 text-zinc-900" />
                            </a>
                        )}
                        {social_links.portfolio && (
                            <a href={social_links.portfolio} target="_blank" className="w-12 h-12 flex items-center justify-center rounded-2xl bg-white border border-zinc-100 hover:border-indigo-200 hover:shadow-lg transition-all">
                                <Globe className="w-5 h-5 text-zinc-600" />
                            </a>
                        )}
                    </div>
                </footer>
            </main>
        </div>
    )
}
