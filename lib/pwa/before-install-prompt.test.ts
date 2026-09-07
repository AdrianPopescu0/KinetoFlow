import assert from "node:assert/strict"
import { test } from "node:test"

import { isStandaloneDisplay, shouldShowInstallButton } from "./before-install-prompt.ts"

test("butonul e vizibil doar când există beforeinstallprompt și nu e deja instalat", () => {
  const promptEvent = {} as Parameters<typeof shouldShowInstallButton>[0]["promptEvent"]
  assert.equal(shouldShowInstallButton({ promptEvent, isStandalone: false }), true)
  assert.equal(shouldShowInstallButton({ promptEvent: null, isStandalone: false }), false)
  assert.equal(shouldShowInstallButton({ promptEvent, isStandalone: true }), false)
})

test("standalone / iOS home screen nu mai cere instalare", () => {
  assert.equal(
    isStandaloneDisplay({
      matchMedia: (query) => ({ matches: query.includes("standalone") }),
    }),
    true,
  )
  assert.equal(
    isStandaloneDisplay({
      matchMedia: () => ({ matches: false }),
      navigator: { standalone: true },
    }),
    true,
  )
  assert.equal(
    isStandaloneDisplay({
      matchMedia: () => ({ matches: false }),
      navigator: {},
    }),
    false,
  )
})
