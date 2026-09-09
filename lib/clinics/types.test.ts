import assert from "node:assert/strict"
import { test } from "node:test"

import { canRemoveClinicMember, isClinicAdmin } from "./types.ts"

test("isClinicAdmin recunoaște doar rolul admin", () => {
  assert.equal(isClinicAdmin({ user_id: "a", clinic_name: "K", therapist_name: "A", phone: null, id: null, role: "admin" }), true)
  assert.equal(
    isClinicAdmin({ user_id: "t", clinic_name: "K", therapist_name: "T", phone: null, id: null, role: "therapist" }),
    false,
  )
  assert.equal(isClinicAdmin(null), false)
})

test("canRemoveClinicMember: doar adminul vede Ștergere pe rândurile de terapeut", () => {
  assert.equal(
    canRemoveClinicMember({
      actorIsAdmin: true,
      actorUserId: "admin-1",
      memberRole: "therapist",
      memberUserId: "therapist-1",
    }),
    true,
  )
})

test("canRemoveClinicMember: rândul de Admin nu are buton de ștergere", () => {
  assert.equal(
    canRemoveClinicMember({
      actorIsAdmin: true,
      actorUserId: "admin-1",
      memberRole: "admin",
      memberUserId: "admin-1",
    }),
    false,
  )
  assert.equal(
    canRemoveClinicMember({
      actorIsAdmin: true,
      actorUserId: "admin-1",
      memberRole: "admin",
      memberUserId: "other-admin",
    }),
    false,
  )
})

test("canRemoveClinicMember: un terapeut logat nu poate șterge pe nimeni", () => {
  assert.equal(
    canRemoveClinicMember({
      actorIsAdmin: false,
      actorUserId: "therapist-1",
      memberRole: "therapist",
      memberUserId: "therapist-2",
    }),
    false,
  )
})

test("canRemoveClinicMember: adminul nu își șterge propriul cont", () => {
  assert.equal(
    canRemoveClinicMember({
      actorIsAdmin: true,
      actorUserId: "admin-1",
      memberRole: "therapist",
      memberUserId: "admin-1",
    }),
    false,
  )
})
