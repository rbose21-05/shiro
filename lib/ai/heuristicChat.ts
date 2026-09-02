import {
  addDays,
  format,
  nextDay,
  parse,
  isValid,
  startOfDay,
} from "date-fns"
import type { CalendarEvent } from "@/lib/types"
import type { ChatResponse, ExtractedEvent } from "@/lib/ai/schemas"

const MONTHS: Record<string, number> = {
  jan: 0,
  january: 0,
  feb: 1,
  february: 1,
  mar: 2,
  march: 2,
  apr: 3,
  april: 3,
  may: 4,
  jun: 5,
  june: 5,
  jul: 6,
  july: 6,
  aug: 7,
  august: 7,
  sep: 8,
  sept: 8,
  september: 8,
  oct: 9,
  october: 9,
  nov: 10,
  november: 10,
  dec: 11,
  december: 11,
}

const WEEKDAYS = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
] as const

function guessType(title: string): ExtractedEvent["type"] {
  const t = title.toLowerCase()
  if (/\b(party|hang|rager|social|mixer)\b/.test(t)) return "social"
  if (/\b(exam|midterm|final|quiz)\b/.test(t)) return "exam"
  if (/\b(due|essay|hw|homework|assignment|problem set)\b/.test(t))
    return "assignment"
  if (/\b(lab|lecture|class|seminar)\b/.test(t)) return "class"
  if (/\b(club|meeting|org)\b/.test(t)) return "club"
  return "other"
}

