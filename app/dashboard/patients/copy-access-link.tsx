"use client"

import { useState } from "react"
import { Check, Copy } from "lucide-react"

import { Button } from "@/components/ui/button"
import { patientAccessUrl } from "@/lib/patients/display"

export function CopyAccessLink({ token }: { token: string }) {
  const [copied, setCopied] = useState(false)

  async function copy() {
    await navigator.clipboard.writeText(patientAccessUrl(token))
    setCopied(true)
    window.setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Button type="button" variant="outline" onClick={copy} className="h-11 rounded-xl">
      {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
      Copiază link acces
    </Button>
  )
}
