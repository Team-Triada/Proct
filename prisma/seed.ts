import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
    // Clear existing data
    await prisma.violationLog.deleteMany()
    await prisma.answer.deleteMany()
    await prisma.quizAttempt.deleteMany()
    await prisma.question.deleteMany()
    await prisma.quiz.deleteMany()
    await prisma.subject.deleteMany()
    await prisma.user.deleteMany()

    const hashedPassword = await bcrypt.hash('admin123', 10)
    const facultyPassword = await bcrypt.hash('faculty123', 10)
    const studentPassword = await bcrypt.hash('student123', 10)

    // Admin
    const admin = await prisma.user.create({
        data: {
            email: 'admin@college.edu',
            password: hashedPassword,
            name: 'HOD Admin',
            role: 'ADMIN',
            department: 'Computer Science',
        },
    })

    // Faculty
    const faculty = await prisma.user.create({
        data: {
            email: 'prof.kumar@college.edu',
            password: facultyPassword,
            name: 'Prof. Kumar',
            role: 'FACULTY',
            department: 'Computer Science',
        },
    })

    const faculty2 = await prisma.user.create({
        data: {
            email: 'prof.sharma@college.edu',
            password: facultyPassword,
            name: 'Prof. Sharma',
            role: 'FACULTY',
            department: 'Computer Science',
        },
    })

    // Subjects
    const subjects = await Promise.all([
        prisma.subject.create({
            data: {
                code: 'CS101',
                name: 'Programming Fundamentals',
                semester: 1,
                department: 'Computer Science',
                faculty: { connect: { id: faculty2.id } }
            }
        }),
        prisma.subject.create({
            data: {
                code: 'CS201',
                name: 'Data Structures',
                semester: 3,
                department: 'Computer Science',
                faculty: { connect: { id: faculty.id } }
            }
        }),
        prisma.subject.create({
            data: {
                code: 'CS202',
                name: 'Object Oriented Programming',
                semester: 3,
                department: 'Computer Science',
                faculty: { connect: { id: faculty.id } }
            }
        }),
        prisma.subject.create({
            data: {
                code: 'CS301',
                name: 'Database Systems',
                semester: 5,
                department: 'Computer Science',
                faculty: { connect: { id: faculty.id } }
            }
        }),
        prisma.subject.create({
            data: {
                code: 'CS302',
                name: 'Computer Networks',
                semester: 5,
                department: 'Computer Science',
                faculty: { connect: { id: faculty2.id } }
            }
        }),
        prisma.subject.create({
            data: {
                code: 'CS401',
                name: 'Machine Learning',
                semester: 7,
                department: 'Computer Science',
                faculty: { connect: { id: faculty.id } }
            }
        }),
    ])

    // Students with semesters
    const student1 = await prisma.user.create({
        data: {
            email: 'rahul@college.edu',
            password: studentPassword,
            name: 'Rahul Verma',
            rollNumber: 'CS2023001',
            role: 'STUDENT',
            department: 'Computer Science',
            semester: 3,
        },
    })

    const student2 = await prisma.user.create({
        data: {
            email: 'priya@college.edu',
            password: studentPassword,
            name: 'Priya Singh',
            rollNumber: 'CS2022015',
            role: 'STUDENT',
            department: 'Computer Science',
            semester: 5,
        },
    })

    const student3 = await prisma.user.create({
        data: {
            email: 'amit@college.edu',
            password: studentPassword,
            name: 'Amit Patel',
            rollNumber: 'CS2021008',
            role: 'STUDENT',
            department: 'Computer Science',
            semester: 7,
        },
    })

    // Sample Quiz for Data Structures (Semester 3)
    const quiz1 = await prisma.quiz.create({
        data: {
            title: 'Data Structures Midterm',
            description: 'Test your knowledge of arrays, linked lists, and trees',
            timePerQuestion: 30,
            totalQuestions: 4,
            enforcementMode: 'NORMAL',
            isPublished: true,
            facultyId: faculty.id,
            subjectId: subjects[1].id, // CS201 - Data Structures
            questions: {
                create: [
                    {
                        text: 'What is the time complexity of accessing an element in an array by index?',
                        options: JSON.stringify(['O(1)', 'O(n)', 'O(log n)', 'O(n²)']),
                        correctIndex: 0,
                        points: 1,
                        order: 1
                    },
                    {
                        text: 'Which data structure uses LIFO (Last In First Out) principle?',
                        options: JSON.stringify(['Queue', 'Stack', 'Linked List', 'Tree']),
                        correctIndex: 1,
                        points: 1,
                        order: 2
                    },
                    {
                        text: 'What is the maximum number of children a node can have in a binary tree?',
                        options: JSON.stringify(['1', '2', '3', 'Unlimited']),
                        correctIndex: 1,
                        points: 1,
                        order: 3
                    },
                    {
                        text: 'Which traversal visits the root node first?',
                        options: JSON.stringify(['Inorder', 'Preorder', 'Postorder', 'Level order']),
                        correctIndex: 1,
                        points: 1,
                        order: 4
                    }
                ]
            }
        }
    })

    // Quiz for Database Systems (Semester 5)
    const quiz2 = await prisma.quiz.create({
        data: {
            title: 'SQL Fundamentals',
            description: 'Basic SQL queries and database concepts',
            timePerQuestion: 45,
            totalQuestions: 3,
            enforcementMode: 'STRICT',
            isPublished: true,
            facultyId: faculty.id,
            subjectId: subjects[3].id, // CS301 - Database Systems
            questions: {
                create: [
                    {
                        text: 'Which SQL statement is used to retrieve data from a database?',
                        options: JSON.stringify(['GET', 'SELECT', 'FETCH', 'RETRIEVE']),
                        correctIndex: 1,
                        points: 1,
                        order: 1
                    },
                    {
                        text: 'Which clause is used to filter records in SQL?',
                        options: JSON.stringify(['FILTER', 'WHERE', 'HAVING', 'CONDITION']),
                        correctIndex: 1,
                        points: 1,
                        order: 2
                    },
                    {
                        text: 'What does ACID stand for in database transactions?',
                        options: JSON.stringify([
                            'Atomicity, Consistency, Isolation, Durability',
                            'Access, Control, Identity, Data',
                            'Add, Create, Insert, Delete',
                            'Aggregate, Count, Index, Database'
                        ]),
                        correctIndex: 0,
                        points: 1,
                        order: 3
                    }
                ]
            }
        }
    })

    // Quiz for Machine Learning (Semester 7)
    const quiz3 = await prisma.quiz.create({
        data: {
            title: 'Introduction to Machine Learning',
            description: 'Basic ML concepts and algorithms',
            timePerQuestion: 60,
            totalQuestions: 3,
            enforcementMode: 'NORMAL',
            isPublished: true,
            facultyId: faculty.id,
            subjectId: subjects[5].id, // CS401 - Machine Learning
            questions: {
                create: [
                    {
                        text: 'Which type of learning uses labeled data?',
                        options: JSON.stringify(['Unsupervised Learning', 'Supervised Learning', 'Reinforcement Learning', 'Semi-supervised Learning']),
                        correctIndex: 1,
                        points: 1,
                        order: 1
                    },
                    {
                        text: 'What is overfitting in machine learning?',
                        options: JSON.stringify([
                            'Model performs poorly on training data',
                            'Model performs well on new data',
                            'Model learns noise in training data',
                            'Model is too simple'
                        ]),
                        correctIndex: 2,
                        points: 1,
                        order: 2
                    },
                    {
                        text: 'Which algorithm is commonly used for classification?',
                        options: JSON.stringify(['Linear Regression', 'K-Means', 'Decision Tree', 'PCA']),
                        correctIndex: 2,
                        points: 1,
                        order: 3
                    }
                ]
            }
        }
    })

    console.log('✅ Seed completed!')
    console.log('')
    console.log('📚 Subjects created:')
    subjects.forEach(s => console.log(`   ${s.code}: ${s.name} (Semester ${s.semester})`))
    console.log('')
    console.log('👨‍🏫 Faculty:')
    console.log('   Prof. Kumar - CS201, CS202, CS301, CS401')
    console.log('   Prof. Sharma - CS101, CS302')
    console.log('')
    console.log('👨‍🎓 Students:')
    console.log('   Rahul (Semester 3) - sees CS201, CS202')
    console.log('   Priya (Semester 5) - sees CS301, CS302')
    console.log('   Amit (Semester 7) - sees CS401')
    console.log('')
    console.log('📝 Sample quizzes created for each semester')
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
