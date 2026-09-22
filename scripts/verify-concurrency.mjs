import assert from 'assert';

const BASE_URL = 'http://127.0.0.1:3000';

async function testConcurrency() {
  console.log('=== Testing Concurrent Script Mutations ===');

  const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username: process.env.OWNER_USERNAME || '1111111111111',
      password: process.env.OWNER_PASSWORD || '11111111111111',
    }),
  });
  const setCookie = loginRes.headers.get('set-cookie');
  const sessionCookie = setCookie.split(';')[0];
  const headers = { 'Content-Type': 'application/json', Cookie: sessionCookie };

  const scriptsToCreate = [
    { slug: 'conc-1', name: 'Conc 1', code: '-- Conc 1' },
    { slug: 'conc-2', name: 'Conc 2', code: '-- Conc 2' },
    { slug: 'conc-3', name: 'Conc 3', code: '-- Conc 3' },
    { slug: 'conc-4', name: 'Conc 4', code: '-- Conc 4' },
    { slug: 'conc-5', name: 'Conc 5', code: '-- Conc 5' },
  ];

  console.log('Launching 5 parallel POST requests simultaneously...');
  const promises = scriptsToCreate.map((item) =>
    fetch(`${BASE_URL}/api/scripts`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        ...item,
        category: 'Utility',
        game: 'universal',
      }),
    }).then(async (res) => {
      const json = await res.json();
      return { status: res.status, json };
    })
  );

  const results = await Promise.all(promises);
  for (const r of results) {
    assert.strictEqual(r.status, 201, `Failed creation: ${JSON.stringify(r.json)}`);
  }
  console.log('✓ All 5 parallel creation requests returned HTTP 201');

  // Verify all 5 exist in persistent storage
  const listRes = await fetch(`${BASE_URL}/api/scripts`, { headers: { Cookie: sessionCookie } });
  const allScripts = await listRes.json();
  const slugs = allScripts.map((s) => s.slug);

  for (const item of scriptsToCreate) {
    assert.ok(slugs.includes(item.slug), `Missing concurrent script: ${item.slug}`);
    console.log(`✓ Confirmed ${item.slug} is persistently stored`);
  }

  // Cleanup
  for (const item of scriptsToCreate) {
    await fetch(`${BASE_URL}/api/scripts/${item.slug}`, { method: 'DELETE', headers });
  }
  console.log('✓ All 5 test scripts cleaned up.');
  console.log('🎉 Concurrency serialization test passed with zero lost updates!\n');
}

testConcurrency().catch((err) => {
  console.error('Concurrency test failed:', err);
  process.exit(1);
});
