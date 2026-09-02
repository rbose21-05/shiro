import { format, nextDay, parseISO } from "date-fns"
import { hasGeminiKey, hasGroqKey } from "@/lib/config"
import { geminiExtract } from "@/lib/ai/providers/gemini"
import { groqExtract } from "@/lib/ai/providers/groq"
import type { ExtractedEvent } from "@/lib/ai/schemas"

export type ExtractInput = {
  text?: string
  imageBase64?: string
  mimeType?: string
  referenceDate?: string
  timezone?: string
}

export type ExtractResult = {
  events: ExtractedEvent[]
  provider: "gemini" | "groq" | "heuristic"
  usedFallback: boolean
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

function heuristicExtract(text: string, referenceDate: string): ExtractedEvent[] {
  const now = parseISO(`${referenceDate}T12:00:00`)
  const lines = text
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean)
  const events: ExtractedEvent[] = []

  for (const line of lines) {
    const lower = line.toLowerCase()
    let date: string | null = null
    for (let i = 0; i < WEEKDAYS.length; i++) {
      if (lower.includes(WEEKDAYS[i])) {
        date = format(nextDay(now, i as 0 | 1 | 2 | 3 | 4 | 5 | 6), "yyyy-MM-dd")
        break
      }
    }
    const iso = line.match(/\b(20\d{2}-\d{2}-\d{2})\b/)
    if (iso) date = iso[1]
    const md = line.match(/\b(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?\b/)
    if (md) {
      const year = md[3]
        ? md[3].length === 2
          ? `20${md[3]}`
          : md[3]
        : String(now.getFullYear())
      date = `${year}-${md[1].padStart(2, "0")}-${md[2].padStart(2, "0")}`
    }
    const timeMatch = line.match(/\b(\d{1,2})(?::(\d{2}))?\s*(am|pm)\b/i)
    let time: string | null = null
    if (timeMatch) {
      let hour = Number(timeMatch[1])
      const minute = timeMatch[2] ? Number(timeMatch[2]) : 0
      const mer = timeMatch[3].toLowerCase()
      if (mer === "pm" && hour < 12) hour += 12
      if (mer === "am" && hour === 12) hour = 0
      time = `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`
    }
    const type = lower.includes("exam") || lower.includes("midterm") || lower.includes("final")
      ? "exam"
      : lower.includes("due") || lower.includes("homework") || lower.includes("essay")
        ? "assignment"
        : lower.includes("lab") || lower.includes("lecture") || lower.includes("class")
          ? "class"
          : lower.includes("party") || lower.includes("hang")
            ? "social"
            : "other"
    events.push({
      title: line.slice(0, 80),
      type,
      date,
      time,
      end_time: null,
      location: null,
      recurrence: type === "class" ? "FREQ=WEEKLY" : null,
      confidence: date ? 0.55 : 0.3,
      source_snippet: line.slice(0, 140),
    })
  }

  if (events.length === 0) {
    events.push({
      title: text.slice(0, 60) || "Untitled event",
      type: "other",
      date: referenceDate,
      time: null,
      end_time: null,
      location: null,
      recurrence: null,
      confidence: 0.25,
      source_snippet: text.slice(0, 140),
    })
  }

  return events
}

export async function extractEvents(input: ExtractInput): Promise<ExtractResult> {
  const timezone =
    input.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone
  const referenceDate = input.referenceDate || format(new Date(), "yyyy-MM-dd")
  const text = input.text?.trim()
  let usedFallback = false

  if (input.imageBase64 && hasGeminiKey()) {
    try {
      const events = await geminiExtract({
        text,
        imageBase64: input.imageBase64,
        mimeType: input.mimeType,
        referenceDate,
        timezone,
      })
      return { events, provider: "gemini", usedFallback: false }
    } catch (error) {
      console.error("Gemini vision extract failed", error)
      usedFallback = true
    }
  }

  if (text && hasGeminiKey()) {
    try {
      const events = await geminiExtract({
        text,
        referenceDate,
        timezone,
      })
      return { events, provider: "gemini", usedFallback }
    } catch (error) {
      console.error("Gemini text extract failed", error)
      usedFallback = true
    }
  }

  if (text && hasGroqKey()) {
    try {
      const events = await groqExtract({ text, referenceDate, timezone })
      return { events, provider: "groq", usedFallback: usedFallback || true }
    } catch (error) {
      console.error("Groq extract failed", error)
      usedFallback = true
    }
  }

  if (!text) {
    return {
      events: [
        {
          title: "Event from screenshot",
          type: "other",
          date: referenceDate,
          time: null,
          end_time: null,
          location: null,
          recurrence: null,
          confidence: 0.2,
          source_snippet: "AI keys missing — add GEMINI_API_KEY to parse images.",
        },
      ],
      provider: "heuristic",
      usedFallback: true,
    }
  }

  return {
    events: heuristicExtract(text, referenceDate),
    provider: "heuristic",
    usedFallback: true,
  }
}
