import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';

const base = (process.env.DEMO_API_URL || 'http://localhost:3333/api').replace(/\/$/, '');
const evidence = { executedAt: new Date().toISOString(), baseURL: base, requests: [] };
let token;
async function request(method, route, body, expected = 200, authenticated = true) {
  const response = await fetch(`${base}${route}`, {
    method, headers: { 'Content-Type': 'application/json', ...(authenticated && token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(60000)
  });
  const data = await response.json();
  const sanitize = value => JSON.parse(JSON.stringify(value, (key, item) =>
    /password|token|inviteUrl/i.test(key) ? '[REDACTED]' : item));
  evidence.requests.push({ method, route: route.startsWith('/invitations/') ? '/invitations/[REDACTED]' : route, request: body ? sanitize(body) : null, status: response.status, response: sanitize(data) });
  assert.equal(response.status, expected, `${method} ${route}: ${JSON.stringify(data)}`);
  console.log(`${response.status} ${method} ${route.startsWith('/invitations/') ? '/invitations/[REDACTED]' : route}`);
  return data;
}

try {
  const ready = await request('GET', '/ready');
  if (process.env.DEMO_EXPECT_POSTGRES === 'true') assert.equal(ready.database, 'postgres');
  await request('GET', '/tests', undefined, 401, false);
  let saved;
  try { saved = JSON.parse(await readFile('.azure/demo-login.json', 'utf8')); } catch (error) { if (error.code !== 'ENOENT') throw error; }
  const reuse = saved?.baseURL === base;
  const email = reuse ? saved.email : `demo-${Date.now()}@example.com`;
  const password = reuse ? saved.password : randomBytes(24).toString('base64url');
  if (!reuse) await request('POST', '/auth/register', { companyName: 'Empresa fictícia — demonstração Azure', name: 'Recrutador Demo', email, password }, 201);
  const login = await request('POST', '/auth/login', { email, password });
  token = login.token;
  await mkdir('.azure', { recursive: true });
  await writeFile('.azure/demo-login.json', JSON.stringify({ email, password, baseURL: base }, null, 2));
  await request('POST', '/tests', { title: 'X' }, 400);
  const test = await request('POST', '/tests', { title: 'Demonstração técnica Azure', description: 'Teste persistido no banco para comprovar escrita e leitura.', difficulty: 'Iniciante', durationMinutes: 30, status: 'active' }, 201);
  const persisted = await request('GET', `/tests/${test.id}`);
  assert.equal(persisted.title, test.title);
  const list = await request('GET', '/tests');
  assert.ok(list.some(item => item.id === test.id));
  const question = await request('POST', '/questions', { testId: test.id, statement: 'Qual método HTTP solicita a leitura de dados?', type: 'objective', score: 10, category: 'HTTP', options: ['GET', 'POST'], answer: 'GET' }, 201);
  const candidate = await request('POST', '/candidates', { testId: test.id, name: 'Candidato fictício', email: `candidato-${Date.now()}@example.com` }, 201);
  assert.equal(candidate.status, 'pending');
  assert.equal(candidate.score, null);
  const invitationToken = new URL(candidate.inviteUrl, 'https://example.com').searchParams.get('invite');
  const exam = await request('GET', `/invitations/${invitationToken}`, undefined, 200, false);
  assert.ok(exam.questions.every(item => !('answer' in item)), 'Prova não deve expor gabarito');
  const submissionBody = { invitationToken, answers: [{ questionId: question.id, value: 'GET' }], durationSeconds: 45 };
  const submission = await request('POST', '/submissions', submissionBody, 201, false);
  assert.equal(submission.score, 100);
  const pipeline = await request('GET', '/candidates');
  assert.equal(pipeline.find(item => item.invitationId === candidate.invitationId).status, 'review');
  await request('POST', '/submissions', submissionBody, 409, false);
  const result = await request('GET', `/submissions/${submission.id}`);
  assert.equal(result.score, 100);
  await request('GET', '/ranking');
  await request('GET', '/reports');
  await request('GET', '/dashboard');
  evidence.passed = true;
  evidence.testId = test.id;
  evidence.submissionId = submission.id;
  console.log('Fluxo completo aprovado. Credenciais locais: .azure/demo-login.json (não versionado).');
} catch (error) {
  evidence.passed = false;
  console.error(error.message);
  process.exitCode = 1;
} finally {
  await mkdir('docs/evidencias', { recursive: true });
  await writeFile('docs/evidencias/demo-api.json', JSON.stringify(evidence, null, 2));
}
