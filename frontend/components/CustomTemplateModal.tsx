'use client'

import { useState, useEffect } from 'react'
import { X, Save, FileText, Tag, Globe, Lock, Star, Sparkles } from 'lucide-react'
import axios from 'axios'
import toast from 'react-hot-toast'
import { API_URL } from '../lib/api-config'

interface CustomTemplateModalProps {
  isOpen: boolean
  onClose: () => void
  onTemplateCreated?: (template: any) => void
  editTemplate?: any // If provided, we're editing an existing template
}

interface TemplateCategory {
  value: string
  label: string
  description: string
}

const CustomTemplateModal: React.FC<CustomTemplateModalProps> = ({
  isOpen,
  onClose,
  onTemplateCreated,
  editTemplate
}) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'blog',
    content: '',
    tags: '',
    is_public: false
  })
  const [isLoading, setIsLoading] = useState(false)
  const [categories, setCategories] = useState<TemplateCategory[]>([])

  // Load categories on mount
  useEffect(() => {
    if (isOpen) {
      loadCategories()
    }
  }, [isOpen])

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
      document.documentElement.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
      document.documentElement.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
      document.documentElement.style.overflow = 'unset'
    }
  }, [isOpen])

  // Populate form when editing
  useEffect(() => {
    if (editTemplate) {
      setFormData({
        name: editTemplate.name || '',
        description: editTemplate.description || '',
        category: editTemplate.category || 'blog',
        content: editTemplate.content || '',
        tags: editTemplate.tags || '',
        is_public: editTemplate.is_public || false
      })
    } else {
      // Reset form for new template
      setFormData({
        name: '',
        description: '',
        category: 'blog',
        content: '',
        tags: '',
        is_public: false
      })
    }
  }, [editTemplate, isOpen])

  const loadCategories = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/v1/templates/categories/list`)
      setCategories(response.data.categories)
    } catch (error) {
      console.error('Error loading categories:', error)
      // Fallback categories
      setCategories([
        { value: 'blog', label: 'Blog Post', description: 'Blog articles and posts' },
        { value: 'newsletter', label: 'Newsletter', description: 'Email newsletters and updates' },
        { value: 'marketing', label: 'Marketing', description: 'Marketing content and campaigns' },
        { value: 'social', label: 'Social Media', description: 'Social media posts and content' },
        { value: 'other', label: 'Other', description: 'Other types of content' }
      ])
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name.trim()) {
      toast.error('Template name is required')
      return
    }

    if (!formData.content.trim()) {
      toast.error('Template content is required')
      return
    }

    setIsLoading(true)

    try {
      let response
      if (editTemplate) {
        // Update existing template
        response = await axios.put(
          `${API_URL}/api/v1/templates/${editTemplate.id}`,
          formData
        )
        toast.success('Template updated')
      } else {
        // Create new template
        response = await axios.post(
          `${API_URL}/api/v1/templates/`,
          formData
        )
        toast.success('Template created')
      }

      if (onTemplateCreated) {
        onTemplateCreated(response.data)
      }

      onClose()
    } catch (error: any) {
      console.error('Error saving template:', error)
      const errorMessage = error.response?.data?.detail || 'Failed to save template. Please try again.'
      toast.error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const insertSampleContent = (type: string) => {
    let sampleContent = ''

    switch (type) {
      case 'blog':
        sampleContent = `# Your Blog Title Here

## Introduction
Start with a compelling hook that draws readers in...

## Main Content
### Key Point 1
Explain your first main point with supporting details and examples.

### Key Point 2
Develop your second key point with evidence and insights.

### Key Point 3
Present your final main point with actionable advice.

## Conclusion
Wrap up with a strong conclusion that reinforces your main message and includes a call to action.`
        break
      case 'newsletter':
        sampleContent = `# Weekly Newsletter - [Date]

## 🚀 This Week's Highlights
- Key update or announcement
- Important industry news
- Featured content or resource

## 📊 What's Trending
Brief overview of current trends in your industry...

## 💡 Quick Tip
Share a valuable tip or insight...

## 🔗 Recommended Reading
- [Article Title](link)
- [Resource Name](link)

## 📅 Coming Up Next Week
Preview of what's coming...

Thanks for reading!`
        break
      case 'marketing':
        sampleContent = `# [Campaign/Product Name]: Transform Your [Target Outcome]

## The Problem
Describe the pain point your audience faces...

## The Solution
Introduce your product/service as the solution...

## Key Benefits
✅ Benefit 1: Specific outcome
✅ Benefit 2: Measurable result  
✅ Benefit 3: Unique advantage

## Social Proof
"Customer testimonial or case study result..."

## Call to Action
Ready to [desired action]? [Clear next step]`
        break
      case 'social':
        sampleContent = `🚀 [Attention-grabbing opening]

[Main message or value proposition]

Key points:
• Point 1
• Point 2  
• Point 3

💡 Pro tip: [Actionable advice]

What's your experience with [topic]? Share below! 👇

