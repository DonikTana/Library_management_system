const http = require('http');
const data = JSON.stringify({
  enrollmentId: 'testuser2',
  name: 'Test User2',
  email: 'test2@example.com',
  password: 'pass123'
});
const options = {
  hostname: 'localhost',
  port: 80,
  path: '/library-api/register.php',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(data)
  }
};
const req = http.request(options, (res) => {
  console.log(res.statusCode);
  res.on('data', (chunk) => process.stdout.write(chunk));
});
req.on('error', (e) => console.error(e));
req.write(data);
req.end();
