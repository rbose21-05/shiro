import { addDays, isBefore, parseISO } from "date-fns"
import { RRule } from "rrule"
import type { CalendarEvent } from "@/lib/types"

function parseRRule(rule: string, dtstart: Date) {
  try {
    if (rule.toUpperCase().startsWith("RRULE:")) {
      return RRule.fromString(`DTSTART:${toRRuleDate(dtstart)}\n${rule}`)
    }
    return new RRule({
      ...RRule.parseString(rule),
      dtstart,
    })
  } catch {
    return null
  }
}

function toRRuleDate(date: Date) {
  const y = date.getUTCFullYear()
  const m = String(date.getUTCMonth() + 1).padStart(2, "0")
  const d = String(date.getUTCDate()).padStart(2, "0")
  const hh = String(date.getUTCHours()).padStart(2, "0")
  const mm = String(date.getUTCMinutes()).padStart(2, "0")
  const ss = String(date.getUTCSeconds()).padStart(2, "0")
  return `${y}${m}${d}T${hh}${mm}${ss}Z`
}

export function expandRecurring(
  events: CalendarEvent[],
  rangeStart: Date,
  rangeEnd: Date
): CalendarEvent[] {
  const expanded: CalendarEvent[] = []

  for (const event of events) {
    if (!event.recurrence_rule) {
      expanded.push(event)
      continue
    }

    const start = parseISO(event.start_time)
    const duration =
      event.end_time != null
        ? parseISO(event.end_time).getTime() - start.getTime()
        : 60 * 60 * 1000
    const rule = parseRRule(event.recurrence_rule, start)
    if (!rule) {
      expanded.push(event)
      continue
    }

    const occurrences = rule.between(rangeStart, addDays(rangeEnd, 1), true)
    if (occurrences.length === 0 && isBefore(start, rangeEnd)) {
      expanded.push(event)
      continue
    }

    for (const occ of occurrences) {
      expanded.push({
        ...event,
        id: `${event.id}::${occ.toISOString()}`,
        start_time: occ.toISOString(),
        end_time: new Date(occ.getTime() + duration).toISOString(),
      })
    }
  }

  return expanded
}

export const WEEKLY_RRULE = "FREQ=WEEKLY"
