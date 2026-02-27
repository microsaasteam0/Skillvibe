import { motion } from 'framer-motion'
import { BookOpen, Github, Linkedin, Bookmark, Save, ScrollText } from 'lucide-react'
import EditableText from './EditableText'
import { useState, useEffect } from 'react'

export default function VintagePaperTemplate({
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
        <div className="min-h-screen bg-[#f4f1ea] text-[#2c241e] font-serif selection:bg-[#967b5e] selection:text-white pb-32">
            {/* Paper Texture Overlay */}
            <div className="fixed inset-0 pointer-events-none opacity-20 mix-blend-multiply bg-[url('https://www.transparenttextures.com/patterns/old-mathematics.png')]" />

            {/* Editing Controls */}
            {isEditing && (
                <div className="fixed top-8 right-8 z-[100]">
                    <button
                        onClick={() => onSave?.(localData)}
                        className="group flex items-center gap-2 px-6 py-3 bg-[#5c4a38] text-[#f4f1ea] rounded-none hover:bg-[#4a3b2d] transition-all duration-300 shadow-xl active:scale-95 border border-[#2c241e]/20"
                    >
                        <Save className="w-4 h-4" />
                        <span className="text-[10px] uppercase tracking-[0.2em] font-bold">Seal Archive</span>
                    </button>
                </div>
            )}

            <main className="max-w-4xl mx-auto px-6 pt-24 md:pt-40 relative">
                {/* Vintage Header */}
                <header className="mb-24 text-center border-b-2 border-double border-[#2c241e]/20 pb-16">
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="inline-block relative mb-8"
                    >
                        <div className="absolute -top-12 left-1/2 -translate-x-1/2">
                            <ScrollText className="w-8 h-8 opacity-20" />
                        </div>
                        <EditableText
                            as="span"
                            value={vibe_data.elite_tag}
                            isEditing={isEditing}
                            onSave={(v) => updateNestedData('vibe_data.elite_tag', v)}
                            className="text-[11px] uppercase tracking-[0.5em] font-bold text-[#967b5e]"
                        />
                    </motion.div>

                    <EditableText
                        as="h1"
                        value={full_name}
                        isEditing={isEditing}
                        onSave={(v) => setLocalData({ ...localData, full_name: v })}
                        className="text-6xl md:text-8xl font-normal leading-none mb-10 italic"
                    />

                    <div className="flex justify-center items-center gap-12 text-[#967b5e]">
                        <div className="flex flex-col">
                            <span className="text-[10px] uppercase tracking-widest font-bold">ID</span>
                            <span className="text-xl font-serif">#{localData.id?.slice(0, 8) || 'SV-2026'}</span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[10px] uppercase tracking-widest font-bold">SCORE</span>
                            <span className="text-xl font-serif">{elite_rating}/100</span>
                        </div>
                    </div>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-20">
                    {/* Main Narrative */}
                    <div className="md:col-span-8 space-y-24">
                        <section className="relative">
                            <div className="absolute -left-16 top-0 hidden lg:block opacity-10">
                                <BookOpen className="w-12 h-12" />
                            </div>
                            <h2 className="text-[10px] uppercase font-bold tracking-[0.3em] mb-8 border-b border-[#2c241e]/10 pb-4">I. Professional Narrative</h2>
                            <EditableText
                                multiline
                                as="p"
                                value={vibe_data.bio_summary}
                                isEditing={isEditing}
                                onSave={(v) => updateNestedData('vibe_data.bio_summary', v)}
                                className="text-xl md:text-2xl leading-[1.6] text-[#4a3b2d] first-letter:text-6xl first-letter:float-left first-letter:mr-3 first-letter:font-bold first-letter:mt-2"
                            />
                        </section>

                        <section>
                            <h2 className="text-[10px] uppercase font-bold tracking-[0.3em] mb-12 border-b border-[#2c241e]/10 pb-4">II. Historical Record</h2>
                            <div className="space-y-16">
                                {vibe_data.experience.map((exp: any, i: number) => (
                                    <div key={i} className="relative pl-8 border-l border-[#2c241e]/10 group">
                                        <div className="absolute -left-[5px] top-1.5 w-2 h-2 rounded-full bg-[#967b5e]" />
                                        <div className="mb-4">
                                            <EditableText
                                                as="span"
                                                value={exp.duration}
                                                isEditing={isEditing}
                                                onSave={(v) => {
                                                    const newExp = [...vibe_data.experience];
                                                    newExp[i].duration = v;
                                                    updateNestedData('vibe_data.experience', newExp);
                                                }}
                                                className="text-[10px] font-bold text-[#967b5e] tracking-widest"
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
                                                className="text-2xl font-bold italic"
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
                                                className="text-sm font-bold uppercase tracking-widest opacity-60"
                                            />
                                        </div>
                                        <ul className="space-y-4">
                                            {exp.bullets.map((b: string, bi: number) => (
                                                <li key={bi} className="text-sm leading-relaxed text-[#4a3b2d]/80 italic border-l border-transparent hover:border-[#967b5e]/30 pl-4 transition-colors">
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
                                ))}
                            </div>
                        </section>
                    </div>

                    {/* Sidebar / Footnotes */}
                    <div className="md:col-span-4 space-y-16">
                        <section className="bg-white/30 p-8 border border-[#2c241e]/5 relative">
                            <div className="absolute top-0 left-0 w-full h-1 bg-[#967b5e]" />
                            <h3 className="text-[10px] uppercase font-bold tracking-[0.2em] mb-6 flex items-center gap-2">
                                <Bookmark className="w-3 h-3" /> Synthesis Verdict
                            </h3>
                            <EditableText
                                multiline
                                as="p"
                                value={vibe_data.ai_verdict}
                                isEditing={isEditing}
                                onSave={(v) => updateNestedData('vibe_data.ai_verdict', v)}
                                className="text-sm italic leading-relaxed text-[#4a3b2d]"
                            />
                        </section>

                        <section>
                            <h3 className="text-[10px] uppercase font-bold tracking-[0.3em] mb-8">Technical Proficiencies</h3>
                            <div className="space-y-8">
                                {vibe_data.skills.map((skill: any, i: number) => (
                                    <div key={i}>
                                        <h4 className="text-[11px] font-bold mb-4 uppercase tracking-tighter opacity-70 italic">{skill.category}</h4>
                                        <div className="flex flex-wrap gap-x-4 gap-y-2">
                                            {skill.tags.map((tag: string, ti: number) => (
                                                <span key={ti} className="text-xs font-serif border-b border-[#2c241e]/10 pb-0.5">
                                                    {tag}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>

                        <section>
                            <h3 className="text-[10px] uppercase font-bold tracking-[0.3em] mb-8">Academic Trace</h3>
                            <div className="space-y-6">
                                {vibe_data.education.map((edu: any, i: number) => (
                                    <div key={i} className="text-sm">
                                        <div className="text-[10px] italic opacity-50 mb-1">{edu.year}</div>
                                        <EditableText
                                            as="h4"
                                            value={edu.degree}
                                            isEditing={isEditing}
                                            onSave={(v) => {
                                                const newEdu = [...vibe_data.education];
                                                newEdu[i].degree = v;
                                                updateNestedData('vibe_data.education', newEdu);
                                            }}
                                            className="font-bold mb-1"
                                        />
                                        <div className="italic opacity-70">{edu.school}</div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    </div>
                </div>

                <footer className="mt-32 pt-16 border-t-2 border-double border-[#2c241e]/20 flex flex-col md:flex-row justify-between items-center gap-10">
                    <div className="text-[10px] uppercase font-bold tracking-widest opacity-40 italic">
                        The Collected Works of {full_name} // SV-Archive.bin
                    </div>
                    <div className="flex gap-8">
                        {social_links.linkedin && (
                            <a href={social_links.linkedin} target="_blank" className="opacity-40 hover:opacity-100 transition-opacity">
                                <Linkedin className="w-5 h-5" />
                            </a>
                        )}
                        {social_links.github && (
                            <a href={social_links.github} target="_blank" className="opacity-40 hover:opacity-100 transition-opacity">
                                <Github className="w-5 h-5" />
                            </a>
                        )}
                    </div>
                </footer>
            </main>
        </div>
    )
}
