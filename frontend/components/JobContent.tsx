import { motion } from 'framer-motion';

interface JobContentProps {
    content: string;
    isExpanded?: boolean;
}

export default function JobContent({ content, isExpanded }: JobContentProps) {
    if (!content) return null;

    const renderTextWithLinks = (text: string) => {
        if (!text) return null;
        const urlRegex = /(https?:\/\/[^\s]+)/g;
        return text.split(urlRegex).map((part, index) => {
            if (part.match(urlRegex)) {
                return (
                    <a
                        key={index}
                        href={part}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-cyan-400 hover:text-cyan-300 underline underline-offset-2 break-all"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {part}
                    </a>
                );
            }
            return part;
        });
    };

    // Split content while keeping track of paragraphs and bullet points
    const lines = content.split('\n');
    const renderedItems: JSX.Element[] = [];

    let currentList: string[] = [];
    const flushList = () => {
        if (currentList.length > 0) {
            const listKey = `list-${renderedItems.length}`;
            renderedItems.push(
                <ul key={listKey} className="my-3 space-y-1.5 list-none">
                    {currentList.map((item, i) => (
                        <motion.li
                            initial={{ opacity: 0, x: -5 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.05 }}
                            key={`${listKey}-item-${i}`}
                            className="flex items-start gap-3 group"
                        >
                            <span className="mt-2.5 w-1.5 h-1.5 rounded-full bg-cyan-500/60 shadow-[0_0_8px_rgba(6,182,212,0.4)] group-hover:scale-125 transition-transform shrink-0" />
                            <span className="text-slate-300 group-hover:text-slate-100 transition-colors leading-relaxed">
                                {renderTextWithLinks(item)}
                            </span>
                        </motion.li>
                    ))}
                </ul>
            );
            currentList = [];
        }
    };

    lines.forEach((line, idx) => {
        const trimmed = line.trim();
        if (!trimmed) {
            flushList();
            return;
        }

        // Detect if the line is a bullet point
        const isBullet = /^[•\-\*\+]/.test(trimmed) || /^\d+\./.test(trimmed);
        const itemText = isBullet
            ? trimmed.replace(/^[•\-\*\+]\s*/, '').replace(/^\d+\.\s*/, '')
            : trimmed;

        if (isBullet) {
            currentList.push(itemText);
        } else {
            flushList();
            renderedItems.push(
                <p key={`para-${idx}`} className="text-slate-300 text-sm leading-7 mb-4">
                    {renderTextWithLinks(trimmed)}
                </p>
            );
        }
    });

    flushList();

    return (
        <div
            className={`w-full ${!isExpanded ? 'max-h-[14rem] overflow-hidden mask-gradient-b' : ''}`}
            style={!isExpanded ? { maskImage: 'linear-gradient(to bottom, black 70%, transparent 100%)', WebkitMaskImage: 'linear-gradient(to bottom, black 70%, transparent 100%)' } : {}}
        >
            <div className="space-y-1">
                {renderedItems}
            </div>
        </div>
    );
}
