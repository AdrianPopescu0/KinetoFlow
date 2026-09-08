import assert from "node:assert/strict"
import { test } from "node:test"

import {
  authorizationMatchesCronSecret,
  describeCronAuthFailure,
  isAuthorizedCronRequest,
  isVercelCronInvocation,
  readCronSecret,
  shouldRunDailyProgressReset,
  unwrapCronAuthToken,
} from "./authorize.ts"

const SECRET = "cron-secret-value-16"

test("Bearer exact cu CRON_SECRET e acceptat; lipsa sau token greșit nu", () => {
  assert.equal(authorizationMatchesCronSecret(`Bearer ${SECRET}`, SECRET), true)
  assert.equal(authorizationMatchesCronSecret(null, SECRET), false)
  assert.equal(authorizationMatchesCronSecret("", SECRET), false)
  assert.equal(authorizationMatchesCronSecret("Bearer wrong", SECRET), false)
  assert.equal(authorizationMatchesCronSecret(`Bearer ${SECRET}`, undefined), false)
  assert.equal(authorizationMatchesCronSecret(`Bearer ${SECRET}`, ""), false)
  assert.equal(authorizationMatchesCronSecret(`Bearer ${SECRET}`, "   "), false)
})

test("trim pe secret/header și bearer lowercase rămân valide", () => {
  assert.equal(authorizationMatchesCronSecret(`Bearer ${SECRET}`, ` ${SECRET} \n`), true)
  assert.equal(authorizationMatchesCronSecret(`  Bearer ${SECRET}  `, SECRET), true)
  assert.equal(authorizationMatchesCronSecret(`bearer ${SECRET}`, SECRET), true)
})

test("cron-job.org: secret brut, Bearer dublu și ghilimele", () => {
  assert.equal(readCronSecret(`"${SECRET}"`), SECRET)
  assert.equal(readCronSecret(`'${SECRET}'`), SECRET)
  assert.equal(unwrapCronAuthToken(`Bearer Bearer ${SECRET}`), SECRET)
  assert.equal(unwrapCronAuthToken(`"${SECRET}"`), SECRET)
  assert.equal(authorizationMatchesCronSecret(SECRET, SECRET), true)
  assert.equal(authorizationMatchesCronSecret(`Bearer Bearer ${SECRET}`, SECRET), true)
  assert.equal(authorizationMatchesCronSecret(`"Bearer ${SECRET}"`, `"${SECRET}"`), true)
})

test("isAuthorizedCronRequest citește Authorization de pe Request", () => {
  const ok = new Request("https://example.com/api/cron/reset-daily-progress", {
    headers: { authorization: `Bearer ${SECRET}` },
  })
  const bad = new Request("https://example.com/api/cron/reset-daily-progress")
  assert.equal(isAuthorizedCronRequest(ok, SECRET), true)
  assert.equal(isAuthorizedCronRequest(bad, SECRET), false)
})

test("cron-job.org: secret în X-Cron-Secret sau X-Api-Key, nu doar Authorization", () => {
  assert.equal(
    isAuthorizedCronRequest(
      new Request("https://example.com/api/cron/reminders", {
        headers: { "x-cron-secret": SECRET },
      }),
      SECRET,
    ),
    true,
  )
  assert.equal(
    isAuthorizedCronRequest(
      new Request("https://example.com/api/cron/reminders", {
        headers: { "x-api-key": `Bearer ${SECRET}` },
      }),
      SECRET,
    ),
    true,
  )
  assert.equal(
    isAuthorizedCronRequest(
      new Request("https://example.com/api/cron/reminders", {
        headers: { "user-agent": "cron-job.org" },
      }),
      SECRET,
    ),
    false,
  )
})

test("describeCronAuthFailure nu divulgă secretul", () => {
  const noHeader = new Request("https://example.com/api/cron/reminders")
  assert.equal(describeCronAuthFailure(noHeader, SECRET).reason, "missing_header")
  assert.equal(describeCronAuthFailure(noHeader, "").reason, "missing_secret")
  const mismatch = new Request("https://example.com/api/cron/reminders", {
    headers: { authorization: "Bearer other" },
  })
  assert.equal(describeCronAuthFailure(mismatch, SECRET).reason, "mismatch")
})

test("detectează invocarea Vercel Cron din header / user-agent", () => {
  assert.equal(
    isVercelCronInvocation(
      new Request("https://example.com/cron", { headers: { "x-vercel-cron": "1" } }),
    ),
    true,
  )
  assert.equal(
    isVercelCronInvocation(
      new Request("https://example.com/cron", { headers: { "x-vercel-cron-schedule": "0 22 * * *" } }),
    ),
    true,
  )
  assert.equal(
    isVercelCronInvocation(
      new Request("https://example.com/cron", { headers: { "user-agent": "vercel-cron/1.0" } }),
    ),
    true,
  )
  assert.equal(isVercelCronInvocation(new Request("https://example.com/cron")), false)
})

test("resetul rulează la ?force=1 sau la cron Vercel, nu doar la miezul nopții", () => {
  assert.equal(shouldRunDailyProgressReset({ force: true, vercelCron: false, inMidnightWindow: false }), true)
  assert.equal(shouldRunDailyProgressReset({ force: false, vercelCron: true, inMidnightWindow: false }), true)
  assert.equal(shouldRunDailyProgressReset({ force: false, vercelCron: false, inMidnightWindow: true }), true)
  assert.equal(shouldRunDailyProgressReset({ force: false, vercelCron: false, inMidnightWindow: false }), false)
})
