import OpenAI from "openai"
import { EXTRACTION_INSTRUCTIONS } from "@/lib/ai/prompts"
import {
  extractedPayloadSchema,
  type ExtractedEvent,
} from "@/lib/ai/schemas"
import { parseJsonObject } from "@/lib/ai/parse"

function client() {
  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) throw new Error("GROQ_API_KEY is not set")
  return new OpenAI({
    apiKey,
    baseURL: "https://api.groq.com/openai/v1",
  })
}

const MODEL = process.env.GROQ_MODEL || "openai/gpt-oss-120b"

export async function groqExtract(input: {
  text: string
  referenceDate: string
  timezone: string
}): Promise<ExtractedEvent[]> {
  const groq = client()
  const completion = await groq.chat.completions.create({
    model: MODEL,
    temperature: 0.2,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: EXTRACTION_INSTRUCTIONS },
      {
        role: "user",
        content: `Reference date: ${input.referenceDate}\nTimezone: ${input.timezone}\n\n${input.text}`,
      },
    ],
  })
  const raw = completion.choices[0]?.message?.content ?? "{}"
  const parsed = extractedPayloadSchema.safeParse(parseJsonObject(raw))
  if (!parsed.success) throw new Error("Groq returned invalid JSON")
  return parsed.data.events
}

export async function groqChat(prompt: string) {
  const groq = client()
  const completion = await groq.chat.completions.create({
    model: MODEL,
    temperature: 0.3,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: "Return valid JSON only. Follow the schema in the user message.",
      },
      { role: "user", content: prompt },
    ],
  })
  return completion.choices[0]?.message?.content ?? "{}"
}
