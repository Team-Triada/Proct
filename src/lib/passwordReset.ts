/**
 * Password reset tokens.
 *
 * The token handed to the user is 32 bytes of CSPRNG output. Only its SHA-256
 * is stored, so the database never holds anything replayable. SHA-256 rather
 * than bcrypt is correct here: the token has full entropy, so there is nothing
 * to brute-force and no need for a slow KDF — but it does mean lookup is a
 * simple indexed equality check.
 */
import { createHash, randomBytes, timingSafeEqual } from 'crypto'
import { prisma } from './db'

export const RESET_TOKEN_TTL_MINUTES = 60

export function generateResetToken(): string {
    return randomBytes(32).toString('hex')
}

export function hashResetToken(token: string): string {
    return createHash('sha256').update(token).digest('hex')
}

/** Constant-time comparison of two hex digests of equal length. */
export function digestsMatch(a: string, b: string): boolean {
    const bufA = Buffer.from(a, 'hex')
    const bufB = Buffer.from(b, 'hex')
    if (bufA.length !== bufB.length || bufA.length === 0) return false
    return timingSafeEqual(bufA, bufB)
}

/**
 * Issues a reset token for a user, invalidating any tokens already outstanding
 * so a previously requested link cannot be used after a newer one is sent.
 */
export async function issueResetToken(userId: string): Promise<{ token: string; expiresAt: Date }> {
    const token = generateResetToken()
    const expiresAt = new Date(Date.now() + RESET_TOKEN_TTL_MINUTES * 60 * 1000)

    await prisma.$transaction([
        prisma.passwordResetToken.deleteMany({ where: { userId, usedAt: null } }),
        prisma.passwordResetToken.create({
            data: { userId, tokenHash: hashResetToken(token), expiresAt },
        }),
    ])

    return { token, expiresAt }
}

export interface ResolvedResetToken {
    id: string
    userId: string
}

/**
 * Resolves a plaintext token to its unused, unexpired record, or null.
 * Returning null covers all failure modes — unknown, expired, already used —
 * without telling the caller which, so the token cannot be probed.
 */
export async function resolveResetToken(token: unknown): Promise<ResolvedResetToken | null> {
    if (typeof token !== 'string' || !/^[a-f0-9]{64}$/.test(token)) return null

    const record = await prisma.passwordResetToken.findUnique({
        where: { tokenHash: hashResetToken(token) },
        select: { id: true, userId: true, expiresAt: true, usedAt: true },
    })

    if (!record) return null
    if (record.usedAt !== null) return null
    if (new Date(record.expiresAt) <= new Date()) return null

    return { id: record.id, userId: record.userId }
}

/** Deletes expired and consumed tokens. Safe to call opportunistically. */
export async function pruneResetTokens(): Promise<void> {
    await prisma.passwordResetToken.deleteMany({
        where: {
            OR: [
                { expiresAt: { lt: new Date() } },
                { usedAt: { not: null } },
            ],
        },
    })
}
