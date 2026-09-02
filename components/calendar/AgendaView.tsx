"use client"

import { format, isSameDay, parseISO, startOfDay } from "date-fns"
import { formatRange } from "@/lib/dates"
import { CATEGORY_LABEL, categoryColor } from "@/lib/categories"
import { Button } from "@/components/ui/button"
import { CheckIcon, MapPinIcon } from "lucide-react"
import type { CalendarEvent } from "@/lib/types"

export function AgendaView({
  events,
  onSelect,
  onComplete,
}: {
  events: CalendarEvent[]
  onSelect: (event: CalendarEvent) => void
  onComplete: (event: CalendarEvent) => void
}) {
  const sorted = [...events].sort(
    (a, b) =>
      parseISO(a.start_time).getTime() - parseISO(b.start_time).getTime()
  )
  const groups: { day: Date; items: CalendarEvent[] }[] = []
  for (const event of sorted) {
    const day = startOfDay(parseISO(event.start_time))
    const last = groups[groups.length - 1]
    if (last && isSameDay(last.day, day)) last.items.push(event)
    else groups.push({ day, items: [event] })
  }

  if (groups.length === 0) {
    return (
      <div className="rounded-2xl border bg-card p-10 text-center shadow-sm">
        <p className="font-heading text-lg">Nothing on the horizon</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Drop a syllabus screenshot or type “essay due Friday” to fill this up.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {groups.map((group) => (
        <section key={group.day.toISOString()}>
          <h3 className="mb-2 font-heading text-sm font-medium text-muted-foreground">
            {format(group.day, "EEEE, MMM d")}
          </h3>
          <div className="space-y-2">
            {group.items.map((event) => (
              <div
                key={event.id}
                className="flex items-start gap-3 rounded-2xl border bg-card p-3 shadow-sm"
              >
                <div
                  className="mt-1 size-2.5 shrink-0 rounded-full"
                  style={{ background: categoryColor(event.category) }}
                />
                <button
                  type="button"
                  className="min-w-0 flex-1 text-left"
                  onClick={() => onSelect(event)}
                >
                  <div className="font-medium">{event.title}</div>
                  <div className="text-xs text-muted-foreground">
                    {formatRange(
                      parseISO(event.start_time),
                      event.end_time ? parseISO(event.end_time) : null,
                      event.all_day
                    )}{" "}
                    · {CATEGORY_LABEL[event.category]}
                  </div>
                  {event.location ? (
                    <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPinIcon className="size-3" />
                      {event.location}
                    </div>
                  ) : null}
                </button>
                <Button
                  size="icon-sm"
                  variant={event.completed ? "secondary" : "outline"}
                  onClick={() => onComplete(event)}
                  aria-label="Mark done"
                >
                  <CheckIcon />
                </Button>
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}
