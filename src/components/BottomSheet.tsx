import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'

interface BottomSheetProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
}

export function BottomSheet({ isOpen, onClose, title, children }: BottomSheetProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60]"
          />
          
          {/* Sheet */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-[70] glass border-t border-white/10 rounded-t-[2rem] overflow-hidden flex flex-col max-h-[85vh]"
            style={{ background: 'rgba(26, 24, 40, 0.98)' }}
          >
            {/* Handle */}
            <div className="w-full flex justify-center py-3">
              <div className="w-12 h-1.5 bg-white/10 rounded-full" />
            </div>

            {title && (
              <div className="px-6 pb-4 flex items-center justify-between border-b border-white/5 mb-2">
                <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">{title}</h2>
                <button 
                  onClick={onClose}
                  className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-muted-foreground"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            <div className="px-2 pb-safe overflow-y-auto">
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

interface BottomSheetItemProps {
  icon: React.ReactNode
  label: string
  onClick: () => void
  variant?: 'default' | 'danger' | 'info'
}

export function BottomSheetItem({ icon, label, onClick, variant = 'default' }: BottomSheetItemProps) {
  const colorClass = {
    default: 'text-foreground',
    danger: 'text-red-400',
    info: 'text-primary'
  }[variant]

  return (
    <button
      onClick={() => {
        onClick()
        // Parent sheet logic will handle closing
      }}
      className="w-full flex items-center gap-4 px-6 py-4 transition-colors active:bg-white/5 rounded-2xl"
    >
      <div className={`shrink-0 ${variant === 'default' ? 'text-muted-foreground' : colorClass}`}>
        {icon}
      </div>
      <span className={`text-sm font-bold ${colorClass}`}>
        {label}
      </span>
    </button>
  )
}
