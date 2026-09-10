"use client"

import { useTransition } from "react"
import { Loader2 } from "lucide-react"

import { signOutToLogin } from "@/lib/auth/sign-out-to-login"
import { Button } from "@/components/ui/button"
import { createClient } from "@/utils/supabase/client"

export function LeaveUnavailableInviteButton({
  label = "Mergi la autentificare",
}: {
  label?: string
}) {
  const [isPending, startTransition] = useTransition()

  function handleLeave() {
    startTransition(async () => {
      const supabase = createClient()
      try {
        await supabase.auth.signOut()
      } catch {
        // Cookie-urile httpOnly se curăță în acțiunea de pe server.
      }
      await signOutToLogin()
    })
  }

  return (
    <Button
      type="button"
      variant="outline"
      disabled={isPending}
      onClick={handleLeave}
      className="h-12 min-h-[48px] w-full rounded-xl text-sm font-medium"
    >
      {isPending ? (
        <>
          <Loader2 className="size-4 animate-spin" />
          Se deconectează…
        </>
      ) : (
        label
      )}
    </Button>
  )
}
