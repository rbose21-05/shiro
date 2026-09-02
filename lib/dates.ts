import {
  addDays,
  addMinutes,
  differenceInHours,
  differenceInMinutes,
  endOfDay,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isWithinInterval,
  parseISO,
  startOfDay,
  startOfMonth,
  startOfWeek,
} from "date-fns"

export const WEEK_STARTS_ON = 0 as const

export function toDate(value: string | Date) {
  return value instanceof Date ? value : parseISO(value)
}

export function weekRange(anchor: Date) {
  const start = startOfWeek(anchor, { weekStartsOn: WEEK_STARTS_ON })
  const end = endOfWeek(anchor, { weekStartsOn: WEEK_STARTS_ON })
  return { start, end }
}

export function monthRange(anchor: Date) {
  return { start: startOfMonth(anchor), end: endOfMonth(anchor) }
}

export function daysOfWeek(anchor: Date) {
  const { start } = weekRange(anchor)
  return Array.from({ length: 7 }, (_, i) => addDays(start, i))
}

export function hoursInDay(startHour = 7, endHour = 22) {
  return Array.from({ length: endHour - startHour + 1 }, (_, i) => startHour + i)
}

export function formatDayHeading(date: Date) {
  return format(date, "EEE d")
}

export function formatTime(date: Date) {
  return format(date, "h:mm a")
}

export function formatRange(start: Date, end?: Date | null, allDay?: boolean) {
  if (allDay) return format(start, "MMM d")
  if (!end) return `${format(start, "MMM d, h:mm a")}`
  if (isSameDay(start, end)) {
    return `${format(start, "MMM d, h:mm a")} – ${format(end, "h:mm a")}`
  }
  return `${format(start, "MMM d, h:mm a")} – ${format(end, "MMM d, h:mm a")}`
}

export function dueChip(start: Date, now = new Date()) {
  const minutes = differenceInMinutes(start, now)
  if (minutes < 0 || minutes > 48 * 60) return null
  if (minutes < 60) return `Due in ${Math.max(1, minutes)}m`
  const hours = differenceInHours(start, now)
  return `Due in ${hours}h`
}

export function isDueSoon(start: Date, now = new Date()) {
  const minutes = differenceInMinutes(start, now)
  return minutes >= 0 && minutes <= 12 * 60
}

export function combineDateAndTime(date: Date, hours: number, minutes = 0) {
  const next = startOfDay(date)
  next.setHours(hours, minutes, 0, 0)
  return next
}

export function durationMinutes(start: string, end: string | null) {
  if (!end) return 60
  return Math.max(15, differenceInMinutes(parseISO(end), parseISO(start)))
}

export function shiftEventTimes(
  start: string,
  end: string | null,
  newStart: Date
) {
  const length = durationMinutes(start, end)
  return {
    start_time: newStart.toISOString(),
    end_time: addMinutes(newStart, length).toISOString(),
  }
}

export function inRange(iso: string, start: Date, end: Date) {
  const date = parseISO(iso)
  return isWithinInterval(date, { start: startOfDay(start), end: endOfDay(end) })
}

export function toDatetimeLocal(iso: string) {
  return format(parseISO(iso), "yyyy-MM-dd'T'HH:mm")
}

export function fromDatetimeLocal(value: string) {
  return new Date(value).toISOString()
}

export function toDateInput(iso: string | null | undefined) {
  if (!iso) return ""
  return format(parseISO(iso), "yyyy-MM-dd")
}

export function todayKey(date = new Date()) {
  return format(date, "yyyy-MM-dd")
}
