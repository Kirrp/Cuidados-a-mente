// Gera manuais, figuras e trechos numerados a partir do código atual.
import fs from 'node:fs/promises';
import path from 'node:path';
const root = path.resolve(import.meta.dirname, '..');
const recursos = JSON.parse(
  await fs.readFile(path.join(root, 'scripts/recursos-manuais.json'), 'utf8'),
);
async function gravar(nome, texto) {
  const arquivo = path.join(root, nome);
  await fs.mkdir(path.dirname(arquivo), { recursive: true });
  if ((await fs.readFile(arquivo, 'utf8').catch(() => null)) !== texto) {
    await fs.writeFile(arquivo, texto);
  }
}
const esc = (s) => s.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('"', '&quot;');
async function trecho(f) {
  const linhas = (await fs.readFile(path.join(root, f.arquivo), 'utf8'))
    .replaceAll('\r\n', '\n')
    .split('\n');
  const inicio = linhas.findIndex((l) => l.includes(f.marca));
  if (inicio < 0) {
    throw Error('Trecho ausente: ' + f.id + ' ' + f.marca);
  }
  const codigo = linhas
    .slice(inicio, inicio + f.n)
    .map((l, i) => String(inicio + i + 1).padStart(3, '0') + ' | ' + l.trimEnd())
    .join('\n');
  return (
    'Fonte: `' +
    f.arquivo +
    '`, linha ' +
    (inicio + 1) +
    '. Os números à esquerda são as linhas reais.\n\n```' +
    (f.arquivo.endsWith('.py') ? 'python' : f.arquivo.endsWith('.java') ? 'java' : 'typescript') +
    '\n' +
    codigo +
    '\n```\n\n' +
    f.explica
  );
}
for (const f of recursos) {
  let svg =
    '<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="340" ' +
    'viewBox="0 0 1000 340"><rect width="1000" height="340" rx="26" ' +
    'fill="#F4F1F8"/><text x="38" y="48" font-family="Arial" font-size="26" ' +
    'font-weight="bold" fill="#28133F">' +
    esc(f.nome) +
    ('</text><text x="38" y="79" font-family="Arial" font-size="18" ' +
      'fill="#665B73">Fluxo explicado · Cuidados à Mente · versão ' +
      '2026-10-12</text>');
  for (const [i, label] of f.diagrama.entries()) {
    const x = 38 + i * 321;
    svg +=
      '<rect x="' +
      x +
      ('" y="112" width="284" height="151" rx="18" fill="white" stroke="#DCD2E6" ' +
        'stroke-width="2"/><circle cx="') +
      (x + 35) +
      '" cy="147" r="20" fill="#28133F"/><text x="' +
      (x + 35) +
      '" y="155" text-anchor="middle" font-family="Arial" font-size="22" fill="white">' +
      (i + 1) +
      '</text>';
    const linhas = [''];
    for (const palavra of label.split(' ')) {
      const j = linhas.length - 1;
      if ((linhas[j] + ' ' + palavra).trim().length > 21) {
        linhas.push(palavra);
      } else {
        linhas[j] = (linhas[j] + ' ' + palavra).trim();
      }
    }
    linhas.forEach((l, j) => {
      svg +=
        '<text x="' +
        (x + 20) +
        '" y="' +
        (193 + j * 29) +
        '" font-family="Arial" font-size="23" font-weight="bold" fill="#28133F">' +
        esc(l) +
        '</text>';
    });
    if (i < 2) {
      svg +=
        '<path d="M' +
        (x + 291) +
        ' 189 h19 m-8 -8 l8 8 -8 8" fill="none" stroke="#6422B5" stroke-width="4"/>';
    }
  }
  svg +=
    '<text x="38" y="305" font-family="Arial" font-size="18" ' +
    'fill="#665B73">Ilustração do funcionamento. Não representa tela ou registro ' +
    'real.</text></svg>';
  await gravar('docs/imagens/evolucao-' + f.id + '.svg', svg);
}
let usuario = `# Manual do usuário — Cuidados à Mente

Versão 2026-10-12. Faça cada tarefa, reconheça o resultado e confira os limites. As figuras explicam o funcionamento; os exemplos são sintéticos.

## 1. Comece aqui

O Idoso acessa o próprio cuidado. O Cuidador acompanha cadastros autorizados. O Responsável administra seus cadastros. Confira o nome da pessoa antes de escrever, concluir ou compartilhar.

| Quero fazer | Onde encontrar |
| --- | --- |
| Ver pendências | Painel e abas de registros |
| Escrever passagem de turno | Acompanhamento > Diário |
| Programar várias doses | Acompanhamento > Doses recorrentes |
| Ajustar letras e avisos | Perfil > Configurações |
| Rever compartilhamento | Permissões e Administração |
| Pedir correção ou revogar | Configurações > Privacidade |

Na web, use conexão com a API. Lembretes e GPS pontual são nativos. Offline exige build própria com SQLCipher; o Expo Go não valida esse recurso. Resumos e atividades do dia apoiam a organização, sem avaliar saúde.

`;
let aula = `# Manual-aula do código — Cuidados à Mente

Versão 2026-10-12. Cada aula liga ação na tela, regra no servidor e dado persistido. As linhas copiadas vêm do código atual; gere novamente este manual quando alterar a fonte.

## 1. Entenda a arquitetura

A tela chama requisitarApi. O cliente envia token e JSON. O backend identifica a conta, verifica aceite e permissão para a pessoa, valida campos e consulta SQLite. Novas mídias ficam em pasta privada; módulos Expo SDK 57 cuidam de notificações, captura pontual e armazenamento nativo.

![Arquitetura geral do cuidado](imagens/evolucao-operacao.svg)

\`\`\`text
Tela React Native -> cliente-api -> controlador Java
                                  -> BancoDados -> SQLite
                                  -> MidiaController -> arquivos privados
Aparelho -> SecureStore / SQLCipher / Notifications / Location
\`\`\`

Leia uma aula de cada vez e reproduza com dados de teste. Um trecho isolado não substitui as verificações do método completo.

`;
usuario = usuario.replace(
  '## 1. Comece aqui',
  `![Da tela ao registro protegido](imagens/evolucao-registros.svg)

Leia uma tarefa por vez. Localize a tela, siga os passos e compare o resultado esperado. As últimas páginas mostram telas de demonstração e exemplos opcionais de código.

## 1. Comece aqui`,
);
aula = aula.replace(
  '## 1. Entenda a arquitetura',
  `![Do aplicativo à operação](imagens/evolucao-operacao.svg)

Use a imagem para entender o caminho. Depois confira as linhas da fonte e a explicação de cada funcionalidade.

## 1. Entenda a arquitetura`,
);
for (const [i, f] of recursos.entries()) {
  const figura =
    '![Figura ' + (i + 1) + ' — ' + f.nome + '](imagens/evolucao-' + f.id + '.svg)\n\n';
  usuario +=
    '## ' +
    (i + 2) +
    '. ' +
    f.nome +
    '\n\n**Onde:** ' +
    f.tela +
    '.\n\n' +
    figura +
    f.passos.map((p, j) => j + 1 + '. ' + p).join('\n') +
    '\n\n**Resultado esperado:** ' +
    f.efeito +
    '\n\n**O que conferir:** ' +
    f.limite +
    '\n\n';
  aula +=
    '## ' +
    (i + 2) +
    '. ' +
    f.nome +
    '\n\n**Na interface:** ' +
    f.tela +
    '.\n\n' +
    figura +
    '**O que a funcionalidade faz:** ' +
    f.efeito +
    '\n\n' +
    (await trecho(f)) +
    '\n\n**Experimente:** ' +
    f.passos.at(-1) +
    '\n\n**Limites:** ' +
    f.limite +
    '\n\n';
}
usuario += `## 22. Se algo não funcionar

| Situação | Como agir |
| --- | --- |
| Sessão expirada | Entre novamente; cache e fila pertencem à sessão. |
| Sem permissão | Peça revisão ao administrador; link não concede acesso. |
| Conflito | Compare servidor e conteúdo local antes de repetir. |
| E-mail indisponível | O mantenedor precisa conectar remetente e Resend. |
| Sem SQLCipher | Use build nativa própria ou mantenha conexão. |
| Sem lembrete | Confira permissão, horários, sessão e agenda de 12 horas. |
| Sem posição | O titular precisa enviar captura recente do próprio aparelho. |
| Sem mídia | Confira sessão, permissão e arquivo; links dependem de terceiros. |

## 23. Código por trás de cinco ações

Parte opcional para quem deseja estudar. O manual-aula mostra todas as funcionalidades, com linhas reais e explicações.

`;
for (const id of ['doses', 'lembretes', 'historico', 'offline', 'privacidade']) {
  const f = recursos.find((r) => r.id === id);
  usuario += '### ' + f.nome + '\n\n' + (await trecho(f)) + '\n\n';
}
aula += `## 22. Como testar o que aprendeu

1. Leia cliente-api e contexto-autenticacao para sessão e falhas.
2. Leia CuidadosController para permissão e versão dos registros.
3. Leia EvolucaoController e MidiaController para as funções novas.
4. Leia BancoDados para migrações e transações.
5. Confira ALTERACOES_E_TESTES.md e use dados temporários.

| Verificação | O que avalia |
| --- | --- |
| npm run typecheck | Tipos TypeScript |
| npm run lint | Regras estáticas de React |
| npm run format:check | Padrão de formatação dos fontes |
| npm run test:api-client | Sessão, HTTP e recibo de criação |
| npm run test:offline | Concorrência, troca de conta e fila cifrada |
| npm run test:notifications | Agenda, conta e pessoa do lembrete |
| npm run test:core | Fuso, fonte e contraste |
| Maven package | Java, contexto e regras no SQLite |
| npm run test:integration | HTTP, QR, CORS e permissões |
| test_backup.py | Restauração, adulteração e sobrescrita |
| Avaliação nativa e com pessoas | Entrega de avisos, GPS e usabilidade reais |

A cópia imediatamente anterior ao clean code está em work/clean-code/antes-clean-code.zip. A versão das recomendações continua preservada em work/recomendacoes-original. A tabela de recomendações distingue código pronto, configuração externa e avaliação com usuários.

`;
let sintaxe = `# Manual de sintaxe — Cuidados à Mente

Versão 2026-10-12. Aprenda os sinais e palavras usados nas funcionalidades reais. Leia o trecho, a explicação e o exercício; os números indicam as linhas da fonte.

## 1. Como ler um trecho

TypeScript descreve telas, tipos e chamadas do aplicativo. Java implementa a API. SQL descreve consultas e persistência. Python cuida da cópia e restauração. Parênteses recebem argumentos; chaves agrupam blocos ou objetos; colchetes representam listas ou acesso a elementos.

![Do dado à operação protegida](imagens/evolucao-registros.svg)

`;
const conceitos = [
  [
    'Tipos e campos opcionais',
    'src/core/api/cliente-api.ts',
    'export type Registro =',
    17,
    'type descreve o objeto. ? indica campo opcional; | descreve alternativas de status. versao participa da proteção contra edição concorrente.',
    'registros',
  ],
  [
    'Exportar uma função',
    'src/core/notificacoes/horario.ts',
    'export function instanteDoRegistro',
    19,
    'export permite importar a função. string e Date descrevem tipos. Date | null permite recusar um horário inválido. A função completa confere data, hora e fuso.',
    'doses',
  ],
  [
    'async, await e genéricos',
    'src/core/api/cliente-api.ts',
    'export async function requisitarApi',
    15,
    'async devolve uma Promise. await espera uma operação. <T> descreve o tipo esperado da resposta; não valida JSON sozinho. O recibo de criação é preservado ao tentar novamente.',
    'offline',
  ],
  [
    'Efeito e limpeza no React',
    'src/core/notificacoes/observador.tsx',
    'useEffect(() => {',
    20,
    'useEffect conecta a conta à agenda. Sem usuário, limpa avisos. void permite iniciar a Promise sem retornar uma Promise como limpeza do efeito. Leia também a remoção de observadores e timer ao final.',
    'lembretes',
  ],
  [
    'Funções seta e listas',
    'src/app/configuracoes.tsx',
    'const descrever =',
    2,
    '=> define uma função. A lista reúne campos do registro, filter(Boolean) retira valores vazios e join une o texto. O JSX chama a função para comparar a alteração local com o servidor.',
    'historico',
  ],
  [
    'Condição, adaptação e recursão',
    'src/core/tema/paleta.ts',
    "if (typeof item === 'number'",
    19,
    'typeof verifica tipos. && exige duas condições; || aceita uma alternativa. Objetos internos chamam adaptarEstilos novamente para aplicar tema e fonte.',
    'acessibilidade',
  ],
  [
    'Anotações e classes Java',
    'backend/src/main/java/com/cuidadosamente/backend/controlador/EvolucaoController.java',
    '@RestController',
    16,
    '@RestController registra endpoints e @RequestMapping define o prefixo. private limita visibilidade; final preserva a referência. O construtor recebe banco, cuidados e envio de e-mail.',
    'entrada',
  ],
  [
    'Validação numérica',
    'backend/src/main/java/com/cuidadosamente/backend/controlador/EvolucaoController.java',
    'private double numero(',
    11,
    'instanceof exige Number. Double.isFinite rejeita infinito e NaN. Os limites mínimo e máximo recusam valores inválidos; throw interrompe a operação.',
    'gps',
  ],
  [
    'SQL parametrizado',
    'backend/src/main/java/com/cuidadosamente/backend/infraestrutura/BancoDados.java',
    'private void preencherParametros(',
    6,
    'PreparedStatement recebe valores separados do SQL. JDBC começa no índice 1. Isso evita tratar texto digitado como instrução SQL.',
    'registros',
  ],
  [
    'Transação: tudo ou nada',
    'backend/src/main/java/com/cuidadosamente/backend/infraestrutura/BancoDados.java',
    'public void executarTransacao',
    19,
    'Object[]... recebe comandos. setAutoCommit(false) inicia a unidade de trabalho. commit confirma tudo; rollback desfaz as gravações quando ocorre SQLException.',
    'transferencia',
  ],
  [
    'Versão e conflito',
    'backend/src/main/java/com/cuidadosamente/backend/controlador/CuidadosController.java',
    'void exigirVersao(',
    14,
    'A versão precisa ser informada. Ausência gera 428; versão diferente gera 409. Essa comparação preserva a edição feita por outra pessoa.',
    'offline',
  ],
  [
    'Laços e geração de doses',
    'backend/src/main/java/com/cuidadosamente/backend/controlador/EvolucaoController.java',
    'for (LocalDate dia = dataInicial;',
    27,
    'O laço externo avança dias pelo intervalo; o interno percorre horários. UUID identifica cada dose. A transação da função completa grava os registros e seus eventos.',
    'doses',
  ],
  [
    'Permissão antes de ler',
    'backend/src/main/java/com/cuidadosamente/backend/controlador/CuidadosController.java',
    'void exigirPermissao(',
    10,
    'validarAcessoIdoso confere a pessoa e o vínculo. contains exige a ação exata, por exemplo ver_rotinas. FORBIDDEN recusa a operação da conta sem essa permissão.',
    'revisao',
  ],
  [
    'Hash de token e senha',
    'backend/src/main/java/com/cuidadosamente/backend/controlador/CuidadosController.java',
    'String gerarHash(',
    11,
    'SHA-256 transforma um token aleatório em hash e HexFormat o representa em texto. As senhas humanas usam BCrypt em outros métodos.',
    'sessoes',
  ],
  [
    'Chave do cache local',
    'src/core/offline/armazenamento.native.ts',
    'let chave = await SecureStore',
    10,
    'SecureStore guarda a chave local. Bytes aleatórios viram hexadecimal. A seguir, a abertura exige SQLCipher e aplica a chave antes de criar tabelas.',
    'offline',
  ],
  [
    'Datas e fuso',
    'src/core/notificacoes/horario.ts',
    'const formatador =',
    14,
    'Intl.DateTimeFormat obtém partes da data no fuso do plano. A função completa ajusta o instante UTC e recusa horários inexistentes por mudança sazonal.',
    'doses',
  ],
  [
    'Proteção de HTML',
    'src/features/cuidados/relatorios/relatorio-cuidados.ts',
    'const escaparHtml =',
    5,
    'replace converte &, <, > e aspas em entidades HTML. O relatório usa esta função em cada campo digitado. A geração foi extraída da tela mantendo o mesmo conteúdo.',
    'exportacao',
  ],
  [
    'Contexto e streams em Python',
    'scripts/backup.py',
    'def cifrar(',
    10,
    'def declara a função. with fecha arquivos mesmo em falhas. AES-GCM cifra e autentica a cópia; a leitura por blocos limita o uso de memória.',
    'operacao',
  ],
];
sintaxe = sintaxe.replace(
  '## 1. Como ler um trecho',
  `![Do dado ao registro](imagens/evolucao-registros.svg)

Leia o trecho e identifique os sinais. As páginas seguintes ligam cada construção a uma regra do aplicativo e a um exercício.

## 1. Como ler um trecho`,
);
for (const [i, c] of conceitos.entries()) {
  const [nome, arquivo, marca, n, explica, id] = c;
  sintaxe +=
    '## ' +
    (i + 2) +
    '. ' +
    nome +
    '\n\n![Conceito aplicado — ' +
    nome +
    '](imagens/evolucao-' +
    id +
    '.svg)\n\n' +
    (await trecho({ id: 'sintaxe-' + i, arquivo, marca, n, explica })) +
    `

**Exercício:** encontre a função completa no arquivo indicado e identifique entrada, regra de proteção e resultado.

`;
}
sintaxe += `## 20. Glossário rápido

| Termo | Significado neste projeto |
| --- | --- |
| API | Endpoints HTTP que conferem acesso e manipulam dados |
| Token | Credencial aleatória enviada em Authorization |
| UUID | Identificador de conta, dose, arquivo ou evento |
| Hash | Resultado de transformação que evita persistir token bruto |
| Versão | Número incrementado a cada atualização de registro |
| Cache | Cópia de leitura com validade, cifrada no nativo |
| Fila | Alterações locais ainda não confirmadas pelo servidor |
| Transação | Gravações que confirmam ou falham juntas |
| UTC / fuso | Instante global e regra local para exibir/programar horário |
| Retenção | Prazo técnico para conservar e limpar uma categoria de dados |

Não remova validação de acesso para facilitar um teste. Crie contas e dados sintéticos e confira respostas permitidas e recusadas.
`;
usuario += `## 24. Tela do diário no celular

![Diário — tela real da prévia web, dados fictícios](imagens/tela-acompanhamento.png)

A aba marcada indica onde você está. Use Passagem de turno para a próxima equipe e Correção para acrescentar uma retificação. O conteúdo continua pela rolagem; a barra inferior preserva o tamanho de seus botões.

## 25. Tela do histórico

![Histórico — autor, instante e conteúdo sintético](imagens/tela-historico.png)

Escolha a categoria. Antes e Depois permitem conferir a alteração; eventos anteriores à atualização não ganham autoria retroativa.

## 26. Tela de leitura e avisos

![Configurações — preferências na prévia web](imagens/tela-configuracoes.png)

Escolha o tamanho da letra e role para ajustar lembretes. A web exibe as preferências; entrega de aviso exige a build Android/iOS. As capturas usam uma conta de demonstração, sem dados pessoais reais.

`;

