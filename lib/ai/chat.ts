import { format } from "date-fns"
import { hasGeminiKey, hasGroqKey } from "@/lib/config"
import { CHAT_INSTRUCTIONS } from "@/lib/ai/prompts"
import { geminiChat } from "@/lib/ai/providers/gemini"
import { groqChat } from "@/lib/ai/providers/groq"
import { parseJsonObject } from "@/lib/ai/parse"
import { chatResponseSchema, type ChatResponse } from "@/lib/ai/schemas"
import { heuristicChat } from "@/lib/ai/heuristicChat"
import type { CalendarEvent } from "@/lib/types"

export async function runCalendarChat(input: {
  message: string
  events: CalendarEvent[]
  timezone: string
  referenceDate?: string
}): Promise<{ response: ChatResponse; provider: string }> {
  const referenceDate = input.referenceDate || format(new Date(), "yyyy-MM-dd")
  const calendarContext = input.events
    .map(
      (e) =>
        `- id=${e.id} | ${e.title} | ${e.category} | ${e.start_time} → ${e.end_time ?? "?"} | loc=${e.location ?? ""} | done=${e.completed}`
    )
    .join("\n")

  const prompt = `${CHAT_INSTRUCTIONS}

Reference date: ${referenceDate}
Timezone: ${input.timezone}

Current calendar:
${calendarContext || "(empty)"}

Student: ${input.message}`

  const tryParse = (raw: string) =>
    chatResponseSchema.safeParse(parseJsonObject(raw))

  if (hasGroqKey()) {
    try {
      const raw = await groqChat(prompt)
      const parsed = tryParse(raw)
      if (parsed.success) return { response: parsed.data, provider: "groq" }
    } catch (error) {
      console.error("Groq chat failed", error)
    }
  }

  if (hasGeminiKey()) {
    try {
      const raw = await geminiChat(prompt)
      const parsed = tryParse(raw)
      if (parsed.success) return { response: parsed.data, provider: "gemini" }
    } catch (error) {
      console.error("Gemini chat failed", error)
    }
  }

  return {
    response: heuristicChat(input.message, input.events, referenceDate),
    provider: "heuristic",
  }
}
