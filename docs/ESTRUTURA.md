# Entenda as pastas

## Mapa do projeto

```text
CUIDADOS-A-MENTE/
├── README.md                         Leia primeiro
├── Cuidados-a-Mente.code-workspace    Abra no VS Code
├── src/
│   ├── app/                          Telas e endereços de navegação
│   ├── components/                   Interface, layout e navegação compartilhados
│   ├── core/                         API e sessão do usuário
│   ├── features/                     Código agrupado por área funcional
│   │   ├── autenticacao/             Login, cadastro e acesso por QR Code
│   │   ├── cuidados/                 Registros e pessoas acompanhadas
│   │   ├── idoso/                    Telas exclusivas do idoso
│   │   └── responsavel/              Telas exclusivas do responsável
│   ├── legal/                        Conteúdo legal exibido no aplicativo
│   ├── shared/                       Funções compartilhadas sem interface
│   └── constants/                    Cores e medidas
├── assets/
│   ├── images/                       Logos, perfis e ícones existentes
│   ├── illustrations/                Ilustrações de consultas e cuidados
│   └── expo.icon/                    Ícone usado no iOS
├── backend/
│   ├── src/main/java/                Servidor e regras da API
│   ├── src/main/resources/           Configuração do servidor
│   ├── src/test/                     Testes Java
│   ├── data/                         Banco SQLite: preservar!
│   ├── .mvn/                         Configuração do Maven
│   ├── pom.xml                       Bibliotecas e compilação
│   └── mvnw / mvnw.cmd               Inicializadores do Maven
├── docs/                             Explicações
├── scripts/                          Inicialização e testes
├── .vscode/                          Preferências e tarefas do editor
├── backups/                          Histórico compactado
├── .local/                           Java e dependências locais
└── work/                             Temporários
```

## Onde editar

| Quero alterar… | Local |
| --- | --- |
| Tela inicial e escolha de perfil | `src/features/autenticacao/components/escolha-perfil.tsx` |
| Login e acesso por QR Code | `src/features/autenticacao/screens/` |
| Cadastro em etapas | `src/features/autenticacao/components/formulario-cadastro.tsx` |
| Painel principal | `src/features/cuidados/screens/painel.tsx` |
| Pessoas acompanhadas | `src/features/cuidados/screens/pessoas-acompanhadas.tsx` |
| Consultas, doses, atividades e memórias | `src/features/cuidados/components/registros-compartilhados.tsx` |
| Área exclusiva do idoso | `src/features/idoso/screens/` |
| Relatórios do responsável | `src/features/responsavel/screens/` |
| Botões, campos e estilos | `src/components/ui/` |
| Cabeçalho, menu e abas | `src/components/layout/estrutura-aplicativo.tsx` |
| Sessão do usuário | `src/core/autenticacao/contexto-autenticacao.tsx` |
| Endereço e chamadas da API | `src/core/api/cliente-api.ts` |

As classes Java ficam em `backend/src/main/java/com/cuidadosamente/backend/`:

| Classe | Responsabilidade |
| --- | --- |
| `CuidadosAMenteApplication` | Iniciar o servidor |
| `controlador/CuidadosController` | Receber requisições, validar campos e verificar acesso |
| `infraestrutura/BancoDados` | Criar tabelas e executar operações SQLite |
| `erros/TratadorErrosApi` | Devolver mensagens de erro |
| `configuracao/ConfiguracaoWeb` | Configurar origens permitidas para o frontend |

Fluxo dos dados: **tela → cliente-api.ts → CuidadosController → BancoDados → SQLite → tela**.

Os arquivos em `src/app/` são intencionalmente pequenos: o Expo Router usa seus
nomes como URLs. Eles encaminham cada rota para a implementação organizada em
`src/features/`, preservando os endereços antigos do aplicativo.

## Arquivos da raiz

- `package.json`: bibliotecas e comandos.
- `package-lock.json`: versões exatas; preserve no projeto.
- `app.json`: nome, ícones e configuração Expo.
- `tsconfig.json`: verificação do TypeScript.
- `metro.config.js`: empacotamento do aplicativo; ignora ferramentas e backups.
- `.env.example`: modelo do endereço da API; copie para `.env` se necessário.
- `.gitignore`: arquivos que não devem entrar no Git.
- `LICENSE`: licença original.
- `AGENTS.md`, `CLAUDE.md` e `.claude/`: instruções/configurações existentes de assistentes.

## Pastas que exigem cuidado

**backend/data/** contém os dados reais. **.local/tools/** contém o Java que permite executar o backend neste computador.
Os ZIPs em **backups/** preservam versões anteriores e não são executados pelo aplicativo.

## Pastas recriáveis

| Pasta | Como recriar |
| --- | --- |
| node_modules | `npm ci` |
| .expo | Iniciar o Expo |
| backend/target | `npm run backend:build` |
| .local/maven | Compilar o backend com acesso à internet |
| work | Os testes recriam seus temporários |
| dist | `npx expo export --platform web` |

O Java portátil e o cache Maven foram mantidos para evitar downloads desnecessários.



## Acréscimos de 11/10/2026

`src/core/offline` protege o cache e a fila nativos; `src/core/notificacoes` calcula e programa avisos. `acompanhamento.tsx`, `configuracoes.tsx`, `privacidade.tsx` e `recuperar-acesso.tsx` organizam os novos fluxos. No backend, `EvolucaoController`, `MidiaController`, `OperacaoController` e `ManutencaoDados` ampliam as regras e operação. `deploy/` prepara a publicação e cópias; `scripts/backup.py` restaura sem sobrescrever destinos. `scripts/atualizar-manuais.mjs` gera diagramas e exemplos dos fontes. Veja GUIA-CODIGO.md para o mapa completo.
