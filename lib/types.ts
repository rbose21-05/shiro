export type EventCategory =
  | "class"
  | "assignment"
  | "exam"
  | "social"
  | "club"
  | "personal"

export type EventSource = "manual" | "ai_image" | "ai_text" | "google_sync"

export type VibeTheme = "minimal" | "pastel" | "dark-academia"

export type CalendarView = "week" | "month" | "agenda"

export type CalendarEvent = {
  id: string
  user_id: string
  title: string
  description: string | null
  category: EventCategory
  start_time: string
  end_time: string | null
  all_day: boolean
  location: string | null
  recurrence_rule: string | null
  source: EventSource
  google_event_id: string | null
  confidence_score: number | null
  completed: boolean
  created_at: string
  updated_at: string
}

export type Profile = {
  id: string
  email: string | null
  name: string | null
  avatar_url: string | null
  google_refresh_token: string | null
  google_calendar_id: string | null
  google_sync_enabled: boolean
  theme_preference: VibeTheme
  streak_count: number
  last_checkin_date: string | null
  timezone: string | null
  created_at: string
}

export type EventDraft = {
  title: string
  description?: string | null
  category: EventCategory
  start_time: string
  end_time?: string | null
  all_day?: boolean
  location?: string | null
  recurrence_rule?: string | null
  source?: EventSource
  google_event_id?: string | null
  confidence_score?: number | null
  completed?: boolean
}

export type GoogleCalendarOption = {
  id: string
  summary: string
  primary?: boolean
}
