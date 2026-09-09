import { redirect } from "next/navigation"

import { loginHref } from "@/lib/auth/paths"

export default function RegisterPage() {
  redirect(loginHref("signup"))
}
