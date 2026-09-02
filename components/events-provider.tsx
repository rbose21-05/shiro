"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react"
import type { User } from "@supabase/supabase-js"
import {
  DEMO_USER_ID,
  EVENTS_STORAGE_KEY,
  PROFILE_STORAGE_KEY,
  VIBE_STORAGE_KEY,
  isSupabaseConfigured,
} from "@/lib/config"
import { defaultProfile, seedDemoEvents } from "@/lib/demo"
import { createClient } from "@/lib/supabase/client"
import { todayKey } from "@/lib/dates"
import type {
  CalendarEvent,
  EventDraft,
  Profile,
  VibeTheme,
} from "@/lib/types"

type EventsContextValue = {
  user: User | null
  profile: Profile
  events: CalendarEvent[]
  loading: boolean
  isGuest: boolean
  refresh: () => Promise<void>
  createEvent: (draft: EventDraft) => Promise<CalendarEvent>
  updateEvent: (id: string, patch: Partial<CalendarEvent>) => Promise<void>
  deleteEvent: (id: string) => Promise<void>
  completeEvent: (id: string, completed?: boolean) => Promise<void>
  createMany: (drafts: EventDraft[]) => Promise<CalendarEvent[]>
  updateProfile: (patch: Partial<Profile>) => Promise<void>
  checkInStreak: () => Promise<void>
}

const EventsContext = createContext<EventsContextValue | null>(null)

function readLocal<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

function writeLocal(key: string, value: unknown) {
  localStorage.setItem(key, JSON.stringify(value))
}

