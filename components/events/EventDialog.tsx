"use client"

import { useEffect, useState } from "react"
import { fromDatetimeLocal, toDatetimeLocal } from "@/lib/dates"
import { WEEKLY_RRULE } from "@/lib/recurrence"
import { CATEGORIES } from "@/lib/categories"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { CalendarEvent, EventCategory, EventDraft } from "@/lib/types"

export function EventDialog({
  event,
  draft,
  onClose,
  onSave,
  onDelete,
}: {
  event: CalendarEvent | null
  draft: Partial<EventDraft> | null
  onClose: () => void
  onSave: (draft: EventDraft, id?: string) => Promise<void>
  onDelete: (id: string) => Promise<void>
}) {
  const open = Boolean(event || draft)
  const [title, setTitle] = useState("")
  const [category, setCategory] = useState<EventCategory>("personal")
  const [start, setStart] = useState("")
  const [end, setEnd] = useState("")
  const [allDay, setAllDay] = useState(false)
  const [location, setLocation] = useState("")
  const [description, setDescription] = useState("")
  const [weekly, setWeekly] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const source = event ?? draft
    if (!source) return
    setTitle(source.title ?? "")
    setCategory(source.category ?? "personal")
    setStart(
      source.start_time ? toDatetimeLocal(source.start_time) : toDatetimeLocal(new Date().toISOString())
    )
    setEnd(
      source.end_time
        ? toDatetimeLocal(source.end_time)
        : toDatetimeLocal(new Date(Date.now() + 3600000).toISOString())
    )
    setAllDay(source.all_day ?? false)
    setLocation(source.location ?? "")
    setDescription(("description" in source ? source.description : "") ?? "")
    setWeekly(Boolean(source.recurrence_rule))
  }, [event, draft])

  async function save() {
    setSaving(true)
    try {
      await onSave(
        {
          title: title.trim() || "Untitled",
          category,
          start_time: fromDatetimeLocal(start),
          end_time: end ? fromDatetimeLocal(end) : null,
          all_day: allDay,
          location: location.trim() || null,
          description: description.trim() || null,
          recurrence_rule: weekly ? WEEKLY_RRULE : null,
          source: event?.source ?? "manual",
        },
        event?.id
      )
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{event ? "Edit event" : "New event"}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-3">
          <div className="grid gap-1.5">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Chem lab, essay due, club night…"
            />
          </div>
          <div className="grid gap-1.5">
            <Label>Category</Label>
            <Select
              value={category}
              onValueChange={(value) => setCategory(value as EventCategory)}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((item) => (
                  <SelectItem key={item.id} value={item.id}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <Label htmlFor="start">Starts</Label>
              <Input
                id="start"
                type="datetime-local"
                value={start}
                onChange={(e) => setStart(e.target.value)}
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="end">Ends</Label>
              <Input
                id="end"
                type="datetime-local"
                value={end}
                onChange={(e) => setEnd(e.target.value)}
              />
            </div>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Science 204"
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <Checkbox
              checked={allDay}
              onCheckedChange={(v) => setAllDay(Boolean(v))}
            />
            All day
          </label>
          <label className="flex items-center gap-2 text-sm">
            <Checkbox
              checked={weekly}
              onCheckedChange={(v) => setWeekly(Boolean(v))}
            />
            Repeats weekly (classes)
          </label>
        </div>
        <DialogFooter className="gap-2 sm:justify-between">
          {event ? (
            <Button variant="destructive" onClick={() => onDelete(event.id)}>
              Delete
            </Button>
          ) : (
            <span />
          )}
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={() => void save()} disabled={saving}>
              {saving ? "Saving…" : "Save"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
