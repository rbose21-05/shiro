"use client"

import { useEffect, useRef, useState } from "react"
import { format } from "date-fns"
import { ImageIcon, SparklesIcon, TypeIcon } from "lucide-react"
import { toast } from "sonner"
import { ReviewScreen } from "@/components/capture/ReviewScreen"
import { useEvents } from "@/components/events-provider"
import type { ExtractedEvent } from "@/lib/ai/schemas"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"

const STATUS = [
  "Reading your syllabus…",
  "Hunting for due dates…",
  "Checking group-chat vibes…",
  "Highlighting the scary ones…",
]

export function AddSomething({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const { createMany } = useEvents()
  const [text, setText] = useState("")
  const [file, setFile] = useState<File | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState(STATUS[0])
  const [extracted, setExtracted] = useState<ExtractedEvent[]>([])
  const [reviewOpen, setReviewOpen] = useState(false)
  const [notice, setNotice] = useState<string>()
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!loading) return
    let i = 0
    const id = setInterval(() => {
      i = (i + 1) % STATUS.length
      setStatus(STATUS[i])
    }, 1400)
    return () => clearInterval(id)
  }, [loading])

  useEffect(() => {
    if (!open) return
    const onPaste = (event: ClipboardEvent) => {
      const item = Array.from(event.clipboardData?.items ?? []).find((entry) =>
        entry.type.startsWith("image/")
      )
      if (item) {
        const pasted = item.getAsFile()
        if (pasted) setFile(pasted)
      }
    }
    window.addEventListener("paste", onPaste)
    return () => window.removeEventListener("paste", onPaste)
  }, [open])

  async function parse() {
    if (!text.trim() && !file) {
      toast.error("Type something or drop a screenshot.")
      return
    }
    setLoading(true)
    try {
      const form = new FormData()
      if (text.trim()) form.set("text", text.trim())
      if (file) form.set("image", file)
      form.set("timezone", Intl.DateTimeFormat().resolvedOptions().timeZone)
      form.set("referenceDate", format(new Date(), "yyyy-MM-dd"))
      const res = await fetch("/api/ai/extract", { method: "POST", body: form })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || "Parse failed")
      setExtracted(json.events ?? [])
      setNotice(
        json.usedFallback
          ? `Parsed with ${json.provider}. Add GEMINI_API_KEY for better screenshot reading.`
          : `Found by ${json.provider}. Nothing is on your calendar until you approve.`
      )
      onOpenChange(false)
      setReviewOpen(true)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not parse")
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <SparklesIcon className="size-4 text-primary" />
              Add something
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Paste a syllabus snippet, a group chat, or drop a screenshot. Shiro
            will propose events — you approve them.
          </p>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault()
              setDragOver(true)
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault()
              setDragOver(false)
              const dropped = e.dataTransfer.files[0]
              if (dropped) setFile(dropped)
            }}
            className={cn(
              "flex min-h-36 flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed p-6 text-center transition",
              dragOver ? "border-primary bg-primary/8" : "border-border bg-muted/40"
            )}
          >
            <ImageIcon className="size-8 text-muted-foreground" />
            <div className="text-sm font-medium">
              {file ? file.name : "Drop a screenshot, or click to upload"}
            </div>
            <div className="text-xs text-muted-foreground">
              PNG, JPG, HEIC · paste from clipboard works too
            </div>
          </button>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
          <div className="relative">
            <TypeIcon className="absolute top-3 left-3 size-4 text-muted-foreground" />
            <Textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Essay due Friday 11:59pm&#10;Chem lab Monday 2–4pm in Sci 204&#10;Party at 9 Friday"
              className="min-h-28 pl-9"
            />
          </div>
          <Button size="lg" onClick={() => void parse()} disabled={loading}>
            {loading ? status : "Extract events"}
          </Button>
        </DialogContent>
      </Dialog>
      <ReviewScreen
        open={reviewOpen}
        onOpenChange={setReviewOpen}
        events={extracted}
        source={file ? "ai_image" : "ai_text"}
        notice={notice}
        onCommit={async (drafts) => {
          await createMany(drafts)
          toast.success(`Added ${drafts.length} to your calendar`)
          setText("")
          setFile(null)
        }}
      />
    </>
  )
}
