# Entenda as pastas

## Mapa do projeto

```text
CUIDADOS-A-MENTE/
├── README.md                         Leia primeiro
├── Cuidados-a-Mente.code-workspace    Abra no VS Code
├── src/
│   ├── app/                          Telas e endereços de navegação
│   ├── components/                   Componentes compartilhados
│   ├── contexts/                     Sessão do usuário
│   ├── services/                     Comunicação com a API
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
| Tela inicial | `src/components/login.jsx` |
| Login | `src/app/login/index.tsx` |
| Painel principal | `src/app/painel.tsx` |
| Cadastros | `src/app/cadastro/` e `src/components/cadastro_responsavel.tsx` |
| Pessoas acompanhadas | `src/app/pessoas.tsx` |
| Consultas, doses, atividades e memórias | `src/components/registros-screen.tsx` |
| Botões, campos e estilo das telas integradas | `src/components/app-ui.tsx` |
| Sessão do usuário | `src/contexts/AuthContext.tsx` |
| Endereço e chamadas da API | `src/services/api.ts` |

As classes Java ficam em `backend/src/main/java/com/Cuidados_A_Mente/backend/`:

| Classe | Responsabilidade |
| --- | --- |
| BackendApplication | Iniciar o servidor |
| ApiController | Receber requisições, validar campos e verificar acesso |
| Database | Criar tabelas e executar operações SQLite |
| ApiErrors | Devolver mensagens de erro |
| WebConfig | Configurar origens permitidas para o frontend |

Fluxo dos dados: **tela → api.ts → API Java → SQLite → API Java → tela**.

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
