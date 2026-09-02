"use client"

import { parseISO } from "date-fns"
import { CATEGORY_LABEL, categoryColor } from "@/lib/categories"
import { dueChip, formatTime, isDueSoon } from "@/lib/dates"
import { cn } from "@/lib/utils"
import type { CalendarEvent } from "@/lib/types"

export function EventChip({
  event,
  dense = false,
  onClick,
  onPointerDown,
  dragging,
}: {
  event: CalendarEvent
  dense?: boolean
  onClick?: () => void
  onPointerDown?: (e: React.PointerEvent) => void
  dragging?: boolean
}) {
  const start = parseISO(event.start_time)
  const chip = dueChip(start)
  const soon = isDueSoon(start) && !event.completed
  const color = categoryColor(event.category)

  return (
    <button
      type="button"
      onClick={onClick}
      onPointerDown={onPointerDown}
      className={cn(
        "w-full rounded-lg border px-2 py-1 text-left shadow-sm transition hover:brightness-95",
        dense ? "text-[11px] leading-tight" : "text-xs",
        event.completed && "opacity-50 line-through",
        soon && "due-soon",
        dragging && "opacity-70 ring-2 ring-primary"
      )}
      style={{
        background: `color-mix(in oklch, ${color} 22%, white)`,
        borderColor: `color-mix(in oklch, ${color} 55%, transparent)`,
        color: "var(--foreground)",
      }}
    >
      <div className="flex items-start justify-between gap-1">
        <span className="font-medium">{event.title}</span>
        {chip ? (
          <span
            className="shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-semibold text-white"
            style={{ background: color }}
          >
            {chip}
          </span>
        ) : null}
      </div>
      {!dense ? (
        <div className="mt-0.5 text-[10px] opacity-70">
          {event.all_day ? "All day" : formatTime(start)} · {CATEGORY_LABEL[event.category]}
        </div>
      ) : null}
    </button>
  )
}
