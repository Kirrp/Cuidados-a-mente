# Como executar e testar

## Neste computador

Abra `Cuidados-a-Mente.code-workspace` no VS Code.

Se `node_modules/` não existir, execute na raiz:
```powershell
npm ci
```

Depois use **Terminal → Executar Tarefa → Iniciar aplicativo completo**, ou execute em dois terminais:

| Terminal | Comando |
| --- | --- |
| Backend | `npm run backend` |
| Frontend | `npm run web` |

O script do backend seleciona e confere o JDK 21 portátil em `.local/tools/` (ou o JDK 21 de `JAVA_HOME`), sem alterar o Java do Windows. O workspace do VS Code aponta para o JDK 21 portátil deste computador.
O banco real é criado em `backend/data/cuidados.db`.

## Em outro computador

Instale Node.js 22.13 ou superior e JDK 21, configure JAVA_HOME e execute `npm ci`.
O Maven é iniciado pelo wrapper do projeto; as dependências são baixadas na primeira compilação.
Se mover o projeto, ajuste os dois caminhos do JDK em `Cuidados-a-Mente.code-workspace` para a instalação do Java 21 no novo computador.

As tarefas prontas usam PowerShell no Windows. Em Linux/macOS, com JDK 21 configurado, entre em `backend/` e execute `./mvnw spring-boot:run`.

## Primeiro uso

Na tela inicial, escolha **Inscreva-se aqui**. Use senha de pelo menos 8 caracteres.
Cadastre uma pessoa acompanhada no painel e depois adicione seus registros.

No navegador, a sessão fica na aba; no aplicativo nativo, fica no armazenamento seguro. As sessões expiram em 12 horas.
O idoso acessa os registros da pessoa vinculada à sua conta; o cuidador ou responsável que a cadastrou acompanha esses mesmos dados.

## Verificações

Inicie o Expo uma vez para gerar as declarações de rotas. Depois:

```powershell
npm run typecheck
npm run lint
npm run backend:build
npm run test:integration
```

O teste de integração usa seu próprio servidor e um banco separado em `work/tests/`. Ele exige o backend compilado.
Para gerar a publicação web: `npx expo export --platform web`.

## Celular e emulador

- Navegador local: `http://localhost:8080/api`.
- Emulador Android: `http://10.0.2.2:8080/api`.
- Celular físico: copie `.env.example` para `.env`, substitua localhost pelo IP do computador na mesma rede e reinicie o Expo.

Para permitir acesso pela rede local:
```powershell
$env:SERVER_ADDRESS = '0.0.0.0'
npm run backend
```

Se o navegador estiver em outro endereço, configure CORS_ORIGINS com as origens autorizadas, separadas por vírgula.
O padrão é acesso apenas pelo próprio computador. Publicação exige HTTPS e revisão dos controles de acesso.

## Problemas comuns

| Sintoma | O que conferir |
| --- | --- |
| Servidor indisponível | Se o terminal do backend está aberto |
| Erro de Java | Se o JDK 21 está em .local/tools ou JAVA_HOME |
| Porta ocupada | Se outra instância já está aberta |
| Tela/imagem não atualiza | Reinicie o Expo; se preciso, use `npx expo start --clear` |
| Rota nova não reconhecida | Inicie o Expo para gerar os tipos |
