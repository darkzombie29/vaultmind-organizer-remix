/**
 * Smart Label — derives a contextual content label from title, summary, and contentType.
 * Four possible labels, priority order: Time-Sensitive > Actionable > Deep Read > Evergreen
 */

export type SmartLabelType = 'time-sensitive' | 'actionable' | 'deep-read' | 'evergreen' | null

export interface SmartLabel {
  type: SmartLabelType
  emoji: string
  text: string
  /** Tailwind-compatible inline style colors */
  bg: string
  color: string
  border: string
}

const TIME_SENSITIVE_KEYWORDS = [
  'trend', 'trending', 'breaking', 'event', 'limited', 'deadline', 'expires',
  'urgent', 'live', 'now', 'today', 'this week', 'flash', 'sale ends', 'soon',
  'announcement', 'launch', 'just released', 'just dropped', 'new release',
]

const ACTIONABLE_KEYWORDS = [
  'step-by-step', 'checklist', 'how to', 'how-to', 'guide', 'tool',
  'template', 'framework', 'strategy', 'tips', 'hack', 'trick', 'shortcut',
  'cheat sheet', 'playbook', 'workflow', 'process', 'system', 'action plan',
  'actionable', 'do this', 'try this', 'implement', 'build', 'create',
  'recommendation', 'resource', 'toolkit', 'free tool',
]

const DEEP_READ_KEYWORDS = [
  'thread', 'deep dive', 'analysis', 'research', 'study', 'report',
  'breakdown', 'explained', 'comprehensive', 'ultimate', 'complete',
  'everything you need', 'essay', 'manifesto', 'whitepaper', 'case study',
  'in-depth', 'detailed', 'long read', 'series',
]

const EVERGREEN_KEYWORDS = [
  'tutorial', 'career', 'advice', 'lesson', 'principle', 'mindset',
  'skill', 'learn', 'growth', 'habit', 'productivity', 'motivation',
  'philosophy', 'foundation', 'fundamentals', 'beginner', 'master',
  'evergreen', 'timeless', 'classic', 'best practice', ' 101',
]

function matchesAny(haystack: string, keywords: string[]): boolean {
  const lower = haystack.toLowerCase()
  return keywords.some((kw) => lower.includes(kw))
}

export function getSmartLabel(item: {
  title: string
  summary: string
  contentType: string
  tags: string[]
}): SmartLabel | null {
  const combined = `${item.title} ${item.summary} ${item.tags.join(' ')}`

  // Priority 1: Time-Sensitive
  if (matchesAny(combined, TIME_SENSITIVE_KEYWORDS)) {
    return {
      type: 'time-sensitive',
      emoji: '🕐',
      text: 'Time-Sensitive',
      bg: 'hsl(0 80% 62% / 0.12)',
      color: 'hsl(0 80% 70%)',
      border: 'hsl(0 80% 62% / 0.3)',
    }
  }

  // Priority 2: Actionable
  if (matchesAny(combined, ACTIONABLE_KEYWORDS)) {
    return {
      type: 'actionable',
      emoji: '💡',
      text: 'Actionable',
      bg: 'hsl(48 96% 53% / 0.12)',
      color: 'hsl(48 96% 60%)',
      border: 'hsl(48 96% 53% / 0.3)',
    }
  }

  // Priority 3: Deep Read (Videos are never "deep read")
  if (
    item.contentType !== 'Video' &&
    item.contentType !== 'Reel' &&
    matchesAny(combined, DEEP_READ_KEYWORDS)
  ) {
    return {
      type: 'deep-read',
      emoji: '📖',
      text: 'Deep Read',
      bg: 'hsl(210 80% 58% / 0.12)',
      color: 'hsl(210 80% 70%)',
      border: 'hsl(210 80% 58% / 0.3)',
    }
  }

  // Priority 4: Evergreen
  if (matchesAny(combined, EVERGREEN_KEYWORDS)) {
    return {
      type: 'evergreen',
      emoji: '🌿',
      text: 'Evergreen',
      bg: 'hsl(142 72% 40% / 0.12)',
      color: 'hsl(142 72% 55%)',
      border: 'hsl(142 72% 40% / 0.3)',
    }
  }

  return null
}
