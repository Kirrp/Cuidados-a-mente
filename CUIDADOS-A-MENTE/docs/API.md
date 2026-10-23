# API local

Base: http://localhost:8080/api

Requisições e respostas usam JSON. Rotas privadas exigem `Authorization: Bearer TOKEN`.
Erros retornam `{ "message": "Descrição" }`. IDs são gerados pelo servidor.

| Método | Rota | Finalidade |
|---|---|---|
| GET | /health | Estado do servidor e SQLite |
| POST | /auth/cadastro | Criar conta e sessão |
| POST | /auth/login | Autenticar |
| POST | /auth/qr | Trocar código de uso único por sessão do idoso |
| POST | /idosos/ID/qr | Preparar conta do idoso e gerar/renovar QR Code (cuidador/responsável proprietário) |
| DELETE | /idosos/ID/qr | Cancelar QR Code e revogar sessões do idoso |
| GET | /auth/me | Consultar conta autenticada |
| PUT | /auth/me | Atualizar nome, endereço, telefones e contato de emergência |
| POST | /auth/logout | Revogar sessão atual |
| GET | /idosos | Listar pessoas da conta |
| POST | /idosos | Cadastrar pessoa acompanhada |
| PUT | /idosos/ID | Atualizar nome, nascimento e observações da pessoa |
| GET | /registros?tipo=rotinas&idosoId=ID | Listar registros da pessoa |
| POST | /registros | Criar registro |
| PUT | /registros/ID | Editar ou alterar status |
| DELETE | /registros/ID | Excluir registro |

Cadastro público: nome, email, senha (8 caracteres ou mais; máximo 72 bytes), tipo (responsavel ou cuidador). Cadastro e login com senha de idoso não são aceitos.
Campos adicionais dos formulários são preservados em perfil; a senha nunca é retornada.
Pessoa acompanhada: nome, nascimento (AAAA-MM-DD), observacoes, rg, cpf, celular, telefone, cep, rua, bairro, cidade, estado, numero, complemento e email de contato opcional. Os campos de contato e endereço ficam no JSON `perfil` da tabela `idosos`, retornado também na listagem. Cadastros antigos continuam preservados e podem ser completados; o endpoint de QR exige nome, nascimento, RG, CPF, celular e endereço completos.
Registro: idosoId, tipo (consultas, medicamentos, rotinas, memorias), titulo, data (AAAA-MM-DD), horario opcional (HH:MM), detalhes opcional.
Edição: titulo, data, horario, detalhes, status (pendente ou concluido).
Memórias também aceitam categoria (Fotos, Vídeos, Áudios ou Histórias) e midia. Para fotos, midia pode ser uma data URL JPEG/PNG/WebP em base64 (até 4 milhões de caracteres); vídeos e áudios aceitam links http/https. Os novos campos são adicionados automaticamente ao SQLite existente, preservando os registros anteriores.
A API verifica a propriedade ou o vínculo exato do idoso autenticado. O vínculo com um idoso não permite consultar nem modificar outras pessoas acompanhadas pelo mesmo cuidador/responsável. Criar/editar pessoas e administrar os QR Codes exige perfil adulto.

`POST /idosos/ID/qr` retorna `{ codigo, expires, nome }` (expires em segundos Unix). O código contém 256 bits aleatórios, vence em 10 minutos e substitui o anterior. Somente seu SHA-256 fica no banco. `POST /auth/qr` recebe `{ codigo }` e retorna `{ token, usuario }`; seu consumo é atômico e de uso único. Código inválido, expirado ou consumido retorna 401. Gerar novamente reutiliza a conta existente. Revogar acesso retorna 204 e encerra todas as sessões vinculadas.

As tabelas `elder_accounts` e `qr_access` são adicionadas sem apagar os dados existentes. As sessões mantêm validade de 12 horas.

Respostas: 201 ao criar; 200 ao ler/editar; 204 ao excluir/sair; 400 para dados inválidos; 401 sem sessão; 404 para recurso inexistente ou de outra conta; 409 para e-mail duplicado.

Configuração: PORT, SERVER_ADDRESS, DATABASE_PATH, CORS_ORIGINS.
