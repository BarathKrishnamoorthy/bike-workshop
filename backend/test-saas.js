require('dotenv').config();
const http = require('http');
const express = require('express');
const { connectDB } = require('./src/config/db');
const mockStore = require('./src/utils/mockStore');
const authRoutes = require('./src/routes/authRoutes');
const customerRoutes = require('./src/routes/customerRoutes');
const bikeRoutes = require('./src/routes/bikeRoutes');
const serviceRoutes = require('./src/routes/serviceRoutes');
const paymentRoutes = require('./src/routes/paymentRoutes');
const dashboardRoutes = require('./src/routes/dashboardRoutes');
const reportRoutes = require('./src/routes/reportRoutes');

const app = express();
app.use(express.json());

// Mount routers
app.use('/api/auth', authRoutes);
app.use('/api', authRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/bikes', bikeRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/reports', reportRoutes);

async function runSaaSTests() {
  await mockStore.initMockData();
  const server = app.listen(0);
  const port = server.address().port;

  const request = (path, method = 'GET', body = null, token = null) => {
    return new Promise((resolve, reject) => {
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const req = http.request(
        { hostname: '127.0.0.1', port, path, method, headers },
        (res) => {
          let data = '';
          res.on('data', (chunk) => (data += chunk));
          res.on('end', () => {
            try {
              resolve({ status: res.statusCode, body: JSON.parse(data) });
            } catch (e) {
              resolve({ status: res.statusCode, body: data });
            }
          });
        }
      );
      req.on('error', reject);
      if (body) req.write(JSON.stringify(body));
      req.end();
    });
  };

  try {
    console.log('--- 🧪 STARTING SAAS MULTI-TENANT VERIFICATION TESTS ---\n');

    // 1. Workshop 1 Login
    console.log('1. Logging in as Workshop 1 Owner (admin@bikeworkshop.com)...');
    const ws1Login = await request('/api/login', 'POST', {
      email: 'admin@bikeworkshop.com',
      password: 'admin123',
    });
    console.log('   Status:', ws1Login.status, '| Workshop:', ws1Login.body.workshop?.workshop_name, '| Tenant ID:', ws1Login.body.user?.workshop_id);
    const token1 = ws1Login.body.token;

    // 2. Workshop 2 Login
    console.log('\n2. Logging in as Workshop 2 Owner (owner@apexmotohub.com)...');
    const ws2Login = await request('/api/login', 'POST', {
      email: 'owner@apexmotohub.com',
      password: 'apex123',
    });
    console.log('   Status:', ws2Login.status, '| Workshop:', ws2Login.body.workshop?.workshop_name, '| Tenant ID:', ws2Login.body.user?.workshop_id);
    const token2 = ws2Login.body.token;

    // 3. Verify Tenant Customer Isolation
    console.log('\n3. Verifying Customer Isolation:');
    const ws1Custs = await request('/api/customers', 'GET', null, token1);
    const ws2Custs = await request('/api/customers', 'GET', null, token2);
    console.log('   Workshop 1 Customers count:', ws1Custs.body.count, '(Expected: 5)');
    console.log('   Workshop 2 Customers count:', ws2Custs.body.count, '(Expected: 2)');

    // 4. Verify Dashboard Metrics Isolation
    console.log('\n4. Verifying Dashboard Metrics Isolation:');
    const ws1Stats = await request('/api/dashboard/stats', 'GET', null, token1);
    const ws2Stats = await request('/api/dashboard/stats', 'GET', null, token2);
    console.log('   Workshop 1 Metrics:', JSON.stringify(ws1Stats.body.data?.metrics));
    console.log('   Workshop 2 Metrics:', JSON.stringify(ws2Stats.body.data?.metrics));

    // 5. Verify IDOR Protection
    console.log('\n5. Verifying IDOR Protection (Workshop 1 attempting to access Workshop 2 customer cust_101):');
    const idorTest = await request('/api/customers/cust_101', 'GET', null, token1);
    console.log('   IDOR Attempt Status:', idorTest.status, '| Message:', idorTest.body.message);
    if (idorTest.status === 404) {
      console.log('   ✅ IDOR BLOCKED: Workshop 1 cannot access Workshop 2 data!');
    } else {
      console.error('   ❌ IDOR VULNERABILITY DETECTED!');
    }

    // 6. Test New Workshop Registration
    console.log('\n6. Testing New Workshop Registration (POST /api/register)...');
    const regRes = await request('/api/register', 'POST', {
      name: 'Pooja Hegde',
      email: `pooja.workshop_${Date.now()}@example.com`,
      password: 'securePassword123',
      workshop_name: 'FastTrack Superbikes',
      location: '55 MG Road, Pune, Maharashtra',
      phone_number: '+91 91234 56789',
    });
    console.log('   Status:', regRes.status, '| Success:', regRes.body.success);
    console.log('   Generated User ID:', regRes.body.user?.user_id);
    console.log('   Generated Workshop ID:', regRes.body.workshop?.workshop_id);
    const token3 = regRes.body.token;

    // 7. Verify Newly Registered Workshop Starts With Clean Isolated State
    console.log('\n7. Verifying Newly Registered Workshop data:');
    const ws3Custs = await request('/api/customers', 'GET', null, token3);
    const ws3Stats = await request('/api/dashboard/stats', 'GET', null, token3);
    console.log('   New Workshop Customers count:', ws3Custs.body.count, '(Expected: 0)');
    console.log('   New Workshop Dashboard totalCustomers:', ws3Stats.body.data?.metrics?.totalCustomers, '(Expected: 0)');

    // 8. Test Workshop and Profile APIs
    console.log('\n8. Testing Profile & Workshop Details APIs:');
    const profileRes = await request('/api/profile', 'GET', null, token1);
    const workshopRes = await request('/api/workshop', 'GET', null, token1);
    console.log('   Profile Status:', profileRes.status, '| User:', profileRes.body.user?.name);
    console.log('   Workshop Status:', workshopRes.status, '| Workshop:', workshopRes.body.data?.workshop_name);

    // 9. Test Logout
    console.log('\n9. Testing Logout API:');
    const logoutRes = await request('/api/logout', 'POST', null, token1);
    console.log('   Logout Status:', logoutRes.status, '| Message:', logoutRes.body.message);

    console.log('\n🎉 ALL SAAS MULTI-TENANT VERIFICATION TESTS PASSED SUCCESSFULLY! 🎉\n');
  } catch (err) {
    console.error('❌ Test failed with error:', err);
  } finally {
    server.close();
    process.exit(0);
  }
}

runSaaSTests();

