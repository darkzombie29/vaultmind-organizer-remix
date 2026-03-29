import React, { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { formatDistanceToNow } from 'date-fns'
import { 
  ExternalLink, 
  Bookmark, 
  MoreVertical, 
  Archive, 
  Trash2, 
  Zap, 
  Pin,
  Clock
} from 'lucide-react'
import { Button } from '@blinkdotnew/ui'
import { getSmartLabel } from '../lib/smartLabel'
import { BottomSheet, BottomSheetItem } from './BottomSheet'
import type { SavedItem, Platform } from '../types'

interface ContentCardProps {
  item: SavedItem
  index?: number
  onToggleFavorite?: (id: string, current: boolean) => void
  onArchive?: (id: string) => void
  onDelete?: (id: string) => void
  onToggleToday?: (id: string, current: boolean) => void
  onSendToFocus?: (id: string) => void
}

const PLATFORM_COLORS: Record<Platform, string> = {
  Instagram: '#E1306C',
  LinkedIn: '#0A66C2',
  X: '#ffffff',
  Reddit: '#FF4500',
  YouTube: '#FF0000',
  TikTok: '#00f2ea',
  Web: '#7c5cbf',
  Other: '#8b879a'
}

export function ContentCard({
  item,
  index = 0,
  onToggleFavorite,
  onArchive,
  onDelete,
  onToggleToday,
  onSendToFocus,
}: ContentCardProps) {
  const [sheetOpen, setSheetOpen] = useState(false)
  const visibleTags = item.tags.slice(0, 3)

  const smartLabel = useMemo(
    () => getSmartLabel({ 
      title: item.title, 
      summary: item.summary, 
      contentType: item.contentType, 
      tags: item.tags 
    }),
    [item.title, item.summary, item.contentType, item.tags]
  )

  const relativeDate = useMemo(() => {
    try {
      return formatDistanceToNow(new Date(item.dateSaved), { addSuffix: true })
    } catch {
      return 'just now'
    }
  }, [item.dateSaved])

  const handleCardClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('[data-no-nav]')) return
    if (item.url) window.open(item.url, '_blank')
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: index * 0.05, ease: [0.4, 0, 0.2, 1] }}
        className="card-surface rounded-2xl overflow-hidden group relative flex flex-col h-full active:scale-[0.98] transition-transform duration-200"
      >
        {/* Header Info */}
        <div className="p-4 pb-2 flex items-center justify-between">
          <div className="flex items-center gap-2 overflow-hidden" onClick={handleCardClick}>
            <div 
              className="w-2 h-2 rounded-full shrink-0" 
              style={{ backgroundColor: PLATFORM_COLORS[item.platform] || PLATFORM_COLORS.Other }}
            />
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider truncate">
              {item.platform} • {relativeDate}
            </span>
          </div>

          <button 
            data-no-nav
            onClick={(e) => {
              e.stopPropagation()
              setSheetOpen(true)
            }}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/5 transition-colors text-muted-foreground hover:text-foreground"
          >
            <MoreVertical className="w-4 h-4" />
          </button>
        </div>

        {/* Title & Description */}
        <div className="px-4 flex flex-col gap-1 flex-1" onClick={handleCardClick}>
          <h3 className="font-bold text-base leading-snug line-clamp-2 text-foreground">
            {item.title || 'Untitled'}
          </h3>
          <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
            {item.summary}
          </p>
        </div>

        {/* Tags & Smart Label */}
        <div className="px-4 py-3 flex flex-col gap-3">
          <div className="flex flex-wrap gap-1.5" onClick={handleCardClick}>
            {smartLabel && (
              <div
                className="flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-tight shrink-0"
                style={{
                  background: smartLabel.bg,
                  color: smartLabel.color,
                  border: `1px solid ${smartLabel.border}`,
                }}
              >
                <span>{smartLabel.emoji}</span>
                <span>{smartLabel.text}</span>
              </div>
            )}
            {visibleTags.map((tag) => (
              <span
                key={tag}
                className="text-[10px] px-2 py-0.5 rounded-md bg-white/5 border border-white/5 text-muted-foreground font-medium whitespace-nowrap"
              >
                #{tag}
              </span>
            ))}
          </div>

          {/* Action Row */}
          <div className="flex items-center justify-between pt-1 border-t border-white/5">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-0 text-primary hover:text-primary/80 hover:bg-transparent text-xs font-bold gap-1 group/btn"
              onClick={() => window.open(item.url, '_blank')}
            >
              Open
              <ExternalLink className="w-3 h-3 transition-transform group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5" />
            </Button>

            <div className="flex items-center gap-1">
              <button
                data-no-nav
                onClick={(e) => {
                  e.stopPropagation()
                  onArchive?.(item.id)
                }}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/5 transition-colors text-muted-foreground hover:text-foreground"
                title="Archive"
              >
                <Archive className="w-4 h-4" />
              </button>
              <button
                data-no-nav
                onClick={(e) => {
                  e.stopPropagation()
                  onToggleFavorite?.(item.id, item.isFavorite)
                }}
                className={`w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/5 transition-colors ${item.isFavorite ? 'text-yellow-500' : 'text-muted-foreground hover:text-foreground'}`}
                title="Bookmark"
              >
                <Bookmark className={`w-4 h-4 ${item.isFavorite ? 'fill-current' : ''}`} />
              </button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Action Menu Sheet */}
      <BottomSheet 
        isOpen={sheetOpen} 
        onClose={() => setSheetOpen(false)}
        title="Manage Save"
      >
        <div className="flex flex-col gap-1 p-2">
          <BottomSheetItem 
            icon={<Pin className="w-5 h-5" />}
            label={item.isDoToday ? 'Unpin from Today' : 'Pin to Today\'s Actions'}
            onClick={() => {
              onToggleToday?.(item.id, item.isDoToday)
              setSheetOpen(false)
            }}
          />
          <BottomSheetItem 
            icon={<Zap className="w-5 h-5" />}
            label="Send to Focus Mode"
            variant="info"
            onClick={() => {
              onSendToFocus?.(item.id)
              setSheetOpen(false)
            }}
          />
          <BottomSheetItem 
            icon={<Archive className="w-5 h-5" />}
            label={item.isArchived ? 'Unarchive' : 'Archive to Vault'}
            onClick={() => {
              onArchive?.(item.id)
              setSheetOpen(false)
            }}
          />
          <BottomSheetItem 
            icon={<ExternalLink className="w-5 h-5" />}
            label="Open Original URL"
            onClick={() => {
              window.open(item.url, '_blank')
              setSheetOpen(false)
            }}
          />
          <div className="my-2 mx-4 h-px bg-white/5" />
          <BottomSheetItem 
            icon={<Trash2 className="w-5 h-5" />}
            label="Delete Permanently"
            variant="danger"
            onClick={() => {
              if (confirm('Are you sure you want to delete this save?')) {
                onDelete?.(item.id)
              }
              setSheetOpen(false)
            }}
          />
        </div>
      </BottomSheet>
    </>
  )
}
