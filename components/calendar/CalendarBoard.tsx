"use client"

import { useEffect, useMemo, useState } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { addDays, addMonths, format } from "date-fns"
import { AnimatePresence, motion } from "framer-motion"
import {
  CalendarDaysIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ListIcon,
  PlusIcon,
  SearchIcon,
} from "lucide-react"
import { WeekView } from "@/components/calendar/WeekView"
import { MonthView } from "@/components/calendar/MonthView"
import { AgendaView } from "@/components/calendar/AgendaView"
import { EventDialog } from "@/components/events/EventDialog"
import { AddSomething } from "@/components/capture/AddSomething"
import { useEvents } from "@/components/events-provider"
import { expandRecurring } from "@/lib/recurrence"
import { combineDateAndTime, shiftEventTimes, weekRange } from "@/lib/dates"
import { celebrate } from "@/lib/confetti"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { CalendarEvent, CalendarView, EventDraft } from "@/lib/types"

function initialFromParams(params: URLSearchParams) {
  const year = Number(params.get("year"))
  const month = Number(params.get("month"))
  const viewParam = params.get("view")
  const view: CalendarView =
    viewParam === "month" || viewParam === "agenda" || viewParam === "week"
      ? viewParam
      : month
        ? "month"
        : "week"
  const anchor =
    year && month
      ? new Date(year, month - 1, 1)
      : new Date()
  return { view, anchor }
}

export function CalendarBoard() {
  const params = useSearchParams()
  const initial = initialFromParams(params)
  const { events, createEvent, updateEvent, deleteEvent, completeEvent, loading, profile } =
    useEvents()
  const [anchor, setAnchor] = useState(initial.anchor)
  const [view, setView] = useState<CalendarView>(initial.view)
  const [query, setQuery] = useState("")
  const [editing, setEditing] = useState<CalendarEvent | null>(null)
  const [creating, setCreating] = useState<Partial<EventDraft> | null>(null)
  const [captureOpen, setCaptureOpen] = useState(false)

  useEffect(() => {
    if (!profile.google_sync_enabled) return
    const pull = () =>
      fetch("/api/google/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ direction: "pull" }),
      }).catch(() => null)
    void pull()
    const id = setInterval(pull, 5 * 60 * 1000)
    return () => clearInterval(id)
  }, [profile.google_sync_enabled])

  const visible = useMemo(() => {
    const range =
      view === "month"
        ? { start: addDays(anchor, -7), end: addDays(anchor, 40) }
        : view === "agenda"
          ? { start: new Date(), end: addDays(new Date(), 21) }
          : weekRange(anchor)
    const expanded = expandRecurring(events, range.start, range.end)
    const q = query.trim().toLowerCase()
    return expanded.filter((event) => {
      if (!q) return true
      return (
        event.title.toLowerCase().includes(q) ||
        (event.location ?? "").toLowerCase().includes(q) ||
        (event.description ?? "").toLowerCase().includes(q)
      )
    })
  }, [anchor, events, query, view])

  function shift(dir: -1 | 1) {
    if (view === "month") setAnchor(addMonths(anchor, dir))
    else setAnchor(addDays(anchor, dir * 7))
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl tracking-tight">
            {format(anchor, view === "month" ? "MMMM yyyy" : "'Week of' MMM d")}
          </h1>
          <p className="text-sm text-muted-foreground">
            <Link href="/" className="underline underline-offset-4">
              Year wall
            </Link>
            {" · "}
            Capture a syllabus, then review before it lands.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="icon-sm" onClick={() => shift(-1)}>
            <ChevronLeftIcon />
          </Button>
          <Button variant="outline" size="sm" onClick={() => setAnchor(new Date())}>
            Today
          </Button>
          <Button variant="outline" size="icon-sm" onClick={() => shift(1)}>
            <ChevronRightIcon />
          </Button>
          <Tabs
            value={view}
            onValueChange={(value) => setView(value as CalendarView)}
          >
            <TabsList>
              <TabsTrigger value="week">
                <CalendarDaysIcon /> Week
              </TabsTrigger>
              <TabsTrigger value="month">Month</TabsTrigger>
              <TabsTrigger value="agenda">
                <ListIcon /> Agenda
              </TabsTrigger>
            </TabsList>
          </Tabs>
          <Button onClick={() => setCaptureOpen(true)}>
            <PlusIcon /> Add something
          </Button>
        </div>
      </div>

      <div className="relative">
        <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search events, rooms, professors…"
          className="h-10 pl-9"
        />
      </div>

      {loading ? (
        <div className="h-96 animate-pulse rounded-2xl bg-muted" />
      ) : (
        <AnimatePresence mode="wait">
          <motion.div
            key={view}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
          >
            {view === "week" ? (
              <WeekView
                anchor={anchor}
                events={visible}
                onSelect={setEditing}
                onReschedule={async (event, day, hour, minute) => {
                  if (event.id === "__new__") return
                  const next = combineDateAndTime(day, hour, minute)
                  const times = shiftEventTimes(
                    event.start_time,
                    event.end_time,
                    next
                  )
                  await updateEvent(event.id.split("::")[0], times)
                }}
                onCreateAt={(day, hour, minute) => {
                  const start = combineDateAndTime(day, hour, minute)
                  setCreating({
                    title: "",
                    category: "personal",
                    start_time: start.toISOString(),
                    end_time: new Date(start.getTime() + 60 * 60 * 1000).toISOString(),
                  })
                }}
              />
            ) : null}
            {view === "month" ? (
              <MonthView
                anchor={anchor}
                events={visible}
                onSelect={setEditing}
                onSelectDay={(day) => {
                  setAnchor(day)
                  setView("agenda")
                }}
              />
            ) : null}
            {view === "agenda" ? (
              <AgendaView
                events={visible}
                onSelect={setEditing}
                onComplete={async (event) => {
                  await completeEvent(event.id.split("::")[0], !event.completed)
                  if (!event.completed) celebrate()
                }}
              />
            ) : null}
          </motion.div>
        </AnimatePresence>
      )}

      <EventDialog
        event={editing}
        draft={creating}
        onClose={() => {
          setEditing(null)
          setCreating(null)
        }}
        onSave={async (draft, id) => {
          if (id) await updateEvent(id.split("::")[0], draft)
          else await createEvent(draft)
          setEditing(null)
          setCreating(null)
        }}
        onDelete={async (id) => {
          await deleteEvent(id.split("::")[0])
          setEditing(null)
        }}
      />

      <AddSomething open={captureOpen} onOpenChange={setCaptureOpen} />
    </div>
  )
}
