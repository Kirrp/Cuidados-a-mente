# Atualização visual — Cuidados à Mente

Referência: arquivo Figma `GbLJu2BfWbautG7IoVXnQZ`, página principal. A implementação foi feita por inspeção visual autorizada, pois a leitura automática dos componentes não estava disponível. As telas distantes de **Configurações** ficaram fora do escopo.

## Onde encontrar cada parte

- `src/components/design.tsx`: cores, fonte Jua, botões, campos, mensagens e imagens compartilhadas.
- `src/components/app-shell.tsx`: cabeçalho, menu e navegação inferior por perfil.
- `src/components/cadastro-flow.tsx`: cinco etapas para responsável e cuidador. O cadastro do idoso fica nas configurações da conta adulta, com dados pessoais, contato e endereço em três etapas antes de liberar o QR Code.
- `src/components/registros-screen.tsx`: rotina, consultas, medicamentos e memórias com dados reais.
- `src/hooks/use-care.ts`: leitura dos registros e seleção da pessoa acompanhada.
- `src/app/painel.tsx`: início do responsável/cuidador e atalhos grandes para o idoso.
- `src/app/pessoas.tsx`: cadastro, busca e edição de pessoas.
- `src/components/elder-profile.tsx`: perfil da pessoa acompanhada.
- `src/app/meu-perfil.tsx`: edição de dados pessoais e contato de emergência.
- `src/app/idoso/atividade.tsx`: roleta de sugestões e jogo de pares.
- `src/app/responsavel/relatorio_responsavel.tsx`: contagem real de registros e progresso do dia.

As rotas antigas continuam apontando para os componentes novos. As ilustrações existentes foram reaproveitadas; os ícones de navegação usam a biblioteca `@expo/vector-icons`, já presente no projeto. A fonte Jua é empacotada localmente com o aplicativo.

## Comportamento

O cadastro só cria a conta ao concluir a última etapa. É possível voltar sem perder os campos preenchidos. O estado (UF) passa a ser salvo no perfil.

Os números no painel e nos relatórios são calculados a partir dos registros da conta. Não são usados os nomes, pacientes, consultas ou estatísticas fictícias do desenho. Os anúncios de contratação do protótipo não têm uma fonte de dados e não foram apresentados como anúncios reais.

Fotos de até aproximadamente 3 MB podem ser escolhidas e salvas no SQLite. Histórias são salvas em texto. Vídeos e áudios são guardados por links http/https e abertos no navegador/aplicativo do dispositivo; não há envio de arquivos de áudio/vídeo. A foto fica disponível após reiniciar o backend.

O botão de emergência abre o discador para o contato cadastrado pelo usuário. Em computadores sem discador, o telefone continua visível. A roleta sugere atividades, permite adicioná-las à rotina e inclui um jogo de memória local.

## Execução e conferência

1. Na raiz do projeto, execute `npm run backend`.
2. Em outro terminal, execute `npm run web`.
3. Use uma conta de teste para explorar o cadastro e os três perfis.

Verificações: `npm run typecheck`, `npm run backend:build` e `npm run test:integration`.

Para conferir uma versão web exportada: `npx expo export --platform web --output-dir work/web-preview --max-workers 2`, depois `node scripts/preview-web.mjs` e abra `http://localhost:8081`.

## Limites existentes

Compartilhamento entre contas de cuidador/responsável, convite por chave, envio de e-mail de confirmação, recuperação de senha por e-mail, notificações do sistema e dispositivos conectados precisam de serviços/regras próprios. Esta atualização não simula essas integrações. As rotas legadas de confirmação não fazem parte do novo caminho de cadastro.

Backup dos layouts anteriores: `backups/antes-layout-figma-20260924.zip`. O banco principal não foi usado pelos testes automáticos.
