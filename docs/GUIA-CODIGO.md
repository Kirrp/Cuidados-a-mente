# Guia do código atual — 2026-10-12

Comece pelo [manual-aula](MANUAL-AULA.md), que mostra vinte fluxos, figuras e trechos reais numerados. O [manual de sintaxe](MANUAL-SINTAXE.md) explica tipos, async, React, SQL, Java e backup. O [manual do usuário](MANUAL_USUARIO.md) traz os caminhos na interface e exemplos de código opcionais.

| Parte | Arquivo | Responsabilidade |
| --- | --- | --- |
| Sessão | src/core/autenticacao/contexto-autenticacao.tsx | Entrada, aceite, saída e limpeza local |
| Cliente API | src/core/api/cliente-api.ts | HTTP, token, erros e sincronização |
| Dados offline | src/core/offline/armazenamento.native.ts | Cache e fila SQLCipher por sessão |
| Agenda | src/core/notificacoes/lembretes.native.ts | Reconciliar avisos locais e preferências |
| Fuso | src/core/notificacoes/horario.ts | Converter horário do plano em instante |
| Acompanhamento | src/app/acompanhamento.tsx | Diário, história, contatos, doses, administração e exportação |
| Relatório para impressão | src/features/cuidados/relatorios/relatorio-cuidados.ts | Gerar o mesmo HTML e escapar os campos digitados |
| Configurações | src/app/configuracoes.tsx | Leitura, avisos, offline, sessões, convites e GPS pontual |
| Privacidade | src/features/cuidados/components/central-privacidade.tsx | Pedidos, protocolos e consentimentos |
| API central | backend/.../controlador/CuidadosController.java | Contas, pessoas, permissões e registros versionados |
| Evolução | backend/.../controlador/EvolucaoController.java | Fluxos novos reutilizando as mesmas verificações |
| Mídia | backend/.../controlador/MidiaController.java | Upload, download e eliminação privados |
| Operação | backend/.../controlador/OperacaoController.java | Métricas agregadas e resposta a pedidos |
| Banco | backend/.../infraestrutura/BancoDados.java | Migrações incrementais, SQL parametrizado e transações |
| E-mail | backend/.../infraestrutura/EnvioEmail.java | Resend configurado somente no servidor |
| Retenção | backend/.../configuracao/ManutencaoDados.java | Limpeza de expiração, posição, auditoria e órfãos |
| Backup | scripts/backup.py | Pacote cifrado e restauração em pasta nova |

As pastas originais src/features/autenticacao, cuidados, idoso e responsavel continuam organizando telas e ações antigas. As rotas de compatibilidade em src/app redirecionam aos fluxos compartilhados. A cópia aninhada CUIDADOS-A-MENTE não é a raiz desta implementação.

Para mudar uma função, leia o método completo, sua permissão e os testes. Nunca remova autorização para fazer o frontend “funcionar”. Alterações em registros precisam enviar versao; o servidor define autoria e dados imutáveis de contexto. Use npm run docs:manuals para atualizar trechos quando mover linhas.

## Padrão de leitura e manutenção

O clean code de 12/10/2026 preservou o comportamento. Estados React ficam em declarações separadas; condições e laços usam blocos explícitos. `estilosDaTela`, `ocupado`, `usuarioId` e `banco` substituem abreviações nos respectivos contextos. Rotas, chaves de JSON, tabelas, permissões e interfaces públicas mantêm os mesmos contratos.

`BancoDados` inicia em quatro métodos privados, executados nesta ordem: `criarTabelasIniciais`, `migrarPessoasERegistros`, `migrarSessoesEVinculos` e `prepararContinuidadeEPrivacidade`. Essa separação preserva a sequência do esquema, a compatibilidade com bancos antigos e as transações existentes.

`gerarHtmlRelatorio` recebe os dados já autorizados e o período; a tela continua responsável por buscar, imprimir ou compartilhar. `identificadorDoLembrete` monta o mesmo identificador usado na comparação e no agendamento. Os limites de agenda e cache têm constantes com nomes e unidades claros.

Use `npm run format:check` e `npm run format` com as versões fixadas no lockfile. Para Python, use Black 26.10.1: `python -m black --check scripts` e `python -m black scripts`; a configuração está em `pyproject.toml`. PowerShell, shell e arquivos de serviço mantêm a sintaxe de suas ferramentas. O formatter não substitui tipos, lint, compilação ou testes.

Veja os detalhes e a evidência de validação em [Clean code](CLEAN_CODE_2026-10-12.md). A cópia dos fontes e manuais anterior a esta refatoração está em `work/clean-code/antes-clean-code.zip`.
