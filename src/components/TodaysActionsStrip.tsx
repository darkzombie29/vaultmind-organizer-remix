import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Flame, ChevronRight } from 'lucide-react'
import type { SavedItem, Platform } from '../types'

interface TodaysActionsStripProps {
  items: SavedItem[]
  onItemClick: (id: string) => void
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

export function TodaysActionsStrip({ items, onItemClick }: TodaysActionsStripProps) {
  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <h2 className="font-bold text-sm text-foreground flex items-center gap-1.5">
            Do Today <Flame className="w-4 h-4 text-orange-500 fill-orange-500" />
          </h2>
          <span className="text-[10px] font-bold bg-white/5 px-1.5 py-0.5 rounded-full text-muted-foreground border border-white/5">
            {items.length}
          </span>
        </div>
      </div>

      <div className="flex gap-3 overflow-x-auto px-4 pb-2 no-scrollbar scroll-smooth">
        <AnimatePresence mode="popLayout">
          {items.length > 0 ? (
            items.map((item) => (
              <motion.button
                key={item.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                onClick={() => onItemClick(item.id)}
                className="shrink-0 w-48 card-surface rounded-xl p-3 flex flex-col gap-2 text-left group active:scale-[0.97] transition-transform"
              >
                <div className="flex items-center gap-2">
                  <div 
                    className="w-1.5 h-1.5 rounded-full" 
                    style={{ backgroundColor: PLATFORM_COLORS[item.platform] || PLATFORM_COLORS.Other }} 
                  />
                  <span className="text-[10px] font-bold text-muted-foreground uppercase truncate">
                    {item.platform}
                  </span>
                </div>
                <p className="text-[11px] font-bold text-foreground line-clamp-1 group-hover:text-primary transition-colors">
                  {item.title}
                </p>
                <div className="flex items-center justify-between mt-1 pt-1 border-t border-white/5">
                  <span className="text-[9px] font-bold text-primary flex items-center gap-0.5">
                    Review <ChevronRight className="w-2.5 h-2.5" />
                  </span>
                </div>
              </motion.button>
            ))
          ) : (
            <div className="w-full card-surface rounded-xl p-4 flex items-center justify-center border-dashed">
              <p className="text-[11px] text-muted-foreground italic">
                Nothing pinned — use Focus Mode to decide
              </p>
            </div>
          )}
        </AnimatePresence>
      </div>
    </section>
  )
}
