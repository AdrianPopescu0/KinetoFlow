import assert from "node:assert/strict"
import { test } from "node:test"

import {
  CANONICAL_PRODUCTION_ORIGIN,
  LOCAL_DEV_ORIGIN,
  isVercelAppOrigin,
  oauthCallbackUrl,
  resolveAppOrigin,
} from "./site-origin.ts"

test("recunoaște orice host Vercel, nu doar preview-urile git", () => {
  assert.equal(isVercelAppOrigin("https://kinetoflow96.vercel.app"), true)
  assert.equal(isVercelAppOrigin("https://kinetoflow-git-main.vercel.app"), true)
  assert.equal(isVercelAppOrigin("https://kinetoflow.ro"), false)
  assert.equal(isVercelAppOrigin("http://127.0.0.1:43123"), false)
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
      envSiteUrl: "http://127.0.0.1:43123",
      production: true,
    }),
    CANONICAL_PRODUCTION_ORIGIN,
  )
})

test("local, originea ferestrei rămâne 127.0.0.1", () => {
  assert.equal(
    resolveAppOrigin({
      requestOrigin: "http://127.0.0.1:43123",
      envSiteUrl: "https://kinetoflow.ro",
      production: false,
    }),
    "http://127.0.0.1:43123",
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
