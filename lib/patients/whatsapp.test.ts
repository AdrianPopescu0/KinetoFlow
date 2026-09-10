import assert from "node:assert/strict"
import { test } from "node:test"

import {
  isExternalWhatsAppUrl,
  patientWhatsAppHref,
  patientWhatsAppWebHref,
} from "./whatsapp-links.ts"

test("click-to-chat folosește api.whatsapp.com, nu o rută internă", () => {
  const href = patientWhatsAppHref("0722 123 456", "Bună, Ana!")
  assert.ok(href)
  const url = new URL(href)
  assert.equal(url.protocol, "https:")
  assert.equal(url.hostname, "api.whatsapp.com")
  assert.equal(url.pathname, "/send")
  assert.equal(url.searchParams.get("phone"), "40722123456")
  assert.equal(url.searchParams.get("text"), "Bună, Ana!")
  assert.equal(href.includes("/dashboard"), false)
})

test("WhatsApp Web rămâne pe web.whatsapp.com", () => {
  const href = patientWhatsAppWebHref("0722123456", "Cod 12345678")
  assert.ok(href)
  const url = new URL(href)
  assert.equal(url.hostname, "web.whatsapp.com")
  assert.equal(url.pathname, "/send")
  assert.equal(url.searchParams.get("phone"), "40722123456")
  assert.ok((url.searchParams.get("text") ?? "").includes("12345678"))
})

test("număr invalid nu produce link", () => {
  assert.equal(patientWhatsAppHref("12", "salut"), null)
  assert.equal(patientWhatsAppWebHref("", "salut"), null)
})

test("doar URL-uri https WhatsApp sunt acceptate pentru deschidere externă", () => {
  assert.equal(
    isExternalWhatsAppUrl("https://api.whatsapp.com/send?phone=40722123456&text=x"),
    true,
  )
  assert.equal(isExternalWhatsAppUrl("https://wa.me/40722123456?text=x"), true)
  assert.equal(
    isExternalWhatsAppUrl("https://web.whatsapp.com/send?phone=40722123456&text=x"),
    true,
  )
  assert.equal(isExternalWhatsAppUrl("/dashboard/patients/wa.me/40722123456"), false)
  assert.equal(isExternalWhatsAppUrl("wa.me/40722123456"), false)
  assert.equal(isExternalWhatsAppUrl("http://api.whatsapp.com/send?phone=40722123456"), false)
  assert.equal(isExternalWhatsAppUrl("https://evil.example/send?phone=40722123456"), false)
  assert.equal(isExternalWhatsAppUrl(null), false)
})
