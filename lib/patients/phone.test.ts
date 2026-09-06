import assert from "node:assert/strict"
import { test } from "node:test"

import { toTwilioE164 } from "./phone.ts"

test("toTwilioE164 scoate prefixul whatsapp: și păstrează E.164", () => {
  assert.equal(toTwilioE164("whatsapp:+4915888623971"), "+4915888623971")
  assert.equal(toTwilioE164("whatsapp:+1 415 555 2671"), "+14155552671")
  assert.equal(toTwilioE164("+4915888623971"), "+4915888623971")
  assert.equal(toTwilioE164("4915888623971"), "+4915888623971")
  assert.equal(toTwilioE164(null), null)
})
