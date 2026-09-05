import { handlePatientInviteNotify } from "@/lib/patients/notify-invite"

export async function POST(request: Request) {
  return handlePatientInviteNotify(request)
}
