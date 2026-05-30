"use client"

import Link from "next/link"
import { useActionState } from "react"

import { signInAction } from "~/server/actions/auth"
import { Button } from "~/components/ui/button"
import { Input } from "~/components/ui/input"
import { Label } from "~/components/ui/label"

export function SignInForm() {
  const [state, action, pending] = useActionState(signInAction, null)

  return (
    <form action={action} className="space-y-4">
      <div>
        <h1 className="text-xl font-medium">Sign in</h1>
        <p className="text-sm text-muted-foreground">Welcome back to the garage</p>
      </div>
      {state?.error ? (
        <p className="text-sm text-destructive">{state.error}</p>
      ) : null}
      <div className="space-y-2">
        <Label htmlFor="username">Username</Label>
        <Input id="username" name="username" required autoComplete="username" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
        />
      </div>
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Signing in..." : "Sign in"}
      </Button>
      <p className="text-center text-sm text-muted-foreground">
        No account?{" "}
        <Link href="/signup" className="text-primary hover:underline">
          Register your car
        </Link>
      </p>
    </form>
  )
}
