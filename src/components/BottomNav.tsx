import React from 'react'
import { motion } from 'framer-motion'
import { LayoutDashboard, Zap, BookOpen, BarChart2 } from 'lucide-react'

export type BottomNavTab = 'home' | 'focus' | 'digest' | 'stats'

interface BottomNavProps {
  active: BottomNavTab
  onChange: (tab: BottomNavTab) => void
  focusCount?: number
}

const TABS: { id: BottomNavTab; label: string; Icon: React.FC<{ className?: string }> }[] = [
  { id: 'home',   label: 'Home',   Icon: LayoutDashboard },
  { id: 'focus',  label: 'Focus',  Icon: Zap },
  { id: 'digest', label: 'Digest', Icon: BookOpen },
  { id: 'stats',  label: 'Stats',  Icon: BarChart2 },
]

export function BottomNav({ active, onChange, focusCount = 0 }: BottomNavProps) {
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 glass border-t border-white/[0.06] pb-safe"
      style={{ background: 'rgba(15, 14, 26, 0.85)' }}
    >
      <div className="flex items-stretch h-16 max-w-lg mx-auto">
        {TABS.map(({ id, label, Icon }) => {
          const isActive = active === id
          const showBadge = id === 'focus' && focusCount > 0 && !isActive

          return (
            <button
              key={id}
              onClick={() => onChange(id)}
              className="flex-1 flex flex-col items-center justify-center gap-1 relative transition-colors py-1"
              style={{ color: isActive ? '#7c5cbf' : '#8b879a' }}
            >
              {/* Active indicator underline pill */}
              {isActive && (
                <motion.div
                  layoutId="bottom-nav-indicator"
                  className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-1 rounded-full bg-primary"
                  transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                />
              )}

              <div className="relative">
                <Icon className={`w-5 h-5 transition-transform duration-200 ${isActive ? 'scale-110' : 'scale-100'}`} />
                
                {/* Count badge dot on Focus */}
                {showBadge && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-primary border-2 border-[#0f0e1a]"
                  />
                )}
              </div>

              <span className="text-[10px] font-bold uppercase tracking-wider">
                {label}
              </span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
