import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { googleAuthUrl } from "@/lib/google/oauth"
import { hasGoogleOAuth } from "@/lib/config"

export async function GET() {
  if (!hasGoogleOAuth()) {
    return NextResponse.json(
      { error: "Google OAuth env vars are missing." },
      { status: 400 }
    )
  }
  const supabase = await createClient()
  if (!supabase) {
    return NextResponse.json({ error: "Sign in first." }, { status: 401 })
  }
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "Sign in first." }, { status: 401 })
  }
  const url = googleAuthUrl(user.id)
  return NextResponse.redirect(url)
}
