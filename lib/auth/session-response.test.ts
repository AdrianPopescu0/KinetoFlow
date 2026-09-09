import assert from "node:assert/strict"
import { test } from "node:test"

import { isPublicMarketingPath, therapistAppPath } from "./paths.ts"

test("landing-ul public e pagina de marketing, nu dashboard-ul", () => {
  assert.equal(isPublicMarketingPath("/"), true)
  assert.equal(isPublicMarketingPath("/early-access"), true)
  assert.equal(isPublicMarketingPath("/login"), false)
  assert.equal(isPublicMarketingPath("/dashboard"), false)
  assert.equal(isPublicMarketingPath("/acces"), false)
})

test("terapeutul cu clinică merge în dashboard, altfel la onboarding", () => {
  assert.equal(therapistAppPath(true), "/dashboard")
  assert.equal(therapistAppPath(false), "/onboarding")
})
