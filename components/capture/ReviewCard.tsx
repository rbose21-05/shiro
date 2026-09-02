"use client"

import { CATEGORIES, mapExtractedType } from "@/lib/categories"
import type { ExtractedEvent } from "@/lib/ai/schemas"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Trash2Icon } from "lucide-react"

export function ReviewCard({
  event,
  onChange,
  onRemove,
}: {
  event: ExtractedEvent
  onChange: (event: ExtractedEvent) => void
  onRemove: () => void
}) {
  const confidence = Math.round(event.confidence * 100)
  const tone =
    confidence >= 80 ? "default" : confidence >= 50 ? "secondary" : "outline"

  return (
    <div
      className="rounded-xl border p-3"
      style={{
        borderColor: `color-mix(in oklch, var(--cat-${mapExtractedType(event.type)}) 50%, var(--border))`,
      }}
    >
      <div className="mb-2 flex items-start justify-between gap-2">
        <Input
          value={event.title}
          onChange={(e) => onChange({ ...event, title: e.target.value })}
          className="font-medium"
        />
        <div className="flex items-center gap-1">
          <Badge variant={tone}>{confidence}%</Badge>
          <Button variant="ghost" size="icon-sm" onClick={onRemove}>
            <Trash2Icon />
          </Button>
        </div>
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        <div className="grid gap-1">
          <Label>Category</Label>
          <Select
            value={event.type === "other" ? "personal" : event.type}
            onValueChange={(value) =>
              onChange({
                ...event,
                type: value === "personal" ? "other" : (value as ExtractedEvent["type"]),
              })
            }
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
        <div className="grid gap-1">
          <Label>Location</Label>
          <Input
            value={event.location ?? ""}
            onChange={(e) => onChange({ ...event, location: e.target.value || null })}
          />
        </div>
        <div className="grid gap-1">
          <Label>Date</Label>
          <Input
            type="date"
            value={event.date ?? ""}
            onChange={(e) => onChange({ ...event, date: e.target.value || null })}
          />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="grid gap-1">
            <Label>Start</Label>
            <Input
              type="time"
              value={event.time ?? ""}
              onChange={(e) => onChange({ ...event, time: e.target.value || null })}
            />
          </div>
          <div className="grid gap-1">
            <Label>End</Label>
            <Input
              type="time"
              value={event.end_time ?? ""}
              onChange={(e) => onChange({ ...event, end_time: e.target.value || null })}
            />
          </div>
        </div>
      </div>
      {event.source_snippet ? (
        <p className="mt-2 text-[11px] text-muted-foreground italic">
          “{event.source_snippet}”
        </p>
      ) : null}
    </div>
  )
}
