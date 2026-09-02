import { Suspense } from "react"
import { SettingsForm } from "@/components/settings/SettingsForm"

export default function SettingsPage() {
  return (
    <Suspense fallback={<div className="min-h-dvh" />}>
      <SettingsForm />
    </Suspense>
  )
}