const visualPaleta = {
  arquivo: 'src/core/tema/paleta.ts',
  marca: 'export const colors',
  n: 14,
  explica:
    'Estes tokens dão a mesma identidade ao cabeçalho, aos botões e aos cartões. ' +
    'Roxo destaca ações; verde, âmbar e vermelho identificam situações do ' +
    'cuidado, acompanhadas de texto.',
};
const visualLayout = {
  arquivo: 'src/components/layout/estrutura-aplicativo.tsx',
  marca: 'const desktop = width',
  n: 1,
  explica:
    'A largura da janela escolhe o menu lateral a partir de 1024 pixels. Em ' +
    'telas menores, o aplicativo mostra uma barra inferior e o botão Mais.',
};
const visualLeitura = {
  arquivo: 'src/components/layout/estrutura-aplicativo.tsx',
  marca: 'const leituraAmpliada',
  n: 8,
  explica:
    'O tamanho escolhido na conta é combinado com a escala de fonte do aparelho. ' +
    'Com letras ampliadas, uma opção passa para Mais, deixando espaço para ler ' +
    'os rótulos. As permissões continuam filtrando os destinos.',
};
usuario += `## 27. Encontre seu caminho na nova interface

![Painel no celular com dados fictícios](imagens/tela-painel-celular.png)

1. Veja a pessoa acompanhada e o resumo do dia no painel.
2. No celular, use Início, Rotina, Memórias e Perfil. Toque em Mais para acessar as demais telas. Com letras maiores, algumas opções passam ao menu.
3. No computador, use o menu lateral. O conteúdo fica centralizado e tem a mesma ordem do celular.

![Painel no computador com dados fictícios](imagens/tela-painel-desktop.png)

O perfil idoso prioriza Emergência. A cor roxa indica a área selecionada. Os cartões mostram também o nome do estado, para que você não precise interpretar apenas uma cor.

`;
aula +=
  `## 23. Identidade visual e navegação adaptável

![Navegação lateral e conteúdo centralizado](imagens/tela-painel-desktop.png)

` +
  (await trecho(visualPaleta)) +
  '\n\n' +
  (await trecho(visualLayout)) +
  '\n\n' +
  (await trecho(visualLeitura)) +
  `

**Experimente:** abra o painel em uma janela estreita e depois larga. Em Configurações, salve letras de 160% e confira a barra inferior.

`;
sintaxe +=
  `## 21. Condições que adaptam a interface

![Navegação inferior no celular](imagens/tela-painel-celular.png)

` +
  (await trecho(visualLayout)) +
  '\n\n' +
  (await trecho(visualLeitura)) +
  `

O operador >= compara dois números. O operador * combina as escalas. A expressão condição ? valorA : valorB escolhe qual lista usar; a lista escolhida ainda passa pelo filtro de permissões.

`;

