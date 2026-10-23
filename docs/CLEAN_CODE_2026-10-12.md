# Clean code — 12/10/2026

Esta entrega reorganiza o código para facilitar leitura e manutenção, preservando as funcionalidades existentes. A raiz ativa do projeto foi revisada: aplicativo, componentes, serviços, backend, testes, scripts e configurações. Os manuais foram atualizados para acompanhar os novos nomes, responsabilidades e números de linha.

## Por que foi necessário

Havia declarações de vários estados na mesma linha, condições e laços compactados, nomes abreviados sem contexto e textos extensos misturados com a lógica das telas. Isso dificultava identificar a sequência das operações, as regras de acesso e o tratamento de erros. O problema tratado nesta entrega é a legibilidade; as correções funcionais da revisão anterior estão documentadas separadamente em [REVISAO_2026-10-12.md](REVISAO_2026-10-12.md).

No conjunto de fontes comparado com a cópia anterior, as linhas com mais de 120 caracteres passaram de 1.227 para 82. Esse número é uma medida auxiliar: expressões, comentários e dados que precisam permanecer juntos podem exceder o limite.

## O que mudou

| Parte | Organização aplicada | Motivo |
| --- | --- | --- |
| TypeScript, TSX e JavaScript | Indentação consistente, declarações separadas e blocos explícitos nas condições e nos laços | Permitir acompanhar cada decisão e operação |
| Estados e variáveis | Nomes como `estilosDaTela`, `ocupado`, `preferencias`, `usuarioId`, `banco` e `autorizacao` nos respectivos contextos | Explicar a função da variável sem depender de abreviações |
| Java | Declarações separadas, nomes locais claros, SQL e textos distribuídos em linhas legíveis | Facilitar a leitura das consultas e validações mantendo seus valores |
| Inicialização do banco | Quatro métodos privados chamados na ordem original | Distinguir tabelas iniciais e etapas de migração |
| Relatório de acompanhamento | HTML e escape de campos reunidos em `gerarHtmlRelatorio` | Separar a geração do documento da busca, impressão e compartilhamento |
| Visibilidade das áreas | `podeMostrarArea` explicita a decisão para cada área | Tornar as permissões da interface mais fáceis de conferir |
| Lembretes | `identificadorDoLembrete` reúne a montagem do identificador; limites ganham nomes | Evitar repetir a mesma composição durante comparação e agendamento |
| Armazenamento offline | Constantes identificam validade, tamanho e limite da fila | Explicar as unidades e os limites já existentes |
| Python, PowerShell e shell | Formatação, blocos e comandos distribuídos em linhas | Facilitar manutenção dos scripts de execução, testes e backup |
| Configurações | Formatação consistente de JSON, YAML e XML | Facilitar a revisão dos valores configurados |
| Gerador dos documentos legais | Leitura das declarações como dados pela árvore sintática TypeScript | Continuar gerando as mesmas cópias após a formatação dos objetos e strings |

Os métodos de inicialização do banco são `criarTabelasIniciais`, `migrarPessoasERegistros`, `migrarSessoesEVinculos` e `prepararContinuidadeEPrivacidade`. As instruções continuam na mesma sequência. O novo módulo de relatório está em `src/features/cuidados/relatorios/relatorio-cuidados.ts`.

Os limites permanecem iguais: cache de 15 minutos, 500.000 caracteres por item e 5.000.000 no total, fila de 100 alterações, agenda de 12 horas e máximo de 50 lembretes. Rotas, payloads, chaves de JSON, tabelas, permissões, transações e textos apresentados ao usuário preservam seus contratos.

Não houve atualização das dependências de execução. Foram adicionadas apenas ferramentas de formatação em `devDependencies`; as versões dos pacotes anteriormente presentes no lockfile foram preservadas. A documentação versionada do Expo SDK 57 foi consultada antes das alterações.

## Como manter o padrão

