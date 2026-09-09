import { redirect } from "next/navigation"

import { InviteTherapistDialog } from "@/app/dashboard/echipa/invite-therapist-dialog"
import { RemoveTherapistButton } from "@/app/dashboard/echipa/remove-therapist-button"
import { surfaceCardClassName } from "@/components/brand/app-atmosphere"
import { getCachedUser } from "@/lib/auth/session"
import { privilegedClinicClient } from "@/lib/clinics/members"
import { fetchClinicProfile } from "@/lib/clinics/profile"
import { canRemoveClinicMember, isClinicAdmin } from "@/lib/clinics/types"

export const metadata = {
  title: "Echipă | KinetoFlow",
}

export default async function ClinicTeamPage() {
  const { supabase, user } = await getCachedUser()
  if (!user) {
    redirect("/login")
  }

  const { profile } = await fetchClinicProfile(supabase, user.id)
  if (!isClinicAdmin(profile) || !profile) {
    redirect("/dashboard")
  }

  // Service role evită ca o politică RLS veche să ascundă colegii. `ilike`
  // tratează identic nume precum „KInetoKlinik” și „KinetoKlinik”.
  const clinicClient = await privilegedClinicClient(supabase)
  const { data: memberRows } = await clinicClient
    .from("clinic_profiles")
    .select("user_id, clinic_name, therapist_name, phone, role")
    .ilike("clinic_name", profile.clinic_name.trim())
    .order("therapist_name", { ascending: true })

  const { data: pendingRows } = await clinicClient
    .from("therapist_invites")
    .select("id, therapist_name, phone, expires_at, created_at")
    .ilike("clinic_name", profile.clinic_name.trim())
    .is("accepted_at", null)
    .gt("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false })

  const normalizedClinicName = profile.clinic_name.trim().toLocaleLowerCase("ro-RO")
  const members = (memberRows ?? []).filter(
    (member) =>
      typeof member.user_id === "string" &&
      String(member.clinic_name ?? "").trim().toLocaleLowerCase("ro-RO") === normalizedClinicName &&
      (member.role === "admin" || member.role === "therapist"),
  )

  const pendingInvites = (pendingRows ?? []).filter(
    (row) => typeof row.id === "string" && String(row.therapist_name ?? "").trim().length > 0,
  )

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-5 py-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold tracking-wide text-[#042f2e] uppercase">Administrare echipă</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-800">Echipa clinicii</h1>
          <p className="mt-1 text-sm text-slate-600">
            Invită terapeuți în {profile.clinic_name}. Primești un link unic de trimis pe WhatsApp
            sau SMS; colegul își pune singur emailul și parola.
          </p>
        </div>
        <InviteTherapistDialog />
      </div>

      <section className={surfaceCardClassName("overflow-hidden")}>
        <div className="border-b border-slate-200 px-5 py-4">
          <h2 className="text-base font-semibold text-slate-800">Membri</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[32rem] text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold tracking-wide text-slate-500 uppercase">
              <tr>
                <th className="px-5 py-3">Nume</th>
                <th className="px-5 py-3">Rol</th>
                <th className="px-5 py-3">Telefon</th>
                <th className="px-5 py-3 text-right">Acțiuni</th>
              </tr>
            </thead>
            <tbody>
              {(members ?? []).map((member) => {
                const memberUserId = String(member.user_id)
                const showRemove = canRemoveClinicMember({
                  actorIsAdmin: true,
                  actorUserId: user.id,
                  memberRole: typeof member.role === "string" ? member.role : null,
                  memberUserId,
                })
                return (
                  <tr key={memberUserId} className="border-b border-slate-100 last:border-0">
                    <td className="px-5 py-4 font-medium text-slate-800">{member.therapist_name}</td>
                    <td className="px-5 py-4 text-slate-600">
                      {member.role === "admin" ? "Admin" : "Terapeut"}
                    </td>
                    <td className="px-5 py-4 text-slate-600">{member.phone || "—"}</td>
                    <td className="px-5 py-4 text-right">
                      {showRemove ? (
                        <RemoveTherapistButton
                          userId={memberUserId}
                          therapistName={String(member.therapist_name ?? "")}
                        />
                      ) : null}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </section>

      {pendingInvites.length > 0 ? (
        <section className={surfaceCardClassName("overflow-hidden")}>
          <div className="border-b border-slate-200 px-5 py-4">
            <h2 className="text-base font-semibold text-slate-800">Invitații în așteptare</h2>
            <p className="mt-1 text-sm text-slate-600">
              Colegul încă nu și-a creat contul. Linkul e valabil 14 zile.
            </p>
          </div>
          <ul className="divide-y divide-slate-100">
            {pendingInvites.map((invite) => (
              <li key={String(invite.id)} className="flex flex-col gap-1 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-medium text-slate-800">{invite.therapist_name}</p>
                  <p className="text-sm text-slate-600">{invite.phone || "—"}</p>
                </div>
                <p className="text-xs text-slate-500">
                  Expiră{" "}
                  {new Date(String(invite.expires_at)).toLocaleDateString("ro-RO", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </main>
  )
}
