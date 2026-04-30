

async function triggerNetworkLogs() {
  const baseUrl = 'http://localhost:3000';
  console.log(`🌐 Sending REAL network requests to ${baseUrl}...`);

  const timestamp = Date.now();
  const payload = {
    name: 'Network Log Student',
    email: `network-${timestamp}@yenepoya.edu.in`,
    password: 'Password@123',
    rollNumber: `NET-${timestamp.toString().slice(-6)}`,
    campusId: '11111',
    batch: '2023-26',
    semester: '3',
    section: '1'
  };

  try {
    console.log('📡 POSTing to /api/auth/register...');
    const response = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await response.json();
    console.log(`✅ Server responded with status: ${response.status}`);
    console.log('Response body:', JSON.stringify(data, null, 2));
    
    console.log('\n👀 CHECK YOUR TERMINAL (where npm run dev is running) – you should see the POST log now!');
  } catch (error) {
    console.error('❌ Network request failed. Is the server running at :3000?', error.message);
  }
}

triggerNetworkLogs();
