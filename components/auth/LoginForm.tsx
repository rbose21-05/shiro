"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { createClient } from "@/lib/supabase/client"
import { isSupabaseConfigured } from "@/lib/config"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export function LoginForm({ mode }: { mode: "login" | "signup" }) {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [busy, setBusy] = useState(false)
  const configured = isSupabaseConfigured()

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    const supabase = createClient()
    if (!supabase) {
      toast.message("No Supabase keys — continuing as guest")
      router.push("/app")
      return
    }
    setBusy(true)
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({ email, password })
        if (error) throw error
        toast.success("Check your email to confirm, or sign in if confirmation is off.")
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        if (error) throw error
        router.push("/app")
        router.refresh()
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Auth failed")
    } finally {
      setBusy(false)
    }
  }

  async function google() {
    const supabase = createClient()
    if (!supabase) {
      toast.message("Add Supabase keys to enable Google login")
      return
    }
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    })
  }

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-6">
      <Link href="/" className="font-display text-2xl font-bold">
        CampusSync
      </Link>
      <h1 className="font-heading mt-6 text-3xl">
        {mode === "login" ? "Welcome back" : "Create your campus calendar"}
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        {configured
          ? "Email or Google. Calendar sync is a separate connect in Settings."
          : "Supabase isn’t configured yet — you can still try the demo."}
      </p>
      <form className="mt-6 grid gap-3" onSubmit={(e) => void onSubmit(e)}>
        <div className="grid gap-1.5">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required={configured}
          />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required={configured}
          />
        </div>
        <Button type="submit" disabled={busy}>
          {mode === "login" ? "Sign in" : "Sign up"}
        </Button>
      </form>
      <Button className="mt-3" variant="outline" onClick={() => void google()}>
        Continue with Google
      </Button>
      <Button
        className="mt-3"
        variant="secondary"
        onClick={() => router.push("/app")}
      >
        Continue as guest
      </Button>
      <p className="mt-4 text-sm text-muted-foreground">
        {mode === "login" ? (
          <>
            New here?{" "}
            <Link href="/signup" className="underline">
              Create an account
            </Link>
          </>
        ) : (
          <>
            Already have one?{" "}
            <Link href="/login" className="underline">
              Sign in
            </Link>
          </>
        )}
      </p>
    </div>
  )
}
