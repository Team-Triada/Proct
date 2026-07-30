/**
 * Single source of truth for password strength.
 *
 * Registration and password reset must agree: a policy enforced only at signup
 * is trivially sidestepped by resetting to a weak password afterwards.
 */

export const PASSWORD_MIN_LENGTH = 8
export const PASSWORD_MAX_LENGTH = 200

const SPECIAL_CHARACTERS = /[!@#$%^&*(),.?":{}|<>_\-+=[\]\\;'/`~]/

/** Returns the first policy violation as a user-facing message, or null if valid. */
export function validatePassword(password: unknown): string | null {
    if (typeof password !== 'string' || password.length === 0) {
        return 'Password is required'
    }
    if (password.length < PASSWORD_MIN_LENGTH) {
        return `Password must be at least ${PASSWORD_MIN_LENGTH} characters`
    }
    // bcrypt silently truncates past 72 bytes; cap well below any DoS threshold.
    if (password.length > PASSWORD_MAX_LENGTH) {
        return `Password must be at most ${PASSWORD_MAX_LENGTH} characters`
    }
    if (!/[a-z]/.test(password)) {
        return 'Password must contain at least one lowercase letter'
    }
    if (!/[A-Z]/.test(password)) {
        return 'Password must contain at least one uppercase letter'
    }
    if (!/[0-9]/.test(password)) {
        return 'Password must contain at least one number'
    }
    if (!SPECIAL_CHARACTERS.test(password)) {
        return 'Password must contain at least one special character'
    }
    return null
}

/** Requirements list for rendering next to a password field. */
export const PASSWORD_REQUIREMENTS = [
    `At least ${PASSWORD_MIN_LENGTH} characters`,
    'One lowercase letter',
    'One uppercase letter',
    'One number',
    'One special character',
] as const
