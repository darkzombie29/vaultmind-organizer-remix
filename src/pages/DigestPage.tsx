import React, { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  BookOpen, 
  Flame, 
  Calendar, 
  Sparkles, 
  ArrowRight, 
  Clock, 
  History, 
  CheckCircle, 
  Archive,
  ChevronDown,
  BookMarked,
  Layout
} from 'lucide-react'
import { format } from 'date-fns'
import { Button } from '@blinkdotnew/ui'
import { PlatformBadge } from '../components/PlatformBadge'
import type { SavedItem } from '../types'

interface DigestPageProps {
  items: SavedItem[]
}

export function DigestPage({ items }: DigestPageProps) {
  const [expandedDigest, setExpandedDigest] = useState<string | null>(null)

  const activeItems = useMemo(() => items.filter(i => !i.isArchived), [items])

  // Logic for the 3 brain snacks
  const brainSnacks = useMemo(() => {
    if (activeItems.length < 3) return []

    // 1. Fresh Save: most recent
    const fresh = activeItems[0]

    // 2. Forgotten Gem: unreviewed, 7-30 days old
    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 7)
    const monthAgo = new Date()
    monthAgo.setDate(monthAgo.getDate() - 30)
    
    const forgotten = activeItems.find(i => 
      new Date(i.dateSaved) < weekAgo && 
      new Date(i.dateSaved) > monthAgo &&
      !i.isDoToday
    ) || activeItems[1]

    // 3. Rediscovery: 30+ days old
    const rediscovery = activeItems.find(i => 
      new Date(i.dateSaved) < monthAgo
    ) || activeItems[activeItems.length - 1]

    return [
      { 
        type: 'fresh', 
        label: '🆕 Fresh Save', 
        hint: 'You saved this recently — don\'t let it get cold', 
        item: fresh,
        btn: 'Read Now',
        color: '#7c5cbf'
      },
      { 
        type: 'forgotten', 
        label: '⏰ Forgotten Gem', 
        hint: `Saved ${forgotten ? format(new Date(forgotten.dateSaved), 'MMM d') : ''} and never revisited`, 
        item: forgotten,
        btn: 'Rediscover',
        color: '#f59e0b'
      },
      { 
        type: 'rediscovery', 
        label: '🔁 Rediscovery', 
        hint: 'From your archives — still relevant?', 
        item: rediscovery,
        btn: 'Check relevance',
        color: '#10b981'
      }
    ]
  }, [activeItems])

  const stats = [
    { label: 'Streak', value: '7', emoji: '🔥' },
    { label: 'Saves', value: items.length.toString(), emoji: '📚' },
    { label: 'Reviewed', value: '18', emoji: '✅' },
    { label: 'Snacks', value: '3', emoji: '🧠' }
  ]

  if (activeItems.length < 3) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] p-8 text-center gap-6">
        <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center text-primary">
          <BookOpen className="w-10 h-10" />
        </div>
        <div className="flex flex-col gap-2">
          <h2 className="text-xl font-bold">Your digest is loading...</h2>
          <p className="text-sm text-muted-foreground max-w-[240px]">
            Once you have at least 3 saves, we'll curate a daily Brain Snack for you.
          </p>
        </div>
        <Button className="btn-primary rounded-full px-8" onClick={() => window.location.href = '/'}>
          Add your first save
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-8 px-4 py-6 scroll-pb-nav">
      {/* Header */}
      <header className="flex flex-col gap-1">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground">Daily Brain Snack</h1>
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full glass border-orange-500/20 text-orange-500 text-[10px] font-bold uppercase tracking-wider">
            <Flame className="w-3 h-3 fill-current" /> 7 day streak
          </div>
        </div>
        <p className="text-xs text-muted-foreground flex items-center gap-1.5 font-medium uppercase tracking-wider">
          <Calendar className="w-3 h-3" /> {format(new Date(), 'EEEE, MMMM d')}
        </p>
      </header>

      {/* Intro Card */}
      <div className="gradient-border-purple rounded-[2rem] p-6 flex flex-col gap-2 overflow-hidden relative group">
        <div className="absolute -right-4 -top-4 w-32 h-32 bg-primary/20 blur-3xl rounded-full" />
        <div className="flex items-center gap-2 text-primary">
          <Sparkles className="w-5 h-5 fill-current" />
          <span className="text-xs font-bold uppercase tracking-widest">Your 3 picks for today</span>
        </div>
        <h2 className="text-lg font-bold text-foreground pr-12 leading-snug">
          Curated from your vault based on what you haven't revisited
        </h2>
      </div>

      {/* Featured Cards */}
      <div className="flex flex-col gap-6">
        {brainSnacks.map((snack, idx) => (
          <motion.div
            key={snack.type}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="flex flex-col gap-3"
          >
            <div className="flex flex-col gap-1 px-1">
              <span className="text-[10px] font-bold text-foreground uppercase tracking-widest flex items-center gap-2">
                {snack.label}
              </span>
              <p className="text-[11px] text-muted-foreground font-medium">
                {snack.hint}
              </p>
            </div>

            <div className="card-surface rounded-3xl p-5 flex flex-col gap-4 relative overflow-hidden active:scale-[0.98] transition-transform">
              <div className="flex items-start justify-between gap-4">
                <div className="flex flex-col gap-2 flex-1">
                  <PlatformBadge platform={snack.item?.platform || 'Web'} />
                  <h3 className="text-base font-bold text-foreground leading-snug line-clamp-2">
                    {snack.item?.title}
                  </h3>
                  <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                    {snack.item?.summary}
                  </p>
                </div>
                {snack.item?.thumbnail && (
                  <div className="w-20 h-20 rounded-2xl overflow-hidden shrink-0 border border-white/5">
                    <img src={snack.item.thumbnail} className="w-full h-full object-cover" alt="" />
                  </div>
                )}
              </div>

              <div className="flex items-center gap-3 pt-2">
                <Button 
                  className="rounded-xl flex-1 font-bold text-xs h-11 gap-2"
                  style={{ backgroundColor: snack.color }}
                  onClick={() => window.open(snack.item?.url, '_blank')}
                >
                  {snack.btn} <ArrowRight className="w-3 h-3" />
                </Button>
                
                {snack.type === 'rediscovery' && (
                  <div className="flex items-center gap-2">
                    <button className="w-11 h-11 rounded-xl glass flex items-center justify-center text-muted-foreground hover:text-foreground">
                      <Archive className="w-4 h-4" />
                    </button>
                    <button className="w-11 h-11 rounded-xl glass flex items-center justify-center text-primary">
                      <CheckCircle className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Stats Strip */}
      <section className="flex flex-col gap-3">
        <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-1">Your Pulse</h3>
        <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
          {stats.map(s => (
            <div key={s.label} className="shrink-0 flex items-center gap-3 px-4 py-3 rounded-2xl glass border-white/5">
              <span className="text-lg">{s.emoji}</span>
              <div className="flex flex-col">
                <span className="text-xs font-bold text-foreground leading-none">{s.value}</span>
                <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-tighter">{s.label}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Past Digests */}
      <section className="flex flex-col gap-3 mb-12">
        <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-1">Past Brain Snacks</h3>
        <div className="flex flex-col gap-2">
          {['Yesterday · Mar 28', 'Mar 27', 'Mar 26'].map(date => (
            <button
              key={date}
              className="flex items-center justify-between p-4 rounded-2xl glass border-white/5 text-left active:scale-[0.99] transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-muted-foreground">
                  <History className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-muted-foreground">{date}</span>
              </div>
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            </button>
          ))}
        </div>
      </section>
    </div>
  )
}
