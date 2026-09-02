"use server"

import { formatSupabaseError } from "@/lib/supabase/format-error"
import { createClient } from "@/utils/supabase/server"
import { createServiceRoleClient } from "@/utils/supabase/admin"
import { getSupabaseServiceRoleKey } from "@/utils/supabase/env"

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/


const SUPPORT_SUBMIT_ERROR = "Nu am putut trimite mesajul. Verifică datele și încearcă din nou."

export type SupportTicketState = {
  error?: string
  ok?: boolean
}

function readTrimmed(formData: FormData, key: string): string {
  const value = formData.get(key)
  return typeof value === "string" ? value.trim() : ""
}

function isValidContact(contact: string): boolean {
  if (EMAIL_PATTERN.test(contact)) {
    return true
  }
  const digits = contact.replace(/\D/g, "")
  return digits.length >= 8 && digits.length <= 15
}

export async function submitSupportTicket(formData: FormData): Promise<SupportTicketState> {
  const name = readTrimmed(formData, "name")
  const contact = readTrimmed(formData, "contact")
  const message = readTrimmed(formData, "message")

  if (name.length < 2 || name.length > 120) {
    return { error: "Introdu numele tău (minim 2 caractere)." }
  }
  if (!isValidContact(contact) || contact.length > 160) {
    return { error: "Introdu un email valid sau un număr de telefon." }
  }
  if (message.length < 10 || message.length > 4000) {
    return { error: "Mesajul trebuie să aibă între 10 și 4000 de caractere." }
  }

  const row = {
    name,
    contact,
    message,
    status: "open" as const,
  }

  try {
    const client = getSupabaseServiceRoleKey()
      ? createServiceRoleClient()
      : await createClient()

    const { error } = await client.from("support_tickets").insert(row)

    if (error) {
      const raw = formatSupabaseError(error)
      if (/does not exist|42P01|schema cache/i.test(raw)) {
        return {
          error:
            "Tabela de suport nu este configurată. Rulează supabase/migrations/007_support_tickets.sql în SQL Editor.",
        }
      }
      return { error: SUPPORT_SUBMIT_ERROR }
    }

    return { ok: true }
  } catch {
    return { error: SUPPORT_SUBMIT_ERROR }
  }
}