usuario += `## 28. Contas preenchidas e acesso por senha

As três contas do conjunto local usam o banco persistente backend/data/cuidados.db e compartilham o mesmo cadastro fictício: Marina Costa (responsável), Lucas Martins (cuidador) e Antônio Costa (idoso). As credenciais são entregues separadamente no arquivo local work/contas-app/ACESSOS.md; não fazem parte deste manual.

1. Na entrada, escolha o perfil correspondente à conta.
2. Para o idoso, toque em Entrar com e-mail e senha. O QR permanece disponível.
3. Confira a pessoa acompanhada antes de abrir a rotina, os medicamentos, as consultas ou as memórias.
4. Explore o diário e os planos recorrentes pela conta adulta. O idoso acessa apenas os dados e ações permitidos ao seu perfil.

Os nomes, contatos, documentos, consultas, medicamentos e relatos deste conjunto são fictícios. Os registros ficam persistidos após fechar ou reiniciar o aplicativo. Consulte CONTAS_PREENCHIDAS.md para ver a quantidade de dados.

`;
aula += '## 24. Login do idoso preparado pelo proprietário\n\n';
aula +=
  (await trecho({
    arquivo: 'backend/src/main/java/com/cuidadosamente/backend/controlador/CuidadosController.java',
    marca: 'if ("idoso".equals(linhas.getFirst().get("tipo")))',
    n: 20,
    explica:
      'A API só permite senha quando este acesso foi configurado. Depois exige ' +
      'vínculo com uma pessoa e verifica se a autorização continua válida. O tipo ' +
      'da conta e suas permissões permanecem os mesmos; o aceite dos documentos ' +
      'não é registrado pelo login.',
  })) +
  `

A rota PUT /idosos/ID/acesso-senha é exclusiva do proprietário. Ela valida credenciais, guarda o hash BCrypt, invalida sessões e códigos anteriores e registra um evento sem senha. A alternativa QR continua disponível.

`;

