import "server-only"

import { Resend } from "resend"

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const DEFAULT_FROM = "KinetoFlow Suport <onboarding@resend.dev>"
const DEFAULT_TO = "kinetic01flow@gmail.com"

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;")
}

function notifyRecipient(): string {
  return process.env.SUPPORT_NOTIFY_EMAIL?.trim() || DEFAULT_TO
}

function fromAddress(): string {
  return process.env.RESEND_FROM?.trim() || DEFAULT_FROM
}

export async function sendSupportTicketNotification(input: {
  name: string
  contact: string
  message: string
}): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY?.trim()
  if (!apiKey) {
    return
  }

  const sentAt = new Date().toLocaleString("ro-RO", { timeZone: "Europe/Bucharest" })
  const name = escapeHtml(input.name)
  const contact = escapeHtml(input.contact)
  const message = escapeHtml(input.message).replaceAll("\n", "<br />")

  const resend = new Resend(apiKey)
  const payload: {
    from: string
    to: string[]
    subject: string
    html: string
    replyTo?: string
  } = {
    from: fromAddress(),
    to: [notifyRecipient()],
    subject: `[KinetoFlow Contact] Tichet nou de la ${input.name}`,
    html: `
        <div style="font-family:ui-sans-serif,system-ui,sans-serif;max-width:560px;color:#0f172a;line-height:1.5">
        <p style="margin:0 0 16px;font-size:13px;letter-spacing:0.08em;text-transform:uppercase;color:#0d9488">
          KinetoFlow · Tichet suport
        </p>
        <h1 style="margin:0 0 20px;font-size:20px;font-weight:600">Mesaj nou din formularul de contact</h1>
        <table style="width:100%;border-collapse:collapse;font-size:14px">
          <tr>
            <td style="padding:8px 0;color:#64748b;width:160px;vertical-align:top">Nume expeditor</td>
            <td style="padding:8px 0">${name}</td>
          </tr>
          <tr>
            <td style="padding:8px 0;color:#64748b;vertical-align:top">Contact (Email / Tel)</td>
            <td style="padding:8px 0">${contact}</td>
          </tr>
          <tr>
            <td style="padding:8px 0;color:#64748b;vertical-align:top">Data trimiterii</td>
            <td style="padding:8px 0">${escapeHtml(sentAt)}</td>
          </tr>
        </table>
        <p style="margin:20px 0 8px;color:#64748b;font-size:14px">Mesaj</p>
        <div style="padding:14px 16px;border:1px solid #e2e8f0;border-radius:12px;background:#f8fafc;white-space:pre-wrap">${message}</div>
      </div>
    `,
  }

  if (EMAIL_PATTERN.test(input.contact)) {
    payload.replyTo = input.contact
  }

  const { error } = await resend.emails.send(payload)
  if (error) {
    throw new Error(error.message)
  }
}