export function EventsProvider({
  children,
  initialUser,
  initialProfile,
}: {
  children: React.ReactNode
  initialUser: User | null
  initialProfile: Profile | null
}) {
  const isGuest = !initialUser
  const userId = initialUser?.id ?? DEMO_USER_ID
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [profile, setProfile] = useState<Profile>(
    initialProfile ?? defaultProfile(userId)
  )
  const [loading, setLoading] = useState(true)

  const persistLocal = useCallback(
    (nextEvents: CalendarEvent[], nextProfile?: Profile) => {
      writeLocal(EVENTS_STORAGE_KEY, nextEvents)
      writeLocal(PROFILE_STORAGE_KEY, nextProfile ?? profile)
    },
    [profile]
  )

  const refresh = useCallback(async () => {
    const supabase = createClient()
    if (supabase && initialUser) {
      const [{ data: eventRows }, { data: profileRow }] = await Promise.all([
        supabase
          .from("events")
          .select("*")
          .eq("user_id", initialUser.id)
          .order("start_time"),
        supabase.from("profiles").select("*").eq("id", initialUser.id).single(),
      ])
      setEvents((eventRows as CalendarEvent[]) ?? [])
      if (profileRow) setProfile(profileRow as Profile)
    } else {
      const storedEvents = readLocal<CalendarEvent[] | null>(
        EVENTS_STORAGE_KEY,
        null
      )
      const storedProfile = readLocal<Profile | null>(PROFILE_STORAGE_KEY, null)
      const nextEvents = storedEvents ?? seedDemoEvents(userId)
      const nextProfile = storedProfile ?? defaultProfile(userId)
      if (!storedEvents) writeLocal(EVENTS_STORAGE_KEY, nextEvents)
      if (!storedProfile) writeLocal(PROFILE_STORAGE_KEY, nextProfile)
      setEvents(nextEvents)
      setProfile(nextProfile)
    }
    setLoading(false)
  }, [initialUser, userId])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const pushGoogle = useCallback(async (event: CalendarEvent) => {
    if (!isSupabaseConfigured() || !initialUser || !profile.google_sync_enabled) {
      return
    }
    try {
      await fetch("/api/google/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ direction: "push", eventId: event.id }),
      })
    } catch {
      // Sync is best-effort.
    }
  }, [initialUser, profile.google_sync_enabled])

  const createEvent = useCallback(
    async (draft: EventDraft) => {
      const now = new Date().toISOString()
      const supabase = createClient()
      if (supabase && initialUser) {
        const { data, error } = await supabase
          .from("events")
          .insert({
            user_id: initialUser.id,
            title: draft.title,
            description: draft.description ?? null,
            category: draft.category,
            start_time: draft.start_time,
            end_time: draft.end_time ?? null,
            all_day: draft.all_day ?? false,
            location: draft.location ?? null,
            recurrence_rule: draft.recurrence_rule ?? null,
            source: draft.source ?? "manual",
            google_event_id: draft.google_event_id ?? null,
            confidence_score: draft.confidence_score ?? null,
            completed: draft.completed ?? false,
          })
          .select("*")
          .single()
        if (error) throw error
        const created = data as CalendarEvent
        setEvents((prev) => [...prev, created])
        void pushGoogle(created)
        return created
      }
      const created: CalendarEvent = {
        id: crypto.randomUUID(),
        user_id: userId,
        title: draft.title,
        description: draft.description ?? null,
        category: draft.category,
        start_time: draft.start_time,
        end_time: draft.end_time ?? null,
        all_day: draft.all_day ?? false,
        location: draft.location ?? null,
        recurrence_rule: draft.recurrence_rule ?? null,
        source: draft.source ?? "manual",
        google_event_id: draft.google_event_id ?? null,
        confidence_score: draft.confidence_score ?? null,
        completed: draft.completed ?? false,
        created_at: now,
        updated_at: now,
      }
      setEvents((prev) => {
        const next = [...prev, created]
        persistLocal(next)
        return next
      })
      return created
    },
    [initialUser, persistLocal, pushGoogle, userId]
  )

  const updateEvent = useCallback(
    async (id: string, patch: Partial<CalendarEvent>) => {
      const supabase = createClient()
      const apply = (prev: CalendarEvent[]) =>
        prev.map((event) =>
          event.id === id || event.id.startsWith(`${id}::`)
            ? { ...event, ...patch, updated_at: new Date().toISOString() }
            : event
        )
      if (supabase && initialUser) {
        const realId = id.split("::")[0]
        const { error } = await supabase.from("events").update(patch).eq("id", realId)
        if (error) throw error
      }
      setEvents((prev) => {
        const next = apply(prev)
        if (!initialUser) persistLocal(next)
        return next
      })
      const updated = events.find((e) => e.id === id || e.id.startsWith(`${id}::`))
      if (updated) void pushGoogle({ ...updated, ...patch, id: id.split("::")[0] })
    },
    [events, initialUser, persistLocal, pushGoogle]
  )

  const deleteEvent = useCallback(
    async (id: string) => {
      const realId = id.split("::")[0]
      const existing = events.find((e) => e.id === realId || e.id.startsWith(`${realId}::`))
      const supabase = createClient()
      if (supabase && initialUser) {
        const { error } = await supabase.from("events").delete().eq("id", realId)
        if (error) throw error
      }
      setEvents((prev) => {
        const next = prev.filter(
          (event) => event.id !== realId && !event.id.startsWith(`${realId}::`)
        )
        if (!initialUser) persistLocal(next)
        return next
      })
      if (existing?.google_event_id && profile.google_sync_enabled) {
        void fetch("/api/google/sync", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            direction: "delete",
            googleEventId: existing.google_event_id,
          }),
        })
      }
    },
    [events, initialUser, persistLocal, profile.google_sync_enabled]
  )

  const completeEvent = useCallback(
    async (id: string, completed = true) => {
      await updateEvent(id.split("::")[0], { completed })
    },
    [updateEvent]
  )

  const createMany = useCallback(
    async (drafts: EventDraft[]) => {
      const created: CalendarEvent[] = []
      for (const draft of drafts) {
        created.push(await createEvent(draft))
      }
      return created
    },
    [createEvent]
  )

  const updateProfile = useCallback(
    async (patch: Partial<Profile>) => {
      const next = { ...profile, ...patch }
      setProfile(next)
      const supabase = createClient()
      if (supabase && initialUser) {
        await supabase.from("profiles").update(patch).eq("id", initialUser.id)
      } else {
        persistLocal(events, next)
      }
      if (patch.theme_preference) {
        document.documentElement.dataset.vibe = patch.theme_preference
        localStorage.setItem(VIBE_STORAGE_KEY, patch.theme_preference)
      }
    },
    [events, initialUser, persistLocal, profile]
  )

  const checkInStreak = useCallback(async () => {
    const today = todayKey()
    if (profile.last_checkin_date === today) return
    const yesterday = todayKey(new Date(Date.now() - 86400000))
    const nextCount =
      profile.last_checkin_date === yesterday ? profile.streak_count + 1 : 1
    await updateProfile({
      streak_count: nextCount,
      last_checkin_date: today,
    })
  }, [profile.last_checkin_date, profile.streak_count, updateProfile])

  const value = useMemo(
    () => ({
      user: initialUser,
      profile,
      events,
      loading,
      isGuest,
      refresh,
      createEvent,
      updateEvent,
      deleteEvent,
      completeEvent,
      createMany,
      updateProfile,
      checkInStreak,
    }),
    [
      checkInStreak,
      completeEvent,
      createEvent,
      createMany,
      deleteEvent,
      events,
      initialUser,
      isGuest,
      loading,
      profile,
      refresh,
      updateEvent,
      updateProfile,
    ]
  )

  return <EventsContext.Provider value={value}>{children}</EventsContext.Provider>
}

export function useEvents() {
  const ctx = useContext(EventsContext)
  if (!ctx) throw new Error("useEvents must be used within EventsProvider")
  return ctx
}

export function applyVibe(theme: VibeTheme) {
  if (typeof document === "undefined") return
  document.documentElement.dataset.vibe = theme
}