#hashtag1 #hashtag2 #hashtag3`
        break
      default:
        sampleContent = `# Template Title

Your content goes here...

## Section 1
Content for section 1

## Section 2
Content for section 2

## Conclusion
Wrap up your content`
    }

    handleInputChange('content', sampleContent)
    toast.success('Sample content inserted')
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[999999] flex items-center justify-center p-4">
      <div className="bg-zinc-50 dark:bg-slate-950 border border-zinc-200 dark:border-white/5 rounded-[3rem] w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] relative">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] opacity-20 pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between p-10 border-b border-zinc-200 dark:border-white/5 relative bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm">
          <div className="flex items-center group">
            <div className="w-14 h-14 bg-indigo-500/10 rounded-2xl flex items-center justify-center mr-6 border border-indigo-500/20 shadow-lg group-hover:scale-110 transition-transform duration-500">
              <FileText className="w-7 h-7 text-indigo-500" />
            </div>
            <div>
              <h4 className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.4em] mb-1.5 font-mono">TEMPLATE EDITOR</h4>
              <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">
                {editTemplate ? 'Update Template' : 'Create New Template'}
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-12 h-12 flex items-center justify-center rounded-2xl text-slate-400 hover:text-red-500 hover:bg-red-500/10 transition-all border border-transparent hover:border-red-500/20"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-hidden flex flex-col">
          <div className="flex-1 overflow-y-auto p-10 space-y-10 relative z-10">
            {/* Template Name and Category Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest font-mono ml-1">Template Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="Enter template name..."
                  className="w-full px-6 py-4 bg-white dark:bg-white/5 border border-zinc-200 dark:border-white/10 rounded-2xl text-slate-900 dark:text-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/50 font-mono text-sm transition-all shadow-sm"
                  required
                />
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest font-mono ml-1">Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => handleInputChange('category', e.target.value)}
                  className="w-full px-6 py-4 bg-white dark:bg-white/5 border border-zinc-200 dark:border-white/10 rounded-2xl text-slate-900 dark:text-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/50 font-black text-[11px] uppercase tracking-widest transition-all cursor-pointer shadow-sm"
                  required
                >
                  <option value="" disabled>Select Type...</option>
                  {categories.map((cat) => (
                    <option key={cat.value} value={cat.value} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">{cat.label.toUpperCase()}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest font-mono ml-1">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="What is this template for?"
                rows={2}
                className="w-full px-6 py-4 bg-white dark:bg-white/5 border border-zinc-200 dark:border-white/10 rounded-2xl text-slate-900 dark:text-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/50 font-mono text-sm transition-all shadow-sm resize-none"
              />
            </div>

            {/* Content with Injection Tool */}
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest font-mono ml-1">Template Content</label>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => insertSampleContent(formData.category)}
                    className="px-4 py-2 bg-indigo-500/10 hover:bg-indigo-500 text-indigo-500 hover:text-white border border-indigo-500/20 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all duration-300 flex items-center gap-2 group/inject"
                  >
                    <Sparkles className="w-3 h-3 group-hover:rotate-12 transition-transform" />
                    Insert Sample
                  </button>
                </div>
              </div>
              <div className="relative group/editor">
                <div className="absolute top-4 left-4 p-2 bg-indigo-500/5 dark:bg-indigo-500/10 rounded-lg border border-indigo-500/10 pointer-events-none opacity-40 group-focus-within/editor:opacity-100 transition-opacity">
                  <div className="flex gap-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-500/40" />
                  </div>
                </div>
                <textarea
                  value={formData.content}
                  onChange={(e) => handleInputChange('content', e.target.value)}
                  placeholder="Write your template here..."
                  rows={10}
                  className="w-full p-10 bg-white dark:bg-black/20 border border-zinc-200 dark:border-white/10 rounded-[2.5rem] text-slate-900 dark:text-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/50 font-mono text-sm transition-all shadow-inner leading-relaxed"
                  required
                />
              </div>
              <p className="px-4 text-[9px] text-slate-400 font-mono uppercase tracking-widest opacity-60">
                TIP: Use double curly-braces for variables like {'{{'}variable_name{'}}'} if needed.
              </p>
            </div>

            {/* Tags and Privacy */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pb-10">
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest font-mono ml-1">Tags</label>
                <div className="relative group">
                  <Tag className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                  <input
                    type="text"
                    value={formData.tags}
                    onChange={(e) => handleInputChange('tags', e.target.value)}
                    placeholder="tag1, tag2..."
                    className="w-full pl-14 pr-6 py-4 bg-white dark:bg-white/5 border border-zinc-200 dark:border-white/10 rounded-2xl text-slate-900 dark:text-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/50 font-mono text-sm transition-all"
                  />
                </div>
              </div>
              <div className="flex items-center gap-6 p-6 bg-white dark:bg-white/5 border border-zinc-200 dark:border-white/5 rounded-2xl">
                <button
                  type="button"
                  onClick={() => handleInputChange('is_public', !formData.is_public)}
                  className={`relative inline-flex h-8 w-14 items-center rounded-2xl transition-all ${formData.is_public ? 'bg-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.3)]' : 'bg-slate-300 dark:bg-slate-700'
                    }`}
                >
                  <span
                    className={`inline-block h-5 w-5 transform rounded-xl bg-white transition-transform duration-300 shadow-md ${formData.is_public ? 'translate-x-7' : 'translate-x-2'
                      }`}
                  />
                </button>
                <div>
                  <label className="block text-[11px] font-black text-slate-800 dark:text-white uppercase tracking-widest font-mono">Public Template</label>
                  <p className="text-[9px] text-slate-400 uppercase tracking-widest font-mono mt-0.5">Allow others to see and use this</p>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="p-8 border-t border-zinc-200 dark:border-white/5 bg-white/50 dark:bg-slate-900/50 backdrop-blur-md flex justify-end gap-4 relative">
            <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-indigo-500 to-transparent opacity-20" />

            <button
              type="button"
              onClick={onClose}
              className="px-8 py-4 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white font-black text-[11px] uppercase tracking-widest transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-10 py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-black text-[11px] uppercase tracking-widest hover:scale-105 transition-all shadow-2xl active:scale-95 disabled:opacity-50 disabled:scale-100 flex items-center gap-3"
            >
              <Save className="w-4 h-4" />
              {isLoading ? 'Saving...' : (editTemplate ? 'Save Changes' : 'Create Template')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
export default CustomTemplateModal