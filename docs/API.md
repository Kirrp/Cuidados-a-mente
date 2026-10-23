# API — versão 2026-10-11

Base local: `http://localhost:8080/api`. JSON e `Authorization: Bearer TOKEN` nas rotas privadas. IDs e autoria são gerados no servidor. Erros retornam `{"message":"Descrição"}`, sem detalhes internos.

A sessão dura até 12 horas. Rotas de cuidado exigem documentos atuais, vínculo exato, autorização da pessoa e permissão da ação. Preferências, encerramento de conta, direitos do titular e retirada da posição possuem regras próprias para continuarem acessíveis após mudanças jurídicas. O servidor nunca confia apenas nas abas visíveis.

## Conta, sessão e e-mail

| Método | Rota | Uso |
| --- | --- | --- |
| GET | /health | Saúde da API/SQLite |
| POST | /auth/cadastro | Nome, e-mail, senha, tipo adulto e aceites separados |
| POST | /auth/login | E-mail e senha |
| POST | /auth/qr | Consome código único de acesso da pessoa idosa |
| GET / PUT | /auth/me | Conta atual / dados permitidos do perfil |
| DELETE | /auth/me | Excluir conta adulta; corpo com senha |
| POST | /auth/logout | Revogar sessão atual |
| PUT | /auth/me/tema | `tema: claro\|escuro` |
| PUT | /auth/me/preferencias | `font_scale` 1–1,6; `notifications` e `notification_details` booleanos; `consultation_minutes` 5–1440 |
| GET | /auth/sessoes | Sessões próprias: ID público, criação, validade e indicação atual |
| DELETE | /auth/sessoes/ID | Revogar sessão própria |
| POST | /auth/sessoes/revogar-outras | Manter apenas a sessão atual |
| POST | /auth/recuperacao | `email`; resposta genérica para evitar enumeração |
| POST | /auth/recuperacao/confirmar | `codigo` e `senha`; uso único e encerramento de sessões |
| POST | /auth/verificacao/enviar | Enviar código à conta autenticada |
| POST | /auth/verificacao/confirmar | `codigo`; retorna usuário atualizado |

Senha: mínimo oito caracteres, máximo 72 bytes. Os códigos de e-mail vencem em 30 minutos e só seus hashes persistem. Envio exige Resend/remetente configurados; testes usam transporte substituto. Limite persistente por e-mail: dez tentativas em 15 minutos; limite de autenticação por IP: 40 em 15 minutos. Não registrar corpo, senha, token ou código nos logs.

## Pessoas e acessos

| Método | Rota | Uso |
| --- | --- | --- |
| GET / POST | /idosos | Listar / criar |
| PUT / DELETE | /idosos/ID | Editar com permissão / excluir pelo proprietário |
| GET | /idosos/ID/acesso | Permissões efetivas e gestão conforme o perfil |
| POST | /idosos/ID/cuidadores | `email` de conta de cuidador existente; cria convite pendente |
| GET | /convites | Convites do destinatário, sem dados de saúde |
| POST | /convites/ID/responder | `aceitar` booleano; confirma ou recusa |
| DELETE | /idosos/ID/meu-vinculo | Cuidador retira o próprio vínculo |
| DELETE | /idosos/ID/cuidadores/CUIDADOR | Administrador remove vínculo |
| PUT | /idosos/ID/cuidadores/CUIDADOR/permissoes | `permissoes` substitui concessões |
| PUT | /idosos/ID/cuidadores/CUIDADOR/revisao | `validade` AAAA-MM-DD, após hoje e até um ano |
| PUT | /idosos/ID/permissoes-idoso | Concessões permitidas à pessoa idosa |
| POST / DELETE | /idosos/ID/qr | Preparar/gerar QR / revogar QR, senha opcional e sessões vinculadas |
| PUT | /idosos/ID/acesso-senha | Proprietário configura `email` e `senha` da conta vinculada; encerra sessões anteriores |
| POST | /idosos/ID/transferencia | `email` do novo responsável e `senha` do administrador atual |
| GET | /transferencias | Solicitações do destinatário |
| POST | /transferencias/ID/responder | `aceitar` e, ao aceitar, `senha` do destinatário |
| PUT | /idosos/ID/contatos | `nome`, `telefone`; `nomeAlternativo` e `telefoneAlternativo` opcionais em conjunto |

Criar pessoa exige `nome`, `autorizacaoTitularConfirmada:true` e `representacao: titular_autorizou\|representante_legal`. Documentos e endereço são opcionais; não comprovam identidade. Autorização/representação precisa ser verificada pela operação. QR exige nome; hash no banco, 256 bits aleatórios, dez minutos e consumo único.

Convite vence em sete dias e aceite cria vínculo de 90 dias. Revisão concede até um ano; vínculo vencido não permite novos pedidos de cuidado. Transferência vence em 24 horas, confirma ambas as senhas, mantém registros e revoga vínculos, concessões, QR, sessões técnicas e GPS para nova revisão.

## Registros, diário e planos

