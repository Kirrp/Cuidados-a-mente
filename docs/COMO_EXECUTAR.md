# Como executar — versão 2026-10-12

Use Node.js 22.13 ou superior e JDK 21. O frontend usa Expo SDK 57. As instruções de Expo foram conferidas na documentação versionada: https://docs.expo.dev/versions/v57.0.0/.

## Aplicativo local

Na raiz, execute `npm ci`. Abra dois terminais:

| Terminal | Comando |
| --- | --- |
| API Java/SQLite | `npm run backend` |
| Aplicativo web | `npm run web` |

O script scripts/backend.ps1 encontra JAVA_HOME, um JDK instalado ou ferramentas locais e usa o Maven Wrapper. O banco padrão, ao iniciar dentro de backend, é backend/data/cuidados.db; novas mídias ficam em backend/data/media. Para parar, use Ctrl+C em cada terminal.

No primeiro uso, crie uma conta adulta, aceite separadamente os documentos e cadastre a pessoa com nome e declaração de autorização válida. CPF, RG, endereço e telefones são opcionais. Não use exemplos de teste como dados reais.

## No aparelho

Use `EXPO_PUBLIC_API_URL` apontando para a API HTTPS acessível ao aparelho. No emulador Android, o padrão local é http://10.0.2.2:8080/api. Um aparelho físico não acessa o localhost do computador.

Notificações e captura pontual exigem Android/iOS. Offline exige uma build própria com SQLCipher; o Expo Go não comprova esse recurso. O arquivo app.json já configura notificações, localização somente em primeiro plano, SQLite com SQLCipher, seletor de arquivos e compartilhamento. eas.json inclui preview interno APK e produção. Os identificadores nativos, conta Expo/EAS e assinatura devem corresponder ao mantenedor. A build nativa não foi gerada nesta entrega.

## Testes

```powershell
npm run typecheck
npm run lint
npm run format:check
npm run test:core
npm run test:api-client
npm run test:notifications
npm run test:offline
npm run backend:build
npm run test:integration
python scripts/tests/test_backup.py
```

O teste HTTP inicia servidor em porta livre e banco em work/tests; os testes Java e de backup usam dados temporários. Não apontam para o banco do usuário. Se o Java não estiver no PATH, configure JAVA_HOME.

O teste do cliente da API verifica falhas HTTP, respostas inválidas, troca de sessão e sincronização offline, incluindo a preservação da chave que evita envio duplicado.

O teste de notificações simula as chamadas nativas e confere troca de conta, limpeza no logout e abertura única após tocar no aviso. A entrega real de avisos ainda precisa ser verificada em aparelho.

O teste offline usa SQLite em memória para validar isolamento de cache e fila durante troca de sessão, limpeza de gravações atrasadas e preservação do identificador de envio. A criptografia SQLCipher continua exigindo validação em uma build nativa.

Para exportar a web: `npx expo export --platform web --output-dir work/web-preview`. Para conferência local: `node scripts/preview-web.mjs`. A prévia não publica o projeto.

## Manuais e PDF

`npm run docs:manuals` atualiza figuras e trechos numerados lendo o código atual. Depois, com Python, ReportLab, Pillow e Sharp disponíveis, execute `python scripts/generate-manual-pdfs.py`. Os três PDFs ficam em output/pdf. Abra os arquivos e confira a renderização ao modificar a diagramação.

`scripts/verificar-manuais.py` renderiza os PDFs e cria folhas de conferência em `tmp/pdfs/qa`. Ele requer Poppler (`pdftoppm`) e verifica o texto das páginas; confira também as imagens para detectar cortes ou sobreposição. Os trechos são copiados dos fontes: depois de usar `npm run format`, execute novamente `npm run docs:manuals` antes de gerar os PDFs.

## Manter o clean code

`npm ci` inclui Prettier 3.9.10, prettier-plugin-java 2.11.0 e @prettier/plugin-xml 3.4.2 como ferramentas de desenvolvimento. `npm run format:check` apenas confere o padrão; `npm run format` formata fontes e configurações. As exclusões em `.prettierignore` protegem dados, ferramentas, saídas geradas e a cópia histórica.

Os scripts Python usam Black 26.10.1 com a configuração de `pyproject.toml`. Instale com `python -m pip install black==26.10.1`, confira com `python -m black --check scripts` e formate com `python -m black scripts`. Depois, repita os testes apropriados e regenere os manuais se as linhas mudarem.

A implantação HTTPS, serviços escolhidos e backup diário estão em OPERACAO.md.

## Contas preenchidas no banco do aplicativo

O conjunto solicitado está documentado em CONTAS_PREENCHIDAS.md. Seus acessos ficam no arquivo local ignorado work/contas-app/ACESSOS.md. O banco é backend/data/cuidados.db e as imagens privadas ficam em backend/data/media, os mesmos destinos do comando npm run backend. A carga scripts/criar-contas-preenchidas.mjs é manual e exige --confirmar-banco-persistente; não é executada na inicialização e não duplica registros ao retomar o mesmo conjunto.
