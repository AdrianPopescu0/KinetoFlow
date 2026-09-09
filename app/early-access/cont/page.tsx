import { redirect } from "next/navigation"

export const metadata = {
  title: "Autentificare | KinetoFlow",
  description: "Continuă către pagina clasică de autentificare KinetoFlow.",
}

export default function EarlyAccessContinuePage() {
  redirect("/login")
}
