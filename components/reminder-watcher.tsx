"use client"

import { useEffect } from "react"
import { parseISO } from "date-fns"
import { useEvents } from "@/components/events-provider"
import { isDueSoon } from "@/lib/dates"

export function ReminderWatcher() {
  const { events } = useEvents()

  useEffect(() => {
    if (typeof window === "undefined" || !("Notification" in window)) return
    if (Notification.permission === "default") {
      void Notification.requestPermission()
    }
  }, [])

  useEffect(() => {
    if (typeof window === "undefined" || Notification.permission !== "granted") {
      return
    }
    const soon = events.filter(
      (event) => !event.completed && isDueSoon(parseISO(event.start_time))
    )
    const key = "campussync.notified"
    const notified = new Set<string>(
      JSON.parse(sessionStorage.getItem(key) || "[]")
    )
    for (const event of soon) {
      if (notified.has(event.id)) continue
      new Notification("Due soon on CampusSync", { body: event.title })
      notified.add(event.id)
    }
    sessionStorage.setItem(key, JSON.stringify([...notified]))
  }, [events])

  return null
}
