import { Resend } from 'resend'

export const resend = new Resend(process.env.RESEND_API_KEY!)

export const FROM_EMAIL = process.env.RESEND_FROM_EMAIL ?? 'noreply@linkvault.app'

// ─── Email senders ────────────────────────────────────────────────────────────

export async function sendVerificationEmail({
  to,
  name,
  token,
}: {
  to: string
  name: string
  token: string
}) {
  const verifyUrl = `${process.env.NEXT_PUBLIC_APP_URL}/verify-email?token=${token}`

  return resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject: 'Verify your LinkVault email',
    html: `
      <h2>Welcome to LinkVault, ${name}!</h2>
      <p>Click the link below to verify your email address. This link expires in 30 minutes.</p>
      <a href="${verifyUrl}" style="display:inline-block;padding:12px 24px;background:#000;color:#fff;text-decoration:none;border-radius:6px;">
        Verify Email
      </a>
      <p style="margin-top:16px;color:#666;font-size:14px;">
        Or copy this URL: ${verifyUrl}
      </p>
    `,
  })
}

export async function sendPasswordResetEmail({
  to,
  name,
  token,
}: {
  to: string
  name: string
  token: string
}) {
  const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${token}`

  return resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject: 'Reset your LinkVault password',
    html: `
      <h2>Password reset request</h2>
      <p>Hi ${name}, click the link below to reset your password. This link expires in 15 minutes.</p>
      <a href="${resetUrl}" style="display:inline-block;padding:12px 24px;background:#000;color:#fff;text-decoration:none;border-radius:6px;">
        Reset Password
      </a>
      <p style="margin-top:16px;color:#666;font-size:14px;">
        If you didn't request this, you can safely ignore this email.
      </p>
    `,
  })
}
