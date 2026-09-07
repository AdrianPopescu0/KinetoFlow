import assert from "node:assert/strict"
import { test } from "node:test"

import {
  authorizationMatchesCronSecret,
  isAuthorizedCronRequest,
  isVercelCronInvocation,
  shouldRunDailyProgressReset,
} from "./authorize.ts"

const SECRET = "cron-secret-value-16"

test("Bearer exact cu CRON_SECRET e acceptat; lipsa sau token greșit nu", () => {
  assert.equal(authorizationMatchesCronSecret(`Bearer ${SECRET}`, SECRET), true)
  assert.equal(authorizationMatchesCronSecret(null, SECRET), false)
  assert.equal(authorizationMatchesCronSecret("", SECRET), false)
  assert.equal(authorizationMatchesCronSecret("Bearer wrong", SECRET), false)
  assert.equal(authorizationMatchesCronSecret(SECRET, SECRET), false)
  assert.equal(authorizationMatchesCronSecret(`Bearer ${SECRET}`, undefined), false)
  assert.equal(authorizationMatchesCronSecret(`Bearer ${SECRET}`, ""), false)
  assert.equal(authorizationMatchesCronSecret(`Bearer ${SECRET}`, "   "), false)
})

test("trim pe secret/header și bearer lowercase rămân valide", () => {
  assert.equal(authorizationMatchesCronSecret(`Bearer ${SECRET}`, ` ${SECRET} \n`), true)
  assert.equal(authorizationMatchesCronSecret(`  Bearer ${SECRET}  `, SECRET), true)
  assert.equal(authorizationMatchesCronSecret(`bearer ${SECRET}`, SECRET), true)
})

test("isAuthorizedCronRequest citește Authorization de pe Request", () => {
  const ok = new Request("https://example.com/api/cron/reset-daily-progress", {
    headers: { authorization: `Bearer ${SECRET}` },
  })
  const bad = new Request("https://example.com/api/cron/reset-daily-progress")
  assert.equal(isAuthorizedCronRequest(ok, SECRET), true)
  assert.equal(isAuthorizedCronRequest(bad, SECRET), false)
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
