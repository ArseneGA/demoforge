"use client"

import posthog from "posthog-js"
import { PostHogProvider as PHProvider, usePostHog } from "posthog-js/react"
import { useEffect, Suspense } from "react"
import { usePathname, useSearchParams } from "next/navigation"
import { createClient } from "@/utils/supabase/client"

function PageViewTracker() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const ph = usePostHog()

  useEffect(() => {
    ph?.capture("$pageview", { $current_url: window.location.href })
  }, [pathname, searchParams, ph])

  return null
}

function UserIdentifier() {
  const ph = usePostHog()

  useEffect(() => {
    const sb = createClient()
    sb.auth.getUser().then(({ data: { user } }) => {
      if (!user) return
      ph?.identify(user.id, { email: user.email })
      // Track signup if account was created in the last 5 minutes
      if (user.created_at && Date.now() - new Date(user.created_at).getTime() < 5 * 60 * 1000) {
        ph?.capture("signup", { email: user.email })
      }
    })
  }, [ph])

  return null
}

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_POSTHOG_KEY) return
    posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
      api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://us.i.posthog.com",
      person_profiles: "identified_only",
      capture_pageview: false,
    })
  }, [])

  return (
    <PHProvider client={posthog}>
      <Suspense><PageViewTracker /></Suspense>
      <UserIdentifier />
      {children}
    </PHProvider>
  )
}
