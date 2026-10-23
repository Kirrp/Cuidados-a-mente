# Dependências e integrações — 2026-10-11

## Escolhas feitas para este projeto

| Área | Escolha | Por que se encaixa |
| --- | --- | --- |
| Hospedagem | Google Cloud Compute Engine, southamerica-east1 | Mantém a arquitetura Java/SQLite em uma VM com disco persistente e região em São Paulo. |
| Mídia ativa | Pasta privada no disco persistente da VM | Evita arquivos grandes no SQLite; a API revalida acesso, sem URL pública. |
| Cópia externa | Cloud Storage privado, mesma região | Separa backups da VM e permite impedir acesso público; os pacotes já saem cifrados. |
| E-mail | Resend API | Integração HTTP pequena no Java, para códigos de recuperação e confirmação. |
| HTTPS | Caddy | Serve a exportação web e encaminha a API com TLS. |
| Cartografia | Configurável, sem provedor novo ativado | Captura GPS independe de contratar mapas; carregamento externo exige escolha informada. |
| Contato de privacidade | PRIVACY_CONTACT, identidade real pendente | Não é possível escolher ou inventar uma pessoa controladora em nome do mantenedor. |

Estas escolhas são técnicas. Nenhuma conta foi criada, contratação feita, domínio adquirido ou cobrança ativada. A região e condições efetivas dos operadores devem ser registradas antes de produção. Não há estimativa de preço garantida; o operador deve consultar o orçamento da VM, disco, armazenamento e envio contratado.

Fontes oficiais conferidas em 11/10/2026: [regiões do Compute Engine](https://docs.cloud.google.com/compute/docs/regions-zones), [envio Resend](https://resend.com/docs/api-reference/emails/send-email) e [prevenção de acesso público no Cloud Storage](https://docs.cloud.google.com/storage/docs/public-access-prevention). A escolha da arquitetura é uma decisão técnica deste projeto.

## Módulos nativos Expo SDK 57

| Módulo | Uso |
| --- | --- |
| expo-notifications | Avisos locais, canal privado e resposta do usuário |
| expo-location | Uma captura explícita em primeiro plano |
| expo-sqlite | Cache e fila cifrados com SQLCipher na build própria |
| expo-secure-store / expo-crypto | Token e chave locais; aleatoriedade e hash de escopo |
| expo-document-picker / expo-file-system | Selecionar e enviar somente o arquivo escolhido |
| expo-print / expo-sharing | PDF e compartilhamento de arquivo escolhido |

O package-lock.json foi atualizado. A web possui implementações que informam indisponibilidade para recursos exclusivamente nativos. Não há push remoto, rastreamento contínuo, coleta de microfone ou biblioteca inteira de fotos.

## Configuração externa necessária

No servidor: RESEND_API_KEY, EMAIL_FROM, PRIVACY_CONTACT, OPS_TOKEN, DATABASE_PATH, MEDIA_PATH, CORS_ORIGINS e AUDIT_DAYS. Chaves ficam fora do frontend. Na exportação web/app, EXPO_PUBLIC_API_URL contém apenas a URL pública da API.

No backup: chave AES fora do repositório e bucket privado opcional. Só dados de destinatário e código entram no e-mail; registros de saúde não são enviados ao Resend.

## Limites atuais

Validação de notificações, GPS, SQLCipher, leitor de tela e fonte do sistema exige aparelhos Android/iOS. A infraestrutura Docker/systemd ainda precisa ser executada no servidor escolhido. A central registra protocolo e resposta; o mantenedor deve identificar o contato real e executar as providências. Fontes e build local não representam publicação ou certificação de acessibilidade.
