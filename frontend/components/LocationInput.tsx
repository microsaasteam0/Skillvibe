'use client'

import { useState, useEffect, useRef } from 'react'
import axios from 'axios'
import { MapPin, Loader2, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface LocationInputProps {
    value: string
    onChange: (value: string) => void
    placeholder?: string
    className?: string
    iconClassName?: string
}

export default function LocationInput({
    value,
    onChange,
    placeholder = "Location",
    className = "",
    iconClassName = "w-5 h-5 text-slate-400"
}: LocationInputProps) {
    const [suggestions, setSuggestions] = useState<any[]>([])
    const [loading, setLoading] = useState(false)
    const [showDropdown, setShowDropdown] = useState(false)
    const dropdownRef = useRef<HTMLDivElement>(null)
    const [inputValue, setInputValue] = useState(value)

    useEffect(() => {
        setInputValue(value)
    }, [value])

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setShowDropdown(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    const fetchSuggestions = async (query: string) => {
        if (!query || query.length < 2) {
            setSuggestions([])
            return
        }
        setLoading(true)
        try {
            const response = await axios.get(`https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&limit=5`)
            const features = response.data.features || []
            const results = features.map((f: any) => {
                const p = f.properties
                const parts = [p.name, p.city, p.state, p.country].filter(Boolean)
                const uniqueParts = Array.from(new Set(parts))
                return uniqueParts.join(', ')
            })
            setSuggestions(Array.from(new Set(results)))
            setShowDropdown(true)
        } catch (err) {
            console.error("Error fetching location suggestions:", err)
        } finally {
            setLoading(false)
        }
    }

    const timeoutRef = useRef<NodeJS.Timeout | null>(null)

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value
        setInputValue(val)
        onChange(val)

        if (timeoutRef.current) clearTimeout(timeoutRef.current)
        timeoutRef.current = setTimeout(() => {
            fetchSuggestions(val)
        }, 500)
    }

    const handleSelect = (suggestion: string) => {
        setInputValue(suggestion)
        onChange(suggestion)
        setShowDropdown(false)
        setSuggestions([])
    }

    return (
        <div className="relative w-full" ref={dropdownRef}>
            <MapPin className={`absolute left-5 top-1/2 -translate-y-1/2 z-10 pointer-events-none transition-colors ${iconClassName}`} />
            <input
                type="text"
                value={inputValue}
                onChange={handleInputChange}
                onFocus={() => inputValue.length >= 2 && suggestions.length > 0 && setShowDropdown(true)}
                placeholder={placeholder}
                className={`w-full pl-12 pr-10 focus:outline-none transition-all ${className}`}
            />

            {loading && (
                <Loader2 className="w-4 h-4 absolute right-4 top-1/2 -translate-y-1/2 text-cyan-500 animate-spin" />
            )}

            {inputValue && !loading && (
                <button
                    type="button"
                    onClick={() => { setInputValue(''); onChange(''); setSuggestions([]); }}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
                >
                    <X className="w-4 h-4" />
                </button>
            )}

            <AnimatePresence>
                {showDropdown && suggestions.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="absolute top-full left-0 right-0 mt-2 p-1 bg-[#0f172a] backdrop-blur-3xl border border-white/10 rounded-xl z-[100] shadow-2xl overflow-hidden"
                    >
                        <div className="max-h-60 overflow-y-auto hide-scrollbar" data-lenis-prevent="true">
                            {suggestions.map((suggestion, idx) => (
                                <button
                                    key={idx}
                                    type="button"
                                    onClick={() => handleSelect(suggestion)}
                                    className="w-full text-left px-4 py-3 text-xs font-black uppercase tracking-widest text-slate-300 hover:bg-white/5 hover:text-cyan-400 transition-all rounded-lg"
                                >
                                    {suggestion}
                                </button>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
