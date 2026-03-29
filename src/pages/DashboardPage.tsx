import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion'
import { 
  Plus, 
  Search, 
  LogOut, 
  Vault, 
  Flame, 
  Snowflake, 
  ChevronDown, 
  ChevronUp, 
  Inbox, 
  X, 
  Bell,
  ArrowRight
} from 'lucide-react'
import { Button, Avatar, AvatarFallback, Skeleton } from '@blinkdotnew/ui'
import { blink } from '../blink/client'
import { ContentCard } from '../components/ContentCard'
import { AddContentModal } from '../components/AddContentModal'
import { BottomNav, type BottomNavTab } from '../components/BottomNav'
import { FocusModePage } from './FocusModePage'
import { DigestPage } from './DigestPage'
import { StatsPage } from './StatsPage'
import { TodaysActionsStrip } from '../components/TodaysActionsStrip'
import type { SavedItem, ContentTab } from '../types'

interface DashboardPageProps {
  user: { id: string; email?: string; displayName?: string; [key: string]: unknown }
  processUrlFunctionUrl: string
}

const CONTENT_TABS: ContentTab[] = ['All', 'Videos', 'Articles', 'Ideas', 'Products', 'Threads']

function parseItem(raw: Record<string, unknown>): SavedItem {
  let tags: string[] = []
  try {
    const rawTags = raw.tags as string
    tags = rawTags ? JSON.parse(rawTags) : []
  } catch {
    tags = []
  }

  return {
    id: String(raw.id || ''),
    userId: String(raw.userId || raw.user_id || ''),
    url: String(raw.url || ''),
    title: String(raw.title || 'Untitled'),
    thumbnail: String(raw.thumbnail || ''),
    platform: String(raw.platform || 'Web') as any,
    tags,
    contentType: String(raw.contentType || raw.content_type || 'Article') as any,
    summary: String(raw.summary || ''),
    isArchived: Number(raw.isArchived ?? raw.is_archived ?? 0) > 0,
    isFavorite: Number(raw.isFavorite ?? raw.is_favorite ?? 0) > 0,
    isDoToday: Number(raw.isDoToday ?? raw.is_do_today ?? 0) > 0,
    dateSaved: String(raw.dateSaved || raw.date_saved || new Date().toISOString()),
    createdAt: String(raw.createdAt || raw.created_at || new Date().toISOString()),
  }
}

