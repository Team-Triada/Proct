
import { prisma } from '@/lib/db'

async function fixStudent() {
    const email = 'rahul@college.edu'
    await prisma.user.update({
        where: { email },
        data: { section: '1' }
    })
    console.log(`Updated ${email} to Section 1`)
}

fixStudent()
