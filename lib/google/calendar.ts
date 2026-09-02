import type { calendar_v3 } from "googleapis"
import type { CalendarEvent, EventCategory } from "@/lib/types"
import { calendarClient } from "@/lib/google/oauth"

function categoryFromColor(colorId?: string | null): EventCategory {
  switch (colorId) {
    case "9":
    case "1":
      return "class"
    case "11":
    case "4":
      return "exam"
    case "6":
      return "assignment"
    case "3":
      return "social"
    case "2":
    case "10":
      return "club"
    default:
      return "personal"
  }
}

function colorForCategory(category: EventCategory) {
  switch (category) {
    case "class":
      return "9"
    case "exam":
      return "11"
    case "assignment":
      return "6"
    case "social":
      return "3"
    case "club":
      return "10"
    default:
      return "8"
  }
}

function toGoogleEvent(event: CalendarEvent): calendar_v3.Schema$Event {
  if (event.all_day) {
    const day = event.start_time.slice(0, 10)
    return {
      summary: event.title,
      description: event.description ?? undefined,
      location: event.location ?? undefined,
      start: { date: day },
      end: { date: (event.end_time ?? event.start_time).slice(0, 10) },
      recurrence: event.recurrence_rule
        ? [`RRULE:${event.recurrence_rule.replace(/^RRULE:/, "")}`]
        : undefined,
      colorId: colorForCategory(event.category),
    }
  }
  return {
    summary: event.title,
    description: event.description ?? undefined,
    location: event.location ?? undefined,
    start: { dateTime: event.start_time },
    end: { dateTime: event.end_time ?? event.start_time },
    recurrence: event.recurrence_rule
      ? [`RRULE:${event.recurrence_rule.replace(/^RRULE:/, "")}`]
      : undefined,
    colorId: colorForCategory(event.category),
  }
}

export async function listGoogleCalendars(refreshToken: string) {
  const calendar = calendarClient(refreshToken)
  const { data } = await calendar.calendarList.list()
  return (data.items ?? []).map((item) => ({
    id: item.id!,
    summary: item.summary || item.id!,
    primary: Boolean(item.primary),
  }))
}

export async function pushEvent(
  refreshToken: string,
  calendarId: string,
  event: CalendarEvent
) {
  const calendar = calendarClient(refreshToken)
  const body = toGoogleEvent(event)
  if (event.google_event_id) {
    const { data } = await calendar.events.patch({
      calendarId,
      eventId: event.google_event_id,
      requestBody: body,
    })
    return data.id ?? event.google_event_id
  }
  const { data } = await calendar.events.insert({
    calendarId,
    requestBody: body,
  })
  return data.id ?? null
}

export async function deleteGoogleEvent(
  refreshToken: string,
  calendarId: string,
  googleEventId: string
) {
  const calendar = calendarClient(refreshToken)
  await calendar.events.delete({ calendarId, eventId: googleEventId })
}

export async function pullEvents(
  refreshToken: string,
  calendarId: string,
  timeMin: string,
  timeMax: string
) {
  const calendar = calendarClient(refreshToken)
  const { data } = await calendar.events.list({
    calendarId,
    timeMin,
    timeMax,
    singleEvents: true,
    orderBy: "startTime",
    maxResults: 250,
  })
  return (data.items ?? []).map((item) => ({
    google_event_id: item.id!,
    title: item.summary || "(No title)",
    description: item.description ?? null,
    location: item.location ?? null,
    start_time: item.start?.dateTime || `${item.start?.date}T00:00:00.000Z`,
    end_time: item.end?.dateTime || item.end?.date || null,
    all_day: Boolean(item.start?.date && !item.start?.dateTime),
    category: categoryFromColor(item.colorId),
    recurrence_rule: item.recurrence?.[0]?.replace(/^RRULE:/, "") ?? null,
  }))
}