As configurações ficam em `.editorconfig`, `.prettierrc.json`, `.prettierignore` e `pyproject.toml`. As ferramentas têm versões fixadas: Prettier 3.9.10, prettier-plugin-java 2.11.0, @prettier/plugin-xml 3.4.2 e Black 26.10.1 para Python.

```powershell
npm run format:check
npm run format
python -m black --check scripts
python -m black scripts
npm run docs:manuals
```

Depois de alterar linhas usadas nos exemplos, regenere os manuais e os PDFs conforme [COMO_EXECUTAR.md](COMO_EXECUTAR.md). A formatação não substitui a verificação de tipos, o lint ou os testes das regras modificadas.

O gerador `docs:legal` agora lê apenas os tipos de dados utilizados nos documentos: objetos, listas, strings e concatenações de strings. Ele não executa a fonte. Os textos e a versão jurídica `2026-10-11` permanecem iguais.

## Evidências de preservação

A cópia anterior dos fontes, configurações e manuais está em `work/clean-code/antes-clean-code.zip`, acompanhada de hashes em `manifesto-antes.json`. A comparação automatizada cobre a estrutura do código JavaScript/TypeScript após emissão, normalizando as renomeações e mudanças de formatação. As extrações de responsabilidades tiveram conferência específica.

- 87 arquivos JavaScript/TypeScript comparados sem divergência estrutural após normalização.
- HTML do relatório idêntico ao anterior, byte a byte, com dados sintéticos contendo aspas, quebras de linha e marcação HTML.
- Imports Java preservados; árvore sintática dos scripts Python operacionais e de testes preservada.
- Conteúdo XML do Maven, configurações do aplicativo e tokens dos scripts PowerShell preservados.
- Documentos legais gerados idênticos aos anteriores, byte a byte.
- Revisão independente dos fluxos do aplicativo, da sequência do banco e dos scripts operacionais.

Essas comparações complementam os testes; não constituem uma prova de todos os comportamentos possíveis.

## Validação executada

| Verificação | Resultado |
| --- | --- |
| `npm run format:check` | Fontes e configurações no padrão |
| Black `--check scripts` | Os quatro scripts Python seguem o padrão |
| `npm run typecheck` | Sem erros |
| `npm run lint` | Sem erros ou avisos |
| `npm run test:api-client` | 8 verificações aprovadas |
| `npm run test:notifications` | 6 verificações aprovadas |
| `npm run test:offline` | 9 verificações aprovadas |
| `npm run test:core` | Fuso, mudança sazonal, fontes e 26 pares de contraste aprovados |
| Maven `package` com Java 21 | Build aprovado; 15 testes JUnit, nenhuma falha |
| `scripts/test-backend-local.ps1` | 92 verificações aprovadas |
| `npm run test:integration` | Integração HTTP, permissões, contas, QR, localização, CORS e persistência aprovadas |
| `scripts/tests/test_backup.py` | 2 testes e seus cenários de restauração e recusa aprovados |
| Exportação Expo web | 38 rotas geradas |
| `npm run docs:legal` | Cópias legais preservadas |
| Manuais | Trechos regenerados; três PDFs renderizados e conferidos visualmente |

Os testes usaram dados sintéticos e bancos temporários. Os testes de notificações e offline simulam as integrações nativas. Não houve execução em aparelhos Android/iOS nesta refatoração; entrega física dos avisos, SQLCipher/SecureStore e GPS continuam com o roteiro de validação descrito nos guias.

## Documentação atualizada

README, organização, guia do código e instruções de execução explicam o padrão e os módulos extraídos. O manual-aula e o manual de sintaxe usam os nomes e números de linha atuais. O manual do usuário registra a atualização da organização do código e conserva os mesmos passos de uso. Os três PDFs correspondentes ficam em `output/pdf`.

Os PDFs desta entrega têm 27 páginas no manual-aula, 24 no manual de sintaxe e 34 no manual do usuário. Todas foram renderizadas e inspecionadas visualmente. As imagens temporárias de conferência foram removidas após a validação.

O banco e as mídias reais, os segredos, a cópia histórica aninhada e a implantação externa não foram alterados nesta entrega.
