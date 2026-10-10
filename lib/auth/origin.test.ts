import assert from "node:assert/strict"
import { test } from "node:test"

import {
  CANONICAL_PRODUCTION_ORIGIN,
  LOCAL_DEV_ORIGIN,
  isVercelAppOrigin,
  oauthCallbackUrl,
  requestOAuthCallbackOrigin,
  resolveAppOrigin,
} from "./site-origin.ts"

test("recunoaște orice host Vercel, nu doar preview-urile git", () => {
  assert.equal(isVercelAppOrigin("https://kinetoflow96.vercel.app"), true)
  assert.equal(isVercelAppOrigin("https://kinetoflow-git-main.vercel.app"), true)
  assert.equal(isVercelAppOrigin("https://kinetoflow.ro"), false)
  assert.equal(isVercelAppOrigin("http://localhost:3000"), false)
})

test("loginul pe kinetoflow.ro rămâne pe kinetoflow.ro", () => {
  assert.equal(
    resolveAppOrigin({
      forwardedHost: "kinetoflow.ro",
      forwardedProto: "https",
      requestOrigin: "https://kinetoflow96.vercel.app",
      envSiteUrl: "https://kinetoflow96.vercel.app",
      production: true,
    }),
    CANONICAL_PRODUCTION_ORIGIN,
  )
})

test("window.location.origin pe domeniul real bate URL-ul Vercel din env", () => {
  assert.equal(
    resolveAppOrigin({
      requestOrigin: "https://kinetoflow.ro",
      envSiteUrl: "https://kinetoflow96.vercel.app",
      production: true,
    }),
    CANONICAL_PRODUCTION_ORIGIN,
  )
})

test("un request pe *.vercel.app nu e folosit ca redirect după login", () => {
  assert.equal(
    resolveAppOrigin({
      forwardedHost: "kinetoflow96.vercel.app",
      forwardedProto: "https",
      requestOrigin: "https://kinetoflow96.vercel.app",
      envSiteUrl: "https://kinetoflow96.vercel.app",
      production: true,
    }),
    CANONICAL_PRODUCTION_ORIGIN,
  )
})

test("NEXT_PUBLIC_SITE_URL pe kinetoflow.ro e folosit dacă request-ul e Vercel", () => {
  assert.equal(
    resolveAppOrigin({
      requestOrigin: "https://kinetoflow96.vercel.app",
      envSiteUrl: "https://kinetoflow.ro",
      production: true,
    }),
    CANONICAL_PRODUCTION_ORIGIN,
  )
})

test("în producție, SITE_URL de localhost nu bate kinetoflow.ro", () => {
  assert.equal(
    resolveAppOrigin({
      requestOrigin: "https://kinetoflow96.vercel.app",
      envSiteUrl: "http://localhost:3000",
      production: true,
    }),
    CANONICAL_PRODUCTION_ORIGIN,
  )
})

test("local, originea ferestrei rămâne localhost:3000", () => {
  assert.equal(
    resolveAppOrigin({
      requestOrigin: "http://localhost:3000",
      envSiteUrl: "https://kinetoflow.ro",
      production: false,
    }),
    "http://localhost:3000",
  )
})

test("local, SITE_URL greșit pe producție nu bate hostul request-ului pe server", () => {
  assert.equal(
    resolveAppOrigin({
      host: "localhost:3000",
      forwardedProto: "http",
      envSiteUrl: "https://kinetoflow.ro",
      production: false,
    }),
    "http://localhost:3000",
  )
})

test("fără host util, producția cade pe kinetoflow.ro, nu pe Vercel", () => {
  assert.equal(resolveAppOrigin({ production: true }), CANONICAL_PRODUCTION_ORIGIN)
  assert.equal(resolveAppOrigin({ envSiteUrl: "https://x.vercel.app", production: false }), LOCAL_DEV_ORIGIN)
})

test("callback-ul OAuth e pe originea rezolvată", () => {
  assert.equal(
    oauthCallbackUrl(CANONICAL_PRODUCTION_ORIGIN, "/dashboard"),
    "https://kinetoflow.ro/auth/callback?next=%2Fdashboard",
  )
})

test("redirect după /auth/callback păstrează hostul request-ului, fără producție hardcodată", () => {
  assert.equal(
    requestOAuthCallbackOrigin({
      nextUrl: { origin: "http://localhost:3000" },
      headers: { get: (name) => (name === "host" ? "localhost:3000" : null) },
    }),
    "http://localhost:3000",
  )
  assert.equal(
    requestOAuthCallbackOrigin({
      nextUrl: { origin: "https://preview.example" },
      headers: {
        get: (name) => {
          if (name === "x-forwarded-host") return "preview.example"
          if (name === "x-forwarded-proto") return "https"
          return null
        },
      },
    }),
    "https://preview.example",
  )
  assert.equal(
    requestOAuthCallbackOrigin({
      nextUrl: { origin: "https://kinetoflow.ro" },
      headers: {
        get: (name) => {
          if (name === "x-forwarded-host") return "kinetoflow.ro"
          if (name === "x-forwarded-proto") return "https"
          return null
        },
      },
    }),
    "https://kinetoflow.ro",
  )
})
