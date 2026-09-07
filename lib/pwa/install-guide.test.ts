import assert from "node:assert/strict"
import { test } from "node:test"

import { detectInstallBrowser, detectPlatform, extraBrowserGuides, installGuideFor } from "./install-guide.ts"

test("recunoaște Chrome Android, Brave, Samsung Internet și Chrome desktop", () => {
  assert.equal(
    detectInstallBrowser({
      userAgent:
        "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Mobile Safari/537.36",
    }),
    "chrome",
  )
  assert.equal(
    detectInstallBrowser({
      userAgent:
        "Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Mobile Safari/537.36",
      isBrave: true,
    }),
    "brave",
  )
  assert.equal(
    detectInstallBrowser({
      userAgent:
        "Mozilla/5.0 (Linux; Android 14; SM-S918B) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/26.0 Chrome/122.0.0.0 Mobile Safari/537.36",
    }),
    "samsung",
  )
  assert.equal(
    detectInstallBrowser({
      userAgent:
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36",
    }),
    "chrome",
  )
})

test("Brave din userAgentData brands bate Chrome din UA", () => {
  assert.equal(
    detectInstallBrowser({
      userAgent:
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36",
      brands: ["Brave", "Chromium"],
    }),
    "brave",
  )
})

test("platforma distinge Android, iOS și desktop", () => {
  assert.equal(detectPlatform({ userAgent: "Mozilla/5.0 (Linux; Android 14) Chrome/128" }), "android")
  assert.equal(detectPlatform({ userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)" }), "ios")
  assert.equal(detectPlatform({ userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)" }), "desktop")
  assert.equal(
    detectPlatform({ userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)", maxTouchPoints: 5 }),
    "ios",
  )
})

test("ghidul Chrome pe Android menționează meniul și Instalează aplicația", () => {
  const guide = installGuideFor({
    userAgent:
      "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Mobile Safari/537.36",
  })
  assert.equal(guide.browser, "chrome")
  assert.equal(guide.platform, "android")
  assert.match(guide.steps.join(" "), /Instalează aplicația/)
})

test("ghidul desktop Chrome menționează iconița din bara de adrese", () => {
  const guide = installGuideFor({
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36",
  })
  assert.equal(guide.platform, "desktop")
  assert.match(guide.steps.join(" "), /barei de adrese/)
})

test("ghidul Samsung nu e înlocuit de Chrome din același UA", () => {
  const guide = installGuideFor({
    userAgent:
      "Mozilla/5.0 (Linux; Android 14; SM-S918B) AppleWebKit/537.36 Chrome/122.0.0.0 SamsungBrowser/26.0 Mobile Safari/537.36",
  })
  assert.equal(guide.browser, "samsung")
  assert.match(guide.steps.join(" "), /Samsung Internet/)
})

test("celelalte browsere din trio rămân ca ghid secundar", () => {
  const extras = extraBrowserGuides("chrome", "android")
  assert.deepEqual(
    extras.map((item) => item.label),
    ["Brave", "Samsung Internet"],
  )
})
