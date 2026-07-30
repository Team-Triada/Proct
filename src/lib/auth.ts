import { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"
import { prisma } from "./db"
import { clearFailedLogins, isLocked, recordFailedLogin } from "./loginThrottle"

// A real bcrypt hash (of a value nothing can match) used only to equalise the
// timing of the "no such user" path against the "wrong password" path.
const DUMMY_HASH = "$2b$12$C6UzMDM.H6dfI/f/IKcEeO.wI7uJx3sZ0Rr0Vv7ULzT8L1Q0Ib1Uu"

export const authOptions: NextAuthOptions = {
    providers: [
        CredentialsProvider({
            name: "credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" }
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) {
                    return null
                }

                const user = await prisma.user.findUnique({
                    where: { email: credentials.email }
                })

                if (!user) {
                    // Spend comparable time on a missing account so response
                    // latency does not reveal which addresses are registered.
                    await bcrypt.compare(credentials.password, DUMMY_HASH)
                    return null
                }

                // A locked account fails without even checking the password, so
                // the lock cannot be probed for correctness.
                if (isLocked(user)) {
                    return null
                }

                const isValid = await bcrypt.compare(credentials.password, user.password)

                if (!isValid) {
                    await recordFailedLogin(user.id, user.failedLoginAttempts)
                    return null
                }

                await clearFailedLogins(user.id, user.failedLoginAttempts, user.lockedUntil !== null)

                return {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    role: user.role as 'ADMIN' | 'FACULTY' | 'STUDENT',
                    rollNumber: user.rollNumber,
                }
            }
        })
    ],
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id
                token.role = user.role
                token.rollNumber = user.rollNumber
            }
            return token
        },
        async session({ session, token }) {
            if (session.user) {
                session.user.id = token.id as string
                session.user.role = token.role as 'ADMIN' | 'FACULTY' | 'STUDENT'
                session.user.rollNumber = token.rollNumber
            }
            return session
        }
    },
    pages: {
        signIn: "/login",
    },
    session: {
        strategy: "jwt",
    },
    secret: process.env.NEXTAUTH_SECRET,
}
