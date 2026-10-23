// Cria o conjunto solicitado no SQLite persistente do aplicativo, pela API real; a carga extensa usa transações no mesmo SQLite.
// Reexecução retoma o mesmo conjunto. Não redefine senhas nem exclui cadastros.
import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
const root = path.resolve(import.meta.dirname, '..');
if (!process.argv.includes('--confirmar-banco-persistente')) {
  throw Error('Informe --confirmar-banco-persistente para criar dados no banco do aplicativo.');
}
const base = (process.env.SEED_API_URL || 'http://127.0.0.1:8080/api').replace(/\/$/, '');
const bancoPath = path.join(root, 'backend/data/cuidados.db');
const dir = path.join(root, 'work/contas-app');
await fs.mkdir(dir, { recursive: true });
const acessoPath = path.join(dir, 'acessos.json');
const dataHoje = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'America/Sao_Paulo',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
}).format(new Date());
let config;
try {
  config = JSON.parse(await fs.readFile(acessoPath, 'utf8'));
} catch (erroCapturado) {
  if (erroCapturado.code !== 'ENOENT') {
    throw erroCapturado;
  }
  config = {
    versao: 1,
    criadoEm: new Date().toISOString(),
    dataBase: dataHoje,
    contas: [
      {
        tipo: 'responsavel',
        nome: 'Marina Costa',
        email: 'responsavel@cuidados.test',
        senha: 'Rsp!' + crypto.randomBytes(8).toString('hex') + '9a',
      },
      {
        tipo: 'cuidador',
        nome: 'Lucas Martins',
        email: 'cuidador@cuidados.test',
        senha: 'Cdr!' + crypto.randomBytes(8).toString('hex') + '8b',
      },
      {
        tipo: 'idoso',
        nome: 'Antônio Costa',
        email: 'idoso@cuidados.test',
        senha: 'Ido!' + crypto.randomBytes(8).toString('hex') + '7c',
      },
    ],
  };
  await fs.writeFile(acessoPath, JSON.stringify(config, null, 2), { flag: 'wx', mode: 0o600 });
}
const legal = { termsVersion: '2026-10-11', privacyVersion: '2026-10-11', healthConsent: true };
const hoje = config.dataBase;
const dia = (n) => {
  const d = new Date(hoje + 'T12:00:00Z');
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};
const br = (s) => s.slice(8) + '/' + s.slice(5, 7) + '/' + s.slice(0, 4);
async function api(route, method = 'GET', body, token) {
  const headers = {
    ...(token ? { Authorization: 'Bearer ' + token } : {}),
    ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
  };
  const r = await fetch(base + route, {
    method,
    headers,
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  const value = r.status === 204 ? null : await r.json();
  if (!r.ok) {
    const e = Error(route + ': ' + (value?.message || value?.error || r.status));
    e.status = r.status;
    throw e;
  }
  return value;
}
function leitura(fn) {
  const db = new DatabaseSync(bancoPath, { readOnly: true });
  try {
    return fn(db);
  } finally {
    db.close();
  }
}
const endereco = {
  cpf: '000.000.000-00',
  rg: 'EXEMPLO-FICTICIO',
  cep: '00000-000',
  rua: 'Rua dos Ipês — endereço fictício',
  bairro: 'Jardim Exemplo',
  cidade: 'São Paulo',
  estado: 'SP',
  numero: '120',
  complemento: 'Casa térrea de exemplo, acesso sem degraus',
  telefone: '(11) 0000-0001',
};
const adultos = [];
for (const [i, conta] of config.contas.slice(0, 2).entries()) {
  let sessao;
  try {
    sessao = await api('/auth/login', 'POST', { email: conta.email, senha: conta.senha });
  } catch (erroCapturado) {
    if (erroCapturado.status !== 401) {
      throw erroCapturado;
    }
    sessao = await api('/auth/cadastro', 'POST', {
      ...conta,
      ...legal,
      ...endereco,
      dataNascimento: i ? '1989-09-22' : '1978-05-12',
      celular: i ? '(11) 00000-0002' : '(11) 00000-0001',
      temFilhos: i ? 'Não' : 'Sim',
      quantosFilhos: i ? '0' : '2',
      idadeFilhos: i ? 'Não se aplica' : '16 e 21 anos — dados fictícios',
      trabalha: 'Sim',
      empresa: i ? 'Equipe Caminhos — cadastro fictício' : 'Família Costa — cadastro fictício',
      periodo: i
        ? 'Acompanhamento diurno, 07:00 às 19:00, com passagem de turno'
        : 'Expediente flexível; organização de consultas, agenda e materiais de cuidado',
      nomeResponsavel: 'Marina Costa — exemplo fictício',
      celularResponsavel: '(11) 00000-0001',
      telefoneResponsavel: '(11) 0000-0001',
      nomeEmergencia: 'Marina Costa — contato fictício',
      telefoneEmergencia: '(11) 00000-0001',
    });
  }
  // Comprova que a API gravou exatamente no banco persistente antes de continuar.
  assert.ok(
    leitura((db) =>
      db.prepare('SELECT id FROM users WHERE id=? AND email=?').get(sessao.usuario.id, conta.email),
    ),
    'A API não está usando backend/data/cuidados.db.',
  );
  await api(
    '/auth/me/preferencias',
    'PUT',
    { font_scale: 1, notifications: false, notification_details: false, consultation_minutes: 60 },
    sessao.token,
  );
  adultos.push(sessao);
  console.log('Conta persistente pronta: ' + conta.tipo);
}
const [responsavel, cuidador] = adultos;
let pessoas = await api('/idosos', 'GET', undefined, responsavel.token);
let pessoa = pessoas.find((p) => p.nome === 'Antônio Costa');
if (!pessoa) {
  pessoa = await api(
    '/idosos',
    'POST',
    {
      ...endereco,
      nome: 'Antônio Costa',
      nascimento: '1944-04-18',
      email: config.contas[2].email,
      celular: '(11) 00000-0003',
      autorizacaoTitularConfirmada: true,
      representacao: 'titular_autorizou',
      observacoes:
        'CADASTRO INTEIRAMENTE FICTÍCIO para explorar o aplicativo real. Antônio ' +
        'Costa é um personagem de 82 anos, aposentado, que gosta de jardinagem, ' +
        'música instrumental, leitura de jornais, dominó, culinária familiar e ' +
        'álbuns de fotografias. Prefere conversas tranquilas, uma atividade por vez ' +
        'e orientações claras. A filha fictícia Marina organiza a agenda; Lucas é o ' +
        'cuidador fictício do período diurno. O conjunto inclui organização de ' +
        'alimentação, hidratação, higiene, lazer, contatos, consultas e itens de ' +
        'medicação demonstrativos. A rotina pode ser ajustada por responsável e ' +
        'cuidador. As anotações descrevem situações inventadas, sem diagnósticos ou ' +
        'prescrições reais. A casa fictícia é térrea, com cantinho de leitura, ' +
        'quintal e mesa para atividades. Preferências: almoço em ambiente calmo, ' +
        'músicas antigas à tarde, visitas combinadas com antecedência e participação ' +
        'na escolha das atividades. A família revisa a agenda semanal e separa ' +
        'documentos, transporte e dúvidas antes dos compromissos. Os números de ' +
        'telefone, documentos e endereço são exemplos sem titular real. Os ' +
        'medicamentos deste conjunto são personagens de demonstração, sem princípio ' +
        'ativo e sem dose clínica. Nenhum item deve ser usado como orientação de ' +
        'tratamento.',
    },
    responsavel.token,
  );
}
const p = pessoa.id;
await api(
  '/idosos/' + p + '/contatos',
  'PUT',
  {
    nome: 'Marina Costa — contato fictício',
    telefone: '(11) 00000-0001',
    nomeAlternativo: 'Lucas Martins — contato fictício',
    telefoneAlternativo: '(11) 00000-0002',
  },
  responsavel.token,
);
if (!(await api('/idosos', 'GET', undefined, cuidador.token)).some((i) => i.id === p)) {
  await api(
    '/idosos/' + p + '/cuidadores',
    'POST',
    { email: config.contas[1].email },
    responsavel.token,
  );
  const convites = await api('/convites', 'GET', undefined, cuidador.token);
  assert.equal(convites.length, 1, 'Convite inesperado; confira antes de continuar.');
  await api(
    '/convites/' + convites[0].id + '/responder',
    'POST',
    { aceitar: true },
    cuidador.token,
  );
}
let sessaoIdoso;
try {
  sessaoIdoso = await api('/auth/login', 'POST', {
    email: config.contas[2].email,
    senha: config.contas[2].senha,
  });
} catch (erroCapturado) {
  if (![400, 401].includes(erroCapturado.status)) {
    throw erroCapturado;
  }
  if (
    leitura((db) => db.prepare('SELECT id FROM users WHERE email=?').get(config.contas[2].email))
  ) {
    throw Error(
      'A conta idosa já existe com acesso alterado. A carga não redefine credenciais existentes.',
    );
  }
  await api(
    '/idosos/' + p + '/acesso-senha',
    'PUT',
    { email: config.contas[2].email, senha: config.contas[2].senha },
    responsavel.token,
  );
  sessaoIdoso = await api('/auth/login', 'POST', {
    email: config.contas[2].email,
    senha: config.contas[2].senha,
  });
}
if (!sessaoIdoso.usuario.legalAccepted) {
  await api('/legal/accept', 'POST', legal, sessaoIdoso.token);
}
await api(
  '/auth/me/preferencias',
  'PUT',
  { font_scale: 1.2, notifications: false, notification_details: false, consultation_minutes: 60 },
  sessaoIdoso.token,
);
console.log('Três contas vinculadas ao mesmo cadastro fictício.');
const tipos = ['rotinas', 'medicamentos', 'consultas', 'memorias'];
const existentes = {};
for (const t of tipos) {
  existentes[t] = await api(
    '/registros?tipo=' + t + '&idosoId=' + p,
    'GET',
    undefined,
    responsavel.token,
  );
}
const chave = (r) => [r.tipo, r.titulo, r.data, r.horario].join('|');
const vistos = new Map(
  Object.values(existentes)
    .flat()
    .map((r) => [chave(r), r]),
);

const bancoCarga = new DatabaseSync(bancoPath);
bancoCarga.exec('PRAGMA foreign_keys=ON; PRAGMA busy_timeout=5000');
assert.equal(
  bancoCarga.prepare('SELECT owner_id FROM idosos WHERE id=?').get(p).owner_id,
  responsavel.usuario.id,
);
function transacaoLocal(fn) {
  bancoCarga.exec('BEGIN IMMEDIATE');
  try {
    const v = fn();
    bancoCarga.exec('COMMIT');
    return v;
  } catch (erroCapturado) {
    bancoCarga.exec('ROLLBACK');
    throw erroCapturado;
  }
}
function eventoLocal(actor, tipo, entidade, acao, antes, depois) {
  bancoCarga
    .prepare(
      'INSERT INTO audit_events(id,idoso_id,actor_id,actor_name,tipo,entity_id,action,occurred_at,before_json,after_json) VALUES(?,?,?,?,?,?,?,?,?,?)',
    )
    .run(
      crypto.randomUUID(),
      p,
      actor.usuario.id,
      actor.usuario.nome,
      tipo,
      entidade,
      acao,
      new Date().toISOString(),
      JSON.stringify(antes),
      JSON.stringify({ ...depois, origem: 'importacao_ficticia_local' }),
    );
}
function inserirRegistroLocal(actor, r) {
  assert.ok(tipos.includes(r.tipo));
  assert.match(r.data, /^\d{4}-\d{2}-\d{2}$/);
  assert.match(r.horario, /^\d{2}:\d{2}$/);
  if (actor.usuario.id !== responsavel.usuario.id) {
    assert.ok(
      bancoCarga
        .prepare(
          'SELECT permission FROM access_grants WHERE idoso_id=? AND user_id=? AND permission=?',
        )
        .get(p, actor.usuario.id, 'criar_' + r.tipo),
    );
  }
  bancoCarga
    .prepare(
      'INSERT INTO registros(id,owner_id,idoso_id,tipo,titulo,data,horario,detalhes,status,categoria,midia,versao,plano_id,fuso) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?)',
    )
    .run(
      r.id,
      responsavel.usuario.id,
      p,
      r.tipo,
      r.titulo,
      r.data,
      r.horario,
      r.detalhes,
      r.status,
      r.categoria,
      r.midia,
      r.versao,
      r.planoId,
      r.fuso,
    );
}
function planoLocal(titulo, horarios, detalhes) {
  return transacaoLocal(() => {
    const id = crypto.randomUUID();
    bancoCarga
      .prepare(
        'INSERT INTO dose_plans(id,idoso_id,actor_id,titulo,start_date,end_date,times,interval_days,timezone) VALUES(?,?,?,?,?,?,?,?,?)',
      )
      .run(
        id,
        p,
        responsavel.usuario.id,
        titulo,
        hoje,
        dia(41),
        JSON.stringify(horarios),
        1,
        'America/Sao_Paulo',
      );
    let doses = 0;
    for (let offset = 0; offset <= 41; offset++) {
      for (const hora of horarios) {
        const r = {
          id: crypto.randomUUID(),
          tipo: 'medicamentos',
          titulo,
          data: dia(offset),
          horario: hora,
          detalhes,
          status: 'pendente',
          categoria: 'Histórias',
          midia: '',
          versao: 1,
          planoId: id,
          fuso: 'America/Sao_Paulo',
        };
        inserirRegistroLocal(responsavel, r);
        eventoLocal(
          responsavel,
          'medicamentos',
          r.id,
          'dose_programada',
          {},
          { plano: id, titulo, data: r.data, horario: hora },
        );
        doses++;
      }
    }
    return { id, doses };
  });
}

let criados = 0;
let concluidos = 0;

async function registro(tipo, titulo, offset, horario, detalhes, done = false, extra = {}) {
  const body = { idosoId: p, tipo, titulo, data: dia(offset), horario, detalhes, ...extra };
  const key = chave(body);
  if (vistos.has(key)) {
    return vistos.get(key);
  }
  const actor = criados % 3 === 0 ? cuidador : responsavel;
  let r = {
    ...body,
    id: crypto.randomUUID(),
    status: 'pendente',
    versao: 1,
    categoria: extra.categoria || 'Histórias',
    midia: extra.midia || '',
    planoId: '',
    fuso: '',
  };
  transacaoLocal(() => {
    inserirRegistroLocal(actor, r);
    eventoLocal(actor, tipo, r.id, 'criado', {}, r);
    bancoCarga.prepare('INSERT INTO mutation_receipts(id,user_id,record_id) VALUES(?,?,?)').run(
      'conjunto-' +
        crypto
          .createHash('sha256')
          .update(p + '|' + key)
          .digest('hex'),
      actor.usuario.id,
      r.id,
    );
    if (done) {
      const antes = { ...r };
      r = { ...r, status: 'concluido', versao: 2 };
      bancoCarga
        .prepare('UPDATE registros SET status=?,versao=? WHERE id=?')
        .run(r.status, r.versao, r.id);
      eventoLocal(actor, tipo, r.id, 'concluido', antes, r);
      concluidos++;
    }
  });
  vistos.set(key, r);
  criados++;
  if (criados % 100 === 0) {
    console.log('Registros adicionados: ' + criados);
  }
  return r;
}

const rotina = [
  [
    '07:00',
    'Acolhimento e organização da manhã',
    'Conferir a agenda escolhida para o dia, abrir as cortinas e organizar os ' +
      'objetos de uso cotidiano. Perguntar qual atividade o personagem prefere ' +
      'fazer primeiro e registrar a escolha.',
  ],
  [
    '07:30',
    'Café da manhã em família',
    'Organizar a mesa, separar os utensílios e conversar sobre o dia. ' +
      'Preferências fictícias: ambiente tranquilo, porções apresentadas com calma ' +
      'e escolha compartilhada do acompanhamento.',
  ],
  [
    '08:30',
    'Higiene e organização pessoal',
    'Separar roupas e itens pessoais do personagem, conferir a organização do ' +
      'ambiente e registrar o apoio prestado na situação inventada.',
  ],
  [
    '09:00',
    'Pausa de hidratação',
    'Lembrete organizacional de demonstração. Registrar a participação do ' +
      'personagem e a disponibilidade dos itens; nenhuma meta clínica é definida ' +
      'neste conjunto.',
  ],
  [
    '10:00',
    'Jardinagem no quintal',
    'Atividade fictícia de lazer: observar as plantas, identificar uma espécie ' +
      'do canteiro e escolher uma tarefa simples de organização. Adaptar o ' +
      'programa à preferência registrada.',
  ],
  [
    '11:00',
    'Leitura de jornal e conversa',
    'Escolher uma manchete do jornal demonstrativo, comentar lembranças ' +
      'associadas e registrar os assuntos que despertaram interesse.',
  ],
  [
    '12:00',
    'Almoço e encontro familiar',
    'Conferir o planejamento do almoço e os itens da mesa. O registro descreve ' +
      'organização de uma refeição fictícia, sem cardápio ou orientação ' +
      'nutricional individual.',
  ],
  [
    '13:30',
    'Descanso e ambiente tranquilo',
    'Reservar um momento calmo e organizar o espaço de descanso. Registrar a ' +
      'preferência do personagem por silêncio ou música instrumental.',
  ],
  [
    '15:00',
    'Música, dominó ou álbum de fotos',
    'Oferecer opções de lazer e registrar a escolha. Alternar música ' +
      'instrumental, dominó, lembranças da família e histórias do bairro fictício.',
  ],
  [
    '16:00',
    'Lanche e conversa da tarde',
    'Preparar a mesa e retomar um assunto de interesse. Conferir os compromissos ' +
      'da tarde e separar os materiais da atividade seguinte.',
  ],
  [
    '18:00',
    'Revisão da agenda com o cuidador',
    'Conferir os itens concluídos e pendentes. Registrar dúvidas organizacionais ' +
      'para o responsável e apontar o que a próxima equipe deve acompanhar.',
  ],
  [
    '20:30',
    'Preparação para a noite',
    'Organizar os pertences, conferir a agenda de amanhã e combinar um ' +
      'encerramento tranquilo das atividades. Anotação sem avaliação clínica.',
  ],
];
for (let offset = -14; offset <= 41; offset++) {
  for (const [j, [hora, titulo, texto]] of rotina.entries()) {
    const done =
      offset < 0 ? (offset + j) % 5 !== 0 : offset === 0 && hora < '16:00' && j % 3 !== 0;
    await registro(
      'rotinas',
      titulo,
      offset,
      hora,
      'Exemplo fictício referente a ' +
        br(dia(offset)) +
        '. ' +
        texto +
        (' Responsável pela organização: equipe Costa. Ao concluir, registrar somente ' +
          'a ação efetivamente representada no exemplo.'),
      done,
    );
  }
  if ((offset + 14) % 7 === 0) {
    for (const [hora, titulo, texto] of [
      [
        '09:30',
        'Conferência semanal de documentos',
        'Organizar a pasta de compromissos e anotar dúvidas para os profissionais fictícios.',
      ],
      [
        '14:00',
        'Organização dos materiais de cuidado',
        'Conferir etiquetas demonstrativas, embalagens de exemplo e a lista de materiais da semana.',
      ],
      [
        '17:00',
        'Ligação combinada com familiares',
        'Separar o aparelho e combinar os assuntos da conversa com a família fictícia.',
      ],
      [
        '19:00',
        'Revisão semanal com o responsável',
        'Revisar agenda, transporte, tarefas pendentes e preferências do personagem.',
      ],
    ]) {
      await registro(
        'rotinas',
        titulo,
        offset,
        hora,
        'Atividade semanal fictícia. ' +
          texto +
          ' Registrar combinados e responsáveis pela próxima etapa.',
        offset < 0,
      );
    }
  }
}
const medicamentos = [
  [
    'Medicamento fictício A — demonstração',
    ['08:00', '20:00'],
    'Item inventado de apresentação em comprimido. Conferir o nome do exemplo e ' +
      'registrar o estado da tarefa.',
  ],
  [
    'Medicamento fictício B — demonstração',
    ['12:30'],
    'Item inventado de apresentação em cápsula. O lembrete apenas ilustra a organização do aplicativo.',
  ],
  [
    'Medicamento fictício C — demonstração',
    ['07:00', '15:00', '23:00'],
    'Item inventado de apresentação em solução. Nenhum volume ou princípio ativo clínico foi definido.',
  ],
  [
    'Medicamento fictício D — demonstração',
    ['09:00'],
    'Item inventado de apresentação tópica, usado somente para explorar a agenda e o histórico.',
  ],
  [
    'Medicamento fictício E — demonstração',
    ['18:00'],
    'Item inventado de apresentação em sachê. O registro não constitui prescrição.',
  ],
  [
    'Medicamento fictício F — demonstração',
    ['10:00', '22:00'],
    'Item inventado de apresentação em gotas, sem concentração, volume ou princípio ativo real.',
  ],
];
const planos = await api('/idosos/' + p + '/planos', 'GET', undefined, responsavel.token);
for (const [titulo, horarios, texto] of medicamentos) {
  if (!planos.some((i) => i.titulo === titulo && i.inicio === hoje && i.fim === dia(41))) {
    const result = planoLocal(
      titulo,
      horarios,
      'DADOS FICTÍCIOS, SEM VALOR PRESCRITIVO. ' +
        texto +
        ' Estes horários são apenas exemplos de organização, sem orientação de uso de medicamento real.',
    );
    console.log('Plano persistente criado: ' + result.doses + ' lembretes.');
  }
  for (let offset = -14; offset < 0; offset++) {
    await registro(
      'medicamentos',
      titulo + ' — histórico',
      offset,
      horarios[0],
      'Histórico fictício de ' +
        br(dia(offset)) +
        '. ' +
        texto +
        ' Estado registrado somente para demonstrar conclusão, pendência e autoria.',
      offset % 4 !== 0,
    );
  }
}
const futuras = await api(
  '/registros?tipo=medicamentos&idosoId=' + p,
  'GET',
  undefined,
  responsavel.token,
);
for (const [i, r] of futuras
  .filter((r) => r.data === hoje && r.planoId && r.horario < '16:00')
  .entries())
  if (i % 2 === 0 && r.status === 'pendente') {
    await api('/registros/' + r.id, 'PUT', { ...r, status: 'concluido' }, cuidador.token);
  }
const consulta = [
  [
    'Clínica fictícia Ipês — acompanhamento geral',
    'Revisar a agenda, levar o resumo dos registros de demonstração e anotar perguntas organizacionais.',
  ],
  [
    'Centro fictício Caminhos — avaliação de movimento',
    'Separar os documentos de exemplo e confirmar o transporte combinado.',
  ],
  [
    'Consultório fictício Aurora — conversa nutricional',
    'Levar somente o registro de refeições inventadas para explorar o fluxo do aplicativo.',
  ],
  [
    'Centro fictício Horizonte — consulta odontológica',
    'Organizar a pasta e a lista de dúvidas; nenhum procedimento real foi prescrito.',
  ],
  [
    'Clínica fictícia Vista — acompanhamento visual',
    'Conferir os itens pessoais e o local inventado do compromisso.',
  ],
  [
    'Espaço fictício Memória — conversa de acompanhamento',
    'Preparar a lista de atividades preferidas e as dúvidas da família fictícia.',
  ],
  [
    'Clínica fictícia Escuta — acompanhamento auditivo',
    'Conferir o horário e registrar os combinados de transporte.',
  ],
  [
    'Reunião fictícia da equipe de cuidado',
    'Revisar a agenda, as preferências e a passagem de turno com os personagens.',
  ],
];
for (let i = 0; i < 32; i++) {
  const [titulo, texto] = consulta[i % consulta.length];
  const offset = -20 + i * 2;
  await registro(
    'consultas',
    titulo + ' · encontro ' + (Math.floor(i / 8) + 1),
    offset,
    ['09:30', '14:30', '10:00', '16:00'][i % 4],
    'Compromisso e estabelecimento inteiramente fictícios. Referência: ' +
      br(dia(offset)) +
      '. ' +
      texto +
      (' Preparação: confirmar data e horário no exemplo, separar documentos ' +
        'demonstrativos, combinar acompanhante e registrar perguntas. Após a tarefa, ' +
        'registrar apenas informações inventadas. Contato de exemplo: (11) ' +
        '0000-0000.'),
    offset < 0 && i % 4 !== 0,
  );
}
const memorias = [
  [
    'O jardim da casa antiga',
    'Antônio conta que gostava de observar as flores no fim da tarde e de ' +
      'organizar pequenos canteiros com a família.',
  ],
  [
    'Uma tarde de dominó',
    'O personagem recorda os encontros de domingo, a mesa de madeira e as ' +
      'conversas entre uma rodada e outra.',
  ],
  [
    'A rádio da cozinha',
    'A lembrança fictícia reúne músicas antigas, o som do rádio e a preparação de um café em família.',
  ],
  [
    'Histórias do primeiro trabalho',
    'Antônio descreve colegas inventados, o trajeto até o trabalho e o orgulho ' +
      'de aprender uma nova tarefa.',
  ],
  [
    'O aniversário no quintal',
    'A família fictícia reuniu cadeiras, flores e um álbum para celebrar uma tarde de convivência.',
  ],
  [
    'O passeio pela praça',
    'O personagem conta como reconhecia árvores e bancos da praça inventada do bairro.',
  ],
  [
    'O caderno de receitas',
    'Marina lembra de um caderno familiar de exemplo, com anotações e pequenas ' +
      'histórias associadas às receitas.',
  ],
  [
    'As cartas guardadas',
    'A lembrança inventada reúne cartas, fotografias e relatos de encontros com parentes fictícios.',
  ],
  [
    'A viagem de trem',
    'Antônio conta sobre paisagens, estações e conversas de uma viagem que ' +
      'existe apenas neste conjunto demonstrativo.',
  ],
  [
    'A festa do bairro',
    'O relato fictício descreve bandeirinhas, música, jogos e o encontro de vizinhos inventados.',
  ],
  [
    'O álbum da família',
    'O personagem escolhe uma imagem ilustrativa e comenta o que ela representa na história inventada.',
  ],
  [
    'A coleção de livros',
    'A família organiza livros por assunto e pergunta ao personagem qual história gostaria de reler.',
  ],
  [
    'O canteiro de ervas',
    'Uma lembrança fictícia sobre observar folhas, cheiros e etiquetas de um pequeno jardim de exemplo.',
  ],
  [
    'O jogo de perguntas',
    'Lucas prepara cartões com assuntos cotidianos e registra os temas preferidos do personagem.',
  ],
  [
    'O domingo de música',
    'Antônio escolhe uma música instrumental de referência e conta uma lembrança inteiramente inventada.',
  ],
  [
    'A oficina de madeira',
    'O personagem relata como gostava de organizar ferramentas e planejar pequenos projetos de exemplo.',
  ],
];
for (let i = 0; i < 48; i++) {
  const [titulo, texto] = memorias[i % memorias.length];
  await registro(
    'memorias',
    titulo + ' · capítulo ' + (Math.floor(i / 16) + 1),
    -200 + i * 4,
    '15:00',
    'HISTÓRIA INTEIRAMENTE FICTÍCIA. ' +
      texto +
      (' Na conversa de exemplo, a equipe usa perguntas abertas, respeita a escolha ' +
        'do assunto e registra as preferências do personagem. Marina participa ' +
        'lembrando detalhes inventados; Lucas organiza a atividade e anota o que ' +
        'despertou interesse. Esta memória não descreve pessoa ou acontecimento ' +
        'real.'),
    true,
    { categoria: 'Histórias' },
  );
}
const imagens = ['passeioBancoRC.png', 'reuniaoBancoRC.png', 'diaBancoRC.png'];
for (let i = 0; i < 12; i++) {
  const titulo =
    [
      'Passeio ilustrativo no parque',
      'Encontro familiar ilustrativo',
      'Atividade ilustrativa do dia',
    ][i % 3] +
    ' · álbum ' +
    (Math.floor(i / 3) + 1);
  const offset = -180 + i * 15;
  const body = { tipo: 'memorias', titulo, data: dia(offset), horario: '16:00' };
  if (vistos.has(chave(body))) {
    continue;
  }
  const nome = imagens[i % 3];
  const bytes = await fs.readFile(path.join(root, 'assets/illustrations', nome));
  const form = new FormData();
  form.append('arquivo', new Blob([bytes], { type: 'image/png' }), nome);
  const resp = await fetch(base + '/idosos/' + p + '/midias', {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + responsavel.token },
    body: form,
  });
  const midia = await resp.json();
  if (!resp.ok) {
    throw Error('Falha ao adicionar ilustração privada.');
  }
  await registro(
    'memorias',
    titulo,
    offset,
    '16:00',
    'Imagem ilustrativa já incluída no projeto, associada a uma memória ' +
      'inventada. Não é fotografia de uma pessoa real. Legenda: a família fictícia ' +
      'organiza uma atividade de convivência e registra uma lembrança no álbum.',
    true,
    { categoria: 'Fotos', midia: midia.midia },
  );
}
const anotacoes = await api('/idosos/' + p + '/diario', 'GET', undefined, responsavel.token);
const textos = new Set(anotacoes.map((i) => i.texto));
const assuntos = [
  [
    'Acolhimento',
    'O personagem escolheu a leitura de jornal como atividade inicial. A equipe ' +
      'organizou os materiais e combinou uma pausa antes da próxima tarefa.',
  ],
  [
    'Refeições',
    'No cenário fictício, a mesa foi organizada com calma. A família registrou ' +
      'as preferências do personagem, sem avaliação nutricional.',
  ],
  [
    'Lazer',
    'A atividade escolhida foi dominó e conversa sobre o jardim. O personagem ' +
      'preferiu uma atividade por vez e pediu para retomar o álbum em outro ' +
      'momento.',
  ],
  [
    'Agenda',
    'Os compromissos inventados da semana foram conferidos. A pasta de ' +
      'documentos de exemplo ficou organizada por data e o transporte foi ' +
      'combinado no cenário.',
  ],
  [
    'Materiais',
    'As etiquetas e os itens demonstrativos foram conferidos. Não houve registro ' +
      'de medicamento real, prescrição ou medida clínica.',
  ],
  [
    'Convivência',
    'Marina e Lucas revisaram os combinados com o personagem e anotaram os ' +
      'assuntos de interesse para a próxima conversa.',
  ],
];
for (let i = 0; i < 84; i++) {
  const [assunto, texto] = assuntos[i % assuntos.length];
  const categoria = i % 9 === 8 ? 'correcao' : i % 3 === 2 ? 'passagem_turno' : 'observacao';
  const referencia = dia(-14 + Math.floor(i / 6));
  const textoFinal =
    'ANOTAÇÃO FICTÍCIA ' +
    String(i + 1).padStart(3, '0') +
    ' — referência ' +
    br(referencia) +
    '. ' +
    assunto +
    ': ' +
    texto +
    ' ' +
    (categoria === 'passagem_turno'
      ? 'Passagem de turno: revisar pendências, conferir a pessoa selecionada e ' +
        'manter os combinados descritos no exemplo.'
      : categoria === 'correcao'
        ? 'Correção do cenário demonstrativo: a atividade prevista ficou combinada ' +
          'para a tarde; preservar a anotação anterior como parte do histórico.'
        : 'Próxima etapa: retomar a agenda, registrar escolhas e combinar a atividade ' +
          'seguinte com o personagem.') +
    ' As situações são inventadas e foram importadas agora, sem simular autoria retroativa.';
  if (textos.has(textoFinal)) {
    continue;
  }

  const actor = i % 2 ? cuidador : responsavel;
  const nid = crypto.randomUUID();
  transacaoLocal(() => {
    bancoCarga
      .prepare(
        'INSERT INTO care_notes(id,idoso_id,actor_id,actor_name,kind,texto,occurred_at) VALUES(?,?,?,?,?,?,?)',
      )
      .run(
        nid,
        p,
        actor.usuario.id,
        actor.usuario.nome,
        categoria,
        textoFinal,
        new Date().toISOString(),
      );
    eventoLocal(actor, 'diario', nid, 'anotacao_importada', {}, { categoria, texto: textoFinal });
  });

  textos.add(textoFinal);
}
bancoCarga.close();
const sessoes = [responsavel, cuidador, sessaoIdoso];
for (const [i, s] of sessoes.entries()) {
  const pessoas = await api('/idosos', 'GET', undefined, s.token);
  assert.equal(pessoas.length, 1);
  assert.equal(pessoas[0].id, p);
  for (const tipo of tipos) {
    assert.ok(
      (await api('/registros?tipo=' + tipo + '&idosoId=' + p, 'GET', undefined, s.token)).length >
        0,
    );
  }
  assert.equal((await api('/auth/me', 'GET', undefined, s.token)).tipo, config.contas[i].tipo);
}
const resumo = leitura((db) => ({
  banco: 'backend/data/cuidados.db',
  dataBase: hoje,
  pessoa: p,
  contas: config.contas.map((c, i) => ({
    tipo: c.tipo,
    nome: c.nome,
    email: c.email,
    id: sessoes[i].usuario.id,
  })),
  registros: db
    .prepare(
      'SELECT tipo,COUNT(*) AS total,SUM(status=?) AS concluidos FROM registros ' +
        'WHERE idoso_id=? GROUP BY tipo',
    )
    .all('concluido', p),
  planos: db.prepare('SELECT COUNT(*) AS total FROM dose_plans WHERE idoso_id=?').get(p).total,
  diario: db.prepare('SELECT COUNT(*) AS total FROM care_notes WHERE idoso_id=?').get(p).total,
  midias: db.prepare('SELECT COUNT(*) AS total FROM media_files WHERE idoso_id=?').get(p).total,
  eventos: db.prepare('SELECT COUNT(*) AS total FROM audit_events WHERE idoso_id=?').get(p).total,
}));
assert.equal(
  resumo.registros.reduce((n, r) => n + r.total, 0),
  1300,
);
assert.equal(resumo.diario, 84);
assert.equal(resumo.planos, 6);
assert.equal(resumo.midias, 12);
await fs.writeFile(path.join(dir, 'resumo.json'), JSON.stringify(resumo, null, 2));
await fs.writeFile(
  path.join(dir, 'ACESSOS.md'),
  `# Acessos do aplicativo persistente

Dados de cuidado inteiramente fictícios. Banco: backend/data/cuidados.db.

| Perfil | E-mail | Senha |
| --- | --- | --- |
` +
    config.contas.map((c) => '| ' + c.tipo + ' | ' + c.email + ' | ' + c.senha + ' |').join('\n') +
    '\n\nIdoso: Idoso > Entrar com e-mail e senha. QR continua disponível.\n',
);
await fs.writeFile(
  path.join(root, 'docs/CONTAS_PREENCHIDAS.md'),
  '# Contas preenchidas no aplicativo\n\nConjunto criado em ' +
    br(hoje) +
    ` no banco persistente backend/data/cuidados.db. Responsável Marina Costa, cuidador Lucas Martins e idoso Antônio Costa estão vinculados ao mesmo cadastro. Nomes, documentos, contatos, relatos e itens de medicamento são fictícios.

` +
    resumo.registros
      .map(
        (r) => '- ' + r.total + ' registros de ' + r.tipo + ' (' + r.concluidos + ' concluídos).',
      )
      .join('\n') +
    '\n- ' +
    resumo.planos +
    ' planos recorrentes de medicamentos demonstrativos.\n- ' +
    resumo.diario +
    ' anotações de diário e passagem de turno.\n- ' +
    resumo.midias +
    ' ilustrações privadas em memórias.\n- ' +
    resumo.eventos +
    ` eventos de autoria, incluindo a importação local fictícia.

O conjunto cobre oito semanas de rotinas, seis semanas futuras de lembretes, compromissos e memórias distribuídas em vários meses. O responsável administra; o cuidador acessa por vínculo aceito; o idoso vê somente seu próprio cadastro, com as ações permitidas ao seu perfil.

Credenciais ficam somente no arquivo local ignorado work/contas-app/ACESSOS.md, não nos manuais. Para recriar ou retomar, com a API usando este banco: node scripts/criar-contas-preenchidas.mjs --confirmar-banco-persistente. A reexecução preserva as contas, não redefine senhas e não duplica o conjunto.

O login do idoso permite e-mail e senha quando configurados pelo proprietário. A alternativa QR permanece. Uma desconexão ou transferência desativa a senha e encerra sessões para revisão pelo proprietário.
`,
);
for (const s of sessoes) {
  await api('/auth/logout', 'POST', undefined, s.token);
}
console.log(JSON.stringify(resumo, null, 2));
