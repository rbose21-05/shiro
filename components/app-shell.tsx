"use client"

import { useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { FlameIcon, Grid2x2Icon, LogOutIcon, SettingsIcon } from "lucide-react"
import { ChatPanel } from "@/components/chat/ChatPanel"
import { ReminderWatcher } from "@/components/reminder-watcher"
import { useEvents } from "@/components/events-provider"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

export function AppShell({ children }: { children: React.ReactNode }) {
  const { profile, isGuest, checkInStreak } = useEvents()
  const router = useRouter()

  useEffect(() => {
    void checkInStreak()
  }, [checkInStreak])

  async function signOut() {
    const supabase = createClient()
    if (supabase) await supabase.auth.signOut()
    router.push("/")
    router.refresh()
  }

  return (
    <div className="min-h-dvh bg-background">
      <ReminderWatcher />
      <header className="sticky top-0 z-30 border-b bg-background/85 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-2">
            <Link href="/" aria-label="Year wall">
              <Button variant="ghost" size="icon-sm">
                <Grid2x2Icon />
              </Button>
            </Link>
            <Link href="/app" className="font-display text-lg font-bold">
              CampusSync
            </Link>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 rounded-full bg-primary/10 px-2 py-1 text-xs font-semibold text-primary">
              <FlameIcon className="size-3.5" />
              {profile.streak_count} day streak
            </div>
            <Link href="/settings" aria-label="Settings">
              <Button variant="ghost" size="icon-sm">
                <SettingsIcon />
              </Button>
            </Link>
            {!isGuest ? (
              <Button variant="ghost" size="icon-sm" onClick={() => void signOut()}>
                <LogOutIcon />
              </Button>
            ) : (
              <Link href="/login">
                <Button size="sm">Sign in</Button>
              </Link>
            )}
            <Avatar className="size-8">
              <AvatarFallback>
                {(profile.name ?? "CS").slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-5 pb-24">
        {children}
      </main>
      <ChatPanel />
    </div>
  )
}
