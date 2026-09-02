import { z } from "zod"

export const extractedEventSchema = z.object({
  title: z.string().min(1),
  type: z
    .enum(["assignment", "exam", "class", "social", "club", "other"])
    .default("other"),
  date: z.string().nullable().default(null),
  time: z.string().nullable().default(null),
  end_time: z.string().nullable().default(null),
  location: z.string().nullable().default(null),
  recurrence: z.string().nullable().default(null),
  confidence: z.number().min(0).max(1).default(0.5),
  source_snippet: z.string().default(""),
})

export const extractedPayloadSchema = z.object({
  events: z.array(extractedEventSchema),
})

export type ExtractedEvent = z.infer<typeof extractedEventSchema>

export const chatMutationSchema = z.object({
  action: z.enum(["create", "update", "delete", "clear_day"]),
  event_id: z.string().nullable().optional(),
  title: z.string().nullable().optional(),
  type: z
    .enum(["assignment", "exam", "class", "social", "club", "other"])
    .nullable()
    .optional(),
  date: z.string().nullable().optional(),
  time: z.string().nullable().optional(),
  end_time: z.string().nullable().optional(),
  location: z.string().nullable().optional(),
  recurrence: z.string().nullable().optional(),
  confidence: z.number().min(0).max(1).optional(),
  source_snippet: z.string().optional(),
})

export const chatResponseSchema = z.object({
  type: z.enum(["answer", "mutation"]),
  message: z.string(),
  proposedEvents: z.array(extractedEventSchema).optional().default([]),
  mutations: z.array(chatMutationSchema).optional().default([]),
})

export type ChatResponse = z.infer<typeof chatResponseSchema>
export type ChatMutation = z.infer<typeof chatMutationSchema>
