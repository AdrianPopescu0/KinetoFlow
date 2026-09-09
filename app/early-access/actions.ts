"use server"

import { cookies } from "next/headers"
import { redirect } from "next/navigation"

import {
  EARLY_ACCESS_COOKIE,
  EARLY_ACCESS_TTL_MS,
  isValidEarlyAccessCode,
  signEarlyAccessCookie,
} from "@/lib/auth/early-access"

export type EarlyAccessState = {
  error?: string
}

export async function unlockEarlyAccess(formData: FormData): Promise<EarlyAccessState> {
  const code = formData.get("code")
  if (!isValidEarlyAccessCode(code)) {
    return { error: "Codul nu este valid. Introdu cele 12 caractere primite pentru Early Access." }
  }

  const jar = await cookies()
  jar.set(EARLY_ACCESS_COOKIE, await signEarlyAccessCookie(Date.now() + EARLY_ACCESS_TTL_MS), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: Math.floor(EARLY_ACCESS_TTL_MS / 1000),
  })

  redirect("/login")
}
