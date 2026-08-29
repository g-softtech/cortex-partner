async function testLogin() {
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
  console.log('STATUS:', res.status);
  console.log('RESPONSE:', text);
  console.log('HEADERS:', Object.fromEntries(res.headers.entries()));
}
testLogin();
