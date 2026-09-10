import type { AuthEmailOtpPurpose } from "@/lib/auth/email-otp"

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;")
}

export const AUTH_OTP_FROM_DEFAULT = "KinetoFlow <no-reply@kinetoflow.ro>"

export function authOtpFromAddress(): string {
  return process.env.RESEND_AUTH_FROM?.trim() || AUTH_OTP_FROM_DEFAULT
}

export function buildAuthOtpEmail(input: {
  code: string
  purpose: AuthEmailOtpPurpose
  loginUrl: string
}): { subject: string; html: string; text: string } {
  const code = escapeHtml(input.code)
  const loginUrl = escapeHtml(input.loginUrl)
  const isRegister = input.purpose === "register"
  const subject = isRegister
    ? "Codul tău KinetoFlow pentru crearea contului"
    : "Codul tău de autentificare KinetoFlow"
  const heading = isRegister ? "Confirmă crearea contului" : "Cod de autentificare"
  const intro = isRegister
    ? "Introdu acest cod în aplicație, pe același telefon, tabletă sau calculator de pe care ai început înregistrarea. Emailul nu te autentifică automat."
    : "Introdu acest cod în aplicație, pe dispozitivul de pe care ai cerut autentificarea."

  const text = [
    heading,
    intro,
    `Codul tău: ${input.code}`,
    "Valabil 10 minute. Dacă nu ai cerut acest email, poți să-l ignori.",
    `Ecranul de confirmare este deja deschis în aplicație. Dacă l-ai închis: ${input.loginUrl}`,
  ].join("\n")

  const html = `
    <div style="margin:0;padding:0;background:#f8fafc">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:32px 16px">
        <tr>
          <td align="center">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border:1px solid #e2e8f0;border-radius:16px;padding:32px 28px;font-family:ui-sans-serif,system-ui,sans-serif;color:#0f172a">
              <tr>
                <td>
                  <p style="margin:0 0 8px;font-size:12px;letter-spacing:0.14em;text-transform:uppercase;color:#0f766e;font-weight:600">KinetoFlow</p>
                  <h1 style="margin:0 0 12px;font-size:22px;line-height:1.3;font-weight:600">${heading}</h1>
                  <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#475569">${intro}</p>
                  <p style="margin:0 0 8px;font-size:12px;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;color:#94a3b8">Cod de 6 cifre</p>
                  <p style="margin:0 0 24px;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:32px;letter-spacing:0.28em;font-weight:700;color:#042f2e">${code}</p>
                  <p style="margin:0 0 16px;font-size:14px;line-height:1.6;color:#334155">Nu apăsa niciun buton din email. Tastează codul în ecranul KinetoFlow rămas deschis pe dispozitivul de pe care ai început.</p>
                  <p style="margin:0 0 8px;font-size:13px;line-height:1.6;color:#64748b">Valabil 10 minute. Dacă ai închis aplicația, revino la <a href="${loginUrl}" style="color:#0f766e">pagina de autentificare</a> și cere un cod nou.</p>
                  <p style="margin:0;font-size:12px;line-height:1.6;color:#94a3b8">Dacă nu ai cerut acest mesaj, ignoră-l. Nu trimitem parole pe email.</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </div>
  `

  return { subject, html, text }
}
