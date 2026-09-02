"use client"

import { useRef } from "react"
import { isSameDay, parseISO } from "date-fns"
import { daysOfWeek, formatDayHeading, hoursInDay, todayKey } from "@/lib/dates"
import { EventChip } from "@/components/calendar/EventChip"
import { cn } from "@/lib/utils"
import type { CalendarEvent } from "@/lib/types"

const START_HOUR = 7
const END_HOUR = 22
const HOUR_HEIGHT = 56

function eventTop(event: CalendarEvent) {
  const start = parseISO(event.start_time)
  const hours = start.getHours() + start.getMinutes() / 60
  return (hours - START_HOUR) * HOUR_HEIGHT
}

function eventHeight(event: CalendarEvent) {
  if (event.all_day) return 28
  const start = parseISO(event.start_time)
  const end = event.end_time
    ? parseISO(event.end_time)
    : new Date(start.getTime() + 60 * 60 * 1000)
  const hours = Math.max(0.5, (end.getTime() - start.getTime()) / 3600000)
  return hours * HOUR_HEIGHT
}

function slotFromPoint(column: HTMLElement, clientY: number) {
  const rect = column.getBoundingClientRect()
  const hourFloat = START_HOUR + (clientY - rect.top) / HOUR_HEIGHT
  const hour = Math.min(END_HOUR, Math.max(START_HOUR, Math.floor(hourFloat)))
  const minute = hourFloat % 1 >= 0.5 ? 30 : 0
  return { hour, minute }
}

export function WeekView({
  anchor,
  events,
  onSelect,
  onReschedule,
  onCreateAt,
}: {
  anchor: Date
  events: CalendarEvent[]
  onSelect: (event: CalendarEvent) => void
  onReschedule: (event: CalendarEvent, day: Date, hour: number, minute: number) => void
  onCreateAt: (day: Date, hour: number, minute: number) => void
}) {
  const gridRef = useRef<HTMLDivElement>(null)
  const days = daysOfWeek(anchor)
  const hours = hoursInDay(START_HOUR, END_HOUR)
  const today = todayKey()

  return (
    <div className="overflow-x-auto rounded-2xl border bg-card shadow-sm">
      <div
        ref={gridRef}
        className="grid min-w-[720px]"
        style={{ gridTemplateColumns: "3.5rem repeat(7, 1fr)" }}
      >
        <div className="border-b bg-muted/40 p-2" />
        {days.map((day) => {
          const key = todayKey(day)
          const load = events.filter(
            (e) =>
              isSameDay(parseISO(e.start_time), day) &&
              ["assignment", "exam"].includes(e.category)
          ).length
          const heat =
            load >= 4
              ? "heatmap-4"
              : load === 3
                ? "heatmap-3"
                : load === 2
                  ? "heatmap-2"
                  : load === 1
                    ? "heatmap-1"
                    : ""
          return (
            <div
              key={key}
              className={cn(
                "border-b border-l p-2 text-center",
                key === today && "bg-primary/8",
                heat
              )}
            >
              <div className="text-xs font-medium">{formatDayHeading(day)}</div>
              {load > 0 ? (
                <div className="text-[10px] text-muted-foreground">{load} due</div>
              ) : null}
            </div>
          )
        })}

        <div>
          {hours.map((hour) => (
            <div
              key={hour}
              className="border-b pr-1 text-right text-[10px] text-muted-foreground"
              style={{ height: HOUR_HEIGHT }}
            >
              {hour > 12 ? hour - 12 : hour}
              {hour >= 12 ? "p" : "a"}
            </div>
          ))}
        </div>

        {days.map((day, dayIndex) => {
          const dayEvents = events.filter((e) =>
            isSameDay(parseISO(e.start_time), day)
          )
          return (
            <div
              key={todayKey(day)}
              data-day-col={dayIndex}
              className="relative border-l"
              onDoubleClick={(e) => {
                const { hour, minute } = slotFromPoint(
                  e.currentTarget,
                  e.clientY
                )
                onCreateAt(day, hour, minute)
              }}
            >
              {hours.map((hour) => (
                <div
                  key={hour}
                  className="border-b border-dashed border-border/70"
                  style={{ height: HOUR_HEIGHT }}
                />
              ))}
              {dayEvents.map((event) => (
                <div
                  key={event.id}
                  className="absolute inset-x-1 z-10 cursor-grab active:cursor-grabbing"
                  style={{
                    top: Math.max(2, eventTop(event)),
                    height: Math.max(24, eventHeight(event)),
                  }}
                >
                  <EventChip
                    event={event}
                    dense
                    onClick={() => onSelect(event)}
                    onPointerDown={(pointerEvent) => {
                      if (pointerEvent.button !== 0) return
                      const startX = pointerEvent.clientX
                      const startY = pointerEvent.clientY
                      const handleUp = (up: PointerEvent) => {
                        window.removeEventListener("pointerup", handleUp)
                        if (
                          Math.abs(up.clientX - startX) < 8 &&
                          Math.abs(up.clientY - startY) < 8
                        ) {
                          return
                        }
                        const columns =
                          gridRef.current?.querySelectorAll("[data-day-col]")
                        if (!columns) return
                        let targetDay = day
                        let targetCol: HTMLElement | null = null
                        columns.forEach((node, index) => {
                          const rect = node.getBoundingClientRect()
                          if (up.clientX >= rect.left && up.clientX <= rect.right) {
                            targetDay = days[index]
                            targetCol = node as HTMLElement
                          }
                        })
                        if (!targetCol) return
                        const { hour, minute } = slotFromPoint(targetCol, up.clientY)
                        onReschedule(event, targetDay, hour, minute)
                      }
                      window.addEventListener("pointerup", handleUp)
                    }}
                  />
                </div>
              ))}
            </div>
          )
        })}
      </div>
    </div>
  )
}
