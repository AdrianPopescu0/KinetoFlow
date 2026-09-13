import assert from "node:assert/strict"
import { test } from "node:test"

import { parseCheckinDraft } from "./checkin-draft.ts"

test("parsează un draft de check-in valid", () => {
  const draft = parseCheckinDraft({
    pain: 4,
    sleep: "moderat",
    energy: "buna",
    painKind: "arsura",
    notes: "Mai bine azi",
  })
  assert.deepEqual(draft, {
    pain: 4,
    sleep: "moderat",
    energy: "buna",
    painKind: "arsura",
    notes: "Mai bine azi",
  })
})

test("acceptă somn, energie și tip durere goale", () => {
  const draft = parseCheckinDraft({ pain: 2, sleep: null, energy: null, notes: "" })
  assert.deepEqual(draft, { pain: 2, sleep: null, energy: null, painKind: null, notes: "" })
})

test("respinge draft-uri invalide", () => {
  assert.equal(parseCheckinDraft(null), null)
  assert.equal(parseCheckinDraft({ pain: 99, sleep: null, notes: "" }), null)
  assert.equal(parseCheckinDraft({ pain: 3, sleep: "noapte", notes: "" }), null)
  assert.equal(parseCheckinDraft({ pain: 3, sleep: null, painKind: "efort", notes: "" }), null)
})
