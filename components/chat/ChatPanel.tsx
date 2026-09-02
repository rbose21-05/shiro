"use client"

import { useEffect, useRef, useState } from "react"
import { addDays, format, parseISO } from "date-fns"
import { MessageCircleIcon, SendIcon, SparklesIcon } from "lucide-react"
import { toast } from "sonner"
import { ReviewScreen } from "@/components/capture/ReviewScreen"
import { useEvents } from "@/components/events-provider"
import { expandRecurring } from "@/lib/recurrence"
import type { ExtractedEvent } from "@/lib/ai/schemas"
import type { ChatMutation } from "@/lib/ai/schemas"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"

type ChatLine = { role: "user" | "assistant"; text: string }

export function ChatPanel() {
  const { events, createMany, updateEvent, deleteEvent } = useEvents()
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState("")
  const [lines, setLines] = useState<ChatLine[]>([
    {
      role: "assistant",
      text: "Ask me to move a lab, summarize due dates, or clear Saturday. I'll always show a review before changing anything.",
    },
  ])
  const [loading, setLoading] = useState(false)
  const [proposed, setProposed] = useState<ExtractedEvent[]>([])
  const [reviewOpen, setReviewOpen] = useState(false)
  const [pendingMutations, setPendingMutations] = useState<ChatMutation[]>([])
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [lines, open])

  async function send() {
    const message = input.trim()
    if (!message) return
    setInput("")
    setLines((prev) => [...prev, { role: "user", text: message }])
    setLoading(true)
    try {
      const upcoming = expandRecurring(events, new Date(), addDays(new Date(), 90))
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message,
          events: upcoming,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        }),
      })
      const json = await res.json()
      const reply = json.response ?? json
      setLines((prev) => [
        ...prev,
        { role: "assistant", text: reply.message || "I had a look." },
      ])
      const proposedEvents = reply.proposedEvents ?? []
      const mutations = reply.mutations ?? []
      if (proposedEvents.length > 0 || reply.type === "mutation") {
        setProposed(proposedEvents)
        setPendingMutations(
          mutations.length
            ? mutations
            : [{ action: "create" as const, title: proposedEvents[0]?.title }]
        )
        if (proposedEvents.length > 0) setReviewOpen(true)
      }
    } catch {
      toast.error("Chat hiccup — try again")
    } finally {
      setLoading(false)
    }
  }

  async function applyMutations(draftsFromReview: Parameters<typeof createMany>[0]) {
    for (const mutation of pendingMutations) {
      if (mutation.action === "delete" && mutation.event_id) {
        await deleteEvent(mutation.event_id.split("::")[0])
      }
      if (mutation.action === "clear_day" && mutation.date) {
        const day = mutation.date
        const matches = events.filter(
          (event) => format(parseISO(event.start_time), "yyyy-MM-dd") === day
        )
        for (const event of matches) {
          await deleteEvent(event.id.split("::")[0])
        }
      }
      if (mutation.action === "update" && mutation.event_id) {
        const draft = draftsFromReview.find(
          (item) => item.title === mutation.title || draftsFromReview.length === 1
        )
        if (draft) {
          await updateEvent(mutation.event_id.split("::")[0], draft)
        }
      }
    }
    const creates = pendingMutations.some((m) => m.action === "create")
      ? draftsFromReview
      : pendingMutations.length === 0
        ? draftsFromReview
        : []
    if (creates.length) await createMany(creates)
    setPendingMutations([])
    toast.success("Calendar updated")
  }

  return (
    <>
      <Button
        size="lg"
        className="fixed right-4 bottom-4 z-40 rounded-full shadow-lg"
        onClick={() => setOpen(true)}
      >
        <MessageCircleIcon />
        Ask CampusSync
      </Button>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" className="flex w-full flex-col sm:max-w-md">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <SparklesIcon className="size-4 text-primary" />
              Ask CampusSync
            </SheetTitle>
            <SheetDescription>
              Natural language, with a confirmation step. Never silent edits.
            </SheetDescription>
          </SheetHeader>
          <ScrollArea className="flex-1 px-4">
            <div className="flex flex-col gap-3 pb-4">
              {lines.map((line, i) => (
                <div
                  key={i}
                  className={
                    line.role === "user"
                      ? "ml-8 rounded-2xl bg-primary px-3 py-2 text-sm text-primary-foreground"
                      : "mr-8 rounded-2xl bg-muted px-3 py-2 text-sm"
                  }
                >
                  {line.text}
                </div>
              ))}
              {loading ? (
                <Badge variant="secondary" className="w-fit">
                  Thinking through your week…
                </Badge>
              ) : null}
              <div ref={bottomRef} />
            </div>
          </ScrollArea>
          <form
            className="flex gap-2 p-4"
            onSubmit={(e) => {
              e.preventDefault()
              void send()
            }}
          >
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Move chem lab to Friday at 2pm"
            />
            <Button type="submit" size="icon" disabled={loading}>
              <SendIcon />
            </Button>
          </form>
        </SheetContent>
      </Sheet>
      <ReviewScreen
        open={reviewOpen}
        onOpenChange={setReviewOpen}
        events={proposed}
        source="ai_text"
        notice="Proposed changes — tap add to apply."
        onCommit={applyMutations}
      />
    </>
  )
}
