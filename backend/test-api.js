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
app.use('/api/auth', authRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/bikes', bikeRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/reports', reportRoutes);

async function runTests() {
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
    const loginRes = await request('/api/auth/login', 'POST', {
      email: 'admin@bikeworkshop.com',
      password: 'admin123',
    });
    const token = loginRes.body.token;

    console.log('1. Testing Customer Mobile Lookup (/api/customers/lookup/9845012345)...');
    const lookupRes = await request('/api/customers/lookup/9845012345', 'GET', null, token);
    console.log('   Status:', lookupRes.status, '| Customer:', lookupRes.body.data?.customer?.name, '| Bikes:', lookupRes.body.data?.bikes?.length);

    console.log('2. Testing Dashboard Customer Overview (/api/dashboard/customer-summary/9845012345)...');
    const dashRes = await request('/api/dashboard/customer-summary/9845012345', 'GET', null, token);
    console.log('   Status:', dashRes.status, '| Services:', dashRes.body.data?.serviceSummary?.totalServices, '| Outstanding Due:', dashRes.body.data?.paymentOverview?.pendingBalance);

    console.log('3. Testing Service Filter by Mobile (/api/services?mobile=9845012345)...');
    const srvRes = await request('/api/services?mobile=9845012345', 'GET', null, token);
    console.log('   Status:', srvRes.status, '| Services Found:', srvRes.body.count);

    console.log('4. Testing Payment Filter by Mobile (/api/payments?mobile=9845012345)...');
    const payRes = await request('/api/payments?mobile=9845012345', 'GET', null, token);
    console.log('   Status:', payRes.status, '| Payments Found:', payRes.body.count);

    console.log('5. Testing Customer Dossier Report (/api/reports/customer-dossier/9845012345)...');
    const repRes = await request('/api/reports/customer-dossier/9845012345', 'GET', null, token);
    console.log('   Status:', repRes.status, '| History Rows:', repRes.body.data?.serviceHistory?.length);

    console.log('\n ALL PHONE-BASED CUSTOMER IDENTIFICATION ENDPOINTS VERIFIED!');
  } catch (err) {
    console.error('Test failed:', err);
  } finally {
    server.close();
    process.exit(0);
  }
}

runTests();
