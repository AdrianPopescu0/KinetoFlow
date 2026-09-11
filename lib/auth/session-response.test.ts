import assert from "node:assert/strict"
import { test } from "node:test"

import { isPublicMarketingPath, isSignupAuthMode, loginHref, safeAuthNextPath, shouldStayOnTherapistLogin, therapistAppPath } from "./paths.ts"
import { isSupabaseAuthCookieName, oauthBrowserRedirectTo, therapistEnterPath } from "./oauth-redirect.ts"

test("taburile de autentificare și înregistrare au rute distincte", () => {
  assert.equal(loginHref("signin"), "/login?mode=signin")
  assert.equal(loginHref("signup"), "/login?mode=signup")
  assert.notEqual(loginHref("signin"), loginHref("signup"))
  assert.equal(isSignupAuthMode({ mode: "signup" }), true)
  assert.equal(isSignupAuthMode({ tab: "register" }), true)
  assert.equal(isSignupAuthMode({ mode: "signin" }), false)
  assert.equal(isSignupAuthMode({}), false)
})

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

test("după deconectarea de pe invitație, /login?signedout=1 nu e aruncat în clinică", () => {
  assert.equal(shouldStayOnTherapistLogin("signedout=1"), true)
  assert.equal(shouldStayOnTherapistLogin("?signedout=1"), true)
  assert.equal(shouldStayOnTherapistLogin(new URLSearchParams("signedout=1")), true)
  assert.equal(shouldStayOnTherapistLogin("reason=oauth"), false)
  assert.equal(shouldStayOnTherapistLogin(null), false)
})

test("după login, destinația implicită e dashboard-ul clinicii", () => {
  assert.equal(therapistEnterPath("/dashboard"), "/dashboard")
  assert.equal(therapistEnterPath("/onboarding"), "/onboarding")
  assert.equal(therapistEnterPath(null), "/dashboard")
  assert.equal(therapistEnterPath("/"), "/dashboard")
})

test("callback-ul Google duce în dashboard, nu pe pagina principală", () => {
  assert.equal(
    oauthBrowserRedirectTo("https://kinetoflow.ro", { next: "/dashboard" }),
    "https://kinetoflow.ro/auth/callback?next=%2Fdashboard",
  )
  assert.equal(
    oauthBrowserRedirectTo("https://app.example", { next: "/dashboard" }),
    "https://app.example/auth/callback?next=%2Fdashboard",
  )
  assert.match(
    oauthBrowserRedirectTo("https://app.example", { next: "/dashboard", invite: "tok" }),
    /invite=tok/,
  )
  assert.match(
    oauthBrowserRedirectTo("https://kinetoflow.ro", { next: "/onboarding", invite: "AbCdEfGhIjKlMnOpQrStUv" }),
    /invite=AbCdEfGhIjKlMnOpQrStUv/,
  )
})

test("callback-ul Google poate reveni pe pagina care citește invitația din localStorage", () => {
  assert.equal(safeAuthNextPath("/auth/invitatie/continue"), "/auth/invitatie/continue")
  assert.equal(safeAuthNextPath("/onboarding"), "/onboarding")
  assert.equal(
    safeAuthNextPath("/auth/invitatie/AbCdEfGhIjKlMnOpQrStUvWx"),
    "/auth/invitatie/AbCdEfGhIjKlMnOpQrStUvWx",
  )
  assert.match(
    oauthBrowserRedirectTo("https://kinetoflow.ro", {
      next: "/auth/invitatie/continue",
      invite: "AbCdEfGhIjKlMnOpQrStUv",
    }),
    /next=%2Fauth%2Finvitatie%2Fcontinue/,
  )
})

test("recunoaște cookie-urile de sesiune Supabase", () => {
  assert.equal(isSupabaseAuthCookieName("sb-xxxx-auth-token"), true)
  assert.equal(isSupabaseAuthCookieName("sb-xxxx-auth-token.0"), true)
  assert.equal(isSupabaseAuthCookieName("early_access_verified"), false)
})
