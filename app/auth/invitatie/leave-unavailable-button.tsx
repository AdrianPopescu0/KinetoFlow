"use client"

import { useTransition } from "react"
import { Loader2 } from "lucide-react"

import { signOutFromUnavailableInvite } from "@/app/auth/invitatie/actions"
import { Button } from "@/components/ui/button"
import { createClient } from "@/utils/supabase/client"

export function LeaveUnavailableInviteButton() {
  const [isPending, startTransition] = useTransition()

  function handleLeave() {
    startTransition(async () => {
      const supabase = createClient()
      try {
        await supabase.auth.signOut({ scope: "local" })
      } catch {
        // Cookie-urile httpOnly se curăță oricum în acțiunea de pe server.
      }
      await signOutFromUnavailableInvite()
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
        "Mergi la autentificare"
      )}
    </Button>
  )
}
