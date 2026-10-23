# Organização e limpeza

## O que mudou

- Imagens reunidas em assets/images e assets/illustrations, com referências atualizadas.
- 18 imagens idênticas comparadas por SHA-256 e consolidadas.
- Pasta duplicada assets/merged-ui removida após backup.
- 18 arquivos de componentes de exemplo, estilos e código sem referência em nenhuma rota retirados do código ativo e preservados no ZIP.
- Java portátil e cache Maven movidos para .local.
- Removidos ZIP já extraído do Java, publicações antigas, bancos de teste e scripts temporários da integração.
- Removido o comando reset-project do template, desnecessário para o TCC.
- Documentação centralizada em docs.
- Configuração do Metro corrigida para ignorar ferramentas e backups.
- VS Code usa uma única raiz, evitando mostrar o backend duas vezes.

## Preservado

Banco real em backend/data, Java portátil, cache Maven, código e imagens usados, material visual restante, rotas antigas, licença e configurações existentes dos assistentes.

A pasta node_modules já não existia ao retomar esta organização. Ela pode ser recriada com npm ci; não foi removida por esta limpeza.

## Backups e recuperação

- backups/antes-da-organizacao.zip: frontend, imagens, scripts e configurações anteriores à limpeza.
- backups/frontend-original.zip: telas anteriores à primeira integração SQLite.
- backups/limpeza.json: caminhos removidos e seus tamanhos.

Extraia o ZIP em uma pasta separada para consultar e comparar. Os backups de código não substituem a cópia do banco real.

Foram removidos aproximadamente 202 MiB de arquivos. Esse valor é bruto: os backups preservados também ocupam espaço.

## Verificação final
Conferidas 86 referências locais, imagens, configurações JSON e exclusões do Metro. O banco real foi preservado. A execução completa não foi repetida: faltam as dependências do frontend e o ambiente bloqueou o processo Java do teste (EPERM). Os auxiliares da organização ficaram em work, pois sua remoção final foi bloqueada pela política de aprovação.

