import { google } from "googleapis"
import { appUrl } from "@/lib/config"

const SCOPES = [
  "https://www.googleapis.com/auth/calendar.events",
  "https://www.googleapis.com/auth/calendar.calendarlist.readonly",
]

export function googleOAuthClient() {
  const id = process.env.GOOGLE_CLIENT_ID
  const secret = process.env.GOOGLE_CLIENT_SECRET
  if (!id || !secret) return null
  return new google.auth.OAuth2(
    id,
    secret,
    `${appUrl()}/api/google/callback`
  )
}

export function googleAuthUrl(state: string) {
  const client = googleOAuthClient()
  if (!client) throw new Error("Google OAuth is not configured")
  return client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: SCOPES,
    state,
  })
}

export async function exchangeCode(code: string) {
  const client = googleOAuthClient()
  if (!client) throw new Error("Google OAuth is not configured")
  const { tokens } = await client.getToken(code)
  return tokens
}

export function calendarClient(refreshToken: string) {
  const auth = googleOAuthClient()
  if (!auth) throw new Error("Google OAuth is not configured")
  auth.setCredentials({ refresh_token: refreshToken })
  return google.calendar({ version: "v3", auth })
}
