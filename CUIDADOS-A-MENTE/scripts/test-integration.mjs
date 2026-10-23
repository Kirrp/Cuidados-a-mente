import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import { mkdtemp, readdir, mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import net from 'node:net';
import { DatabaseSync } from 'node:sqlite';
const root = resolve(import.meta.dirname, '..');
await mkdir(resolve(root, 'work/tests'), { recursive: true });
const directory = await mkdtemp(resolve(root, 'work/tests/api-'));
// Simula o formato anterior do SQLite para verificar a migração sem usar o banco real.
const legacy = new DatabaseSync(resolve(directory, 'test.db'));
legacy.exec("CREATE TABLE idosos (id TEXT PRIMARY KEY, owner_id TEXT NOT NULL, nome TEXT NOT NULL, nascimento TEXT NOT NULL DEFAULT '', observacoes TEXT NOT NULL DEFAULT '')");
legacy.close();
const tools = await readdir(resolve(root, '.local/tools'), { withFileTypes: true }).catch(() => []);
const javaBinary = process.platform === 'win32' ? 'java.exe' : 'java';
const candidates = [
  ...tools.filter(p => p.isDirectory() && p.name.startsWith('jdk-21')).sort((a, b) => b.name.localeCompare(a.name)).map(p => resolve(root, '.local/tools', p.name, 'bin', javaBinary)),
  ...(process.env.JAVA_HOME ? [resolve(process.env.JAVA_HOME, 'bin', javaBinary)] : []),
  'java',
];
const java = candidates.find(candidate => {
  const result = spawnSync(candidate, ['-version'], { encoding: 'utf8', windowsHide: true });
  return result.status === 0 && /(?:openjdk|java) version "21(?:\.|\")/.test(result.stdout + result.stderr);
});
if (!java) throw new Error('JDK 21 não encontrado para o teste de integração. Configure JAVA_HOME ou use .local/tools/jdk-21*.');
const socket = net.createServer();
await new Promise(r => socket.listen(0, '127.0.0.1', r));
const port = socket.address().port;
await new Promise(r => socket.close(r));
const base = 'http://127.0.0.1:' + port + '/api';
let processHandle, logs = '';
async function start() {
  processHandle = spawn(java, ['-jar', resolve(root, 'backend/target/backend-0.0.1-SNAPSHOT.jar'), '--server.port=' + port, '--server.address=127.0.0.1', '--app.database=' + resolve(directory, 'test.db')], { cwd: root, windowsHide: true, stdio: ['ignore','pipe','pipe'] });
  processHandle.stdout.on('data', b => { logs = (logs + b).slice(-12000); });
  processHandle.stderr.on('data', b => { logs = (logs + b).slice(-12000); });
  let spawnError;
  processHandle.on('error', e => { spawnError = e; });
  for (let i = 0; i < 900; i++) {
    if (spawnError) throw spawnError;
    if (processHandle.exitCode !== null) throw new Error('Servidor encerrou: ' + logs);
    try { if ((await fetch(base + '/health')).ok) return; } catch {}
    await new Promise(r => setTimeout(r, 100));
  }
  throw new Error('Servidor não iniciou: ' + logs);
}
async function stop() {
  if (!processHandle || processHandle.exitCode !== null) return;
  const child = processHandle;
  await new Promise(r => { child.once('exit', r); child.kill(); });
}
async function request(path, status = 200, { token, method = 'GET', body } = {}) {
  const response = await fetch(base + path, { method, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: 'Bearer ' + token } : {}) }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
  const data = response.status === 204 ? null : await response.json();
  assert.equal(response.status, status, path + ': ' + JSON.stringify(data));
  return data;
}
const account = { nome: 'Pessoa de Teste', email: 'teste@example.invalid', senha: 'TesteSeguro123!', tipo: 'responsavel', cpf: '000.000.000-00' };
const elderDetails = { rg: '12.345.678-9', cpf: '123.456.789-00', celular: '(11) 99999-9999', telefone: '(11) 3333-4444', cep: '01001-000', rua: 'Rua de Teste', bairro: 'Centro', cidade: 'São Paulo', estado: 'SP', numero: '12', complemento: 'Casa' };
try {
  await start();
  assert.equal((await request('/health')).database, 'sqlite');
  await request('/idosos', 401);
  await request('/auth/cadastro', 400, { method: 'POST', body: { ...account, senha: '123' } });
  const first = await request('/auth/cadastro', 201, { method: 'POST', body: account });
  assert.equal(first.usuario.nome, account.nome);
  assert.equal(first.usuario.senha, undefined);
  const token = first.token;
  const profile = await request('/auth/me', 200, { token, method: 'PUT', body: { nome: account.nome, estado: 'SP', nomeEmergencia: 'Contato de teste', telefoneEmergencia: '11999999999' } });
  assert.equal(JSON.parse(profile.perfil).estado, 'SP');
  await request('/auth/cadastro', 409, { method: 'POST', body: { ...account, email: account.email.toUpperCase() } });
  await request('/auth/login', 401, { method: 'POST', body: { email: account.email, senha: 'invalida' } });
  await request('/auth/login', 200, { method: 'POST', body: { email: account.email.toUpperCase(), senha: account.senha } });
  await request('/idosos', 400, { token, method: 'POST', body: { nome: 'Teste', nascimento: '2026-02-30' } });
  const person = await request('/idosos', 201, { token, method: 'POST', body: { nome: 'Idoso de Teste', nascimento: '1950-01-01', observacoes: "Texto com apóstrofo: d'água", ...elderDetails } });
  assert.equal(JSON.parse(person.perfil).cpf, elderDetails.cpf);
  assert.equal((await request('/idosos', 200, { token })).length, 1);
  const records = [];
  for (const tipo of ['consultas','medicamentos','rotinas','memorias']) {
    records.push(await request('/registros', 201, { token, method: 'POST', body: { idosoId: person.id, tipo, titulo: 'Registro ' + tipo, data: '2026-09-23', horario: '08:30', detalhes: "Teste d'água" } }));
  }
  const item = records[0], path = '/registros?tipo=consultas&idosoId=' + person.id;
  assert.equal((await request(path, 200, { token })).length, 1);
  await request('/registros', 400, { token, method: 'POST', body: { ...item, data: '2026-02-30' } });
  await request('/registros', 400, { token, method: 'POST', body: { ...item, horario: '25:80' } });
  await request('/registros', 400, { token, method: 'POST', body: { ...item, titulo: ' ' } });
  await request('/registros', 400, { token, method: 'POST', body: { ...item, tipo: 'users' } });
  await request('/registros/' + item.id, 400, { token, method: 'PUT', body: { ...item, status: 'qualquer' } });
  const updated = await request('/registros/' + item.id, 200, { token, method: 'PUT', body: { ...item, titulo: 'Consulta atualizada', status: 'concluido' } });
  assert.equal(updated.status, 'concluido');
  const second = await request('/auth/cadastro', 201, { method: 'POST', body: { ...account, email: 'outra@example.invalid', tipo: 'cuidador' } });
  const incomplete = await request('/idosos', 201, { token, method: 'POST', body: { nome: 'Cadastro incompleto', nascimento: '1951-01-01' } });
  await request(`/idosos/${incomplete.id}/qr`, 400, { token, method: 'POST' });
  await request(`/idosos/${incomplete.id}`, 200, { token, method: 'PUT', body: { nome: incomplete.nome, nascimento: incomplete.nascimento, ...elderDetails } });
  assert.equal((await request(`/idosos/${incomplete.id}/qr`, 200, { token, method: 'POST' })).nome, incomplete.nome);
  await request('/auth/cadastro', 400, { method: 'POST', body: { ...account, email: 'idoso@example.invalid', tipo: 'idoso' } });
  await request(`/idosos/${person.id}/qr`, 401, { method: 'POST' });
  await request(`/idosos/${person.id}/qr`, 404, { token: second.token, method: 'POST' });
  const qr1 = await request(`/idosos/${person.id}/qr`, 200, { token, method: 'POST' });
  const qr2 = await request(`/idosos/${person.id}/qr`, 200, { token, method: 'POST' });
  assert.notEqual(qr1.codigo, qr2.codigo);
  await request('/auth/qr', 401, { method: 'POST', body: { codigo: qr1.codigo } });
  await request('/auth/qr', 401, { method: 'POST', body: { codigo: 'codigo-invalido' } });
  const elder = await request('/auth/qr', 200, { method: 'POST', body: { codigo: qr2.codigo } });
  assert.equal(elder.usuario.tipo, 'idoso');
  assert.equal(elder.usuario.nome, person.nome);
  assert.equal(JSON.parse(elder.usuario.perfil).cpf, elderDetails.cpf);
  await request('/auth/qr', 401, { method: 'POST', body: { codigo: qr2.codigo } });
  assert.deepEqual((await request('/idosos', 200, { token: elder.token })).map(p => p.id), [person.id]);
  assert.equal((await request(path, 200, { token: elder.token }))[0].id, item.id);
  await request('/idosos', 403, { token: elder.token, method: 'POST', body: { nome: 'Indevido' } });
  await request(`/idosos/${person.id}/qr`, 403, { token: elder.token, method: 'POST' });
  await request(`/idosos/${person.id}/qr`, 403, { token: elder.token, method: 'DELETE' });
  const sibling = await request('/idosos', 201, { token, method: 'POST', body: { nome: 'Outra pessoa acompanhada' } });
  const siblingRecord = await request('/registros', 201, { token, method: 'POST', body: { ...item, idosoId: sibling.id } });
  await request('/registros?tipo=consultas&idosoId=' + sibling.id, 404, { token: elder.token });
  await request('/registros/' + siblingRecord.id, 404, { token: elder.token, method: 'PUT', body: siblingRecord });
  await request('/registros/' + siblingRecord.id, 404, { token: elder.token, method: 'DELETE' });
  await request('/registros', 404, { token: elder.token, method: 'POST', body: siblingRecord });
  const finishedByElder = await request('/registros/' + item.id, 200, { token: elder.token, method: 'PUT', body: { ...updated, status: 'concluido' } });
  assert.equal(finishedByElder.status, 'concluido');
  const expiring = await request(`/idosos/${person.id}/qr`, 200, { token, method: 'POST' });
  const isolatedDb = new DatabaseSync(resolve(directory, 'test.db'));
  isolatedDb.prepare('UPDATE qr_access SET expires=0 WHERE idoso_id=?').run(person.id);
  isolatedDb.close();
  await request('/auth/qr', 401, { method: 'POST', body: { codigo: expiring.codigo } });
  const raceQr = await request(`/idosos/${person.id}/qr`, 200, { token, method: 'POST' });
  const race = await Promise.all([1, 2].map(() => fetch(base + '/auth/qr', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ codigo: raceQr.codigo }) })));
  assert.deepEqual(race.map(r => r.status).sort(), [200, 401]);
  await request(`/idosos/${person.id}/qr`, 204, { token, method: 'DELETE' });
  await request('/auth/me', 401, { token: elder.token });
  const restoredQr = await request(`/idosos/${person.id}/qr`, 200, { token, method: 'POST' });
  const restored = await request('/auth/qr', 200, { method: 'POST', body: { codigo: restoredQr.codigo } });
  assert.equal(restored.usuario.id, elder.usuario.id);
  const carerPerson = await request('/idosos', 201, { token: second.token, method: 'POST', body: { nome: 'Idoso do cuidador', nascimento: '1948-02-01', ...elderDetails } });
  const carerQr = await request(`/idosos/${carerPerson.id}/qr`, 200, { token: second.token, method: 'POST' });
  assert.equal((await request('/auth/qr', 200, { method: 'POST', body: { codigo: carerQr.codigo } })).usuario.tipo, 'idoso');
  await request('/idosos/' + person.id, 404, { token: second.token, method: 'PUT', body: { nome: 'Alteração indevida' } });
  const changedPerson = await request('/idosos/' + person.id, 200, { token, method: 'PUT', body: { ...person, observacoes: 'Informações atualizadas' } });
  assert.equal(changedPerson.observacoes, 'Informações atualizadas');
  const photoData = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Y9ZpC0AAAAASUVORK5CYII=';
  const photo = await request('/registros', 201, { token, method: 'POST', body: { ...records[3], titulo: 'Foto de teste', categoria: 'Fotos', midia: photoData } });
  assert.equal(photo.midia, photoData);
  await request('/registros', 400, { token, method: 'POST', body: { ...records[3], categoria: 'Fotos', midia: 'data:image/svg+xml;base64,AAAA' } });
  await request('/registros', 400, { token, method: 'POST', body: { ...records[3], categoria: 'Vídeos', midia: 'javascript:alert(1)' } });
  assert.equal((await request('/idosos', 200, { token: second.token })).length, 1);
  await request(path, 404, { token: second.token });
  await request('/registros', 404, { token: second.token, method: 'POST', body: item });
  await request('/registros/' + item.id, 404, { token: second.token, method: 'PUT', body: updated });
  await request('/registros/' + item.id, 404, { token: second.token, method: 'DELETE' });
  const cors = await fetch(base + '/idosos', { method: 'OPTIONS', headers: { Origin: 'http://localhost:8081', 'Access-Control-Request-Method': 'GET', 'Access-Control-Request-Headers': 'authorization' } });
  assert.equal(cors.headers.get('access-control-allow-origin'), 'http://localhost:8081');
  const forbiddenCors = await fetch(base + '/idosos', { method: 'OPTIONS', headers: { Origin: 'http://untrusted.invalid', 'Access-Control-Request-Method': 'GET' } });
  assert.equal(forbiddenCors.headers.get('access-control-allow-origin'), null);
  await stop(); await start();
  const persisted = await request(path, 200, { token });
  assert.equal((await request(path, 200, { token: restored.token }))[0].id, item.id);
  const memories = await request('/registros?tipo=memorias&idosoId=' + person.id, 200, { token });
  assert.equal(memories.find(p => p.id === photo.id).midia, photoData);
  assert.equal(JSON.parse((await request('/auth/me', 200, { token })).perfil).nomeEmergencia, 'Contato de teste');
  assert.equal(persisted[0].titulo, 'Consulta atualizada');
  assert.equal(persisted[0].status, 'concluido');
  await request('/registros/' + item.id, 204, { token, method: 'DELETE' });
  assert.equal((await request(path, 200, { token })).length, 0);
  await request('/auth/logout', 204, { token, method: 'POST' });
  await request('/auth/me', 401, { token });
  console.log('OK: cadastro, login, QR de responsável/cuidador, uso único concorrente, expiração, revogação, vínculo com registros, isolamento entre idosos, CRUD, CORS, logout e persistência após reiniciar.');
} finally { await stop(); }
