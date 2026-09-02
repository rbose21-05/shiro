import { GoogleGenAI, type Schema, Type } from "@google/genai"
import { EXTRACTION_INSTRUCTIONS } from "@/lib/ai/prompts"
import {
  extractedPayloadSchema,
  type ExtractedEvent,
} from "@/lib/ai/schemas"
import { parseJsonObject } from "@/lib/ai/parse"

const EVENT_SCHEMA: Schema = {
  type: Type.OBJECT,
  properties: {
    events: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          type: { type: Type.STRING },
          date: { type: Type.STRING, nullable: true },
          time: { type: Type.STRING, nullable: true },
          end_time: { type: Type.STRING, nullable: true },
          location: { type: Type.STRING, nullable: true },
          recurrence: { type: Type.STRING, nullable: true },
          confidence: { type: Type.NUMBER },
          source_snippet: { type: Type.STRING },
        },
        required: ["title"],
      },
    },
  },
  required: ["events"],
}

export async function geminiExtract(input: {
  text?: string
  imageBase64?: string
  mimeType?: string
  referenceDate: string
  timezone: string
}): Promise<ExtractedEvent[]> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) throw new Error("GEMINI_API_KEY is not set")

  const ai = new GoogleGenAI({ apiKey })
  const prompt = `${EXTRACTION_INSTRUCTIONS}

Reference date (today): ${input.referenceDate}
Timezone: ${input.timezone}
${input.text ? `\nSource text:\n${input.text}` : ""}
${input.imageBase64 ? "\nAn image is attached. Read every deadline, class, and event visible." : ""}`

  const parts: Array<
    { text: string } | { inlineData: { mimeType: string; data: string } }
  > = [{ text: prompt }]

  if (input.imageBase64) {
    parts.unshift({
      inlineData: {
        mimeType: input.mimeType || "image/png",
        data: input.imageBase64,
      },
    })
  }

  const response = await ai.models.generateContent({
    model: process.env.GEMINI_MODEL || "gemini-3.5-flash",
    contents: parts,
    config: {
      responseMimeType: "application/json",
      responseSchema: EVENT_SCHEMA,
    },
  })

  const raw = response.text ?? "{}"
  const parsed = extractedPayloadSchema.safeParse(parseJsonObject(raw))
  if (!parsed.success) {
    throw new Error("Gemini returned invalid JSON")
  }
  return parsed.data.events
}

export async function geminiChat(prompt: string) {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) throw new Error("GEMINI_API_KEY is not set")
  const ai = new GoogleGenAI({ apiKey })
  const response = await ai.models.generateContent({
    model: process.env.GEMINI_MODEL || "gemini-3.5-flash",
    contents: prompt,
    config: { responseMimeType: "application/json" },
  })
  return response.text ?? "{}"
}