function parseTime(message: string): string | null {
  const match = message.match(/\b(\d{1,2})(?::(\d{2}))?\s*(am|pm)\b/i)
  if (!match) return null
  let hour = Number(match[1])
  const minute = match[2] ? Number(match[2]) : 0
  const mer = match[3].toLowerCase()
  if (mer === "pm" && hour < 12) hour += 12
  if (mer === "am" && hour === 12) hour = 0
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`
}

function parseDate(message: string, reference: Date): string | null {
  const iso = message.match(/\b(20\d{2}-\d{2}-\d{2})\b/)
  if (iso) return iso[1]

  const monthNames = Object.keys(MONTHS).join("|")
  const day = "(\\d{1,2})(?:st|nd|rd|th)?"
  const monthThenDay = message.match(
    new RegExp(`\\b(${monthNames})\\.?\\s+${day}\\b`, "i")
  )
  const dayThenMonth = message.match(
    new RegExp(`\\b(?:the\\s+)?${day}\\s+(?:of\\s+)?(${monthNames})\\.?\\b`, "i")
  )
  const parts = monthThenDay ?? dayThenMonth
  if (parts) {
    const monthToken = (monthThenDay ? parts[1] : parts[2]).toLowerCase()
    const dayNum = Number(monthThenDay ? parts[2] : parts[1])
    const month = MONTHS[monthToken]
    if (month != null && dayNum >= 1 && dayNum <= 31) {
      let year = reference.getFullYear()
      const candidate = new Date(year, month, dayNum)
      if (candidate < startOfDay(reference)) year += 1
      return format(new Date(year, month, dayNum), "yyyy-MM-dd")
    }
  }

  const slash = message.match(/\b(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?\b/)
  if (slash) {
    const year = slash[3]
      ? slash[3].length === 2
        ? `20${slash[3]}`
        : slash[3]
      : String(reference.getFullYear())
    return `${year}-${slash[1].padStart(2, "0")}-${slash[2].padStart(2, "0")}`
  }

  for (let i = 0; i < WEEKDAYS.length; i++) {
    if (message.includes(WEEKDAYS[i])) {
      return format(nextDay(reference, i as 0 | 1 | 2 | 3 | 4 | 5 | 6), "yyyy-MM-dd")
    }
  }
  if (/\btoday\b/.test(message)) return format(reference, "yyyy-MM-dd")
  if (/\btomorrow\b/.test(message))
    return format(addDays(reference, 1), "yyyy-MM-dd")
  return null
}

function extractTitle(message: string): string {
  const named = message.match(
    /(?:titled|titles|called|named)\s+(.+?)(?:\s+on\s+|\s+for\s+|\s+at\s+|$)/i
  )
  if (named?.[1]) return named[1].trim()

  const add = message.match(
    /(?:add|create|schedule|make)\s+(?:an?\s+)?(?:event\s+)?(.+?)(?:\s+on\s+|\s+for\s+|\s+at\s+|$)/i
  )
  if (add?.[1]) {
    return add[1]
      .replace(/^(an?\s+)?(event\s+)?(called|named|titled|titles)\s+/i, "")
      .trim()
  }
  return message.slice(0, 48).trim() || "New event"
}

function findEvent(message: string, events: CalendarEvent[]) {
  const lower = message.toLowerCase()
  return events.find((event) => {
    const title = event.title.toLowerCase()
    return title.length > 2 && lower.includes(title)
  })
}

export function heuristicChat(
  message: string,
  events: CalendarEvent[],
  referenceDate: string
): ChatResponse {
  const lower = message.toLowerCase()
  const now = parse(referenceDate, "yyyy-MM-dd", new Date())
  const ref = isValid(now) ? now : new Date()
  const date = parseDate(lower, ref)
  const time = parseTime(lower)

  const wantsDue =
    /\b(due|this week|what do i have|what's on|whats on|agenda|summarize)\b/.test(
      lower
    )
  const wantsClear = /\b(clear|wipe|free up|empty)\b/.test(lower)
  const wantsMove = /\b(move|reschedule|shift|push)\b/.test(lower)
  const wantsAdd =
    /\b(add|create|schedule|make|new event|party|hangout)\b/.test(lower) &&
    !wantsMove &&
    !wantsClear

  if (wantsDue) {
    const upcoming = events
      .filter((e) => !e.completed)
      .slice(0, 8)
      .map((e) => `• ${e.title} (${e.category})`)
      .join("\n")
    return {
      type: "answer",
      message: upcoming
        ? `Here's what's on your plate:\n${upcoming}`
        : "Your calendar looks clear. Add something — try “add a party on Oct 3”.",
      proposedEvents: [],
      mutations: [],
    }
  }

  if (wantsClear && date) {
    const label = format(parse(date, "yyyy-MM-dd", new Date()), "EEEE, MMM d")
    return {
      type: "mutation",
      message: `I’ll clear ${label} if you confirm. Nothing is deleted until you tap add.`,
      proposedEvents: [],
      mutations: [
        {
          action: "clear_day",
          date,
          source_snippet: message,
        },
      ],
    }
  }

  if (wantsMove) {
    const match = findEvent(lower, events)
    if (match && date) {
      const proposed: ExtractedEvent = {
        title: match.title,
        type: guessType(match.title),
        date,
        time: time ?? format(new Date(match.start_time), "HH:mm"),
        end_time: null,
        location: match.location,
        recurrence: match.recurrence_rule,
        confidence: 0.72,
        source_snippet: message,
      }
      return {
        type: "mutation",
        message: `Proposed: move “${match.title}” to ${date}${time ? ` at ${time}` : ""}. Review before it lands.`,
        proposedEvents: [proposed],
        mutations: [
          {
            action: "update",
            event_id: match.id,
            title: match.title,
            date,
            time: proposed.time,
            source_snippet: message,
          },
        ],
      }
    }
  }

  if (wantsAdd) {
    const title = extractTitle(message)
    const proposed: ExtractedEvent = {
      title,
      type: guessType(title + " " + lower),
      date,
      time,
      end_time: null,
      location: null,
      recurrence: null,
      confidence: date ? 0.78 : 0.45,
      source_snippet: message,
    }
    const when = date
      ? ` on ${format(parse(date, "yyyy-MM-dd", new Date()), "MMM d")}`
      : " (pick a date in the review)"
    return {
      type: "mutation",
      message: `Proposed: add “${title}”${when}. Confirm on the review cards — I won’t save it silently.`,
      proposedEvents: [proposed],
      mutations: [
        {
          action: "create",
          title,
          type: proposed.type,
          date,
          time,
          source_snippet: message,
        },
      ],
    }
  }

  return {
    type: "answer",
    message:
      "I can add things (“party on Oct 3”), move a lab, summarize due dates, or clear Saturday. I’ll always show a review first.",
    proposedEvents: [],
    mutations: [],
  }
}
