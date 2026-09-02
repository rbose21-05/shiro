import { addDays, addHours, setHours, startOfWeek } from "date-fns"
import { DEMO_USER_ID } from "@/lib/config"
import type { CalendarEvent, Profile } from "@/lib/types"

function ev(
  partial: Omit<CalendarEvent, "user_id" | "created_at" | "updated_at" | "source" | "google_event_id" | "confidence_score" | "completed" | "description" | "all_day" | "location" | "recurrence_rule"> &
    Partial<CalendarEvent>
): CalendarEvent {
  const now = new Date().toISOString()
  return {
    user_id: DEMO_USER_ID,
    description: null,
    all_day: false,
    location: null,
    recurrence_rule: null,
    source: "manual",
    google_event_id: null,
    confidence_score: null,
    completed: false,
    created_at: now,
    updated_at: now,
    ...partial,
  }
}

export function seedDemoEvents(userId = DEMO_USER_ID): CalendarEvent[] {
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 0 })
  const mon = addDays(weekStart, 1)
  const tue = addDays(weekStart, 2)
  const wed = addDays(weekStart, 3)
  const thu = addDays(weekStart, 4)
  const fri = addDays(weekStart, 5)
  const sat = addDays(weekStart, 6)

  return [
    ev({
      id: "demo-chem",
      user_id: userId,
      title: "Chem Lab",
      category: "class",
      start_time: setHours(mon, 14).toISOString(),
      end_time: setHours(mon, 16).toISOString(),
      location: "Science 204",
      recurrence_rule: "FREQ=WEEKLY",
    }),
    ev({
      id: "demo-calc",
      user_id: userId,
      title: "Calc II lecture",
      category: "class",
      start_time: setHours(tue, 10).toISOString(),
      end_time: setHours(tue, 11).toISOString(),
      location: "Hall 110",
      recurrence_rule: "FREQ=WEEKLY",
    }),
    ev({
      id: "demo-essay",
      user_id: userId,
      title: "History essay due",
      category: "assignment",
      start_time: setHours(wed, 23).toISOString(),
      end_time: addHours(setHours(wed, 23), 1).toISOString(),
    }),
    ev({
      id: "demo-midterm",
      user_id: userId,
      title: "Psych midterm",
      category: "exam",
      start_time: setHours(thu, 9).toISOString(),
      end_time: setHours(thu, 11).toISOString(),
      location: "Auditorium B",
    }),
    ev({
      id: "demo-club",
      user_id: userId,
      title: "Design club meeting",
      category: "club",
      start_time: setHours(thu, 18).toISOString(),
      end_time: setHours(thu, 19).toISOString(),
      location: "Student Center",
    }),
    ev({
      id: "demo-party",
      user_id: userId,
      title: "Friday house hang",
      category: "social",
      start_time: setHours(fri, 21).toISOString(),
      end_time: addHours(setHours(fri, 21), 3).toISOString(),
    }),
    ev({
      id: "demo-grocery",
      user_id: userId,
      title: "Grocery run",
      category: "personal",
      start_time: setHours(sat, 11).toISOString(),
      end_time: setHours(sat, 12).toISOString(),
    }),
  ]
}

export function defaultProfile(userId = DEMO_USER_ID): Profile {
  return {
    id: userId,
    email: "you@campus.edu",
    name: "Campus student",
    avatar_url: null,
    google_refresh_token: null,
    google_calendar_id: null,
    google_sync_enabled: false,
    theme_preference: "minimal",
    streak_count: 3,
    last_checkin_date: null,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    created_at: new Date().toISOString(),
  }
}
