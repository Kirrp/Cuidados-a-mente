# Alterações e verificações — atualizado em 2026-10-12

## Clean code — 2026-10-12

A refatoração de leitura e manutenção está em [CLEAN_CODE_2026-10-12.md](CLEAN_CODE_2026-10-12.md). Inclui formatação dos fontes, nomes mais claros, separação da inicialização do banco, geração do relatório em módulo próprio e constantes dos limites existentes. Os contratos e comportamentos foram preservados; os manuais e seus trechos foram regenerados.

Validação desta entrega: tipos, lint e formatação aprovados; 15 testes JUnit, 92 verificações locais do backend, suítes do cliente API, notificações, offline, núcleo, backup e integração HTTP aprovadas; 38 rotas web exportadas. As comparações com a cópia anterior e os limites da validação estão no relatório de clean code. As seções seguintes registram entregas anteriores.

## Revisão de problemas — 2026-10-12

Foi realizada uma nova revisão do cliente, armazenamento offline, notificações, telas, backend e scripts. O relatório [Revisão de problemas](REVISAO_2026-10-12.md) explica cada falha confirmada e por que sua correção era necessária, incluindo isolamento entre contas/pessoas, duplicação após perda de conexão, revogação de localização, navegação e restauração de mídia.

As novas regressões estão em `scripts/test-api-client.mjs`, `scripts/test-offline.mjs`, `scripts/test-notifications.mjs`, `scripts/tests/TesteBackendLocal.java` e `scripts/tests/test_backup.py`. Os testes usam dados sintéticos. A revisão não alterou o banco persistente, as mídias reais nem a implantação externa.

As recomendações autorizadas foram aplicadas à raiz do projeto. A cópia histórica interna permanece como referência; os fontes anteriores desta entrega estão em `work/recomendacoes-original`. Não foram usados os bancos reais nos testes.

## Mudanças

Frontend: telas de acompanhamento, configurações, direitos e recuperação; recorrência, diário, contatos e histórico; preferência de fonte e avisos; captura explícita de GPS; upload privado/exportação; estados ARIA e menu rolável; cache SQLCipher e fila de registros com conflitos.

Backend: migrações aditivas, autoria transacional, versão/idempotência, convites/revisão/transferência, códigos de e-mail, sessões/limites, consentimentos/protocolos, ponto real autenticado, mídia separada, métricas restritas e limpeza de dados vencidos.

Operação: Dockerfiles/Compose/Caddy, exemplos de variáveis, backup cifrado com restauração, timer e destinos escolhidos. Esses arquivos foram revisados, mas a implantação externa não foi executada.

Documentação: três manuais reescritos com 20 diagramas, telas sintéticas, linhas extraídas do código e explicações, mais guias de API/execução/operação/acessibilidade. Os PDFs foram gerados e inspecionados visualmente.

## Verificações executadas

| Verificação | Evidência/resultado |
| --- | --- |
| TypeScript | `npm run typecheck` sem erros |
| Lint React/Expo | `npm run lint` sem erros nem avisos |
| Maven/Java 21 | Build/package com dez testes aprovados, usando repositório Maven local |
| Integração HTTP | `npm run test:integration` aprovado: contas, QR, permissões, CORS, versões e reinício em SQLite temporário |
| Backup | `scripts/tests/test_backup.py` aprovado: restaura SQLite/mídia, recusa senha errada, adulteração e destino existente |
| Fusos/fontes/contraste | `npm run test:core` aprovado: São Paulo, mudança sazonal, horário inexistente, fonte sem ampliar padding e 26 pares de texto |
| Web | `expo export --platform web` concluído; navegação/conteúdo/estados conferidos com conta sintética local |
| Manuais | Figuras e números de linhas gerados dos fontes; PDFs renderizados para inspeção |

Na prévia em 375 × 812, foi corrigida a compressão da barra inferior e conferido o estado selecionado das abas. A abertura direta de Configurações passou a esperar a restauração da sessão; respostas tardias de perfil não restauram a conta após saída. As cinco capturas atuais nos manuais usam somente dados sintéticos.

Os testes Java adicionais cobrem cadastro mínimo/autorização, aceite/expiração/retirada de convite, histórico/autoria/versão/idempotência, cancelamento de doses, diário/contatos/exportação autorizada, hash/uso único de código/sessões/limites, GPS/consentimento/direitos e transferência/mídia.

Os comandos podem exigir rede para obter dependências e Java 21 configurado. O cache Maven histórico foi usado só para dependências durante a validação; não é uma exigência da arquitetura.

## Ainda precisam ser avaliados no ambiente real

