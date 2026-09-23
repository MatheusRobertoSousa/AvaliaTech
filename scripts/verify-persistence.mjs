import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';

// Execute após `az webapp restart`, preservando a conta/ID da simulação anterior.
const login = JSON.parse(await readFile('.azure/demo-login.json', 'utf8'));
const original = JSON.parse(await readFile('docs/evidencias/demo-api.json', 'utf8'));
const base = login.baseURL;
const response = await fetch(`${base}/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: login.email, password: login.password }), signal: AbortSignal.timeout(60000) });
assert.equal(response.status, 200);
const { token } = await response.json();
const result = await fetch(`${base}/tests/${original.testId}`, { headers: { Authorization: `Bearer ${token}` }, signal: AbortSignal.timeout(60000) });
assert.equal(result.status, 200);
const test = await result.json();
assert.equal(test.id, original.testId);
const before = original.requests.find(item => item.method === 'POST' && item.route === '/tests' && item.status === 201).response;
assert.equal(test.title, before.title);
await writeFile('docs/evidencias/persistencia.json', JSON.stringify({ executedAt: new Date().toISOString(), baseURL: base, status: result.status, sameId: true, sameTitle: true, test, passed: true }, null, 2));
console.log('Persistência confirmada: mesmo ID e título após reinício da API.');
