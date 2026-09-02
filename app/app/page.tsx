import { Suspense } from "react"
import { AppShell } from "@/components/app-shell"
import { CalendarBoard } from "@/components/calendar/CalendarBoard"

export default function AppPage() {
  return (
    <AppShell>
      <Suspense fallback={<div className="h-96 animate-pulse rounded-2xl bg-muted" />}>
        <CalendarBoard />
      </Suspense>
    </AppShell>
  )
}
