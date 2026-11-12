"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { HeartPulseIcon, LoaderCircleIcon } from "lucide-react"

import { login, UnauthorizedError } from "@/lib/api"
import { CLINIC_NAME } from "@/lib/config"
import { getToken, getUser, homePath, saveSession } from "@/lib/session"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  // Already signed in? Go straight to the chat (or the approvals, for the front desk).
  useEffect(() => {
    if (getToken()) router.replace(homePath(getUser()))
  }, [router])

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError("")
    setLoading(true)

    try {
      const data = await login(email, password)
      saveSession(data.token, data.user, data.thread_id)
      router.push(homePath(data.user))
    } catch (err) {
      if (err instanceof UnauthorizedError) {
        setError("Wrong email or password. Please try again.")
      } else {
        setError("We couldn't reach the clinic. Please try again in a moment.")
      }
      setLoading(false)
    }
  }

  return (
    <main className="flex flex-1 items-center justify-center bg-muted/40 px-4 py-12">
      <div className="w-full max-w-sm rounded-2xl border bg-background p-8 shadow-sm">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <div className="flex size-12 items-center justify-center rounded-full bg-accent text-primary">
            <HeartPulseIcon className="size-6" />
          </div>
          <div>
            <h1 className="text-xl font-semibold">{CLINIC_NAME}</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Sign in to manage your appointments
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              data-testid="login-email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              data-testid="login-password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </div>

          {error && (
            <p
              role="alert"
              className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive"
            >
              {error}
            </p>
          )}

          <Button
            type="submit"
            size="lg"
            disabled={loading}
            data-testid="login-submit"
          >
            {loading && <LoaderCircleIcon className="animate-spin" />}
            {loading ? "Signing in…" : "Sign in"}
          </Button>
        </form>
      </div>
    </main>
  )
}
