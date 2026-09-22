import assert from 'assert';

const BASE_URL = 'http://127.0.0.1:3000';

async function main() {
  console.log('=== Starting Script Storage Persistence Verification ===\n');

  // 1. Authenticate to get session cookie
  console.log('[Step 1] Authenticating...');
  const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username: process.env.OWNER_USERNAME || '1111111111111',
      password: process.env.OWNER_PASSWORD || '11111111111111',
    }),
  });

  assert.strictEqual(loginRes.status, 200, `Login failed: ${loginRes.status}`);
  const setCookie = loginRes.headers.get('set-cookie');
  assert.ok(setCookie, 'No set-cookie header received from login');
  const sessionCookie = setCookie.split(';')[0];
  console.log('✓ Authenticated successfully with session cookie.\n');

  const headers = {
    'Content-Type': 'application/json',
    Cookie: sessionCookie,
  };

  // Helper functions
  async function createScript(slug, name, code) {
    const res = await fetch(`${BASE_URL}/api/scripts`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        slug,
        name,
        code,
        category: 'Utility',
        game: 'universal',
        description: `Description for ${name}`,
      }),
    });
    const json = await res.json();
    assert.strictEqual(res.status, 201, `Failed to create ${name}: ${JSON.stringify(json)}`);
    console.log(`✓ Created script "${name}" (slug: ${json.slug})`);
    return json;
  }

  async function updateScript(slug, payload) {
    const res = await fetch(`${BASE_URL}/api/scripts/${slug}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    assert.strictEqual(res.status, 200, `Failed to update ${slug}: ${JSON.stringify(json)}`);
    console.log(`✓ Updated script "${slug}" (preserved slug: ${json.slug})`);
    return json;
  }

  async function deleteScript(slug) {
    const res = await fetch(`${BASE_URL}/api/scripts/${slug}`, {
      method: 'DELETE',
      headers,
    });
    const json = await res.json();
    assert.strictEqual(res.status, 200, `Failed to delete ${slug}: ${JSON.stringify(json)}`);
    console.log(`✓ Deleted script "${slug}"`);
    return json;
  }

  async function getScriptsList() {
    const res = await fetch(`${BASE_URL}/api/scripts`, {
      headers: { Cookie: sessionCookie },
    });
    assert.strictEqual(res.status, 200, `Failed to fetch scripts: ${res.status}`);
    return await res.json();
  }

  async function testRawEndpoint(slug, expectedCode, expectedStatus = 200) {
    const res = await fetch(`${BASE_URL}/raw/${slug}`);
    assert.strictEqual(res.status, expectedStatus, `Expected status ${expectedStatus} for /raw/${slug}, got ${res.status}`);
    const text = await res.text();
    if (expectedStatus === 200) {
      assert.strictEqual(text, expectedCode, `Code mismatch for /raw/${slug}`);
      const contentType = res.headers.get('content-type');
      assert.ok(contentType?.includes('text/plain'), `Expected text/plain, got ${contentType}`);
    }
    console.log(`✓ Verified /raw/${slug} returned HTTP ${expectedStatus} with correct content`);
  }

  // --- Exact Test Sequence from Requirement 10 ---
  console.log('[Step 2] Create Script A, B, C...');
  await createScript('script-a', 'Script A', '-- Script A source code');
  await createScript('script-b', 'Script B', '-- Script B source code');
  await createScript('script-c', 'Script C', '-- Script C source code');

  console.log('\n[Step 3] Refresh dashboard -> Verify A, B and C exist...');
  let list = await getScriptsList();
  let slugs = list.map((s) => s.slug);
  assert.ok(slugs.includes('script-a'), 'Script A must exist after initial creation');
  assert.ok(slugs.includes('script-b'), 'Script B must exist after initial creation');
  assert.ok(slugs.includes('script-c'), 'Script C must exist after initial creation');
  console.log('✓ Verified: A, B, and C exist in dashboard.');

  console.log('\n[Step 4] Create Script D...');
  await createScript('script-d', 'Script D', '-- Script D source code');

  console.log('\n[Step 5] Refresh dashboard -> Verify A, B, C and D exist...');
  list = await getScriptsList();
  slugs = list.map((s) => s.slug);
  assert.ok(slugs.includes('script-a'), 'Script A must exist');
  assert.ok(slugs.includes('script-b'), 'Script B must exist');
  assert.ok(slugs.includes('script-c'), 'Script C must exist');
  assert.ok(slugs.includes('script-d'), 'Script D must exist');
  console.log('✓ Verified: A, B, C, and D all exist.');

  console.log('\n[Step 6] Edit Script B...');
  const updatedB = await updateScript('script-b', {
    name: 'Script B Updated',
    code: '-- Script B updated source code',
    description: 'Updated description for B',
  });
  assert.strictEqual(updatedB.slug, 'script-b', "Script B slug must remain 'script-b'");

  console.log('\n[Step 7] Refresh dashboard -> Verify A, B, C and D still exist, and B is updated...');
  list = await getScriptsList();
  slugs = list.map((s) => s.slug);
  assert.ok(slugs.includes('script-a'), 'Script A must still exist');
  assert.ok(slugs.includes('script-b'), 'Script B must still exist');
  assert.ok(slugs.includes('script-c'), 'Script C must still exist');
  assert.ok(slugs.includes('script-d'), 'Script D must still exist');
  const recordB = list.find((s) => s.slug === 'script-b');
  assert.strictEqual(recordB.name, 'Script B Updated', "Script B name must be 'Script B Updated'");
  assert.strictEqual(recordB.code, '-- Script B updated source code', 'Script B code must match updated code');
  console.log('✓ Verified: A, B, C, and D still exist; B has updated content and preserved slug.');

  console.log('\n[Step 8] Delete Script C...');
  await deleteScript('script-c');

  console.log('\n[Step 9] Refresh dashboard -> Verify only A, B and D exist (C deleted)...');
  list = await getScriptsList();
  slugs = list.map((s) => s.slug);
  assert.ok(slugs.includes('script-a'), 'Script A must still exist');
  assert.ok(slugs.includes('script-b'), 'Script B must still exist');
  assert.ok(!slugs.includes('script-c'), 'Script C must NOT exist');
  assert.ok(slugs.includes('script-d'), 'Script D must still exist');
  console.log('✓ Verified: only A, B, and D exist; C was cleanly removed.');

  console.log('\n[Step 10] Create Script E...');
  await createScript('script-e', 'Script E', '-- Script E source code');

  console.log('\n[Step 11] Refresh multiple times -> Verify A, B, D and E remain permanently...');
  for (let i = 1; i <= 5; i++) {
    const freshList = await getScriptsList();
    const freshSlugs = freshList.map((s) => s.slug);
    assert.ok(freshSlugs.includes('script-a'), `[Refresh ${i}] Script A missing`);
    assert.ok(freshSlugs.includes('script-b'), `[Refresh ${i}] Script B missing`);
    assert.ok(!freshSlugs.includes('script-c'), `[Refresh ${i}] Script C should not exist`);
    assert.ok(freshSlugs.includes('script-d'), `[Refresh ${i}] Script D missing`);
    assert.ok(freshSlugs.includes('script-e'), `[Refresh ${i}] Script E missing`);
  }
  console.log('✓ Verified: 5 consecutive refreshes confirmed A, B, D, and E remain permanently.');

  console.log('\n[Step 12] Testing /raw/<slug> for every remaining script...');
  await testRawEndpoint('script-a', '-- Script A source code', 200);
  await testRawEndpoint('script-b', '-- Script B updated source code', 200);
  await testRawEndpoint('script-d', '-- Script D source code', 200);
  await testRawEndpoint('script-e', '-- Script E source code', 200);
  await testRawEndpoint('script-c', '', 404);

  // Clean up test scripts
  console.log('\n[Step 13] Cleaning up test scripts A, B, D, E...');
  await deleteScript('script-a');
  await deleteScript('script-b');
  await deleteScript('script-d');
  await deleteScript('script-e');

  const finalList = await getScriptsList();
  const finalSlugs = finalList.map((s) => s.slug);
  assert.ok(!finalSlugs.includes('script-a'), 'script-a cleaned up');
  assert.ok(!finalSlugs.includes('script-b'), 'script-b cleaned up');
  assert.ok(!finalSlugs.includes('script-d'), 'script-d cleaned up');
  assert.ok(!finalSlugs.includes('script-e'), 'script-e cleaned up');
  console.log('✓ Verified: cleanup successful, original library preserved.');

  console.log('\n🎉 ALL PERSISTENCE VERIFICATION TESTS PASSED SUCCESSFULLY! 🎉');
}

main().catch((err) => {
  console.error('\n❌ Verification Failed:', err);
  process.exit(1);
});