export function DashboardPage({ user, processUrlFunctionUrl }: DashboardPageProps) {
  const queryClient = useQueryClient()
  const [searchQuery, setSearchQuery] = useState('')
  const [isSearchExpanded, setIsSearchExpanded] = useState(false)
  const [activeTab, setActiveTab] = useState<ContentTab>('All')
  const [addModalOpen, setAddModalOpen] = useState(false)
  const [shareUrl, setShareUrl] = useState<string | undefined>(undefined)
  const [coldExpanded, setColdExpanded] = useState(false)
  const [navTab, setNavTab] = useState<BottomNavTab>('home')

  // PWA Share Target: detect ?share=true on mount, pre-fill modal, clean URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('share') !== 'true') return

    // 'url' param is the direct link; 'text' may contain a URL embedded in prose
    const rawUrl  = params.get('url')  || ''
    const rawText = params.get('text') || ''

    // Extract the first http(s) link from text when 'url' param is absent
    const extractUrlFromText = (text: string) => {
      const match = text.match(/https?:\/\/[^\s]+/)
      return match ? match[0] : ''
    }

    const resolvedUrl = rawUrl.trim() || extractUrlFromText(rawText)

    // Strip share params from browser history so Back/Refresh don't re-trigger
    window.history.replaceState({}, '', window.location.pathname)

    if (resolvedUrl) {
      setShareUrl(resolvedUrl)
      setAddModalOpen(true)
    }
  }, [])
  
  const scrollRef = useRef<HTMLDivElement>(null)
  const { scrollY } = useScroll({ container: scrollRef })
  const headerOpacity = useTransform(scrollY, [0, 40], [0, 1])

  const {
    data: rawItems = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['savedItems', user.id],
    queryFn: async () => {
      const results = await blink.db.savedItems.list({
        where: { userId: user.id },
        orderBy: { dateSaved: 'desc' },
      })
      return results as Record<string, unknown>[]
    },
  })

  const allItems = useMemo(() => rawItems.map(parseItem), [rawItems])

  const filteredItems = useMemo(() => {
    let items = allItems.filter((item) => !item.isArchived)
    if (activeTab !== 'All') {
      const map: Record<string, string> = {
        Videos: 'Video',
        Articles: 'Article',
        Ideas: 'Idea',
        Products: 'Product',
        Threads: 'Thread'
      }
      items = items.filter(i => i.contentType === map[activeTab])
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      items = items.filter(i => 
        i.title.toLowerCase().includes(q) || 
        i.summary.toLowerCase().includes(q) ||
        i.tags.some(t => t.toLowerCase().includes(q))
      )
    }
    return items
  }, [allItems, activeTab, searchQuery])

  const hotItems = useMemo(() => {
    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 7)
    return filteredItems.filter(i => new Date(i.dateSaved) >= weekAgo)
  }, [filteredItems])

  const coldItems = useMemo(() => {
    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 7)
    return filteredItems.filter(i => new Date(i.dateSaved) < weekAgo)
  }, [filteredItems])

  const todayItems = useMemo(() => allItems.filter(i => i.isDoToday && !i.isArchived), [allItems])

  const toggleFavoriteMutation = useMutation({
    mutationFn: async ({ id, current }: { id: string; current: boolean }) => {
      await blink.db.savedItems.update(id, { isFavorite: !current })
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['savedItems', user.id] }),
  })

  const archiveMutation = useMutation({
    mutationFn: async (id: string) => {
      const item = allItems.find(i => i.id === id)
      await blink.db.savedItems.update(id, { isArchived: !item?.isArchived })
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['savedItems', user.id] }),
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await blink.db.savedItems.delete(id)
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['savedItems', user.id] }),
  })

  const toggleTodayMutation = useMutation({
    mutationFn: async ({ id, current }: { id: string; current: boolean }) => {
      await blink.db.savedItems.update(id, { isDoToday: !current })
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['savedItems', user.id] }),
  })

  const handleSignOut = useCallback(async () => {
    await blink.auth.signOut()
  }, [])

  const userInitials = useMemo(() => {
    const name = user.displayName || user.email || 'U'
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }, [user])

  const firstName = useMemo(() => {
    const name = user.displayName || user.email || 'there'
    return name.split(' ')[0]
  }, [user])

  const unreviewedCount = useMemo(() => allItems.filter(i => !i.isArchived && !i.isDoToday).length, [allItems])

  const renderHome = () => (
    <div className="flex flex-col gap-8 scroll-pb-nav">
      {/* Greeting Strip */}
      <section className="px-4 pt-6 flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-bold text-foreground tracking-tight">
            Good morning 👋 {firstName}
          </h1>
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-widest">
            {hotItems.length} saves this week · {unreviewedCount} unreviewed
          </p>
        </div>

        {unreviewedCount > 0 && (
          <button 
            onClick={() => setNavTab('focus')}
            className="flex items-center justify-between p-4 rounded-[1.5rem] glass border-primary/20 bg-primary/5 active:scale-[0.98] transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center text-primary">
                <Flame className="w-5 h-5 fill-current" />
              </div>
              <div className="flex flex-col text-left">
                <span className="text-[11px] font-bold uppercase tracking-wider text-primary">Attention needed</span>
                <span className="text-sm font-semibold text-foreground">{unreviewedCount} items to focus on</span>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-primary" />
          </button>
        )}
      </section>

      {/* Today's Actions Strip */}
      <TodaysActionsStrip 
        items={todayItems} 
        onItemClick={() => setNavTab('focus')} 
      />

      {/* Filter Tabs (Sticky Wrapper) */}
      <div className="sticky top-16 z-30 px-4 py-2 bg-background/80 backdrop-blur-md -mx-4 border-b border-white/[0.03]">
        <div className="flex gap-2 overflow-x-auto no-scrollbar px-4 relative">
          {CONTENT_TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className="relative px-4 py-2 text-[10px] font-bold uppercase tracking-[0.15em] transition-colors whitespace-nowrap"
              style={{ color: activeTab === tab ? '#e8e6f0' : '#8b879a' }}
            >
              {tab}
              {activeTab === tab && (
                <motion.div
                  layoutId="tab-underline"
                  className="absolute bottom-0 left-2 right-2 h-1 bg-primary rounded-full shadow-[0_0_8px_rgba(124,92,191,0.5)]"
                />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Content Feed */}
      <section className="px-4 flex flex-col gap-6">
        <div className="flex items-center gap-2 px-1">
          <Flame className="w-4 h-4 text-orange-500" />
          <h2 className="font-bold text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Hot Vault — Last 7 days</h2>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="card-surface rounded-3xl h-48 shimmer" />
            ))}
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
            <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center text-muted-foreground">
              <Inbox className="w-8 h-8" />
            </div>
            <div className="flex flex-col gap-1">
              <h3 className="font-bold text-foreground">Your vault is empty</h3>
              <p className="text-xs text-muted-foreground max-w-[240px]">
                Save anything from the web — articles, videos, threads, ideas
              </p>
            </div>
            <Button 
              className="btn-primary rounded-full px-8 gap-2"
              onClick={() => setAddModalOpen(true)}
            >
              <Plus className="w-4 h-4" /> Save your first link
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {hotItems.map((item, idx) => (
              <ContentCard
                key={item.id}
                item={item}
                index={idx}
                onToggleFavorite={(id, curr) => toggleFavoriteMutation.mutate({ id, current: curr })}
                onArchive={(id) => archiveMutation.mutate(id)}
                onDelete={(id) => deleteMutation.mutate(id)}
                onToggleToday={(id, curr) => toggleTodayMutation.mutate({ id, current: curr })}
                onSendToFocus={() => setNavTab('focus')}
              />
            ))}
          </div>
        )}

        {/* Cold Archive */}
        {coldItems.length > 0 && (
          <section className="flex flex-col gap-4">
            <button 
              onClick={() => setColdExpanded(!coldExpanded)}
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors py-4 border-t border-white/5"
            >
              <Snowflake className="w-4 h-4" />
              <span className="text-[10px] font-bold uppercase tracking-widest flex-1 text-left">Cold Archive</span>
              <span className="text-[10px] font-bold mr-2 opacity-50">{coldItems.length} items</span>
              {coldExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            <AnimatePresence>
              {coldExpanded && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
                    {coldItems.map((item, idx) => (
                      <ContentCard
                        key={item.id}
                        item={item}
                        index={idx}
                        onToggleFavorite={(id, curr) => toggleFavoriteMutation.mutate({ id, current: curr })}
                        onArchive={(id) => archiveMutation.mutate(id)}
                        onDelete={(id) => deleteMutation.mutate(id)}
                        onToggleToday={(id, curr) => toggleTodayMutation.mutate({ id, current: curr })}
                      />
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </section>
        )}
      </section>
    </div>
  )

  return (
    <div className="min-h-screen bg-background relative flex flex-col">
      {/* Sticky Header */}
      <header className="sticky top-0 z-50 w-full h-16 flex items-center justify-between px-4 gap-4 relative overflow-hidden">
        <motion.div 
          style={{ opacity: headerOpacity }}
          className="absolute inset-0 bg-background/80 backdrop-blur-lg border-b border-white/[0.03]"
        />
        
        {/* Left: Logo */}
        <AnimatePresence mode="wait">
          {!isSearchExpanded && (
            <motion.div 
              key="logo"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="flex items-center gap-2 shrink-0 relative z-10"
            >
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
                <Vault className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-lg tracking-tight text-foreground">VaultMind</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Center: Search */}
        <div className={`relative z-10 flex-1 flex justify-center transition-all duration-300 ${isSearchExpanded ? 'max-w-full' : 'max-w-[40px] sm:max-w-xs'}`}>
          <div className="relative w-full">
            <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors ${isSearchExpanded ? 'text-primary' : 'text-muted-foreground'}`} />
            <input
              type="text"
              placeholder="Search your vault..."
              onFocus={() => setIsSearchExpanded(true)}
              onBlur={() => !searchQuery && setIsSearchExpanded(false)}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full h-10 bg-white/5 border border-white/5 rounded-full pl-10 pr-10 text-sm transition-all outline-none focus:border-primary/30 focus:bg-white/10 ${!isSearchExpanded ? 'sm:block hidden' : 'block'}`}
            />
            {!isSearchExpanded && (
              <button 
                onClick={() => setIsSearchExpanded(true)}
                className="sm:hidden absolute inset-0 w-full h-full"
              />
            )}
            {searchQuery && (
              <button 
                onClick={() => {
                  setSearchQuery('')
                  setIsSearchExpanded(false)
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Right: Actions */}
        <AnimatePresence>
          {!isSearchExpanded && (
            <motion.div 
              key="actions"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              className="flex items-center gap-2 shrink-0 relative z-10"
            >
              <button className="relative w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/5 transition-colors group">
                <Bell className="w-5 h-5 text-muted-foreground group-hover:text-foreground" />
                <div className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-primary border-2 border-background" />
              </button>
              <Avatar className="w-8 h-8 border border-white/10 overflow-hidden">
                <AvatarFallback className="bg-primary/20 text-primary font-bold text-xs">
                  {userInitials}
                </AvatarFallback>
              </Avatar>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Main Page Content */}
      <main 
        ref={scrollRef}
        className="flex-1 overflow-y-auto no-scrollbar scroll-smooth"
      >
        {navTab === 'home' && renderHome()}
        {navTab === 'focus' && <FocusModePage items={allItems} onArchive={(id) => archiveMutation.mutate(id)} onDoToday={(id, curr) => toggleTodayMutation.mutate({ id, current: curr })} />}
        {navTab === 'digest' && <DigestPage items={allItems} />}
        {navTab === 'stats' && <StatsPage items={allItems} />}
      </main>

      {/* FAB */}
      {navTab === 'home' && (
        <motion.button
          id="add-btn"
          initial={{ scale: 0, rotate: -45 }}
          animate={{ scale: 1, rotate: 0 }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setAddModalOpen(true)}
          className="fixed bottom-24 right-6 w-14 h-14 rounded-full bg-primary text-white shadow-2xl shadow-primary/40 flex items-center justify-center z-40 transition-transform"
        >
          <Plus className="w-7 h-7" />
        </motion.button>
      )}

      {/* Bottom Nav */}
      <BottomNav 
        active={navTab} 
        onChange={setNavTab} 
        focusCount={unreviewedCount}
      />

      {/* Modal */}
      <AddContentModal
        open={addModalOpen}
        onClose={() => {
          setAddModalOpen(false)
          setShareUrl(undefined)   // clear pre-fill so re-opens start blank
        }}
        userId={user.id}
        processUrlFunctionUrl={processUrlFunctionUrl}
        initialUrl={shareUrl}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['savedItems', user.id] })
          setAddModalOpen(false)
          setShareUrl(undefined)
        }}
      />
    </div>
  )
}
