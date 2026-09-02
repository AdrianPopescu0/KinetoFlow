import { cache } from "react"

import { createClient } from "@/utils/supabase/server"

export const getCachedUser = cache(async () => {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return { supabase, user }
})
