async function testDashboard() {
  const csrfRes = await fetch('http://localhost:3000/api/auth/csrf');
  const csrfData = await csrfRes.json();
  const csrfToken = csrfData.csrfToken;
  const cookie = csrfRes.headers.get('set-cookie');

  const formData = new URLSearchParams();
  formData.append('email', 'admin@test.com');
  formData.append('password', 'password123');
  formData.append('csrfToken', csrfToken);
  formData.append('json', 'true');

  const res = await fetch('http://localhost:3000/api/auth/callback/credentials', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Cookie': cookie || '',
    },
    body: formData.toString()
  });

  const text = await res.text();
  console.log('LOGIN STATUS:', res.status);
  console.log('LOGIN RESPONSE:', text);
  
  const authCookie = res.headers.get('set-cookie');
  console.log('AUTH COOKIE:', authCookie);

  // Now fetch dashboard
  const dashRes = await fetch('http://localhost:3000/dashboard', {
    headers: {
      'Cookie': authCookie || '',
    },
    redirect: 'manual'
  });

  console.log('DASHBOARD STATUS:', dashRes.status);
  console.log('DASHBOARD HEADERS:', Object.fromEntries(dashRes.headers.entries()));
}
testDashboard();
