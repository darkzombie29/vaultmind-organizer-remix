import React, { useMemo, useState, useEffect } from 'react'
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion'
import { 
  Brain, 
  ExternalLink, 
  Archive, 
  CheckCircle, 
  Flame, 
  CalendarClock, 
  X,
  ArrowLeft,
  ArrowRight,
  Sparkles
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import confetti from 'canvas-confetti'
import { Button, toast } from '@blinkdotnew/ui'
import { PlatformBadge } from '../components/PlatformBadge'
import { getSmartLabel } from '../lib/smartLabel'
import type { SavedItem } from '../types'

interface FocusModePageProps {
  items: SavedItem[]
  onArchive: (id: string) => void
  onDoToday: (id: string, current: boolean) => void
}

const CELEBRATE_EVERY = 5

export function FocusModePage({ items, onArchive, onDoToday }: FocusModePageProps) {
  const [index, setIndex] = useState(0)
  const [reviewedCount, setReviewedCount] = useState(0)
  const [showHint, setShowHint] = useState(true)
  const [isQueueCleared, setIsQueueCleared] = useState(false)

  // Only non-archived items that aren't already marked for today
  const queue = useMemo(
    () => items.filter((i) => !i.isArchived && !i.isDoToday),
    [items]
  )

  const current = queue[index]
  const totalInQueue = queue.length

  // Motion values for swipe
  const x = useMotionValue(0)
  const rotate = useTransform(x, [-200, 200], [-25, 25])
  const opacity = useTransform(x, [-200, -150, 0, 150, 200], [0, 1, 1, 1, 0])
  const archiveOpacity = useTransform(x, [-100, -50], [1, 0])
  const todayOpacity = useTransform(x, [50, 100], [0, 1])

  useEffect(() => {
    if (reviewedCount > 0 && reviewedCount % CELEBRATE_EVERY === 0) {
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#7c5cbf', '#e8e6f0', '#4a3a8c']
      })
      toast.success(`🎉 ${reviewedCount} down! Keep going`, {
        description: 'Great focus session! Take a break if needed.',
        duration: 3000
      })
    }
  }, [reviewedCount])

  useEffect(() => {
    const timer = setTimeout(() => setShowHint(false), 3000)
    return () => clearTimeout(timer)
  }, [])

  const handleAction = (type: 'archive' | 'keep' | 'today') => {
    if (!current) return

    if (type === 'archive') onArchive(current.id)
    if (type === 'today') onDoToday(current.id, false)
    
    const nextCount = reviewedCount + 1
    setReviewedCount(nextCount)
    
    if (index >= queue.length - 1) {
      setIsQueueCleared(true)
    } else {
      setIndex(prev => prev + 1)
    }
    x.set(0)
  }

  const smartLabel = useMemo(
    () => current ? getSmartLabel({ 
      title: current.title, 
      summary: current.summary, 
      contentType: current.contentType, 
      tags: current.tags 
    }) : null,
    [current]
  )

  if (isQueueCleared || totalInQueue === 0) {
    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col items-center justify-center min-h-[80vh] px-6 text-center gap-8"
      >
        <div className="relative">
          <div className="w-24 h-24 rounded-3xl bg-primary/20 flex items-center justify-center text-primary relative z-10">
            <Brain className="w-12 h-12" />
          </div>
          <motion.div 
            animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.2, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="absolute inset-0 bg-primary blur-3xl rounded-full z-0"
          />
        </div>

        <div className="flex flex-col gap-2">
          <h2 className="text-3xl font-bold text-foreground">🧠 Vault cleared!</h2>
          <p className="text-muted-foreground text-sm max-w-[260px] mx-auto">
            You reviewed {reviewedCount || items.length} items today. Your brain is officially organized.
          </p>
        </div>

        <div className="flex flex-col gap-4 w-full max-w-xs">
          <div className="flex items-center justify-center gap-6 py-4 rounded-2xl glass border-white/5">
            <div className="flex flex-col gap-1">
              <span className="text-2xl font-bold text-primary">🔥 7</span>
              <span className="text-[10px] font-bold uppercase text-muted-foreground">Streak</span>
            </div>
            <div className="w-px h-8 bg-white/10" />
            <div className="flex flex-col gap-1">
              <span className="text-2xl font-bold text-foreground">{reviewedCount}</span>
              <span className="text-[10px] font-bold uppercase text-muted-foreground">Reviewed</span>
            </div>
          </div>

          <Button 
            className="btn-primary h-14 rounded-2xl text-base shadow-xl shadow-primary/20"
            onClick={() => window.location.href = '/'}
          >
            Back to Home
          </Button>
        </div>
      </motion.div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-background relative overflow-hidden">
      {/* Header */}
      <header className="px-4 pt-6 pb-4 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <h1 className="text-lg font-bold text-foreground flex items-center gap-2">
              <Zap className="w-5 h-5 text-primary fill-primary" /> Focus Mode
            </h1>
            <p className="text-xs text-muted-foreground">Review your vault one save at a time</p>
          </div>
          <button 
            onClick={() => window.location.href = '/'}
            className="w-10 h-10 rounded-full glass flex items-center justify-center"
          >
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            <span>{index + 1} of {totalInQueue} reviewed today</span>
            <span className="text-primary">{Math.round(((index + 1) / totalInQueue) * 100)}%</span>
          </div>
          <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${((index + 1) / totalInQueue) * 100}%` }}
              className="h-full bg-primary"
            />
          </div>
        </div>

        <div className="flex justify-center">
          <div className="px-3 py-1 rounded-full glass border-primary/20 text-[10px] font-bold text-primary uppercase tracking-widest flex items-center gap-2">
            <Sparkles className="w-3 h-3" /> {totalInQueue} items in queue · {totalInQueue - index} unreviewed
          </div>
        </div>
      </header>

      {/* Main Focus Card Area */}
      <div className="flex-1 flex items-center justify-center px-6 relative py-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={current.id}
            style={{ x, rotate, opacity }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            onDragEnd={(_, info) => {
              if (info.offset.x < -100) handleAction('archive')
              else if (info.offset.x > 100) handleAction('today')
            }}
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="w-full max-w-sm aspect-[3/4] card-surface rounded-[2.5rem] p-8 flex flex-col gap-6 relative shadow-2xl shadow-black/40 cursor-grab active:cursor-grabbing"
          >
            {/* Gesture Hints Arrows */}
            <motion.div style={{ opacity: archiveOpacity }} className="absolute -left-12 top-1/2 -translate-y-1/2 flex flex-col items-center gap-2 text-blue-400">
              <div className="w-12 h-12 rounded-full glass flex items-center justify-center border-blue-400/30">
                <Archive className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-widest">Archive</span>
            </motion.div>

            <motion.div style={{ opacity: todayOpacity }} className="absolute -right-12 top-1/2 -translate-y-1/2 flex flex-col items-center gap-2 text-orange-400">
              <div className="w-12 h-12 rounded-full glass flex items-center justify-center border-orange-400/30">
                <Flame className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-widest">Do Today</span>
            </motion.div>

            <div className="flex items-center justify-between">
              <PlatformBadge platform={current.platform} />
              {smartLabel && (
                <div 
                  className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider"
                  style={{ background: smartLabel.bg, color: smartLabel.color, border: `1px solid ${smartLabel.border}` }}
                >
                  {smartLabel.emoji} {smartLabel.text}
                </div>
              )}
            </div>

            <div className="flex flex-col gap-4 flex-1">
              <h2 className="text-2xl font-bold text-foreground leading-tight line-clamp-3">
                {current.title}
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed line-clamp-4">
                {current.summary}
              </p>
              
              <div className="flex flex-wrap gap-2 mt-auto">
                {current.tags.map(tag => (
                  <span key={tag} className="px-3 py-1 rounded-full bg-white/5 text-[10px] font-bold text-muted-foreground border border-white/5">
                    #{tag}
                  </span>
                ))}
              </div>
            </div>

            <div className="pt-6 border-t border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-2 text-muted-foreground">
                <CalendarClock className="w-4 h-4" />
                <span className="text-[10px] font-bold uppercase tracking-wider">
                  Saved {formatDistanceToNow(new Date(current.dateSaved))} ago
                </span>
              </div>
              <button 
                onClick={() => window.open(current.url, '_blank')}
                className="text-primary text-xs font-bold flex items-center gap-1.5 hover:underline"
              >
                Open Original <ExternalLink className="w-3 h-3" />
              </button>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Swipe Hints Overlay */}
        <AnimatePresence>
          {showHint && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 pointer-events-none flex items-center justify-between px-2"
            >
              <motion.div animate={{ x: [-10, 10, -10] }} transition={{ repeat: Infinity, duration: 1.5 }} className="text-blue-400/40">
                <ArrowLeft className="w-10 h-10" />
              </motion.div>
              <motion.div animate={{ x: [10, -10, 10] }} transition={{ repeat: Infinity, duration: 1.5 }} className="text-orange-400/40">
                <ArrowRight className="w-10 h-10" />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer Action Buttons */}
      <div className="px-6 pb-safe mb-24 flex flex-col gap-4">
        <div className="grid grid-cols-3 gap-3 h-16">
          <button 
            onClick={() => handleAction('archive')}
            className="flex flex-col items-center justify-center gap-1 rounded-2xl glass border-white/10 text-muted-foreground hover:text-foreground transition-all active:scale-95"
          >
            <Archive className="w-5 h-5" />
            <span className="text-[9px] font-bold uppercase">Archive</span>
          </button>
          
          <button 
            onClick={() => handleAction('keep')}
            className="flex flex-col items-center justify-center gap-1 rounded-2xl bg-white/5 border border-white/10 text-foreground transition-all active:scale-95"
          >
            <CheckCircle className="w-5 h-5" />
            <span className="text-[9px] font-bold uppercase">Keep</span>
          </button>

          <button 
            onClick={() => handleAction('today')}
            className="flex flex-col items-center justify-center gap-1 rounded-2xl bg-primary text-white shadow-lg shadow-primary/20 transition-all active:scale-95"
          >
            <Flame className="w-5 h-5" />
            <span className="text-[9px] font-bold uppercase">Do Today</span>
          </button>
        </div>
      </div>
    </div>
  )
}
