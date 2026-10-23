# Acesso do idoso por QR Code

## Como usar

1. Entre como cuidador ou responsável.
2. Abra **Perfil → Configurar contas dos idosos** (também há um ícone de QR Code em **Meus idosos**).
3. Para uma pessoa nova, escolha **Cadastrar novo idoso** e preencha nome, RG, CPF, nascimento, celular e endereço, além dos campos opcionais de telefone, e-mail de contato, complemento e observações. Para uma pessoa já cadastrada, escolha **Completar cadastro** se faltarem informações.
4. Salve o cadastro e escolha **Gerar QR Code de acesso**. O botão de gerar só aparece depois que os dados obrigatórios estiverem preenchidos.
5. No aparelho do idoso, abra o aplicativo e toque no ícone de QR Code no canto superior direito da tela inicial.
6. Escolha **Escanear QR Code**, permita a câmera e aponte para o código exibido no aparelho do cuidador/responsável.
7. O idoso entra diretamente no painel e vê a rotina e as memórias já cadastradas para ele.

O QR é lido dentro do aplicativo. Não é um link público para a câmera padrão do celular. Caso a câmera não esteja disponível, o cuidador pode ajudar a copiar o código e colá-lo em **Usar código de acesso**.

## Validade e dados

- O código dura 10 minutos e funciona uma vez. Gerar outro cancela o anterior.
- A sessão dura até 12 horas. No celular, fica no armazenamento seguro; na web, na sessão da aba. Ao vencer, é necessário gerar e ler outro QR.
- **Desconectar acesso do idoso** cancela o QR pendente e encerra suas sessões; os dados ficam preservados.
- Cada idoso vê apenas a pessoa vinculada à sua conta, mesmo que o adulto cuide de várias pessoas.
- As contas antigas e seus registros não são apagados. Contas antigas de idoso criadas independentemente por e-mail não são mescladas automaticamente: este fluxo prepara o acesso da pessoa cadastrada pelo adulto.
- O vínculo é com o cuidador ou responsável que cadastrou a pessoa. Compartilhamento entre vários adultos ainda não está implementado.
- O e-mail de contato do idoso é opcional. Não há senha no cadastro do idoso, pois o acesso é por QR Code.

## Para testar após a atualização

Reinicie o backend e o Expo para carregar as rotas e bibliotecas novas. Em uma compilação nativa própria, refaça a compilação para incluir câmera e armazenamento seguro.

Para dois aparelhos físicos, ambos precisam alcançar o mesmo backend. Configure `EXPO_PUBLIC_API_URL` com o endereço desse servidor (no celular, `localhost` é o próprio celular). O servidor local vem limitado a `127.0.0.1`; consulte **COMO_EXECUTAR.md** antes de configurá-lo para a rede. No navegador de um celular, a câmera exige um contexto seguro, normalmente HTTPS; HTTP por IP local pode impedir a permissão. O leitor oferece a alternativa de colar o código.

## Verificações automatizadas

`npm run typecheck`, `npm run backend:build` e `npm run test:integration`.

Os testes usam SQLite temporário em `work/tests/`, incluindo criação por ambos os perfis, expiração, rotação, uso único concorrente, revogação, acesso aos registros vinculados, isolamento entre idosos do mesmo adulto e persistência após reiniciar. Nunca usam `backend/data/cuidados.db`.

Verificado em 24/09/2026: tipos, compilação Java, testes de integração e exportação web passaram. No navegador, foram conferidos o ícone inicial, a abertura do leitor, a alternativa manual e a rejeição de código inválido. A leitura óptica com câmera e a persistência no armazenamento seguro ainda precisam ser testadas em aparelho físico.
