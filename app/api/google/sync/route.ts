import { NextResponse } from "next/server"
import { addDays } from "date-fns"
import { createClient } from "@/lib/supabase/server"
import {
  deleteGoogleEvent,
  listGoogleCalendars,
  pullEvents,
  pushEvent,
} from "@/lib/google/calendar"
import type { CalendarEvent, Profile } from "@/lib/types"

export const runtime = "nodejs"

export async function GET() {
  const supabase = await createClient()
  if (!supabase) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 })
  }
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 })

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single()
  const p = profile as Profile | null
  if (!p?.google_refresh_token) {
    return NextResponse.json({ calendars: [] })
  }
  const calendars = await listGoogleCalendars(p.google_refresh_token)
  return NextResponse.json({ calendars })
}

export async function POST(request: Request) {
  const supabase = await createClient()
  if (!supabase) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 })
  }
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 })

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single()
  const p = profile as Profile | null
  if (!p?.google_refresh_token || !p.google_sync_enabled) {
    return NextResponse.json({ ok: false, skipped: true })
  }

  const calendarId = p.google_calendar_id || "primary"
  const body = (await request.json()) as {
    direction?: "push" | "pull" | "delete"
    eventId?: string
    googleEventId?: string
  }

  if (body.direction === "delete" && body.googleEventId) {
    await deleteGoogleEvent(p.google_refresh_token, calendarId, body.googleEventId)
    return NextResponse.json({ ok: true })
  }

  if (body.direction === "push" && body.eventId) {
    const { data: event } = await supabase
      .from("events")
      .select("*")
      .eq("id", body.eventId)
      .single()
    if (!event) return NextResponse.json({ ok: false }, { status: 404 })
    const googleId = await pushEvent(
      p.google_refresh_token,
      calendarId,
      event as CalendarEvent
    )
    if (googleId && googleId !== event.google_event_id) {
      await supabase
        .from("events")
        .update({ google_event_id: googleId })
        .eq("id", event.id)
    }
    return NextResponse.json({ ok: true, google_event_id: googleId })
  }

  const timeMin = new Date().toISOString()
  const timeMax = addDays(new Date(), 60).toISOString()
  const remote = await pullEvents(
    p.google_refresh_token,
    calendarId,
    timeMin,
    timeMax
  )
  const { data: existing } = await supabase
    .from("events")
    .select("id, google_event_id")
    .eq("user_id", user.id)
    .not("google_event_id", "is", null)

  const known = new Set(
    (existing ?? []).map((row) => row.google_event_id as string)
  )

  for (const item of remote) {
    if (known.has(item.google_event_id)) continue
    await supabase.from("events").insert({
      user_id: user.id,
      title: item.title,
      description: item.description,
      category: item.category,
      start_time: item.start_time,
      end_time: item.end_time,
      all_day: item.all_day,
      location: item.location,
      recurrence_rule: item.recurrence_rule,
      source: "google_sync",
      google_event_id: item.google_event_id,
    })
  }

  return NextResponse.json({ ok: true, pulled: remote.length })
}
