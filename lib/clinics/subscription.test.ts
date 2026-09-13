import assert from "node:assert/strict"
import { test } from "node:test"

import { ARCHIVE_LOCKED_MESSAGE, isClinicSubscriptionActive } from "./subscription.ts"

const now = new Date("2026-06-15T12:00:00.000Z")

test("ambele date lipsă: activ (legacy / coloane lipsă)", () => {
  assert.equal(isClinicSubscriptionActive(null, null, now), true)
  assert.equal(isClinicSubscriptionActive("", "", now), true)
})

test("doar endsAt: activ până la termen, inclusiv", () => {
  assert.equal(isClinicSubscriptionActive(null, "2026-12-31T23:59:59.000Z", now), true)
  assert.equal(isClinicSubscriptionActive(null, "2026-06-15T12:00:00.000Z", now), true)
  assert.equal(isClinicSubscriptionActive(null, "2026-01-01T00:00:00.000Z", now), false)
})

test("doar startsAt: activ după start, inclusiv", () => {
  assert.equal(isClinicSubscriptionActive("2026-01-01T00:00:00.000Z", null, now), true)
  assert.equal(isClinicSubscriptionActive("2026-06-15T12:00:00.000Z", null, now), true)
  assert.equal(isClinicSubscriptionActive("2026-07-01T00:00:00.000Z", null, now), false)
})

test("interval complet: activ între capete, inclusiv", () => {
  const startsAt = "2026-01-01T00:00:00.000Z"
  const endsAt = "2026-12-31T00:00:00.000Z"
  assert.equal(isClinicSubscriptionActive(startsAt, endsAt, now), true)
  assert.equal(isClinicSubscriptionActive(startsAt, endsAt, new Date(startsAt)), true)
  assert.equal(isClinicSubscriptionActive(startsAt, endsAt, new Date(endsAt)), true)
})

test("expirat după endsAt", () => {
  assert.equal(
    isClinicSubscriptionActive("2025-01-01T00:00:00.000Z", "2026-01-01T00:00:00.000Z", now),
    false,
  )
})

test("încă nu a început", () => {
  assert.equal(
    isClinicSubscriptionActive("2026-07-01T00:00:00.000Z", "2027-07-01T00:00:00.000Z", now),
    false,
  )
})

test("mesajul de blocare e în română și menționează reînnoirea", () => {
  assert.match(ARCHIVE_LOCKED_MESSAGE, /blocată temporar/i)
  assert.match(ARCHIVE_LOCKED_MESSAGE, /reînnoirea abonamentului/i)
})
