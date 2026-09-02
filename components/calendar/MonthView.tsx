"use client"

import {
  addDays,
  endOfMonth,
  format,
  isSameMonth,
  parseISO,
  startOfMonth,
  startOfWeek,
} from "date-fns"
import { WEEK_STARTS_ON, todayKey } from "@/lib/dates"
import { categoryColor } from "@/lib/categories"
import { cn } from "@/lib/utils"
import type { CalendarEvent } from "@/lib/types"

export function MonthView({
  anchor,
  events,
  onSelectDay,
  onSelect,
}: {
  anchor: Date
  events: CalendarEvent[]
  onSelectDay: (day: Date) => void
  onSelect: (event: CalendarEvent) => void
}) {
  const start = startOfWeek(startOfMonth(anchor), { weekStartsOn: WEEK_STARTS_ON })
  const end = endOfMonth(anchor)
  const cells: Date[] = []
  for (let d = start; d <= addDays(end, 6 - end.getDay()); d = addDays(d, 1)) {
    cells.push(d)
    if (cells.length >= 42) break
  }
  const today = todayKey()

  return (
    <div className="overflow-hidden rounded-2xl border bg-card shadow-sm">
      <div className="grid grid-cols-7 border-b bg-muted/40 text-center text-xs font-medium text-muted-foreground">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
          <div key={d} className="p-2">
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {cells.map((day) => {
          const key = todayKey(day)
          const dayEvents = events.filter(
            (e) => todayKey(parseISO(e.start_time)) === key
          )
          const load = dayEvents.filter((e) =>
            ["assignment", "exam"].includes(e.category)
          ).length
          return (
            <button
              type="button"
              key={key}
              onClick={() => onSelectDay(day)}
              className={cn(
                "min-h-24 border-b border-r p-1.5 text-left align-top",
                !isSameMonth(day, anchor) && "bg-muted/30 text-muted-foreground",
                key === today && "bg-primary/8"
              )}
            >
              <div className="mb-1 flex items-center justify-between">
                <span className="text-xs font-medium">{format(day, "d")}</span>
                {load > 0 ? (
                  <span className="size-1.5 rounded-full bg-primary" />
                ) : null}
              </div>
              <div className="space-y-1">
                {dayEvents.slice(0, 3).map((event) => (
                  <button
                    key={event.id}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      onSelect(event)
                    }}
                    className="block w-full truncate rounded px-1 py-0.5 text-[10px] font-medium"
                    style={{
                      background: `color-mix(in oklch, ${categoryColor(event.category)} 28%, white)`,
                    }}
                  >
                    {event.title}
                  </button>
                ))}
                {dayEvents.length > 3 ? (
                  <div className="text-[10px] text-muted-foreground">
                    +{dayEvents.length - 3} more
                  </div>
                ) : null}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