| Método | Rota | Uso |
| --- | --- | --- |
| GET / POST | /registros | Ler por `tipo`/`idosoId` / criar |
| PUT / DELETE | /registros/ID | Atualizar / excluir com `versao` no corpo |
| GET | /idosos/ID/historico?tipo=rotinas | Últimos 300 eventos da área autorizada; `acesso` só administrador |
| GET / POST | /idosos/ID/diario | Ler / anotar `texto` e `categoria` |
| GET / POST | /idosos/ID/planos | Listar / gerar doses |
| POST | /idosos/ID/planos/PLANO/cancelar | Cancelar plano e remover apenas futuras doses pendentes |
| GET | /idosos/ID/exportacao?inicio=AAAA-MM-DD&fim=AAAA-MM-DD | Resumo por até 366 dias, áreas autorizadas |

Tipos de registro: rotinas, medicamentos, consultas, memorias. Campos: `idosoId`, `tipo`, `titulo`, `data`, `horario`, `detalhes`; memórias aceitam `categoria`/`midia`. Resposta inclui `versao` e, para doses geradas, `planoId`/`fuso` conforme o modelo. Campos ausentes opcionais seguem validação da API.

PUT/DELETE sem versão retornam 428; versão diferente retorna 409. POST aceita `mutationId` para repetição idempotente na fila offline. Um ID reutilizado com outro conteúdo é recusado. A autoria do evento vem da sessão, com antes/depois na mesma transação.

Diário: adultos com `ver_rotinas`/`criar_rotinas`; categorias `observacao`, `passagem_turno` e `correcao`; até 4000 caracteres. Correções são novas anotações.

Plano: `titulo`, `inicio`, `fim`, `horarios` (lista HH:MM), `intervaloDias` (inteiro 1–30), `fuso` IANA, `detalhes` opcional. Começa hoje ou depois no fuso escolhido, até um ano, oito horários e 730 doses. Gerar não agenda sozinho no sistema: a build nativa, a preferência e a sessão precisam estar ativas.

## GPS e mídia

| Método | Rota | Uso |
| --- | --- | --- |
| GET | /idosos/ID/localizacao | Administrador responsável ou cuidador explicitamente autorizado |
| PUT | /idosos/ID/localizacao/compartilhamento | Administrador responsável: `habilitado` e autorização explícita ao ligar |
| PUT | /idosos/ID/localizacao/cuidadores/CUIDADOR | Administrador: `autorizado` booleano |
| POST | /idosos/ID/localizacao/ponto | Apenas conta da pessoa idosa vinculada, com compartilhamento e autorização ativos |
| DELETE | /idosos/ID/localizacao/ponto | Titular/proprietário elimina ponto e compartilhamento |
| POST | /idosos/ID/midias | Multipart `arquivo`, `criar_memorias` |
| GET / DELETE | /midias/ID | Download autenticado / exclusão autorizada |

Ponto: `latitude`, `longitude`, `precisaoMetros`, `capturadaEm` ISO e `autorizacaoTitularConfirmada:true`. Coordenadas finitas, precisão 0–10000 m, captura de até cinco minutos (até 30 segundos de futuro). Guarda somente o mais recente, por até 24 horas. Serviço conectado não significa coleta contínua; `coletando` permanece falso. O app captura em primeiro plano por escolha, sem posição simulada.

Upload: JPEG/PNG/WebP/MP3/WAV/MP4 com assinatura reconhecida, até 10 MB/arquivo e 200 MB/pessoa. Resposta fornece ID de mídia para `midia: media:ID`. Download passa pela autorização, nunca por pasta estática pública. Links e fotos antigas continuam compatíveis. A remoção de pessoa/conta remove suas mídias; arquivos órfãos antigos são limpos.

## Direitos e operação

| Método | Rota | Uso |
| --- | --- | --- |
| GET | /privacidade | Canal configurado, declarações e protocolos próprios |
| POST | /privacidade/solicitacoes | `categoria`, `texto` e `pessoaId` opcional próprio/administrado |
| PUT | /privacidade/pessoas/ID/consentimento | `autorizado` e `representacao` |
| GET | /operacao/metricas | Métricas agregadas, `X-Operations-Token` |
| GET | /operacao/privacidade | Fila restrita de protocolos |
| PUT | /operacao/privacidade/ID | Status e resposta do operador |

Categorias de pedido: acesso, correcao, exclusao, revogacao, informacao. Um protocolo não executa exclusão automaticamente. Revogação bloqueia novos pedidos de cuidado, remove GPS/compartilhamento e QR pendente; direitos continuam acessíveis pela sessão válida. `titular` é aceito apenas para a própria conta técnica; administrador declara autorização ou representação.

As rotas operacionais ficam bloqueadas no proxy público. Chave ausente/incorreta retorna 404. Instale processos de atendimento e monitoramento conforme [OPERACAO.md](OPERACAO.md).

## Respostas e manutenção

201/200/204 conforme a ação; 400 dado inválido; 401 sessão inválida; 403 falta de permissão; 404 recurso fora da conta/indisponível; 409 conflito; 413 upload excessivo; 428 versão ausente; 429 tentativas; 503 integração indisponível.

Limpeza horária de sessões, códigos, convites, transferências e limites vencidos; ponto antigo; mídias órfãs; auditoria após prazo configurado (padrão técnico 365 dias). Excluir dados ativos não elimina backups automaticamente; restauração exige reconciliação de exclusões e acessos. Variáveis estão nos exemplos e em OPERACAO.md.
