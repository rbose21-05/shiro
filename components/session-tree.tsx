"use client"

import { useEffect, useState } from "react"
import type { User } from "@supabase/supabase-js"
import { EventsProvider, applyVibe } from "@/components/events-provider"
import { createClient } from "@/lib/supabase/client"
import { defaultProfile } from "@/lib/demo"
import { VIBE_STORAGE_KEY } from "@/lib/config"
import type { Profile, VibeTheme } from "@/lib/types"

export function SessionTree({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)

  useEffect(() => {
    const stored = localStorage.getItem(VIBE_STORAGE_KEY) as VibeTheme | null
    if (stored) applyVibe(stored)

    const supabase = createClient()
    if (!supabase) return

    supabase.auth.getUser().then(async ({ data }) => {
      setUser(data.user ?? null)
      if (data.user) {
        const { data: row } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", data.user.id)
          .single()
        if (row) {
          setProfile(row as Profile)
          applyVibe((row as Profile).theme_preference)
        } else {
          setProfile(defaultProfile(data.user.id))
        }
      }
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })
    return () => subscription.unsubscribe()
  }, [])

  return (
    <EventsProvider initialUser={user} initialProfile={profile}>
      {children}
    </EventsProvider>
  )
}
