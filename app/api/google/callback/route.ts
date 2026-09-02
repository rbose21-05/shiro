import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { exchangeCode } from "@/lib/google/oauth"
import { appUrl } from "@/lib/config"

export async function GET(request: Request) {
  const url = new URL(request.url)
  const code = url.searchParams.get("code")
  const state = url.searchParams.get("state")
  if (!code || !state) {
    return NextResponse.redirect(`${appUrl()}/settings?google=error`)
  }

  const supabase = await createClient()
  if (!supabase) {
    return NextResponse.redirect(`${appUrl()}/settings?google=error`)
  }
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user || user.id !== state) {
    return NextResponse.redirect(`${appUrl()}/login`)
  }

  try {
    const tokens = await exchangeCode(code)
    if (tokens.refresh_token) {
      await supabase
        .from("profiles")
        .update({
          google_refresh_token: tokens.refresh_token,
          google_sync_enabled: true,
        })
        .eq("id", user.id)
    }
    return NextResponse.redirect(`${appUrl()}/settings?google=connected`)
  } catch {
    return NextResponse.redirect(`${appUrl()}/settings?google=error`)
  }
}
