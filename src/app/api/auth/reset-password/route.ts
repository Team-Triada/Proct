import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/db'
import { resolveResetToken } from '@/lib/passwordReset'
import { validatePassword } from '@/lib/passwordPolicy'

/**
 * Completes a password reset.
 *
 * Consuming the token, writing the new hash and clearing any login lockout all
 * happen in one transaction, so a crash cannot leave a token spent against a
 * password that was never stored.
 */
export async function POST(request: Request) {
    try {
        const body = await request.json()
        const { token, password } = body ?? {}

        const passwordError = validatePassword(password)
        if (passwordError) {
            return NextResponse.json({ error: passwordError }, { status: 400 })
        }

        const resolved = await resolveResetToken(token)
        if (!resolved) {
            return NextResponse.json(
                { error: 'This reset link is invalid or has expired. Please request a new one.' },
                { status: 400 }
            )
        }

        const hashedPassword = await bcrypt.hash(password, 12)

        await prisma.$transaction([
            prisma.passwordResetToken.update({
                where: { id: resolved.id },
                data: { usedAt: new Date() },
            }),
            prisma.user.update({
                where: { id: resolved.userId },
                data: {
                    password: hashedPassword,
                    // A successful reset clears throttling, otherwise a locked-out
                    // user still could not sign in with their new password.
                    failedLoginAttempts: 0,
                    lockedUntil: null,
                },
            }),
            // Any other outstanding tokens for this user are now void.
            prisma.passwordResetToken.deleteMany({
                where: { userId: resolved.userId, usedAt: null },
            }),
        ])

        return NextResponse.json({ message: 'Password updated. You can now sign in.' })
    } catch (error) {
        console.error('Reset password error:', error)
        return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
    }
}
