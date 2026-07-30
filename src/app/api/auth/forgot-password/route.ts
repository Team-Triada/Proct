import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { issueResetToken, pruneResetTokens } from '@/lib/passwordReset'
import { appBaseUrl, sendMail } from '@/lib/mailer'

/**
 * Starts a password reset.
 *
 * The response is identical whether or not the address is registered. Anything
 * else turns this endpoint into an account enumeration oracle, which matters
 * here because addresses follow an institutional pattern and are easy to guess.
 * Per-IP throttling is applied in middleware.
 */
export async function POST(request: Request) {
    const GENERIC_RESPONSE = {
        message: 'If that email is registered, a reset link has been sent.',
    }

    try {
        const body = await request.json()
        const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : ''

        if (!email) {
            return NextResponse.json({ error: 'Email is required' }, { status: 400 })
        }

        const user = await prisma.user.findUnique({
            where: { email },
            select: { id: true, name: true, email: true },
        })

        // Opportunistic cleanup; cheap and keeps the table from growing forever.
        await pruneResetTokens()

        if (!user) {
            return NextResponse.json(GENERIC_RESPONSE)
        }

        const { token, expiresAt } = await issueResetToken(user.id)
        const resetUrl = `${appBaseUrl()}/reset-password?token=${token}`

        const result = await sendMail({
            to: user.email,
            subject: 'Reset your Proct password',
            text:
                `Hello ${user.name},\n\n` +
                `A password reset was requested for your Proct account.\n\n` +
                `${resetUrl}\n\n` +
                `This link expires at ${expiresAt.toUTCString()} and can be used once.\n` +
                `If you did not request this, you can ignore this email — your password has not changed.\n`,
        })

        // Surface the link in the response only when no mail provider is
        // configured AND we are not in production, so local development works
        // without SMTP while a misconfigured production box never leaks tokens.
        if (result.loggedOnly && process.env.NODE_ENV !== 'production') {
            return NextResponse.json({ ...GENERIC_RESPONSE, devResetUrl: resetUrl })
        }

        return NextResponse.json(GENERIC_RESPONSE)
    } catch (error) {
        console.error('Forgot password error:', error)
        // Still generic — a 500 that only fires for real accounts would leak too.
        return NextResponse.json(GENERIC_RESPONSE)
    }
}