aula += `## 25. Como ler o código após o clean code

As funcionalidades, rotas, permissões e dados continuam iguais. A refatoração separou declarações, explicitou blocos e substituiu abreviações por nomes como estilosDaTela, ocupado e usuarioId.

BancoDados inicia em quatro etapas: criarTabelasIniciais, migrarPessoasERegistros, migrarSessoesEVinculos e prepararContinuidadeEPrivacidade. Elas executam as mesmas instruções na mesma ordem. O HTML de impressão agora fica em src/features/cuidados/relatorios/relatorio-cuidados.ts, separado da obtenção e do compartilhamento na tela.

Os limites do cache e da agenda receberam nomes, e identificadorDoLembrete reúne a construção do mesmo identificador antes repetida. Leia CLEAN_CODE_2026-10-12.md e GUIA-CODIGO.md para manter o padrão e conferir os testes.

`;
sintaxe += `## 22. Convenções de legibilidade

Uma declaração por instrução facilita localizar estados e variáveis. Blocos com chaves deixam visíveis os limites de condições e laços. Nomes descrevem a finalidade: estilosDaTela, ocupado, banco e usuarioId.

Uma constante como MAXIMO_ALTERACOES_PENDENTES mantém o mesmo limite de 100 itens, mas explica o significado do número. Uma função como gerarHtmlRelatorio concentra uma responsabilidade. As chaves de JSON, SQL, rotas e componentes públicos permanecem compatíveis.

Use npm run format para formatar e npm run format:check para conferir o padrão. Tipos, lint e testes de comportamento continuam necessários depois de uma mudança.

`;
usuario += `## 29. Atualização de organização do código

O clean code de 12/10/2026 reorganizou os fontes e atualizou os exemplos destes manuais. Os passos, telas, permissões e funcionalidades de uso permanecem os mesmos.

`;

await gravar('docs/MANUAL_USUARIO.md', usuario);
await gravar('docs/MANUAL-AULA.md', aula);
await gravar('docs/MANUAL-SINTAXE.md', sintaxe);
console.log('Três manuais atualizados; ' + recursos.length + ' figuras SVG e trechos numerados.');
