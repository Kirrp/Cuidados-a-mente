# Operação, backup e restauração — 2026-10-11

## Arquitetura escolhida

Google Cloud Compute Engine em southamerica-east1 (São Paulo), uma VM Linux, uma única instância da API Java e disco persistente para /srv/cuidados/data. Novas mídias ficam em /srv/cuidados/data/media e passam pela API autenticada. Caddy serve a exportação web e termina HTTPS. O SQLite exige esta topologia de instância única.

Como ponto de partida técnico para homologação, use VM de 2 vCPUs e 4 GB; confirme capacidade e custo com a carga real. Não use volume efêmero, múltiplas réplicas gravando SQLite ou armazenamento público para mídias. A proteção em repouso depende de disco, permissões e controles da VM; o SQLite do servidor não ganhou criptografia própria.

Cloud Storage privado é a escolha para cópias externas, preferencialmente na mesma região. Ative prevenção de acesso público e acesso uniforme por IAM, com identidade limitada ao bucket. Use lifecycle de eliminação após 30 dias, ajustável à política real. Não ative bloqueio irrevogável de retenção como parte deste guia. Guarde chave de restauração em local separado das cópias.

## Implantação preparada

1. Instale Docker/Compose e JDK/build ou use os Dockerfiles fornecidos.
2. Copie o projeto para /opt/cuidados.
3. Crie /srv/cuidados/data e media; dê propriedade ao UID/GID 10001 da API e permissões restritas.
4. Copie deploy/.env.example para deploy/.env e informe domínio, origem web, contato real e segredos.
5. Configure DNS do domínio para a VM. Permita entrada somente HTTP/HTTPS e administração restrita. A API fica publicada apenas em 127.0.0.1:8080 para o operador.
6. Dentro de deploy, execute `docker compose config`, `docker compose build` e `docker compose up -d`.
7. Confira HTTPS, /api/health, login, permissões e upload com contas sintéticas antes de dados reais.

As configurações foram preparadas no projeto; Docker e a VM não foram provisionados nem executados nesta entrega. O operador deve validar imagens, assinatura nativa, domínio, limites e disponibilidade.

O frontend recebe EXPO_PUBLIC_API_URL no build. Nunca inclua RESEND_API_KEY ou OPS_TOKEN em variáveis EXPO_PUBLIC. Logs de acesso do proxy não são habilitados; a API não registra corpo nem parâmetros de saúde. Restrinja journald, banco, backups, contas IAM e acesso administrativo.

## E-mail

Crie e configure conta Resend e um domínio/remetente verificado. Informe RESEND_API_KEY e EMAIL_FROM apenas na API. Teste recuperação e confirmação em homologação. O token dura 30 minutos e é de uso único. O envio de recuperação retorna resposta pública genérica. Falhas de entrega não revelam se a conta existe; o usuário deve conferir spam e o operador deve verificar a entrega no provedor.

Defina o canal real PRIVACY_CONTACT e preencha a identificação do controlador em src/legal/content.ts. Gerar nova versão dos textos exige atualizar backend e testes e executar scripts/sync-legal-docs.mjs. Não indique instituição ou pessoa sem definição expressa.

## Backup diário cifrado

scripts/backup.py usa o backup consistente do SQLite e inclui os arquivos referenciados em media_files. AES-256-GCM autentica o pacote; SHA-256 confere cada arquivo. A API deve estar pausada para não divergir da pasta de mídias.

Prepare Python 3 em /opt/cuidados/.venv e instale deploy/requirements-backup.txt. Gere uma chave de 32 bytes em hexadecimal em /etc/cuidados/backup.key, com acesso restrito; não publique nem registre essa chave no projeto, nos logs ou no bucket.

Copie deploy/backup.env.example para deploy/backup.env, configure caminho da chave e nome do bucket privado. Restrinja esse arquivo. O script deploy/backup.sh para a API, cria cópia, reinicia a API mesmo em falha e, se configurado, envia somente o pacote cifrado ao bucket. Limpa apenas backups próprios locais com mais de 30 dias, depois da cópia bem-sucedida.

Instale cuidados-backup.service e cuidados-backup.timer no systemd e habilite o timer. Ele executa diariamente às 06:00 UTC, equivalentes a 03:00 em São Paulo na configuração atual. A rotina só ficará ativa após instalação explícita pelo operador. Monitore falhas do serviço e espaço em disco; manter uma cópia apenas na própria VM não cobre perda da VM.

Execução manual:

```text
python scripts/backup.py create --database /srv/cuidados/data/cuidados.db --media /srv/cuidados/data/media --output /srv/cuidados/backups --key-file /etc/cuidados/backup.key --api-stopped
```

## Restauração e verificação

```text
python scripts/backup.py restore --archive COPIA.cam --destination /srv/cuidados/restore-NOVO --key-file /etc/cuidados/backup.key
```

O destino não pode existir. O script autentica a cópia, aceita apenas caminhos previstos, confere hashes, PRAGMA integrity_check e a correspondência exata entre os arquivos de mídia e as referências do banco. A pasta restaurada e sua subpasta de mídia são criadas com permissão 0700 e os arquivos com 0600 em Linux. Só após essas verificações a pasta é publicada; chave errada, pacote adulterado ou mídia ausente falham sem substituir o banco ativo.

Antes de apontar a API para a cópia restaurada: confira cadastros e mídias em ambiente isolado, reaplique exclusões/revogações ocorridas desde a cópia, elimine sessões antigas e confirme permissões. O pacote não resolve automaticamente alterações posteriores ao backup. Documente o procedimento e a política de cópias na operação real. Depois da revisão, pause a API e planeje a troca de caminhos; este guia não manda sobrescrever o banco ativo.

O teste scripts/tests/test_backup.py valida ida e volta, mídia, dados, adulteração, chave errada, recusa de sobrescrita e rejeição de mídia ausente ou extra, usando somente dados sintéticos. Em Linux também confere as permissões dos arquivos restaurados.

## Métricas e atendimento

O canal /api/operacao/* é bloqueado pelo Caddy público. Acesse por loopback ou túnel administrativo, usando X-Operations-Token igual a OPS_TOKEN. Sem configuração ou chave correta, retorna 404.

GET /api/operacao/metricas mostra requisições, falhas 5xx e duração média; valores são agregados desde o início do processo. Não há nome, registro, token ou histórico de trajetos. Acompanhe também /api/health, disco, timer de backup e restauração periódica. Alertas externos não foram ativados nem enviados a terceiros.

GET /api/operacao/privacidade retorna os primeiros 200 protocolos para atendimento restrito. PUT /api/operacao/privacidade/ID recebe status (em_analise, aguardando_titular, concluido ou indeferido) e resposta de até 2000 caracteres; cada resposta ganha histórico. Registrar conclusão não executa exclusão por si só. Verifique legitimidade, execute a providência cabível, registre resposta e confira o resultado. Não coloque documentos pessoais ou conteúdo de saúde nos logs técnicos.

A limitação por IP usa a conexão direta; no proxy, requisições podem compartilhar o IP do proxy. Mantenha a API fechada e ajuste a estratégia de limite no proxy/aplicação conforme a topologia, sem confiar cegamente em X-Forwarded-For fornecido pelo cliente.