- Compilação própria Android/iOS: permissão e entrega de avisos com aparelho fechado, reinício, economia de bateria, fuso, limpeza de sessão e agenda de 12 horas.
- SQLCipher/SecureStore: perda de conexão, fila, reinício, conflitos e revogação no aparelho.
- GPS em dispositivo vinculado: consentimento, precisão, permissão, captura voluntária, retirada e ausência de coleta em segundo plano.
- TalkBack/VoiceOver, teclado, maior tamanho do sistema e escala de fonte; atividades com pessoas idosas e cuidadores, seguindo ACESSIBILIDADE.md.
- Domínio, HTTPS, Resend real, containers, VM, tarefa de backup e restauração operacional. Sem contas/credenciais, não há envio nem implantação ativa.

A identidade e o canal de atendimento do responsável pelos dados continuam pendentes de informação real. O aplicativo registra declaração de autorização; isso não verifica poderes jurídicos do representante. Use a matriz em RECOMENDACOES.md para avaliar a entrega.

## Atualização visual

Paleta central com roxo intenso, tipografia nativa, cartões e campos consistentes, painel com hierarquia clara e navegação adaptada: menu lateral na web larga, barra inferior e Mais no celular. O tamanho do texto considera tanto a preferência da conta quanto a escala do aparelho.

Verificações: TypeScript e lint sem erros/avisos; exportação das 38 rotas web; 26 pares de texto aprovados em contraste; revisão visual em 320, 375 e 1280 px, tema escuro e fonte de 160%, com dados fictícios. Capturas dos manuais atualizadas e duas novas imagens do painel. A conferência visual foi na prévia web; aparelhos físicos seguem no roteiro de acessibilidade.

Também foram conferidos o retorno de Configurações e Acompanhamento ao painel e o destaque da pasta selecionada em Memórias. Os três PDFs finais têm 25, 23 e 31 páginas (aula, sintaxe e usuário), renderizadas e inspecionadas; as referências de arquivo ficam junto aos trechos de código.


## Contas preenchidas e acesso por senha do idoso

Foram criadas, por solicitação do usuário, três contas fictícias no banco persistente `backend/data/cuidados.db`, com um responsável, um cuidador e um idoso vinculados ao mesmo cadastro. A carga usa a API para contas, vínculos, mídia e verificação dos três perfis; os registros extensos foram importados por transações no mesmo SQLite, com autoria e indicação de importação fictícia. Um backup do banco foi salvo antes da carga.

Resultado conferido na API e no SQLite: 704 rotinas, 504 registros de medicamentos demonstrativos, 32 consultas, 60 memórias, seis planos recorrentes, 84 anotações, 12 ilustrações privadas e 1.687 eventos de histórico. O login do idoso por e-mail e senha foi conferido na interface. O resumo sem credenciais está em `docs/CONTAS_PREENCHIDAS.md`; as senhas ficam somente em arquivo local ignorado.

O acesso por senha do idoso é opcional, configurável somente pelo proprietário e protegido por BCrypt, vínculo e consentimento. Não libera cadastro alheio nem ações de adulto. Desconexão, transferência e retirada de consentimento revogam esse acesso. QR continua disponível.

Validação desta alteração: TypeScript e lint sem erros; exportação das 38 rotas web; build Maven com 11 testes aprovados, incluindo o teste de autorização e revogação da senha do idoso; integração HTTP aprovada em banco temporário. Os manuais passaram a explicar o novo login e as contas preenchidas, com exemplos extraídos do código atual. Os testes automatizados continuam usando bancos temporários; a carga persistente descrita acima foi a ação expressamente solicitada pelo usuário.

Os PDFs desta entrega têm 26 páginas no manual-aula, 23 no manual de sintaxe e 32 no manual do usuário. Todas as páginas foram renderizadas e conferidas; a correção das quebras de linha do novo capítulo foi renderizada novamente.


## Correção da barra inferior — 2026-10-12

Problema reproduzido na web em tamanho de celular: ao abrir Rotina a partir do início, Rotina e Memórias sumiam temporariamente da navegação principal. EstruturaAplicativo reiniciava as permissões com uma lista vazia a cada foco; cada instância da tela também possuía uma lista independente.

As permissões usadas somente para montar a navegação agora são compartilhadas pelo contexto de autenticação e mantidas durante a nova consulta. Respostas antigas são descartadas por versão. Logout, nova autenticação e exclusão da conta limpam o estado; o identificador da conta impede exibir permissões de outro usuário. Uma resposta 401/403 limpa a lista; uma falha de rede preserva os últimos atalhos. As operações continuam sendo autorizadas pelo backend.

Validação: TypeScript e lint sem erros; exportação das 38 rotas web; navegação Início → Rotina pelo atalho do painel e pela barra, Memórias e Perfil, em 375 × 812 e 320 × 640; cinco botões preservados durante o carregamento e barra inteiramente dentro da janela. A troca de responsável para idoso exibiu a lista própria do idoso, sem reutilizar os destinos adultos. Conferência feita no navegador em tamanho de celular; não houve execução em aparelho Android/iOS nesta correção. Capturas e cópias dos dois fontes anteriores estão em work/correcao-navegacao.
