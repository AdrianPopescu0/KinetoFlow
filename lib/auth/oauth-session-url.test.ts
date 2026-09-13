import assert from "node:assert/strict"
import { test } from "node:test"

import {
  hasOAuthTokensInLocation,
  persistOAuthSessionFromLocation,
  readOAuthTokensFromLocation,
} from "./oauth-session-url.ts"

test("citește access_token și refresh_token din hash-ul URL-ului", () => {
  assert.deepEqual(
    readOAuthTokensFromLocation({
      search: "?next=/dashboard",
      hash: "#access_token=aaa&refresh_token=bbb&expires_in=3600",
    }),
    { code: null, accessToken: "aaa", refreshToken: "bbb" },
  )
})

test("citește code-ul PKCE din query", () => {
  assert.deepEqual(
    readOAuthTokensFromLocation({ search: "?code=pkce-code&next=/dashboard", hash: "" }),
    { code: "pkce-code", accessToken: null, refreshToken: null },
  )
})

test("hasOAuthTokensInLocation recunoaște hash sau code", () => {
  assert.equal(hasOAuthTokensInLocation({ hash: "#access_token=a&refresh_token=b" }), true)
  assert.equal(hasOAuthTokensInLocation({ search: "?code=x" }), true)
  assert.equal(hasOAuthTokensInLocation({ search: "?next=/dashboard", hash: "" }), false)
})

test("persistOAuthSessionFromLocation salvează imediat sesiunea din hash", async () => {
  const calls: Array<{ access_token: string; refresh_token: string }> = []
  const result = await persistOAuthSessionFromLocation(
    {
      auth: {
        async setSession(session) {
          calls.push(session)
          return { error: null }
        },
        async exchangeCodeForSession() {
          return { error: null }
        },
      },
    },
    { hash: "#access_token=tok&refresh_token=ref" },
  )
  assert.equal(result, "set")
  assert.deepEqual(calls, [{ access_token: "tok", refresh_token: "ref" }])
})

test("persistOAuthSessionFromLocation schimbă code-ul PKCE doar dacă e cerut", async () => {
  let exchanged = ""
  const without = await persistOAuthSessionFromLocation(
    {
      auth: {
        async setSession() {
          return { error: null }
        },
        async exchangeCodeForSession(code) {
          exchanged = code
          return { error: null }
        },
      },
    },
    { search: "?code=abc" },
  )
  assert.equal(without, "none")
  assert.equal(exchanged, "")

  const withCode = await persistOAuthSessionFromLocation(
    {
      auth: {
        async setSession() {
          return { error: null }
        },
        async exchangeCodeForSession(code) {
          exchanged = code
          return { error: null }
        },
      },
    },
    { search: "?code=abc" },
    { exchangeCode: true },
  )
  assert.equal(withCode, "exchanged")
  assert.equal(exchanged, "abc")
})
