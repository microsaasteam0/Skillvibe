'use client'

import { useState, useEffect, useRef } from 'react'
import { ChevronDown, Check } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface Option {
    value: string
    label: string
}

interface CustomSelectProps {
    options: Option[]
    value: string
    onChange: (value: string) => void
    placeholder?: string
    className?: string
}

export default function CustomSelect({
    options,
    value,
    onChange,
    placeholder = "Select option",
    className = ""
}: CustomSelectProps) {
    const [isOpen, setIsOpen] = useState(false)
    const dropdownRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    const selectedOption = options.find(opt => opt.value === value)

    return (
        <div className="relative w-full" ref={dropdownRef}>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl bg-white/[0.04] border border-white/10 text-white text-sm font-bold focus:outline-none focus:border-cyan-500/50 transition-all ${className}`}
            >
                <span className={selectedOption ? "text-white" : "text-slate-500"}>
                    {selectedOption ? selectedOption.label : placeholder}
                </span>
                <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="absolute top-full left-0 right-0 mt-2 p-1 bg-[#0f172a] backdrop-blur-3xl border border-white/10 rounded-xl z-[100] shadow-2xl overflow-hidden"
                    >
                        <div className="max-h-60 overflow-y-auto hide-scrollbar" data-lenis-prevent="true">
                            {options.map((option) => (
                                <button
                                    key={option.value}
                                    type="button"
                                    onClick={() => {
                                        onChange(option.value)
                                        setIsOpen(false)
                                    }}
                                    className={`w-full flex items-center justify-between px-4 py-3 text-xs font-black uppercase tracking-widest transition-all rounded-lg mb-0.5 last:mb-0 ${value === option.value
                                        ? 'bg-cyan-500/10 text-cyan-400'
                                        : 'text-slate-300 hover:bg-white/5 hover:text-white'
                                        }`}
                                >
                                    {option.label}
                                    {value === option.value && <Check className="w-3 h-3" />}
                                </button>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
