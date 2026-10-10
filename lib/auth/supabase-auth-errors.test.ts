import assert from "node:assert/strict"
import { test } from "node:test"

import { isSupabaseAuthLinkExpiredError } from "./supabase-auth-errors.ts"

test("recunoaște linkurile Auth expirate, nu erorile generice", () => {
  assert.equal(isSupabaseAuthLinkExpiredError("otp_expired"), true)
  assert.equal(isSupabaseAuthLinkExpiredError("Email link is invalid or has expired"), true)
  assert.equal(isSupabaseAuthLinkExpiredError("Auth session missing"), false)
  assert.equal(isSupabaseAuthLinkExpiredError("Invalid login credentials"), false)
  assert.equal(isSupabaseAuthLinkExpiredError("invalid request"), false)
  assert.equal(isSupabaseAuthLinkExpiredError(null), false)
})
