"use server"

import { signOutToLogin } from "@/lib/auth/sign-out-to-login"

export async function logout() {
  await signOutToLogin()
}
