export function isSupabaseConfigured() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )
}

export function hasGeminiKey() {
  return Boolean(process.env.GEMINI_API_KEY)
}

export function hasGroqKey() {
  return Boolean(process.env.GROQ_API_KEY)
}

export function hasGoogleOAuth() {
  return Boolean(
    process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
  )
}

export function appUrl() {
  return process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
}

export const DEMO_USER_ID = "demo-user"
export const GUEST_STORAGE_KEY = "campussync.guest"
export const EVENTS_STORAGE_KEY = "campussync.events"
export const PROFILE_STORAGE_KEY = "campussync.profile"
export const VIBE_STORAGE_KEY = "campussync.vibe"
