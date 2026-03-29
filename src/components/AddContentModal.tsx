import React, { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Button,
  Input,
  toast,
} from '@blinkdotnew/ui'
import { Loader2, Link2, Sparkles, X, Plus, ChevronDown, Check } from 'lucide-react'
import { PlatformBadge } from './PlatformBadge'
import { blink } from '../blink/client'

const PLATFORMS = ['Instagram', 'LinkedIn', 'X', 'Reddit', 'YouTube', 'TikTok', 'Web', 'Other'] as const
type Platform = typeof PLATFORMS[number]

interface AnalyzedContent {
  platform: Platform
  title: string
  summary: string
  tags: string[]
  thumbnail: string
  contentType: string
}

interface AddContentModalProps {
  open: boolean
  onClose: () => void
  userId: string
  processUrlFunctionUrl: string
  onSuccess?: () => void
  /** Pre-filled URL from PWA Share Target — triggers auto-analysis on open */
  initialUrl?: string
}

export function AddContentModal({
  open,
  onClose,
  userId,
  processUrlFunctionUrl,
  onSuccess,
  initialUrl,
}: AddContentModalProps) {
  const [url, setUrl] = useState('')
  const [selectedPlatform, setSelectedPlatform] = useState<Platform | null>(null)
  const [platformDropdownOpen, setPlatformDropdownOpen] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [analyzed, setAnalyzed] = useState<AnalyzedContent | null>(null)
  const [editableTags, setEditableTags] = useState<string[]>([])
  const [newTag, setNewTag] = useState('')

  // Seed URL from share target and kick off analysis automatically
  const prevOpenRef = React.useRef(false)
  React.useEffect(() => {
    const justOpened = open && !prevOpenRef.current
    prevOpenRef.current = open
    if (justOpened && initialUrl && initialUrl.trim()) {
      const detectedPlatform = detectPlatformFromUrl(initialUrl)
      setUrl(initialUrl.trim())
      if (detectedPlatform !== 'Web') setSelectedPlatform(detectedPlatform)
      // Small delay so the modal is fully rendered before analysis starts
      setTimeout(() => handleAnalyzeUrl(initialUrl.trim()), 300)
    }
  }, [open, initialUrl])

  const handleClose = () => {
    setUrl('')
    setSelectedPlatform(null)
    setAnalyzed(null)
    setEditableTags([])
    setNewTag('')
    setIsAnalyzing(false)
    setIsSaving(false)
    setPlatformDropdownOpen(false)
    onClose()
  }

  // Extracted analysis logic that can be called with an explicit URL string
  const handleAnalyzeUrl = async (targetUrl: string) => {
    setIsAnalyzing(true)
    setAnalyzed(null)
    try {
      const token = await blink.auth.getValidToken().catch(() => null)
      const response = await fetch(processUrlFunctionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ url: targetUrl }),
      })
      if (!response.ok) throw new Error(`Failed: ${response.statusText}`)
      const data = await response.json()
      const detectedPlatform = (data.platform || 'Web') as Platform
      const content: AnalyzedContent = {
        platform: detectedPlatform,
        title: data.title || 'Untitled',
        summary: data.summary || '',
        tags: Array.isArray(data.tags) ? data.tags : [],
        thumbnail: data.thumbnail || '',
        contentType: data.contentType || data.content_type || 'Article',
      }
      setAnalyzed(content)
      setEditableTags(content.tags)
      setSelectedPlatform(detectedPlatform)
    } catch {
      const platform = detectPlatformFromUrl(targetUrl)
      setAnalyzed({
        platform,
        title: extractTitleFromUrl(targetUrl),
        summary: 'Content saved from ' + (() => { try { return new URL(targetUrl).hostname.replace('www.', '') } catch { return targetUrl } })()
        ,
        tags: [],
        thumbnail: '',
        contentType: inferContentType(platform),
      })
      setEditableTags([])
    } finally {
      setIsAnalyzing(false)
    }
  }

  // Auto-detect platform from URL when typing
  const handleUrlChange = (val: string) => {
    setUrl(val)
    if (!selectedPlatform && val.trim()) {
      const detected = detectPlatformFromUrl(val)
      if (detected !== 'Web') setSelectedPlatform(detected)
    }
  }

  const handleAnalyze = async () => {
    if (!url.trim()) {
      toast.error('Please enter a URL')
      return
    }

    setIsAnalyzing(true)
    setAnalyzed(null)

    try {
      const token = await blink.auth.getValidToken().catch(() => null)
      const response = await fetch(processUrlFunctionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ url: url.trim() }),
      })

      if (!response.ok) throw new Error(`Failed to analyze URL: ${response.statusText}`)

      const data = await response.json()
      const detectedPlatform = (selectedPlatform || data.platform || 'Web') as Platform
      const content: AnalyzedContent = {
        platform: detectedPlatform,
        title: data.title || 'Untitled',
        summary: data.summary || '',
        tags: Array.isArray(data.tags) ? data.tags : [],
        thumbnail: data.thumbnail || '',
        contentType: data.contentType || data.content_type || 'Article',
      }
      setAnalyzed(content)
      setEditableTags(content.tags)
      if (!selectedPlatform) setSelectedPlatform(detectedPlatform)
    } catch {
      // Fallback with manual platform
      const platform = selectedPlatform || detectPlatformFromUrl(url)
      const fallback: AnalyzedContent = {
        platform,
        title: extractTitleFromUrl(url),
        summary: 'Content saved from ' + new URL(url.trim()).hostname.replace('www.', ''),
        tags: [],
        thumbnail: '',
        contentType: inferContentType(platform),
      }
      setAnalyzed(fallback)
      setEditableTags([])
      toast('Saved with basic info — AI analysis unavailable', {})
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handleAddTag = () => {
    const trimmed = newTag.trim().toLowerCase()
    if (trimmed && !editableTags.includes(trimmed)) {
      setEditableTags((prev) => [...prev, trimmed])
    }
    setNewTag('')
  }

  const handleRemoveTag = (tag: string) => {
    setEditableTags((prev) => prev.filter((t) => t !== tag))
  }

  const handleSave = async () => {
    if (!analyzed) return
    setIsSaving(true)

    try {
      await blink.db.savedItems.create({
        userId,
        url: url.trim(),
        title: analyzed.title,
        thumbnail: analyzed.thumbnail,
        platform: analyzed.platform,
        tags: JSON.stringify(editableTags),
        contentType: analyzed.contentType,
        summary: analyzed.summary,
        isArchived: false,
        isFavorite: false,
        dateSaved: new Date().toISOString(),
      })

      toast.success('Saved to Vault!', {
        description: `"${analyzed.title}" added to your vault.`,
      })

      onSuccess?.()
      handleClose()
    } catch {
      toast.error('Failed to save', {
        description: 'Something went wrong. Please try again.',
      })
    } finally {
      setIsSaving(false)
    }
  }

  // Can save directly without analyze if platform is manually chosen
  const canSaveDirect = analyzed !== null
  const effectivePlatform = analyzed?.platform ?? selectedPlatform

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent
        className="max-w-lg w-full"
        style={{ background: 'hsl(228 38% 10%)', border: '1px solid hsl(228 30% 18%)' }}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 gradient-text text-xl font-bold">
            <Link2 className="w-5 h-5" style={{ color: 'hsl(258 84% 70%)' }} />
            Add to Vault
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4 mt-2">
          {/* URL Input */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium" style={{ color: 'hsl(220 15% 65%)' }}>
              Paste a URL
            </label>
            <Input
              id="save-url-input"
              placeholder="https://..."
              value={url}
              onChange={(e) => handleUrlChange(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !isAnalyzing && handleAnalyze()}
              className="text-sm"
              style={{
                background: 'hsl(228 42% 7%)',
                border: '1px solid hsl(228 30% 18%)',
                color: 'hsl(220 20% 88%)',
              }}
              disabled={isAnalyzing}
            />
          </div>

          {/* Platform Selector */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium" style={{ color: 'hsl(220 15% 65%)' }}>
              Platform
            </label>
            <div className="relative">
              <button
                type="button"
                onClick={() => setPlatformDropdownOpen((v) => !v)}
                className="w-full flex items-center justify-between px-3 h-9 rounded-md text-sm transition-colors"
                style={{
                  background: 'hsl(228 42% 7%)',
                  border: '1px solid hsl(228 30% 18%)',
                  color: effectivePlatform ? 'hsl(220 20% 88%)' : 'hsl(220 15% 45%)',
                }}
              >
                <div className="flex items-center gap-2">
                  {effectivePlatform ? (
                    <>
                      <PlatformDot platform={effectivePlatform} />
                      <span>{effectivePlatform}</span>
                    </>
                  ) : (
                    <span>Select platform...</span>
                  )}
                </div>
                <ChevronDown
                  className="w-4 h-4 transition-transform"
                  style={{
                    color: 'hsl(220 15% 45%)',
                    transform: platformDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                  }}
                />
              </button>

              {platformDropdownOpen && (
                <div
                  className="absolute top-full left-0 right-0 mt-1 z-50 rounded-lg overflow-hidden py-1"
                  style={{
                    background: 'hsl(228 38% 12%)',
                    border: '1px solid hsl(228 30% 20%)',
                    boxShadow: '0 8px 32px hsl(0 0% 0% / 0.4)',
                  }}
                >
                  {PLATFORMS.map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => {
                        setSelectedPlatform(p)
                        if (analyzed) setAnalyzed({ ...analyzed, platform: p })
                        setPlatformDropdownOpen(false)
                      }}
                      className="w-full flex items-center justify-between px-3 py-2 text-sm transition-colors hover:bg-white/5"
                      style={{ color: 'hsl(220 20% 85%)' }}
                    >
                      <div className="flex items-center gap-2">
                        <PlatformDot platform={p} />
                        <span>{p}</span>
                      </div>
                      {effectivePlatform === p && (
                        <Check className="w-3.5 h-3.5" style={{ color: 'hsl(258 84% 70%)' }} />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Analyze button */}
          <Button
            onClick={handleAnalyze}
            disabled={isAnalyzing || !url.trim()}
            className="btn-glow w-full"
            style={{ background: 'hsl(258 84% 70%)', color: 'hsl(258 84% 10%)' }}
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Analyzing with AI...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Analyze URL
              </>
            )}
          </Button>

          {/* Analyzing shimmer */}
          {isAnalyzing && (
            <div className="flex items-center gap-3 py-4 justify-center">
              <div
                className="w-8 h-8 rounded-full animate-spin shrink-0"
                style={{
                  border: '2px solid hsl(258 84% 70% / 0.2)',
                  borderTop: '2px solid hsl(258 84% 70%)',
                }}
              />
              <div>
                <p className="text-sm font-medium" style={{ color: 'hsl(220 20% 88%)' }}>
                  Detecting platform & extracting content...
                </p>
                <p className="text-xs mt-0.5" style={{ color: 'hsl(220 15% 55%)' }}>
                  AI is generating your 2-line summary and tags
                </p>
              </div>
            </div>
          )}

          {/* Analyzed preview card */}
          {analyzed && !isAnalyzing && (
            <div
              className="rounded-xl overflow-hidden animate-fade-in"
              style={{ border: '1px solid hsl(258 84% 70% / 0.25)', background: 'hsl(228 42% 7%)' }}
            >
              {/* Thumbnail */}
              {analyzed.thumbnail && (
                <div className="w-full h-32 overflow-hidden">
                  <img
                    src={analyzed.thumbnail}
                    alt={analyzed.title}
                    className="w-full h-full object-cover"
                    onError={(e) => { e.currentTarget.style.display = 'none' }}
                  />
                </div>
              )}

              <div className="p-4 flex flex-col gap-3">
                {/* Platform + Type row */}
                <div className="flex items-center gap-2 flex-wrap">
                  <PlatformBadge platform={analyzed.platform} />
                  <span
                    className="text-xs px-2 py-0.5 rounded-full"
                    style={{
                      background: 'hsl(280 70% 65% / 0.15)',
                      color: 'hsl(280 70% 75%)',
                      border: '1px solid hsl(280 70% 65% / 0.25)',
                    }}
                  >
                    {analyzed.contentType}
                  </span>
                </div>

                {/* Title */}
                <h4 className="font-semibold text-sm leading-snug" style={{ color: 'hsl(220 20% 88%)' }}>
                  {analyzed.title}
                </h4>

                {/* Summary */}
                {analyzed.summary && (
                  <p className="text-xs leading-relaxed" style={{ color: 'hsl(220 15% 55%)' }}>
                    {analyzed.summary}
                  </p>
                )}

                {/* Tags editor */}
                <div className="flex flex-col gap-2">
                  <p className="text-xs font-medium" style={{ color: 'hsl(220 15% 55%)' }}>
                    Tags
                  </p>
                  {editableTags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {editableTags.map((tag) => (
                        <span
                          key={tag}
                          className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-md"
                          style={{
                            background: 'hsl(258 84% 70% / 0.12)',
                            color: 'hsl(258 84% 80%)',
                            border: '1px solid hsl(258 84% 70% / 0.2)',
                          }}
                        >
                          {tag}
                          <button
                            onClick={() => handleRemoveTag(tag)}
                            className="hover:text-red-400 transition-colors ml-0.5"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="flex gap-2">
                    <Input
                      placeholder="Add a tag..."
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleAddTag()}
                      className="text-xs h-8"
                      style={{
                        background: 'hsl(228 38% 10%)',
                        border: '1px solid hsl(228 30% 18%)',
                        color: 'hsl(220 20% 88%)',
                      }}
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleAddTag}
                      disabled={!newTag.trim()}
                      className="h-8 px-2"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-2 justify-end pt-1">
            <Button variant="outline" onClick={handleClose} disabled={isSaving}>
              Cancel
            </Button>
            {canSaveDirect && (
              <Button
                onClick={handleSave}
                disabled={isSaving}
                className="btn-glow"
                style={{ background: 'hsl(258 84% 70%)', color: 'hsl(258 84% 10%)' }}
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Save to Vault
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// Colored dot indicator for each platform
function PlatformDot({ platform }: { platform: string }) {
  const colors: Record<string, string> = {
    Instagram: 'linear-gradient(135deg, #833ab4, #fd1d1d)',
    LinkedIn: '#0077b5',
    X: '#e7e7e7',
    Reddit: '#ff4500',
    YouTube: '#ff0000',
    TikTok: '#69c9d0',
    Web: 'hsl(258 84% 70%)',
    Other: 'hsl(258 84% 70%)',
  }
  return (
    <span
      className="w-2.5 h-2.5 rounded-full shrink-0 inline-block"
      style={{ background: colors[platform] || colors.Other }}
    />
  )
}

// Helper: detect platform from URL
function detectPlatformFromUrl(url: string): Platform {
  try {
    const lower = url.toLowerCase()
    if (lower.includes('instagram.com')) return 'Instagram'
    if (lower.includes('linkedin.com')) return 'LinkedIn'
    if (lower.includes('twitter.com') || lower.includes('x.com')) return 'X'
    if (lower.includes('reddit.com')) return 'Reddit'
    if (lower.includes('youtube.com') || lower.includes('youtu.be')) return 'YouTube'
    if (lower.includes('tiktok.com')) return 'TikTok'
  } catch { /* ignore */ }
  return 'Web'
}

// Helper: extract a readable title from URL
function extractTitleFromUrl(url: string): string {
  try {
    const { hostname, pathname } = new URL(url)
    const host = hostname.replace('www.', '')
    const slug = pathname.split('/').filter(Boolean).pop() || ''
    const readable = slug.replace(/[-_]/g, ' ').replace(/\.\w+$/, '')
    return readable ? `${readable} — ${host}` : host
  } catch {
    return url
  }
}

// Helper: infer content type from platform
function inferContentType(platform: string): string {
  if (platform === 'YouTube') return 'Video'
  if (platform === 'Instagram' || platform === 'TikTok') return 'Reel'
  return 'Article'
}
