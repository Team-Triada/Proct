async function runFullNetworkFlow() {
  const baseUrl = 'http://localhost:3000';
  const timestamp = Date.now();
  console.log('🚀 Starting Full Network Flow Test...');

  async function getCsrfToken() {
    const res = await fetch(`${baseUrl}/api/auth/csrf`);
    const { csrfToken } = await res.json();
    return csrfToken;
  }

  // 1. REGISTER FACULTY
  console.log('\n📡 [1/5] REGISTERING FACULTY...');
  const facultyEmail = `fac-${timestamp}@yenepoya.edu.in`;
  const regRes = await fetch(`${baseUrl}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Net Faculty',
      email: facultyEmail,
      password: 'Password@123',
      rollNumber: `FAC-${timestamp.toString().slice(-4)}`,
      campusId: '22222',
      batch: 'FACULTY',
      semester: '1',
      section: 'A'
    })
  });
  const regData = await regRes.json();
  console.log('✅ Faculty Registered:', facultyEmail);

  // Note: Registration currently hardcodes role to STUDENT in the route.ts I saw earlier.
  // I will manually promote this user to FACULTY via DB to continue the flow.
  const { PrismaClient } = require('@prisma/client');
  const prisma = new PrismaClient();
  await prisma.user.update({ where: { email: facultyEmail }, data: { role: 'FACULTY' } });
  console.log('🛠️ User promoted to FACULTY (internal DB update)');

  // 2. LOGIN AS FACULTY
  console.log('\n📡 [2/5] LOGGING IN AS FACULTY...');
  const csrfToken = await getCsrfToken();
  const loginRes = await fetch(`${baseUrl}/api/auth/callback/credentials`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      email: facultyEmail,
      password: 'Password@123',
      csrfToken,
      json: 'true'
    })
  });
  
  const cookies = loginRes.headers.get('set-cookie');
  if (!cookies) throw new Error('Failed to get session cookie');
  const sessionCookie = cookies.split(';')[0];
  console.log('✅ Logged in successfully. Session cookie captured.');

  // 3. CREATE SUBJECT
  console.log('\n📡 [3/5] CREATING SUBJECT...');
  const subRes = await fetch(`${baseUrl}/api/subjects/my`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Cookie': sessionCookie },
    body: JSON.stringify({
      name: `Net Subject ${timestamp}`,
      code: `NET${timestamp.toString().slice(-4)}`,
      semester: 1
    })
  });
  const subData = await subRes.json();
  console.log('✅ Subject Created:', subData.name);

  // 4. ADMIN APPROVAL (Login as Admin first)
  console.log('\n📡 [4/5] ADMIN APPROVAL FLOW...');
  const adminCsrf = await getCsrfToken();
  const adminLogin = await fetch(`${baseUrl}/api/auth/callback/credentials`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      email: 'admin@college.edu',
      password: 'password123',
      csrfToken: adminCsrf,
      json: 'true'
    })
  });
  const adminCookie = adminLogin.headers.get('set-cookie').split(';')[0];

  await fetch(`${baseUrl}/api/subjects/${subData.id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', 'Cookie': adminCookie },
    body: JSON.stringify({ isApproved: true })
  });
  console.log('✅ Subject Approved by Admin.');

  // 5. CREATE QUIZ
  console.log('\n📡 [5/5] CREATING QUIZ...');
  const quizRes = await fetch(`${baseUrl}/api/quizzes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Cookie': sessionCookie },
    body: JSON.stringify({
      title: `Net Quiz ${timestamp}`,
      subjectId: subData.id,
      timePerQuestion: 60,
      totalQuestions: 1,
      isPublished: true,
      assignedBatches: ['2023-26'],
      questions: [
        { text: 'Network Log Test?', type: 'MULTIPLE_CHOICE', options: ['Yes', 'No'], correctIndex: 0, points: 10 }
      ]
    })
  });
  const quizData = await quizRes.json();
  console.log('✅ Quiz Created:', quizData.title);

  console.log('\n🏁 FULL NETWORK FLOW COMPLETED! Check your terminal for request logs.');
  await prisma.$disconnect();
}

runFullNetworkFlow().catch(console.error);
