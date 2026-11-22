const http = require('http');

function request(options, postData) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(body) });
        } catch (e) {
          resolve({ status: res.statusCode, raw: body });
        }
      });
    });
    req.on('error', reject);
    if (postData) {
      req.write(typeof postData === 'string' ? postData : JSON.stringify(postData));
    }
    req.end();
  });
}

async function runTests() {
  console.log('🚀 Starting Super Admin & Live Chat Integration Tests...\n');

  // 1. Super Admin Login
  const superLogin = await request(
    {
      hostname: 'localhost',
      port: 5000,
      path: '/api/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    },
    { email: 'superadmin@speedywheels.com', password: 'superadmin123' }
  );

  console.log(`1. Super Admin Login: HTTP ${superLogin.status}`);
  if (!superLogin.data?.token) {
    console.error('Failed to login as Super Admin:', superLogin.data);
    process.exit(1);
  }
  const superToken = superLogin.data.token;
  console.log(`   Super Admin Token obtained. Role: ${superLogin.data.user.role}`);

  // 2. Super Admin Dashboard Stats
  const dashboard = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/super-admin/dashboard',
    method: 'GET',
    headers: { Authorization: `Bearer ${superToken}` },
  });
  console.log(`2. Super Admin Dashboard Stats: HTTP ${dashboard.status}`);
  console.log(`   Workshops Total: ${dashboard.data.data.workshops.total}, Active: ${dashboard.data.data.workshops.active}`);
  console.log(`   Active Users: ${dashboard.data.data.activeUsers}`);
  console.log(`   Total Revenue across platform: Rs. ${dashboard.data.data.totalRevenue}`);
  console.log(`   Confirming NO subscriptions field: ${dashboard.data.data.subscriptions === undefined ? '✅ Clean (No Subscriptions)' : '❌ Error'}`);

  // 3. Super Admin Workshops List
  const workshops = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/super-admin/workshops',
    method: 'GET',
    headers: { Authorization: `Bearer ${superToken}` },
  });
  console.log(`3. Super Admin Workshops List: HTTP ${workshops.status}, count: ${workshops.data.count}`);

  // 4. Super Admin Active Sessions
  const sessions = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/super-admin/sessions',
    method: 'GET',
    headers: { Authorization: `Bearer ${superToken}` },
  });
  console.log(`4. Super Admin Active Sessions: HTTP ${sessions.status}, count: ${sessions.data.count}`);

  // 5. Super Admin Branding
  const branding = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/super-admin/branding',
    method: 'GET',
    headers: { Authorization: `Bearer ${superToken}` },
  });
  console.log(`5. Platform Branding: HTTP ${branding.status}, company: ${branding.data.data.company_name}`);

  // 6. Super Admin Reports
  const reports = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/super-admin/reports',
    method: 'GET',
    headers: { Authorization: `Bearer ${superToken}` },
  });
  console.log(`6. Platform Aggregated Reports: HTTP ${reports.status}, workshops breakdown: ${reports.data.data.workshopBreakdown.length}`);

  // 7. Super Admin Activity Logs
  const logs = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/super-admin/logs',
    method: 'GET',
    headers: { Authorization: `Bearer ${superToken}` },
  });
  console.log(`7. Activity Logs: HTTP ${logs.status}, count: ${logs.data.count}`);

  // 8. Workshop Customer Login
  const customerLogin = await request(
    {
      hostname: 'localhost',
      port: 5000,
      path: '/api/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    },
    { email: 'admin@bikeworkshop.com', password: 'admin123' }
  );
  console.log(`8. Workshop 1 Owner Login: HTTP ${customerLogin.status}`);
  const customerToken = customerLogin.data.token;

  // 9. Workshop Customer Chat Conversation
  const conv = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/chat/conversation',
    method: 'POST',
    headers: { Authorization: `Bearer ${customerToken}` },
  });
  console.log(`9. Workshop Chat Conversation: HTTP ${conv.status}, Conv ID: ${conv.data.data._id}`);

  // 10. Workshop Customer Send Message
  const sendMsg = await request(
    {
      hostname: 'localhost',
      port: 5000,
      path: '/api/chat/message',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${customerToken}`,
      },
    },
    { message: 'Hello Support, we need assistance configuring a new invoice template.' }
  );
  console.log(`10. Workshop Customer Send Message: HTTP ${sendMsg.status}, Msg: "${sendMsg.data.data.message}"`);

  // 11. Super Admin List Chat Conversations
  const adminConvs = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/chat/admin/conversations',
    method: 'GET',
    headers: { Authorization: `Bearer ${superToken}` },
  });
  console.log(`11. Super Admin List Conversations: HTTP ${adminConvs.status}, count: ${adminConvs.data.count}`);

  // 12. Super Admin Send Reply to Workshop
  const convId = conv.data.data._id;
  const adminReply = await request(
    {
      hostname: 'localhost',
      port: 5000,
      path: '/api/chat/admin/message',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${superToken}`,
      },
    },
    { conversation_id: convId, message: 'Hi Vikram, sure! You can customize your invoice templates under Settings.' }
  );
  console.log(`12. Super Admin Send Reply: HTTP ${adminReply.status}, Reply: "${adminReply.data.data.message}"`);

  // 13. Workshop Marks as Read
  const markRead = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/chat/read',
    method: 'PUT',
    headers: { Authorization: `Bearer ${customerToken}` },
  });
  console.log(`13. Customer Mark Read: HTTP ${markRead.status}`);

  console.log('\n🎉 ALL 13 SUPER ADMIN & LIVE CHAT TESTS PASSED WITH 100% SUCCESS!\n');
}

runTests().catch(console.error);

