import assert from "node:assert/strict"
import { test } from "node:test"

import {
  isThemePreference,
  parseThemePreference,
  resolveTheme,
  themeCookieWrite,
} from "./preference.ts"

test("recunoaște preferința de temă", () => {
  assert.equal(isThemePreference("light"), true)
  assert.equal(isThemePreference("dark"), true)
  assert.equal(isThemePreference("system"), true)
  assert.equal(isThemePreference("auto"), false)
  assert.equal(isThemePreference(""), false)
})

test("parsează tema din cookie, metadate sau implicit system", () => {
  assert.equal(parseThemePreference("DARK"), "dark")
  assert.equal(parseThemePreference(undefined, "light"), "light")
  assert.equal(parseThemePreference(null, "nope"), "system")
})

test("rezolvă tema automată după sistem", () => {
  assert.equal(resolveTheme("light", true), "light")
  assert.equal(resolveTheme("dark", false), "dark")
  assert.equal(resolveTheme("system", true), "dark")
  assert.equal(resolveTheme("system", false), "light")
})

test("cookie-ul de temă e pe tot site-ul, un an", () => {
  assert.match(themeCookieWrite("system"), /kf_theme=system/)
  assert.match(themeCookieWrite("dark"), /Max-Age=31536000/)
})

test("scriptul de boot aplică tema doar pe dashboard", async () => {
  const { DASHBOARD_THEME_BOOT_SCRIPT } = await import("./preference.ts")
  assert.match(DASHBOARD_THEME_BOOT_SCRIPT, /pathname\.startsWith\("\/dashboard"\)/)
  assert.match(DASHBOARD_THEME_BOOT_SCRIPT, /kf_theme/)
})
