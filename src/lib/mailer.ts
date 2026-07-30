/**
 * Outbound email.
 *
 * No SMTP dependency is pulled in. If `RESEND_API_KEY` is set, mail goes out
 * over Resend's HTTP API with a plain fetch. If it is not set, the message is
 * written to the server log instead and `delivered` comes back false, so the
 * caller knows the mail did not actually leave the box.
 *
 * The unconfigured path is a development convenience, not a deployment mode:
 * a production instance without a provider configured cannot deliver reset
 * links, and an administrator has to read them out of the logs.
 */

export interface MailMessage {
    to: string
    subject: string
    text: string
}

export interface MailResult {
    delivered: boolean
    /** Set when no provider is configured, for surfacing in dev only. */
    loggedOnly?: boolean
}

function isConfigured(): boolean {
    return Boolean(process.env.RESEND_API_KEY && process.env.MAIL_FROM)
}

export async function sendMail(message: MailMessage): Promise<MailResult> {
    if (!isConfigured()) {
        console.warn(
            `[mailer] RESEND_API_KEY/MAIL_FROM not configured — email not sent.\n` +
            `         To: ${message.to}\n` +
            `         Subject: ${message.subject}\n` +
            `${message.text}`
        )
        return { delivered: false, loggedOnly: true }
    }

    try {
        const res = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                from: process.env.MAIL_FROM,
                to: [message.to],
                subject: message.subject,
                text: message.text,
            }),
        })

        if (!res.ok) {
            console.error(`[mailer] delivery failed (${res.status}): ${await res.text()}`)
            return { delivered: false }
        }

        return { delivered: true }
    } catch (error) {
        console.error('[mailer] delivery threw', error)
        return { delivered: false }
    }
}

/** Absolute base URL for links in outbound mail. */
export function appBaseUrl(): string {
    return process.env.NEXTAUTH_URL?.replace(/\/$/, '') || 'http://localhost:3000'
}
