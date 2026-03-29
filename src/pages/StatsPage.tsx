import React, { useMemo } from 'react'
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  LineChart, Line,
} from 'recharts'
import { TrendingUp, Archive, Flame, ListTodo, Bookmark, Sparkles, Layout } from 'lucide-react'
import { getSmartLabel } from '../lib/smartLabel'
import type { SavedItem } from '../types'

interface StatsPageProps {
  items: SavedItem[]
}

const PIE_COLORS = [
  '#7c5cbf',
  '#a78bfa',
  '#4c1d95',
  '#f59e0b',
  '#10b981',
  '#ef4444',
  '#3b82f6',
  '#ec4899',
]

const PLATFORM_COLORS: Record<string, string> = {
  Instagram: '#E1306C',
  LinkedIn: '#0A66C2',
  X: '#ffffff',
  Reddit: '#FF4500',
  YouTube: '#FF0000',
  TikTok: '#00f2ea',
  Web: '#7c5cbf',
  Other: '#8b879a',
}

function PieTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null
  const entry = payload[0]
  return (
    <div className="glass border-white/10 rounded-xl px-3 py-2 text-xs shadow-2xl">
      <p className="font-bold text-foreground mb-1">{entry.name}</p>
      <p className="text-primary">
        {entry.value} items ({Math.round(entry.payload.percent * 100)}%)
      </p>
    </div>
  )
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="glass border-white/10 rounded-xl px-3 py-2 text-xs shadow-2xl">
      {label && <p className="font-bold text-foreground mb-1">{label}</p>}
      {payload.map((p: any) => (
        <p key={p.name} style={{ color: p.color || '#7c5cbf' }}>
          {p.name}: <span className="font-bold">{p.value}</span>
        </p>
      ))}
    </div>
  )
}

export function StatsPage({ items }: StatsPageProps) {
  const now = Date.now()
  const active = useMemo(() => items.filter((i) => !i.isArchived), [items])
  const archived = useMemo(() => items.filter((i) => i.isArchived), [items])
  const doToday = useMemo(() => active.filter((i) => i.isDoToday), [active])
  const reviewedThisWeek = useMemo(
    () => active.filter((i) => now - new Date(i.dateSaved).getTime() < 7 * 864e5).length,
    [active, now]
  )

  const tagData = useMemo(() => {
    const freq: Record<string, number> = {}
    active.forEach((item) => {
      item.tags.forEach((tag) => { freq[tag] = (freq[tag] || 0) + 1 })
    })
    return Object.entries(freq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([name, value]) => ({ name, value }))
  }, [active])

  const platformData = useMemo(() => {
    const freq: Record<string, number> = {}
    active.forEach((item) => { freq[item.platform] = (freq[item.platform] || 0) + 1 })
    return Object.entries(freq)
      .sort((a, b) => b[1] - a[1])
      .map(([platform, count]) => ({ 
        platform, 
        count, 
        fill: PLATFORM_COLORS[platform] || PLATFORM_COLORS.Other 
      }))
  }, [active])

  const weeklyTrend = useMemo(() => {
    return Array.from({ length: 4 }, (_, i) => {
      const start = now - (3 - i) * 7 * 864e5
      const end = start + 7 * 864e5
      const count = active.filter(item => {
        const t = new Date(item.dateSaved).getTime()
        return t >= start && t < end
      }).length
      return { name: `Week ${i + 1}`, saves: count }
    })
  }, [active, now])

  const stats = [
    { label: 'Total Saves', value: active.length, icon: <TrendingUp className="w-4 h-4" />, color: '#7c5cbf' },
    { label: 'Reviewed', value: reviewedThisWeek, icon: <Bookmark className="w-4 h-4" />, color: '#f59e0b' },
    { label: 'Archived', value: archived.length, icon: <Archive className="w-4 h-4" />, color: '#10b981' },
    { label: 'In Action', value: doToday.length, icon: <ListTodo className="w-4 h-4" />, color: '#ec4899' }
  ]

  return (
    <div className="flex flex-col gap-8 px-4 py-6 scroll-pb-nav">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-foreground">Visual Analytics</h1>
        <p className="text-xs text-muted-foreground uppercase tracking-widest font-bold">Your digital consumption</p>
      </header>

      {/* Stat Grid */}
      <div className="grid grid-cols-2 gap-3">
        {stats.map(s => (
          <div key={s.label} className="card-surface rounded-2xl p-4 flex flex-col gap-2">
            <div className="flex items-center gap-2" style={{ color: s.color }}>
              {s.icon}
              <span className="text-[10px] font-bold uppercase tracking-wider opacity-80">{s.label}</span>
            </div>
            <span className="text-2xl font-bold">{s.value}</span>
          </div>
        ))}
      </div>

      {/* Topic Pie */}
      <section className="flex flex-col gap-4">
        <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground px-1">Top Topics</h3>
        <div className="card-surface rounded-3xl p-6 h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={tagData}
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
                stroke="none"
              >
                {tagData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
              </Pie>
              <Tooltip content={<PieTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 mt-[-40px]">
            {tagData.slice(0, 4).map((t, i) => (
              <div key={t.name} className="flex items-center gap-1.5 text-[10px] font-bold uppercase text-muted-foreground">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                {t.name}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Platform Bars */}
      <section className="flex flex-col gap-4">
        <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground px-1">Saves per Platform</h3>
        <div className="card-surface rounded-3xl p-6 h-[240px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={platformData} margin={{ top: 0, right: 0, left: -30, bottom: 0 }}>
              <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.05)" strokeDasharray="3 3" />
              <XAxis 
                dataKey="platform" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#8b879a', fontSize: 10, fontWeight: 600 }} 
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#8b879a', fontSize: 10 }} 
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.02)' }} />
              <Bar dataKey="count" radius={[4, 4, 0, 0]} barSize={24}>
                {platformData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* Weekly Trend */}
      <section className="flex flex-col gap-4 mb-12">
        <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground px-1">Monthly Trend</h3>
        <div className="card-surface rounded-3xl p-6 h-[240px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={weeklyTrend} margin={{ top: 10, right: 10, left: -30, bottom: 0 }}>
              <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.05)" />
              <XAxis 
                dataKey="name" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#8b879a', fontSize: 10, fontWeight: 600 }} 
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#8b879a', fontSize: 10 }} 
              />
              <Tooltip content={<CustomTooltip />} />
              <Line 
                type="monotone" 
                dataKey="saves" 
                stroke="#7c5cbf" 
                strokeWidth={3} 
                dot={{ fill: '#7c5cbf', stroke: '#0f0e1a', strokeWidth: 2, r: 4 }} 
                activeDot={{ r: 6, strokeWidth: 0 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>
    </div>
  )
}
