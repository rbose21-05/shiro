import { NextResponse } from "next/server"
import { extractEvents } from "@/lib/ai/extractEvents"

export const runtime = "nodejs"

export async function POST(request: Request) {
  const form = await request.formData()
  const text = String(form.get("text") ?? "")
  const timezone = String(
    form.get("timezone") ??
      Intl.DateTimeFormat().resolvedOptions().timeZone
  )
  const referenceDate = String(form.get("referenceDate") ?? "")
  const file = form.get("image")
  let imageBase64: string | undefined
  let mimeType: string | undefined

  if (file instanceof File && file.size > 0) {
    const buffer = Buffer.from(await file.arrayBuffer())
    imageBase64 = buffer.toString("base64")
    mimeType = file.type || "image/png"
  }

  if (!text.trim() && !imageBase64) {
    return NextResponse.json(
      { error: "Paste text or drop a screenshot first." },
      { status: 400 }
    )
  }

  const result = await extractEvents({
    text: text.trim() || undefined,
    imageBase64,
    mimeType,
    timezone,
    referenceDate: referenceDate || undefined,
  })

  return NextResponse.json(result)
}
