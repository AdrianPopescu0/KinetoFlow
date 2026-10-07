import { ProtocolLibrary } from "@/app/dashboard/protocols/protocol-library"
import { getCachedUser } from "@/lib/auth/session"
import { listLibraryCatalog } from "@/lib/exercises/library-store"
import { listTrainingProtocols } from "@/lib/protocols/store"

export async function ProtocolsData() {
  const [{ supabase, user }, catalog] = await Promise.all([getCachedUser(), listLibraryCatalog()])
  const protocols = user ? await listTrainingProtocols(supabase, user.id) : []

  return <ProtocolLibrary initialProtocols={protocols} catalog={catalog} />
}
