/**
 * Invite email/password signup may enter the clinic only after confirmInviteRegisterOtp
 * succeeds with a valid 6-digit email OTP. The send/resend step must never log the user in.
 */
export type InviteOtpSendResult = {
  error?: string
  canResend?: boolean
  otpSent?: boolean
  info?: string
  next?: string
} | null

export type InviteOtpSendOutcome = {
  enterClinic: false
  showCodeStep: boolean
  sent: boolean
  message: string | null
}

const SEND_FAILED_MESSAGE = "Nu am putut trimite codul de confirmare. Încearcă din nou."

export function inviteOtpSendOutcome(result: InviteOtpSendResult): InviteOtpSendOutcome {
  if (result?.error) {
    return {
      enterClinic: false,
      showCodeStep: result.canResend === true,
      sent: false,
      message: result.error,
    }
  }

  if (result?.otpSent) {
    return {
      enterClinic: false,
      showCodeStep: true,
      sent: true,
      message: null,
    }
  }

  return {
    enterClinic: false,
    showCodeStep: true,
    sent: false,
    message: SEND_FAILED_MESSAGE,
  }
}

export function inviteOtpConfirmAllowsClinic(
  result: { next?: string; error?: string } | null | undefined,
): boolean {
  return Boolean(result && result.next === "/dashboard" && !result.error)
}
