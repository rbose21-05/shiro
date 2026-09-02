"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { toast } from "sonner"
import { useEvents } from "@/components/events-provider"
import type { GoogleCalendarOption, VibeTheme } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { AppShell } from "@/components/app-shell"

const VIBES: { id: VibeTheme; label: string; blurb: string }[] = [
  { id: "minimal", label: "Minimal", blurb: "Cream, ink, coral" },
  { id: "pastel", label: "Pastel", blurb: "Soft campus dorm" },
  { id: "dark-academia", label: "Dark academia", blurb: "Parchment and gold" },
]

export function SettingsForm() {
  const { profile, updateProfile, isGuest, refresh } = useEvents()
  const params = useSearchParams()
  const [calendars, setCalendars] = useState<GoogleCalendarOption[]>([])
  const [syncing, setSyncing] = useState(false)

  useEffect(() => {
    const status = params.get("google")
    if (status === "connected") toast.success("Google Calendar connected")
    if (status === "error") toast.error("Google connect failed")
  }, [params])

  useEffect(() => {
    if (isGuest) return
    fetch("/api/google/calendars")
      .then((r) => r.json())
      .then((json) => setCalendars(json.calendars ?? []))
      .catch(() => null)
  }, [isGuest, profile.google_refresh_token])

  async function pull() {
    setSyncing(true)
    try {
      const res = await fetch("/api/google/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ direction: "pull" }),
      })
      if (!res.ok) throw new Error("Sync failed")
      await refresh()
      toast.success("Pulled from Google Calendar")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Sync failed")
    } finally {
      setSyncing(false)
    }
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-lg space-y-8">
        <div>
          <h1 className="font-heading text-3xl">Settings</h1>
          <p className="text-sm text-muted-foreground">
            Themes, Google Calendar, and how CampusSync talks to the rest of your life.
          </p>
        </div>

        <section className="space-y-3">
          <h2 className="font-medium">Vibe</h2>
          <div className="grid gap-2">
            {VIBES.map((vibe) => (
              <button
                key={vibe.id}
                type="button"
                onClick={() => void updateProfile({ theme_preference: vibe.id })}
                className="flex items-center justify-between rounded-xl border px-3 py-2 text-left"
                data-vibe={vibe.id}
                style={{
                  outline:
                    profile.theme_preference === vibe.id
                      ? "2px solid var(--primary)"
                      : undefined,
                }}
              >
                <span className="font-medium">{vibe.label}</span>
                <span className="text-xs text-muted-foreground">{vibe.blurb}</span>
              </button>
            ))}
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="font-medium">Google Calendar</h2>
          {isGuest ? (
            <p className="text-sm text-muted-foreground">
              Sign in to connect Google. Guest mode stays on this device.
            </p>
          ) : (
            <>
              <a href="/api/google/oauth">
                <Button>
                  {profile.google_refresh_token
                    ? "Reconnect Google"
                    : "Connect Google Calendar"}
                </Button>
              </a>
              {calendars.length > 0 ? (
                <div className="grid gap-1.5">
                  <Label>Sync into</Label>
                  <Select
                    value={profile.google_calendar_id ?? "primary"}
                    onValueChange={(value) =>
                      void updateProfile({ google_calendar_id: String(value) })
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {calendars.map((cal) => (
                        <SelectItem key={cal.id} value={cal.id}>
                          {cal.summary}
                          {cal.primary ? " (primary)" : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : null}
              <label className="flex items-center justify-between gap-3 text-sm">
                Two-way sync
                <Switch
                  checked={profile.google_sync_enabled}
                  onCheckedChange={(checked) =>
                    void updateProfile({ google_sync_enabled: Boolean(checked) })
                  }
                />
              </label>
              <Button variant="outline" onClick={() => void pull()} disabled={syncing}>
                {syncing ? "Syncing…" : "Sync now"}
              </Button>
            </>
          )}
        </section>
      </div>
    </AppShell>
  )
}
