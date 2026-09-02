import { parseISO, setHours, setMinutes } from "date-fns"
import type { ExtractedEvent } from "@/lib/ai/schemas"

export function extractedToStartEnd(
  event: ExtractedEvent,
  fallbackDate: string
) {
  const date = event.date || fallbackDate
  if (!event.time) {
    const start = parseISO(`${date}T23:59:00`)
    return {
      start_time: start.toISOString(),
      end_time: setMinutes(setHours(start, 23), 59).toISOString(),
      all_day: true,
    }
  }
  const [h, m] = event.time.split(":").map(Number)
  const start = setMinutes(setHours(parseISO(`${date}T00:00:00`), h), m || 0)
  let end = new Date(start.getTime() + 60 * 60 * 1000)
  if (event.end_time) {
    const [eh, em] = event.end_time.split(":").map(Number)
    end = setMinutes(setHours(parseISO(`${date}T00:00:00`), eh), em || 0)
  }
  return {
    start_time: start.toISOString(),
    end_time: end.toISOString(),
    all_day: false,
  }
}
