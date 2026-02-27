import React, { useState, useRef, useEffect } from 'react'
import { Edit2 } from 'lucide-react'

interface EditableTextProps {
    value: string
    isEditing: boolean
    onSave: (val: string) => void
    as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'p' | 'span' | 'div'
    className?: string
    multiline?: boolean
}

export default function EditableText({ value, isEditing, onSave, as = 'span', className = '', multiline = false }: EditableTextProps) {
    const [isFocused, setIsFocused] = useState(false)
    const [currentValue, setCurrentValue] = useState(value)
    const inputRef = useRef<HTMLTextAreaElement | HTMLInputElement | any>(null)

    useEffect(() => {
        setCurrentValue(value)
    }, [value])

    if (!isEditing) {
        const Tag = as as keyof JSX.IntrinsicElements
        return <Tag className={className}>{value}</Tag>
    }

    const handleBlur = () => {
        setIsFocused(false)
        if (currentValue !== value) {
            onSave(currentValue)
        }
    }

    return (
        <div className={`relative group ${className}`}>
            {multiline ? (
                <textarea
                    ref={inputRef}
                    value={currentValue}
                    onChange={(e) => setCurrentValue(e.target.value)}
                    onFocus={() => setIsFocused(true)}
                    onBlur={handleBlur}
                    className="w-full bg-black/20 border border-white/20 focus:border-cyan-500 rounded p-2 text-inherit min-h-[100px] outline-none transition-all resize-y"
                />
            ) : (
                <input
                    ref={inputRef}
                    type="text"
                    value={currentValue}
                    onChange={(e) => setCurrentValue(e.target.value)}
                    onFocus={() => setIsFocused(true)}
                    onBlur={handleBlur}
                    className="w-full bg-black/20 border-b border-white/20 focus:border-cyan-500 p-1 text-inherit outline-none transition-all"
                />
            )}
            {!isFocused && (
                <div className="absolute top-1 right-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                    <Edit2 className="w-4 h-4 text-cyan-500" />
                </div>
            )}
        </div>
    )
}
