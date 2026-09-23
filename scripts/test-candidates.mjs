import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { randomBytes } from 'node:crypto';
import { setTimeout as delay } from 'node:timers/promises';

let child;
const base = process.env.CANDIDATES_API_URL || 'http://localhost:3437/api';
const checks = [];
let token;
const run = randomBytes(6).toString('hex');
const tests = [];
async function call(method, route, body, status = 200, session = token) {
  const response = await fetch(base + route, { method, headers: { 'Content-Type': 'application/json', ...(session ? { Authorization: `Bearer ${session}` } : {}) }, body: body ? JSON.stringify(body) : undefined, signal: AbortSignal.timeout(15000) });
  const data = await response.json();
  assert.equal(response.status, status, `${method} ${route}: ${JSON.stringify(data)}`);
  return data;
}
function pass(message) { checks.push(message); console.log(`OK: ${message}`); }
try {
  if (!process.env.CANDIDATES_API_URL) {
    const cwd = await mkdtemp(path.join(tmpdir(), 'avaliatech-candidates-'));
    child = spawn(process.execPath, [path.resolve('backend/dist/server.js')], { cwd, env: { ...process.env, NODE_ENV: 'production', PORT: '3437', DATABASE_PROVIDER: 'sqlite', DATABASE_URL: '', JWT_SECRET: randomBytes(32).toString('hex'), SEED_DEMO: 'false' }, stdio: 'ignore' });
    for (let attempt = 0; attempt < 50; attempt++) {
      try { const response = await fetch(`${base}/ready`); if (response.ok) break; } catch {}
      await delay(100);
    }
  }
  const account = await call('POST', '/auth/register', { companyName: 'Regressão de candidatos', name: 'Teste automático', email: `regression-${run}@example.com`, password: randomBytes(24).toString('hex') }, 201);
  token = account.token;
  for (const title of ['Frontend', 'Backend']) tests.push(await call('POST', '/tests', { title, description: 'Teste fictício de regressão de candidatos', difficulty: 'Iniciante', durationMinutes: 30, status: 'active' }, 201));
  const question = await call('POST', '/questions', { testId: tests[0].id, statement: 'Qual método faz leitura?', type: 'objective', score: 10, category: 'HTTP', options: ['GET', 'POST'], answer: 'GET' }, 201);
  const email = `ana-${run}@example.com`;
  const first = await call('POST', '/candidates', { testId: tests[0].id, name: 'Ana Demo', email }, 201);
  const second = await call('POST', '/candidates', { testId: tests[1].id, name: 'Ana Demo', email }, 201);
  const another = await call('POST', '/candidates', { testId: tests[0].id, name: 'Bruno Demo', email: `bruno-${run}@example.com` }, 201);
  let list = await call('GET', '/candidates');
  assert.equal(list.length, 3); assert.equal(new Set(list.map(item => item.id)).size, 2);
  assert.equal(new Set(list.map(item => item.invitationId)).size, 3);
  assert.ok(list.every(item => item.status === 'pending' && item.score === null));
  pass('Duas pessoas e três participações distintas, todas pendentes e sem nota');
  const duplicate = await call('POST', '/candidates', { testId: tests[0].id, name: 'Ana Demo', email: ` ${email.toUpperCase()} ` }, 201);
  assert.equal(duplicate.invitationId, first.invitationId);
  assert.equal((await call('GET', '/candidates')).length, 3);
  pass('Mesmo e-mail/teste reutiliza convite ativo sem ocultar outras participações');
  await call('PATCH', `/candidates/${first.id}/status`, { status: 'approved', invitationId: first.invitationId }, 409);
  pass('Não permite aprovar antes de concluir a prova');
  const invitationToken = new URL(first.inviteUrl, 'https://example.com').searchParams.get('invite');
  await call('POST', '/submissions', { invitationToken, answers: [{ questionId: question.id, value: 'GET' }], durationSeconds: 15 }, 201);
  list = await call('GET', '/candidates');
  assert.equal(list.find(item => item.invitationId === first.invitationId).status, 'review');
  assert.equal(list.find(item => item.invitationId === first.invitationId).score, 100);
  assert.equal(list.find(item => item.invitationId === second.invitationId).status, 'pending');
  pass('Nota 100 vai para revisão e não altera outro convite');
  await call('PATCH', `/candidates/${first.id}/status`, { status: 'approved', invitationId: first.invitationId });
  list = await call('GET', '/candidates');
  assert.equal(list.find(item => item.invitationId === first.invitationId).status, 'approved');
  assert.equal(list.find(item => item.invitationId === second.invitationId).status, 'pending');
  const retry = await call('POST', '/candidates', { testId: tests[0].id, name: 'Ana Demo', email }, 201);
  assert.notEqual(retry.invitationId, first.invitationId);
  assert.equal(retry.status, 'pending'); assert.equal(retry.score, null);
  assert.equal((await call('GET', '/candidates')).length, 4);
  pass('Aprovação manual isolada; novo convite preserva histórico sem herdar aprovação/nota');
  const zeroToken = new URL(another.inviteUrl, 'https://example.com').searchParams.get('invite');
  await call('POST', '/submissions', { invitationToken: zeroToken, answers: [{ questionId: question.id, value: 'POST' }], durationSeconds: 15 }, 201);
  list = await call('GET', '/candidates');
  assert.equal(list.find(item => item.invitationId === another.invitationId).score, 0);
  pass('Nota zero permanece 0, diferente de prova sem resultado');
  const other = await call('POST', '/auth/register', { companyName: 'Outra empresa', name: 'Outro RH', email: `other-${run}@example.com`, password: randomBytes(24).toString('hex') }, 201);
  await call('PATCH', `/candidates/${first.id}/status`, { status: 'rejected', invitationId: first.invitationId }, 404, other.token);
  const outsider = await call('POST', '/candidates', { testId: tests[0].id, name: 'Ana Demo', email }, 404, other.token);
  assert.ok(outsider.message);
  const otherTest = await call('POST', '/tests', { title: 'Outra empresa', description: 'Verificação de decisão isolada entre empresas', difficulty: 'Iniciante', durationMinutes: 30 }, 201, other.token);
  try {
    const otherInvite = await call('POST', '/candidates', { testId: otherTest.id, name: 'Ana Demo', email }, 201, other.token);
    assert.equal(otherInvite.status, 'pending'); assert.equal(otherInvite.score, null);
    assert.equal((await call('GET', '/candidates', undefined, 200, other.token)).length, 1);
  } finally {
    await fetch(`${base}/tests/${otherTest.id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${other.token}` } });
  }
  pass('Outra empresa não decide nem convida para testes alheios');
  const rank = await call('GET', '/ranking');
  assert.equal(rank.find(item => item.score === 100).status, 'approved');
  const reports = await call('GET', '/reports');
  assert.equal(reports.candidates.find(item => item.status === 'pending').total, 2);
  await call('PATCH', `/candidates/${first.id}/status`, { status: 'review', invitationId: first.invitationId });
  assert.equal((await call('GET', '/ranking')).find(item => item.score === 100).status, 'review');
  pass('Ranking e relatórios refletem decisão por participação e reabertura de revisão');
  if (process.env.CANDIDATES_API_URL) await writeFile('docs/evidencias/candidatos-regressao.json', JSON.stringify({ executedAt: new Date().toISOString(), baseURL: base, checks, passed: true }, null, 2));
} finally {
  if (token) for (const test of tests) await fetch(`${base}/tests/${test.id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` }, signal: AbortSignal.timeout(15000) }).catch(() => {});
  child?.kill();
}
