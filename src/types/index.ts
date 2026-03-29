export type ContentType = 'Article' | 'Video' | 'Reel' | 'Idea' | 'Product' | 'Thread' | 'Other'

export type Platform = 'Instagram' | 'LinkedIn' | 'X' | 'Reddit' | 'YouTube' | 'TikTok' | 'Web' | 'Other'

export interface SavedItem {
  id: string
  userId: string
  url: string
  title: string
  thumbnail: string
  platform: Platform
  tags: string[] // stored as JSON string in DB, parsed in app
  contentType: ContentType
  summary: string
  isArchived: boolean
  isFavorite: boolean
  isDoToday: boolean
  dateSaved: string
  createdAt: string
}

export type ContentTab = 'All' | 'Videos' | 'Articles' | 'Ideas' | 'Products' | 'Threads'

export interface DailyDigest {
  date: string
  itemIds: string[]
  completed: boolean
}
