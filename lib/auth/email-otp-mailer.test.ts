import assert from "node:assert/strict"
import { test } from "node:test"

import { describeOtpMailerError, serializeOtpMailerError } from "./email-otp-mailer.ts"

test("rate limit de la Supabase e recunoscut și expus utilizatorului", () => {
  const described = describeOtpMailerError("supabase", {
    message: "email rate limit exceeded",
    code: "over_email_send_rate_limit",
    status: 429,
  })
  assert.equal(described.kind, "rate_limit")
  assert.equal(described.status, 429)
  assert.match(described.userMessage, /rate limit/i)
  assert.match(described.userMessage, /Retrimite codul de confirmare/)
})

test("eroarea SMTP e separată de un eșec generic", () => {
  const described = describeOtpMailerError("resend", {
    name: "application_error",
    message: "SMTP 550: mailbox unavailable",
    statusCode: 451,
  })
  assert.equal(described.kind, "smtp")
  assert.match(described.userMessage, /SMTP/)
  assert.match(described.logMessage, /550/)
})

test("configurația fără Resend nu invocă mailer-ul de test Supabase", () => {
  const described = describeOtpMailerError("config", "RESEND_API_KEY lipsește")
  assert.equal(described.kind, "config")
  assert.match(described.userMessage, /RESEND_API_KEY/)
  assert.match(described.userMessage, /Mailer-ul de test/)
})

test("serializeOtpMailerError păstrează codul și mesajul furnizorului", () => {
  assert.match(
    serializeOtpMailerError({ name: "rate_limit_exceeded", message: "Too many requests", statusCode: 429 }),
    /429/,
  )
  assert.equal(serializeOtpMailerError(new Error("timeout")), "Error — timeout")
})
