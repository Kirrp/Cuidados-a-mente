# Nomes do código

O código principal usa nomes em português que descrevem a ação ou o dado. Este
resumo ajuda a acompanhar a explicação do projeto e a encontrar cada parte.

## Arquivos

| Nome atual | O que contém |
| --- | --- |
| `src/features/autenticacao/components/formulario-cadastro.tsx` | Cadastro de responsável ou cuidador em cinco etapas. |
| `src/features/cuidados/screens/cadastro-e-acesso-idoso.tsx` | Cadastro do idoso e criação ou revogação do QR Code. |
| `src/features/cuidados/components/registros-compartilhados.tsx` | Interface comum de consultas, medicamentos, rotinas e memórias. |
| `src/features/cuidados/hooks/use-cuidados.ts` | Carregamento das pessoas e registros da tela. |
| `backend/src/main/java/com/cuidadosamente/backend/controlador/CuidadosController.java` | Rotas da API, autorização e validação. |
| `backend/src/main/java/com/cuidadosamente/backend/infraestrutura/BancoDados.java` | Conexão com o SQLite e operações SQL. |

Os arquivos dentro de `src/app` continuam com os mesmos nomes porque o Expo
Router transforma esses nomes nos endereços do aplicativo. Os nomes das tabelas,
das rotas HTTP e dos campos JSON também continuam iguais para preservar os dados
e o contrato entre frontend e backend.

## Fluxos principais

| Nome atual | Função |
| --- | --- |
| `requisitarApi` | Envia um pedido do aplicativo para o backend. |
| `useAutenticacao` | Dá acesso ao usuário conectado e às ações de sessão. |
| `useCuidados` | Carrega pessoas e registros; devolve `pessoas`, `pessoa`, `pessoaId`, `registros`, `carregando`, `erro`, `selecionarPessoa` e `carregar`. |
| `aplicarMascara` | Formata CPF, telefone ou data durante a digitação. |
| `dataValida` | Confere se uma data informada realmente existe. |
| `avancarEtapa` | Valida os campos visíveis e avança no cadastro. |
| `abrirFormulario` | Abre um cadastro ou edição com os campos preenchidos. |
| `gerarCodigoQr` | Pede ao backend um novo código para o idoso. |
| `salvarRegistro` | Envia a criação ou edição de uma consulta, dose, rotina ou memória. |
| `alternarConclusao` | Marca um registro como concluído ou pendente. |

## Backend

| Nome atual | Função |
| --- | --- |
| `gerarQr`, `entrarComQr`, `revogarQr` | Criam, consomem e revogam o acesso por QR. |
| `listarIdosos`, `cadastrarIdoso`, `atualizarIdoso` | Consultam e alteram os cadastros de idosos. |
| `listarRegistros`, `criarRegistro`, `atualizarRegistro`, `excluirRegistro` | Operações dos registros de cuidado. |
| `usuarioDaSessao` | Encontra a conta de um token válido. |
| `usuarioAutorizado` | Verifica a sessão e o aceite dos documentos atuais. |
| `exigirAdulto` | Restringe uma ação a responsável ou cuidador. |
| `validarAcessoIdoso` | Confere se a conta pode acessar aquele idoso. |
| `buscarRegistro` | Busca um registro dentro dos dados autorizados. |
| `consultar`, `executar`, `executarTransacao` | Leem e alteram o SQLite pela classe `BancoDados`. |

Os nomes anteriores em inglês, como `generateQr`, `sessionOwner`, `query` e
`transaction`, aparecem apenas em explicações antigas. Para ler o código atual,
use os nomes desta página.
