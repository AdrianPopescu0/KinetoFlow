"use server"

import { redirect } from "next/navigation"

import { isAccessCode } from "@/lib/patients/access-code"
import { phonesMatch, toWhatsAppNumber } from "@/lib/patients/phone"

export type PatientAccessState = {
  error: string | null
}

export async function accessWithCode(formData: FormData): Promise<PatientAccessState> {
  const phoneRaw = String(formData.get("phone") ?? "")
  const codeRaw = String(formData.get("access_code") ?? "").replace(/\s/g, "")

  if (!toWhatsAppNumber(phoneRaw) || !isAccessCode(codeRaw)) {
    return { error: "Telefonul sau codul de acces este incorect." }
  }

  const { createServiceRoleClient } = await import("@/utils/supabase/admin")
  const admin = createServiceRoleClient()
  const { data, error } = await admin
    .from("patients")
    .select("token, phone, access_code")
    .eq("access_code", codeRaw)
    .maybeSingle()

  if (error || !data || !phonesMatch(typeof data.phone === "string" ? data.phone : null, phoneRaw)) {
    return { error: "Telefonul sau codul de acces este incorect." }
  }

  redirect(`/p/${data.token}`)
}
