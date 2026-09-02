import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { listGoogleCalendars } from "@/lib/google/calendar"
import type { Profile } from "@/lib/types"

export async function GET() {
  const supabase = await createClient()
  if (!supabase) {
    return NextResponse.json({ calendars: [] })
  }
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ calendars: [] }, { status: 401 })
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single()
  const p = profile as Profile | null
  if (!p?.google_refresh_token) return NextResponse.json({ calendars: [] })
  const calendars = await listGoogleCalendars(p.google_refresh_token)
  return NextResponse.json({ calendars })
}
