import { NextResponse } from "next/server"
import { runCalendarChat } from "@/lib/ai/chat"
import type { CalendarEvent } from "@/lib/types"

export const runtime = "nodejs"

export async function POST(request: Request) {
  const body = (await request.json()) as {
    message?: string
    events?: CalendarEvent[]
    timezone?: string
  }
  if (!body.message?.trim()) {
    return NextResponse.json({ error: "Message required" }, { status: 400 })
  }
  const result = await runCalendarChat({
    message: body.message.trim(),
    events: body.events ?? [],
    timezone:
      body.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
  })
  return NextResponse.json(result)
}
