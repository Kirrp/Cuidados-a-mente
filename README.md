# Cuidados à Mente

Aplicativo de cuidado e acompanhamento. Expo SDK 57 / React Native, Java 21 / Spring Boot e SQLite. Atualização: **12/10/2026**.

Este diretório é exclusivo do Cuidados à Mente. O **Elo**, aplicativo de conversas inspirado no Discord, fica na pasta independente `../ELO`. Abra cada projeto pelo seu próprio arquivo `.code-workspace` e execute os comandos no terminal da pasta correspondente.

## Comece aqui

1. Abra `Cuidados-a-Mente.code-workspace`.
2. Na raiz, instale as dependências com `npm ci`.
3. Inicie o servidor com `npm run backend` e o aplicativo com `npm run web`, em terminais separados.
4. Crie sua conta e cadastre uma pessoa. Nome e declaração de autorização são obrigatórios; documentos e endereço são opcionais.
5. Abra o menu para acessar Configurações, acompanhamento e privacidade.

As instruções completas e os requisitos estão em [Como executar](docs/COMO_EXECUTAR.md). O celular precisa alcançar a API configurada em `EXPO_PUBLIC_API_URL`. Lembretes e cache cifrado exigem compilação nativa própria.

## O que foi acrescentado

- Lembretes locais de doses e consultas, conteúdo discreto por padrão e planos recorrentes com fuso.
- Histórico de autoria, diário e passagem de turno, contatos principal e alternativo por pessoa.
- Convites com aceite, validade e revisão de vínculos, saída do cuidador e transferência confirmada.
- Recuperação e verificação de e-mail, limites de tentativas e encerramento de sessões.
- Fila offline nativa cifrada, versões de registros e conferência de conflitos.
- Captura voluntária de GPS no aparelho vinculado, mídia privada e exportação de registros.
- Central de direitos, declaração/revogação de autorização, fonte ajustável e estados acessíveis.
- Preparação de HTTPS, métricas restritas, cópias cifradas e restauração.

Consulte a [situação das 26 recomendações](docs/RECOMENDACOES.md), incluindo configurações externas e avaliações em aparelho/com usuários. O aplicativo registra o cuidado informado; concluir uma dose não comprova ingestão.

## Manuais ilustrados

| Leitura | Markdown editável | PDF |
| --- | --- | --- |
| Usar o aplicativo — 66 páginas | [Manual do usuário](docs/MANUAL_USUARIO.md) | [Manual do usuário ilustrado](output/pdf/manual-usuario-cuidados-a-mente.pdf) |
| Entender as funcionalidades e seu código | [Manual-aula](docs/MANUAL-AULA.md) | [Manual-aula ilustrado](output/pdf/manual-aula-cuidados-a-mente.pdf) |
| Aprender os sinais das linguagens — 53 páginas | [Manual de sintaxe](docs/MANUAL-SINTAXE.md) | [Manual de sintaxe ilustrado](output/pdf/manual-sintaxe-cuidados-a-mente.pdf) |

Edição ampliada de **27/10/2026**: são **119 páginas nos dois manuais principais**, com capturas de demonstração, diagramas, sumário clicável, marcadores, exercícios resolvidos e roteiros por perfil. O manual-aula permanece como leitura complementar, com 31 páginas. O [catálogo dos manuais](docs/manuais/README.md) reúne downloads, conteúdo e instruções de reprodução.

`npm run docs:manuals` atualiza os trechos extraídos dos fontes; `npm run docs:pdf` gera os PDFs com o ambiente Python preparado. Veja o procedimento em [Como executar](docs/COMO_EXECUTAR.md).

## Documentação técnica

[Alterações e testes](docs/ALTERACOES_E_TESTES.md) · [API](docs/API.md) · [Código](docs/GUIA-CODIGO.md) · [Telas](docs/ROTAS.md) · [Identidade visual](docs/IDENTIDADE_VISUAL.md) · [Acessibilidade](docs/ACESSIBILIDADE.md) · [Contraste medido](docs/CONTRASTE.md) · [QR Code](docs/ACESSO_QR.md) · [Operação](docs/OPERACAO.md) · [Integrações e escolhas](docs/DEPENDENCIAS_E_INTEGRACOES.md).

A [revisão de problemas de 12/10/2026](docs/REVISAO_2026-10-12.md) descreve as falhas corrigidas, seus impactos e os limites da verificação.

A [refatoração de clean code](docs/CLEAN_CODE_2026-10-12.md) explica a organização dos fontes, os nomes mais claros, as funções extraídas e a validação de comportamento. Use `npm run format:check` para conferir o padrão e `npm run format` para aplicá-lo.

Hospedagem escolhida: Google Cloud Compute Engine na região de São Paulo, disco persistente e mídia privada em pasta separada. Resend envia códigos por API HTTPS; Google Cloud Storage privado recebe cópias cifradas. A escolha preserva a arquitetura SQLite e evita armazenamento público de memórias. Essas integrações estão preparadas; **nenhum serviço foi contratado ou publicado nesta entrega**.

## Dados e atualização

**Preserve `backend/data/`, arquivos de mídia e segredos da instalação.** Migrações adicionam estruturas ao banco existente. Antes de atualizar uma instalação real, pare a API e faça uma cópia restaurável. Os testes usam bancos temporários; a versão anterior dos fontes e manuais está em `work/recomendacoes-original/`.

A identidade e o canal do responsável pelos dados precisam ser reais e configurados pelo mantenedor. Termos e Política ficam em `src/legal/content.ts`; `npm run docs:legal` sincroniza as cópias para revisão. A versão jurídica atual é `2026-10-11`. Publicação requer infraestrutura/credenciais, revisão operacional e avaliação nativa descritas nos guias.
