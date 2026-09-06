import { handlePatientInviteNotify } from "@/lib/patients/notify-invite"

/** Compat: invitația se trimite și se salvează ca SMS. */
export async function POST(request: Request) {
  return handlePatientInviteNotify(request, "sms")
}
