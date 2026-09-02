"use client"

import { useEffect, useState } from "react"
import { format } from "date-fns"
import { extractedToStartEnd } from "@/lib/ai/toDraft"
import { mapExtractedType } from "@/lib/categories"
import type { ExtractedEvent } from "@/lib/ai/schemas"
import type { EventDraft, EventSource } from "@/lib/types"
import { ReviewCard } from "@/components/capture/ReviewCard"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"

export function ReviewScreen({
  open,
  onOpenChange,
  events,
  source,
  onCommit,
  notice,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  events: ExtractedEvent[]
  source: EventSource
  onCommit: (drafts: EventDraft[]) => Promise<void>
  notice?: string
}) {
  const [items, setItems] = useState<ExtractedEvent[]>([])
  const [saving, setSaving] = useState(false)
  const fallbackDate = format(new Date(), "yyyy-MM-dd")

  useEffect(() => {
    setItems(events)
  }, [events])

  function toDrafts(list: ExtractedEvent[]): EventDraft[] {
    return list.map((item) => {
      const times = extractedToStartEnd(item, fallbackDate)
      return {
        title: item.title,
        category: mapExtractedType(item.type),
        location: item.location,
        recurrence_rule: item.recurrence,
        confidence_score: item.confidence,
        source,
        ...times,
      }
    })
  }

  async function addAll() {
    setSaving(true)
    try {
      await onCommit(toDrafts(items))
      onOpenChange(false)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Review what CampusSync found
            <Badge variant="secondary">AI — not saved yet</Badge>
          </DialogTitle>
        </DialogHeader>
        {notice ? (
          <p className="text-xs text-muted-foreground">{notice}</p>
        ) : null}
        <div className="grid gap-3">
          {items.map((item, index) => (
            <ReviewCard
              key={`${item.title}-${index}`}
              event={item}
              onChange={(next) =>
                setItems((prev) => prev.map((row, i) => (i === index ? next : row)))
              }
              onRemove={() =>
                setItems((prev) => prev.filter((_, i) => i !== index))
              }
            />
          ))}
          {items.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nothing left to add. Close this and try another capture.
            </p>
          ) : null}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Discard
          </Button>
          <Button onClick={() => void addAll()} disabled={saving || items.length === 0}>
            {saving ? "Adding…" : `Add ${items.length} to calendar`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
