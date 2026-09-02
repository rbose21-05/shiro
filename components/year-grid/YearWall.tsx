"use client"

import { useMemo, useState } from "react"
import { parseISO } from "date-fns"
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react"
import { MonthCard } from "@/components/year-grid/MonthCard"
import { Basket } from "@/components/year-grid/Basket"
import { useEvents } from "@/components/events-provider"
import { expandRecurring } from "@/lib/recurrence"

export function YearWall() {
  const [year, setYear] = useState(() => new Date().getFullYear())
  const { events } = useEvents()

  const marks = useMemo(() => {
    const map: Record<number, number[]> = {}
    const start = new Date(year, 0, 1)
    const end = new Date(year, 11, 31)
    const expanded = expandRecurring(events, start, end)
    for (const event of expanded) {
      const d = parseISO(event.start_time)
      if (d.getFullYear() !== year) continue
      const m = d.getMonth()
      const day = d.getDate()
      map[m] ??= []
      if (!map[m].includes(day)) map[m].push(day)
    }
    return map
  }, [events, year])

  return (
    <div className="relative min-h-dvh overflow-x-hidden bg-[#c9a4a9] text-[#3a2430]">
      <div
        className="pointer-events-none absolute inset-0 opacity-35 mix-blend-multiply"
        style={{
          backgroundImage:
            "radial-gradient(#7a4450 0.7px, transparent 0.7px), radial-gradient(#8a5060 0.6px, transparent 0.6px)",
          backgroundPosition: "0 0, 8px 10px",
          backgroundSize: "16px 16px",
        }}
      />

      <header className="relative z-20 mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-5 sm:px-8">
        <div>
          <p className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
            CampusSync
          </p>
          <p className="text-sm text-[#3a2430]/70">
            Dig through the basket. Pick a month.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setYear((y) => y - 1)}
            className="grid size-9 place-items-center rounded-full bg-white/40 hover:bg-white/70"
            aria-label="Previous year"
          >
            <ChevronLeftIcon className="size-4" />
          </button>
          <div className="font-display min-w-16 text-center text-xl font-bold">
            {year}
          </div>
          <button
            type="button"
            onClick={() => setYear((y) => y + 1)}
            className="grid size-9 place-items-center rounded-full bg-white/40 hover:bg-white/70"
            aria-label="Next year"
          >
            <ChevronRightIcon className="size-4" />
          </button>
          <a
            href="/login"
            className="ml-2 rounded-full bg-[#3a2430] px-3 py-1.5 text-sm font-medium text-[#f7efe8]"
          >
            Sign in
          </a>
        </div>
      </header>

      <main className="relative mx-auto w-full max-w-5xl px-2 pb-10 sm:px-6">
        <div className="relative mx-auto aspect-[8/7] w-full min-h-[34rem] sm:min-h-[40rem]">
          <Basket />
          <div className="absolute inset-[12%_10%_8%] sm:inset-[14%_12%_10%]">
            {Array.from({ length: 12 }, (_, monthIndex) => (
              <MonthCard
                key={monthIndex}
                year={year}
                monthIndex={monthIndex}
                markedDays={marks[monthIndex] ?? []}
              />
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}
