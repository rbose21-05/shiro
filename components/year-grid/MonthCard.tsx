"use client"

import type { CSSProperties } from "react"
import { endOfMonth, format, getDate, getDay, startOfMonth } from "date-fns"
import Link from "next/link"
import { BASKET_SCATTER, MONTH_ABBR, MONTH_PALETTES } from "@/lib/year-palette"
import { cn } from "@/lib/utils"

function monthCells(year: number, monthIndex: number) {
  const start = startOfMonth(new Date(year, monthIndex, 1))
  const end = endOfMonth(start)
  const lead = getDay(start)
  const days = getDate(end)
  const cells: (number | null)[] = Array.from({ length: lead }, () => null)
  for (let d = 1; d <= days; d++) cells.push(d)
  while (cells.length % 7 !== 0) cells.push(null)
  while (cells.length < 42) cells.push(null)
  return cells.slice(0, 42)
}

export function MonthCard({
  year,
  monthIndex,
  markedDays = [],
}: {
  year: number
  monthIndex: number
  markedDays?: number[]
}) {
  const palette = MONTH_PALETTES[monthIndex]
  const scatter = BASKET_SCATTER[monthIndex]
  const cells = monthCells(year, monthIndex)
  const today = new Date()
  const isCurrent =
    today.getFullYear() === year && today.getMonth() === monthIndex
  const marked = new Set(markedDays)

  return (
    <Link
      href={`/app?year=${year}&month=${monthIndex + 1}&view=month`}
      className={cn(
        "group absolute flex aspect-square w-[44%] max-w-52 min-w-32 flex-col overflow-hidden p-[8%] sm:w-[32%] sm:max-w-56 lg:w-[28%]",
        "shadow-[4px_10px_0_rgba(40,18,12,0.28),0_18px_28px_rgba(40,18,12,0.22)]",
        "origin-center transition duration-200 ease-out",
        "z-[var(--stack)] [transform:rotate(var(--tilt))_scale(var(--grow))]",
        "hover:z-50 hover:[transform:rotate(0deg)_scale(1.08)]",
        "focus-visible:z-50 focus-visible:[transform:rotate(0deg)_scale(1.08)] focus-visible:ring-4 focus-visible:ring-white/80 focus-visible:outline-none"
      )}
      style={
        {
          background: palette.bg,
          color: palette.ink,
          left: scatter.left,
          top: scatter.top,
          "--stack": scatter.z,
          "--tilt": `${scatter.rotate}deg`,
          "--grow": scatter.scale,
        } as CSSProperties
      }
      aria-label={`Open ${format(new Date(year, monthIndex, 1), "MMMM yyyy")}`}
    >
      <div
        className="font-display pt-1 text-[clamp(1.6rem,4.4vw,3.4rem)] leading-[0.82] font-bold tracking-tight"
        style={{ color: palette.ink }}
      >
        {MONTH_ABBR[monthIndex]}
      </div>
      <div className="mt-auto grid flex-1 grid-cols-7 content-end gap-px pt-2">
        {cells.map((day, i) => (
          <div
            key={i}
            className="relative flex aspect-square items-center justify-center text-[clamp(0.4rem,1vw,0.65rem)] font-semibold"
            style={{
              boxShadow: `inset 0 0 0 0.5px color-mix(in srgb, ${palette.ink} 35%, transparent)`,
            }}
          >
            {day ?? ""}
            {day && marked.has(day) ? (
              <span
                className="absolute bottom-0.5 size-1 rounded-full"
                style={{ background: palette.ink }}
              />
            ) : null}
            {isCurrent && day === today.getDate() ? (
              <span
                className="absolute inset-0.5 rounded-full"
                style={{ boxShadow: `inset 0 0 0 1.5px ${palette.ink}` }}
              />
            ) : null}
          </div>
        ))}
      </div>
    </Link>
  )
}
