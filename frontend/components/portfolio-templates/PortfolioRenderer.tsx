import { motion } from 'framer-motion';
import EditableText from './EditableText';
import GlassPrismTemplate from './GlassPrismTemplate';
import TerminalVoidTemplate from './TerminalVoidTemplate';
import MinimalNoirTemplate from './MinimalNoirTemplate';
import VintagePaperTemplate from './VintagePaperTemplate';
import ExecutiveGoldTemplate from './ExecutiveGoldTemplate';
import ObsidianEliteTemplate from './ObsidianEliteTemplate';

export default function PortfolioRenderer({ data, isEditing, onSave, vibeNotes = [] }: any) {
    if (!data || !data.vibe_data) return (
        <div className="min-h-screen bg-black flex items-center justify-center">
            <div className="text-white text-center">
                <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <p className="font-mono text-xs tracking-widest uppercase opacity-50">Loading Profile...</p>
            </div>
        </div>
    );

    const { template_id } = data;

    // Route to appropriate template component
    if (template_id === 'obsidian-elite' || template_id === 'default' || template_id === 'creative-specialist' || template_id === 'ai-visionary') {
        return <ObsidianEliteTemplate data={data} isEditing={isEditing} onSave={onSave} vibeNotes={vibeNotes} />;
    }

    if (template_id === 'glass-prism') {
        return <GlassPrismTemplate data={data} isEditing={isEditing} onSave={onSave} vibeNotes={vibeNotes} />;
    }

    if (template_id === 'terminal-void' || template_id === 'cyber-punk' || template_id === 'serial-entrepreneur' || template_id === 'futurist-ops') {
        return <TerminalVoidTemplate data={data} isEditing={isEditing} onSave={onSave} vibeNotes={vibeNotes} />;
    }

    if (template_id === 'minimal-noir' || template_id === 'venture-capital') {
        return <MinimalNoirTemplate data={data} isEditing={isEditing} onSave={onSave} vibeNotes={vibeNotes} />;
    }

    if (template_id === 'vintage-classic' || template_id === 'vintage-paper') {
        return <VintagePaperTemplate data={data} isEditing={isEditing} onSave={onSave} vibeNotes={vibeNotes} />;
    }

    if (template_id === 'midnight-gold' || template_id === 'executive-gold' || template_id === 'lead-strategist') {
        return <ExecutiveGoldTemplate data={data} isEditing={isEditing} onSave={onSave} vibeNotes={vibeNotes} />;
    }

    // Fallback to legacy renderer for any other template_id
    const { vibe_data } = data;
    const updateVibeField = (path: string, value: any) => {
        const newData = JSON.parse(JSON.stringify(data));
        newData.vibe_data[path] = value;
        onSave(newData);
    };

    let themeClasses = "bg-black text-white";
    let accentColor = "text-cyan-400";
    let gradientBg = "from-cyan-500/10 via-black to-black";
    let glassmorphism = "bg-white/5 border border-white/10 backdrop-blur-md";

    return (
        <div className={`min-h-screen ${themeClasses} selection:bg-cyan-500/30 font-sans tracking-wide overflow-hidden`}>
            {/* Background Effects */}
            <div className={`fixed inset-0 z-0 bg-gradient-to-br ${gradientBg} opacity-50 pointer-events-none`} />
            <div className="fixed inset-0 z-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-white/5 via-transparent to-transparent pointer-events-none" />

            <div className="relative z-10 max-w-5xl mx-auto px-6 py-20 lg:py-32">
                <motion.header
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="mb-24 flex flex-col md:flex-row gap-8 justify-between items-start"
                >
                    <div className="flex-1">
                        <div className="flex items-center gap-4 mb-6">
                            <span className="px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] bg-white/10 rounded-full border border-white/10 backdrop-blur-md">
                                {data.elite_tag || 'Elite Profile'}
                            </span>
                        </div>
                        <EditableText
                            value={data.full_name || 'Your Name'}
                            isEditing={isEditing}
                            onSave={(val) => onSave({ ...data, full_name: val })}
                            as="h1"
                            className="text-5xl md:text-7xl font-black mb-4 tracking-tighter"
                        />
                        <EditableText
                            value={vibe_data.elite_tag || 'Visionary Technologist'}
                            isEditing={isEditing}
                            onSave={(val) => updateVibeField('elite_tag', val)}
                            as="h2"
                            className={`text-2xl md:text-3xl ${accentColor} font-bold tracking-widest uppercase opacity-90`}
                        />
                    </div>
                </motion.header>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                    <div className="lg:col-span-8 space-y-20">
                        <motion.section initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}>
                            <EditableText
                                value={vibe_data.bio_summary || 'A visionary professional driving innovation.'}
                                isEditing={isEditing}
                                onSave={(val) => updateVibeField('bio_summary', val)}
                                as="p"
                                multiline={true}
                                className="text-xl md:text-2xl text-zinc-300 leading-relaxed font-light"
                            />
                        </motion.section>
                    </div>
                </div>
            </div>
        </div>
    );
}

