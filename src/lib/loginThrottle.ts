/**
 * Per-account login throttling.
 *
 * Complements the IP rate limit in middleware: that caps how fast one source can
 * guess, this caps how many times one account can be guessed at regardless of
 * how many addresses the attempts come from.
 *
 * Lockout is temporary by design. A permanent lock would let anyone deny a
 * student access to their exam by failing their login a few times, which is a
 * worse outcome than a slow guessing channel.
 */
import { prisma } from './db'

export const MAX_FAILED_ATTEMPTS = 8
export const LOCKOUT_MINUTES = 15

export function isLocked(user: { lockedUntil: Date | null }, now: Date = new Date()): boolean {
    return user.lockedUntil !== null && new Date(user.lockedUntil) > now
}

/**
 * Records a failed sign-in and locks the account once the threshold is reached.
 * Failures are counted from the last lock, not for all time.
 */
export async function recordFailedLogin(userId: string, currentFailures: number): Promise<void> {
    const failedLoginAttempts = currentFailures + 1
    const shouldLock = failedLoginAttempts >= MAX_FAILED_ATTEMPTS

    await prisma.user.update({
        where: { id: userId },
        data: {
            failedLoginAttempts: shouldLock ? 0 : failedLoginAttempts,
            lockedUntil: shouldLock ? new Date(Date.now() + LOCKOUT_MINUTES * 60 * 1000) : undefined,
        },
    })
}

/** Clears throttling state after a successful sign-in. */
export async function clearFailedLogins(userId: string, currentFailures: number, wasLocked: boolean): Promise<void> {
    if (currentFailures === 0 && !wasLocked) return
    await prisma.user.update({
        where: { id: userId },
        data: { failedLoginAttempts: 0, lockedUntil: null },
    })
}
