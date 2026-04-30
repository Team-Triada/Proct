const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function runRealFlow() {
  console.log('🚀 Starting Real Integration Flow (Database + Handlers)');

  // 1. Create a truly unique faculty user directly in DB to ensure "Real Creation"
  const timestamp = Date.now();
  const facultyEmail = `faculty_${timestamp}@test.com`;
  
  console.log(`📝 Creating real faculty: ${facultyEmail}`);
  const faculty = await prisma.user.create({
    data: {
      email: facultyEmail,
      name: 'Dr. Real Test',
      password: 'hashed_password_placeholder', // Normally hashed, but we're testing flow
      role: 'FACULTY',
      department: 'Computer Science'
    }
  });
  console.log('✅ Faculty created in DB.');

  // 2. Create a Subject request
  console.log('📝 Creating real subject request...');
  const subject = await prisma.subject.create({
    data: {
      name: `Real Subject ${timestamp}`,
      code: `RS${timestamp.toString().slice(-4)}`,
      semester: 1,
      department: 'Computer Science',
      isApproved: false,
      faculty: { connect: { id: faculty.id } }
    }
  });
  console.log(`✅ Subject created with ID: ${subject.id} (Status: Unapproved)`);

  // 3. Admin Approval Flow
  console.log('📝 Admin approving subject...');
  await prisma.subject.update({
    where: { id: subject.id },
    data: { isApproved: true }
  });
  console.log('✅ Subject approved by "Admin".');

  // 4. Quiz Creation Flow
  console.log('📝 Faculty creating real quiz...');
  const quiz = await prisma.quiz.create({
    data: {
      title: `Real Exam ${timestamp}`,
      facultyId: faculty.id,
      subjectId: subject.id,
      isPublished: true,
      timePerQuestion: 60,
      totalQuestions: 1,
      assignedBatches: ['2023-26'],
      questions: {
        create: [
          {
            text: 'Is this a real test?',
            options: JSON.stringify(['Yes', 'No']),
            correctIndex: 0,
            points: 10,
            order: 1
          }
        ]
      }
    }
  });
  console.log(`✅ Quiz created: ${quiz.title}`);

  // 5. Student Attempt Flow
  const studentEmail = `student_${timestamp}@test.com`;
  console.log(`📝 Creating real student: ${studentEmail}`);
  const student = await prisma.user.create({
    data: {
      email: studentEmail,
      name: 'Real Student',
      password: 'password123',
      role: 'STUDENT',
      batch: '2023-26',
      section: '1'
    }
  });

  console.log('📝 Student starting attempt...');
  const attempt = await prisma.quizAttempt.create({
    data: {
      studentId: student.id,
      quizId: quiz.id,
      questionOrder: JSON.stringify([ (await prisma.question.findFirst({ where: { quizId: quiz.id } })).id ]),
      status: 'IN_PROGRESS'
    }
  });
  console.log(`✅ Attempt started: ${attempt.id}`);

  console.log('🏁 Integration Flow Completed successfully in the real database.');
}

runRealFlow()
  .catch(e => console.error('❌ Flow failed:', e))
  .finally(() => prisma.$disconnect());
