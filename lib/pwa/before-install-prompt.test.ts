import assert from "node:assert/strict"
import { test } from "node:test"

import { isStandaloneDisplay, shouldShowInstallButton } from "./before-install-prompt.ts"

test("butonul e vizibil în browser și dispare doar în PWA standalone", () => {
  assert.equal(shouldShowInstallButton({ isStandalone: false }), true)
  assert.equal(shouldShowInstallButton({ isStandalone: true }), false)
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
