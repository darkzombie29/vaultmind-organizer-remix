import React from 'react'

const platformClass: Record<string, string> = {
  Instagram: 'badge-instagram',
  LinkedIn: 'badge-linkedin',
  X: 'badge-x',
  Reddit: 'badge-reddit',
  YouTube: 'badge-youtube',
  TikTok: 'badge-tiktok',
  Web: 'badge-web',
  Other: 'badge-web',
}

interface PlatformBadgeProps {
  platform: string
  className?: string
}

export function PlatformBadge({ platform, className = '' }: PlatformBadgeProps) {
  const cls = platformClass[platform] || 'badge-web'
  return (
    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${cls} ${className}`}>
      {platform}
    </span>
  )
}
