# Manual do usuário — Cuidados à Mente

Edição 2026-10-27. Faça cada tarefa, reconheça o resultado e confira os limites. As figuras explicam o funcionamento; os exemplos são sintéticos.

![Da tela ao registro protegido](imagens/evolucao-registros.svg)

Leia uma tarefa por vez. Localize a tela, siga os passos e compare o resultado esperado. As últimas páginas mostram telas de demonstração e exemplos opcionais de código.

## 1. Comece aqui

O Idoso acessa o próprio cuidado. O Cuidador acompanha cadastros autorizados. O Responsável administra seus cadastros. Confira o nome da pessoa antes de escrever, concluir ou compartilhar.

| Quero fazer | Onde encontrar |
| --- | --- |
| Ver pendências | Painel e abas de registros |
| Escrever passagem de turno | Acompanhamento > Diário |
| Programar várias doses | Acompanhamento > Doses recorrentes |
| Ajustar letras e avisos | Perfil > Configurações |
| Rever compartilhamento | Permissões e Administração |
| Pedir correção ou revogar | Configurações > Privacidade |

Na web, use conexão com a API. Lembretes e GPS pontual são nativos. Offline exige build própria com SQLCipher; o Expo Go não valida esse recurso. Resumos e atividades do dia apoiam a organização, sem avaliar saúde.

## 2. Cadastro mínimo

**Onde:** Tela inicial e Contas de idosos.

![Figura 1 — Cadastro mínimo](imagens/evolucao-entrada.svg)

1. Informe nome, e-mail e senha na conta adulta.
2. Leia os documentos e confirme os aceites separadamente.
3. No cadastro da pessoa, informe nome e confirme autorização válida.

**Resultado esperado:** CPF, RG, nascimento, contato e endereço são opcionais.

**O que conferir:** O perfil Responsável não comprova representação legal.

## 3. Acesso por QR

**Onde:** Contas de idosos e botão QR da tela inicial.

![Figura 2 — Acesso por QR](imagens/evolucao-qr.svg)

1. Escolha a pessoa e gere o QR no acesso adulto.
2. No aparelho da pessoa, leia ou digite o código. Se o proprietário preparou credenciais, também pode usar e-mail e senha.
3. Confira o nome e aceite os documentos quando solicitado.

**Resultado esperado:** A conta idosa acessa somente a pessoa vinculada.

**O que conferir:** QR vale dez minutos e é de uso único. Desconectar encerra sessões, desativa a senha opcional e preserva registros.

## 4. Rotinas, medicamentos e consultas

**Onde:** Painel e abas dos registros.

![Figura 3 — Rotinas, medicamentos e consultas](imagens/evolucao-registros.svg)

1. Selecione a pessoa antes de criar ou editar.
2. Informe título, data, horário e detalhes necessários.
3. Use Concluir ou Reabrir conforme a permissão.

**Resultado esperado:** Pesquisa e resumos usam apenas registros autorizados. Concluir registra a declaração do usuário.

**O que conferir:** O aplicativo não mede ingestão, prescreve doses nem agenda consultas com estabelecimentos.

## 5. Histórico de autoria

**Onde:** Acompanhamento > Histórico.

![Figura 4 — Histórico de autoria](imagens/evolucao-historico.svg)

1. Selecione a pessoa e a área.
2. Leia ação, autor e instante.
3. Compare Antes e Depois para entender uma correção.

**Resultado esperado:** Novas mudanças geram eventos separados, na mesma transação do registro.

**O que conferir:** Não reconstrói autoria antiga. Exibe até 300 eventos; retenção padrão de 365 dias.

## 6. Diário e passagem de turno

**Onde:** Acompanhamento > Diário.

![Figura 5 — Diário e passagem de turno](imagens/evolucao-diario.svg)

1. Escolha Observação, Passagem de turno ou Correção.
2. Escreva o necessário para o cuidado.
3. Salve e confira autor e horário. Para corrigir, acrescente outra entrada.

**Resultado esperado:** As entradas anteriores são preservadas. Adultos usam permissões de rotina.

**O que conferir:** Exibe até 200 entradas. Não substitui documentação clínica formal.

## 7. Convites e retirada de vínculo

**Onde:** Perfil > Permissões e Configurações.

![Figura 6 — Convites e retirada de vínculo](imagens/evolucao-convites.svg)

1. O responsável informa o e-mail de uma conta de cuidador existente.
2. O cuidador aceita ou recusa em Configurações.
3. Para sair, use Acompanhamento > Administração > Retirar meu acesso.

**Resultado esperado:** Antes do aceite, os registros continuam inacessíveis. A retirada elimina os acessos do vínculo.

**O que conferir:** Convite vale sete dias. Antes do aceite aparece quem convidou, sem dados de cuidado.

## 8. Validade e revisão de acessos

**Onde:** Acompanhamento > Administração > Revisar acessos.

![Figura 7 — Validade e revisão de acessos](imagens/evolucao-revisao.svg)

1. Confira quem continua acompanhando a pessoa.
2. Revise as permissões e informe nova validade em AAAA-MM-DD.
3. Confirme a revisão ou retire acessos antigos.

**Resultado esperado:** Vínculos aceitos começam com 90 dias. O servidor bloqueia acesso vencido.

**O que conferir:** Renovação limitada a um ano. Vínculos antigos recebem 90 dias a partir da migração.

## 9. Transferência de administração

**Onde:** Acompanhamento > Administração e Configurações do destinatário.

![Figura 8 — Transferência de administração](imagens/evolucao-transferencia.svg)

1. Informe e-mail do novo responsável e sua senha.
2. O destinatário confirma com a própria senha.
3. O novo dono revisa vínculos e gera outro QR.

**Resultado esperado:** Preserva registros e retira acesso do administrador anterior.

**O que conferir:** Proposta vale 24 horas. A troca técnica não transfere representação jurídica.

## 10. Contatos de emergência por pessoa

**Onde:** Acompanhamento > Contatos e Idoso > Emergência.

![Figura 9 — Contatos de emergência por pessoa](imagens/evolucao-contatos.svg)

1. Confira a pessoa selecionada.
2. Cadastre contato principal e, se necessário, alternativo.
3. Na emergência, escolha contato e confirme no discador.

**Resultado esperado:** Pessoas diferentes podem ter contatos diferentes. Alterações são auditadas.

**O que conferir:** Ligação depende de aparelho, rede e confirmação; não há acionamento automático.

## 11. Doses recorrentes

**Onde:** Acompanhamento > Doses recorrentes.

![Figura 10 — Doses recorrentes](imagens/evolucao-doses.svg)

1. Copie o plano já orientado: início, fim, horários e intervalo de dias.
2. Confira o fuso e toque em Programar doses.
3. Cada dose fica pendente; cancelar remove só futuras pendentes.

**Resultado esperado:** Dois horários em dois dias geram quatro doses com estados próprios.

**O que conferir:** Até um ano, oito horários e 730 doses. Intervalo inteiro de 1 a 30 dias. Fuso do plano é preservado.

## 12. Lembretes e privacidade

**Onde:** Perfil > Configurações > Lembretes do cuidado.

![Figura 11 — Lembretes e privacidade](imagens/evolucao-lembretes.svg)

1. Ative no nativo e permita notificações no sistema.
2. Escolha a antecedência das consultas; prefira aviso genérico em aparelho compartilhado.
3. Abra diariamente e confira o registro ao tocar no aviso.

**Resultado esperado:** O aviso genérico não revela o medicamento. Tocar não conclui o registro.

**O que conferir:** Até 50 avisos nas próximas 12 horas, antes da sessão expirar. Web não agenda; entrega precisa de validação física.

## 13. Offline e conflitos

**Onde:** Perfil > Configurações > Sincronização offline.

![Figura 12 — Offline e conflitos](imagens/evolucao-offline.svg)

1. Use build nativa com SQLCipher e ative o cache.
2. Atualize acessos com rede; consulte e altere registros armazenados por até 15 minutos.
3. Reconecte. Em conflito, compare versões, copie o necessário e descarte a alteração local antes de editar o servidor.

**Resultado esperado:** Fila cifrada, até 100 alterações. O servidor revalida acesso e versão.

**O que conferir:** Cache de até 5 milhões de caracteres, sem mídias. Revogação só é conhecida ao reconectar. Saída, troca de sessão ou recusa de acesso limpa cache e fila.

## 14. Recuperação e confirmação de e-mail

**Onde:** Entrar > Recuperar acesso e Configurações.

![Figura 13 — Recuperação e confirmação de e-mail](imagens/evolucao-email.svg)

1. Solicite um código pelo e-mail da conta.
2. Cole o código recebido e escolha nova senha na recuperação.
3. Entre novamente; para verificar e-mail, use o fluxo de confirmação em Configurações.

**Resultado esperado:** Códigos de uso único ficam como hash; recuperar remove todas as sessões da conta.

**O que conferir:** Validade de 30 minutos. Exige Resend, chave e remetente verificado. Sem configuração, a tela informa indisponibilidade.

## 15. Sessões e tentativas repetidas

**Onde:** Perfil > Configurações > Sessões abertas.

![Figura 14 — Sessões e tentativas repetidas](imagens/evolucao-sessoes.svg)

1. Confira entrada atual, outras sessões e datas.
2. Encerre uma sessão ou todas as outras.
3. Se suspeitar de acesso indevido, recupere a senha.

**Resultado esperado:** IDs de sessão permitem gerenciar acessos sem expor tokens utilizáveis.

**O que conferir:** Sessão dura 12 horas. Login: 10 tentativas por e-mail; autenticação: 40 POSTs por IP em 15 minutos. Proxy exige atenção operacional.

## 16. Captura pontual de GPS

**Onde:** Idoso > Configurações > Compartilhar minha posição.

![Figura 15 — Captura pontual de GPS](imagens/evolucao-gps.svg)

1. O responsável habilita compartilhamento e cuidadores individualmente.
2. A pessoa idosa escolhe compartilhar no próprio aparelho e permite localização.
3. Toque em Enviar minha posição agora; para interromper, apague o ponto e desligue compartilhamento.

**Resultado esperado:** Só a conta idosa vinculada envia posição; a API guarda o ponto mais recente com precisão e horário.

**O que conferir:** Sem rastreamento contínuo. Mais de 5 minutos é desatualizado; após 24 horas o ponto é retirado. Mapa externo é opcional.

## 17. Memórias e mídia privada

**Onde:** Memórias > Adicionar e Arquivo privado.

![Figura 16 — Memórias e mídia privada](imagens/evolucao-midia.svg)

1. Escolha a pessoa, a categoria e um arquivo.
2. Salve a memória com título e referência.
3. Para abrir, toque no arquivo; a API confere acesso novamente.

**Resultado esperado:** Arquivos novos ficam fora do SQLite, identificados como media:UUID, sem URL pública.

**O que conferir:** JPEG, PNG, WebP, MP3, WAV e MP4; 10 MB por arquivo, 200 MB por pessoa. Upload sem memória expira em 24 horas.

## 18. Exportação dos registros

**Onde:** Acompanhamento > Exportar.

![Figura 17 — Exportação dos registros](imagens/evolucao-exportacao.svg)

1. Selecione pessoa e período de até um ano.
2. Na web, baixe HTML e imprima ou salve PDF no navegador.
3. No nativo, gere o PDF e escolha destino de compartilhamento.

**Resultado esperado:** Inclui somente as áreas autorizadas, sem CPF, RG, endereço, GPS ou arquivos.

**O que conferir:** A cópia exportada fica fora do controle do aplicativo; escolha o destinatário com cuidado.

## 19. Leitura e navegação acessíveis

**Onde:** Perfil > Configurações > Aparência e leitura.

![Figura 18 — Leitura e navegação acessíveis](imagens/evolucao-acessibilidade.svg)

1. Escolha tema claro ou escuro e fonte de 100% a 160%.
2. Salve e confira rolagem e botões com fonte do sistema ampliada.
3. Use menu e abas autorizadas; valide também com leitor de tela.

**Resultado esperado:** Fontes e altura de linha aumentam juntas. Botões informam estados e ícones decorativos deixam de disputar foco.

**O que conferir:** Correções não substituem teste com pessoas idosas, TalkBack e VoiceOver. Veja ACESSIBILIDADE.md.

## 20. Consentimentos e direitos

**Onde:** Configurações > Privacidade, consentimentos e meus direitos.

![Figura 19 — Consentimentos e direitos](imagens/evolucao-privacidade.svg)

1. Escolha Minha conta ou pessoa cujo cadastro administra.
2. Registre o pedido, guarde protocolo e acompanhe resposta.
3. Indique autorização válida e digite AUTORIZAR ou REVOGAR para confirmar.

**Resultado esperado:** Revogar bloqueia cuidado, apaga posição GPS e invalida QR; a central continua acessível sem novo aceite.

**O que conferir:** Declaração não prova representação. O contato real do controlador precisa ser definido. Providências e cópias dependem do processo administrativo.

## 21. Hospedagem, backup e métricas

**Onde:** deploy/ e scripts/backup.py — ferramentas do mantenedor.

![Figura 20 — Hospedagem, backup e métricas](imagens/evolucao-operacao.svg)

1. Configure domínio, HTTPS, uma API e disco persistente conforme OPERACAO.md.
2. Configure chave fora do projeto e o timer diário; backup pausa a API brevemente.
3. Restaure em pasta nova e valide antes de planejar troca do ambiente.

**Resultado esperado:** Pacote AES-256-GCM reúne SQLite e mídia, manifesto e hashes. Métricas têm só contagens e duração.

**O que conferir:** Infraestrutura e contas externas não foram ativadas. Docker, systemd e nuvem requerem teste no servidor; restauração local usa dados sintéticos.

## 22. Se algo não funcionar

| Situação | Como agir |
| --- | --- |
| Sessão expirada | Entre novamente; cache e fila pertencem à sessão. |
| Sem permissão | Peça revisão ao administrador; link não concede acesso. |
| Conflito | Compare servidor e conteúdo local antes de repetir. |
| E-mail indisponível | O mantenedor precisa conectar remetente e Resend. |
| Sem SQLCipher | Use build nativa própria ou mantenha conexão. |
| Sem lembrete | Confira permissão, horários, sessão e agenda de 12 horas. |
| Sem posição | O titular precisa enviar captura recente do próprio aparelho. |
| Sem mídia | Confira sessão, permissão e arquivo; links dependem de terceiros. |

## 23. Código por trás de cinco ações

Parte opcional para quem deseja estudar. O manual-aula mostra todas as funcionalidades, com linhas reais e explicações.

### Doses recorrentes

Fonte: `backend/src/main/java/com/cuidadosamente/backend/controlador/EvolucaoController.java`, linha 731. Os números à esquerda são as linhas reais.

```java
731 |       for (LocalDate dia = dataInicial; !dia.isAfter(dataFinal); dia = dia.plusDays(intervalo)) {
732 |         for (String hora : horarios) {
733 |           String registroId = UUID.randomUUID().toString();
734 |           doses++;
735 |           comandos.add(new Object[] {
736 |             "INSERT INTO registros(id,owner_id,idoso_id,tipo,titulo,data,horario,detalhes,status,plano_id,fuso) VALUES(?,?,?,'medicamentos',?,?,?,?, 'pendente',?,?)",
737 |             registroId,
738 |             cuidados.donoDosDados(id),
739 |             id,
740 |             titulo,
741 |             dia.toString(),
742 |             hora,
743 |             detalhes,
744 |             planoId,
745 |             fuso,
746 |           });
747 |           comandos.add(
748 |             cuidados.evento(
```

O laço percorre dias e horários. Cada combinação recebe UUID, registro pendente e evento dose_programada.

### Lembretes e privacidade

Fonte: `src/core/notificacoes/lembretes.native.ts`, linha 195. Os números à esquerda são as linhas reais.

```typescript
195 |             body: preferencias.notification_details
196 |               ? r.titulo + ' - abra o aplicativo para conferir e registrar.'
197 |               : 'Há um cuidado programado. Abra o aplicativo para conferir.',
198 |             data: { conta: usuario.id, tipo: r.tipo, idosoId: r.idosoId },
199 |             sound: 'default',
200 |           },
201 |           trigger: {
202 |             type: Notifications.SchedulableTriggerInputTypes.DATE,
203 |             date: data,
204 |             channelId: CANAL,
205 |           },
206 |         });
207 |         // O logout pode ocorrer enquanto a chamada nativa ainda está agendando.
208 |         if (versao !== geracao) {
209 |           await Notifications.cancelScheduledNotificationAsync(identifier);
210 |           return 0;
```

A escolha muda texto detalhado ou genérico. O aviso leva conta e área; o gatilho DATE agenda o instante calculado.

### Histórico de autoria

Fonte: `backend/src/main/java/com/cuidadosamente/backend/controlador/CuidadosController.java`, linha 2018. Os números à esquerda são as linhas reais.

```java
2018 |     var estadoAnterior = new LinkedHashMap<>(antes);
2019 |     var estadoPosterior = new LinkedHashMap<>(depois);
2020 |     estadoAnterior.remove("midia");
2021 |     estadoPosterior.remove("midia");
2022 |     return new Object[] {
2023 |       "INSERT INTO audit_events(id,idoso_id,actor_id,actor_name,tipo,entity_id,action,occurred_at,before_json,after_json) VALUES(?,?,?,?,?,?,?,?,?,?)",
2024 |       UUID.randomUUID().toString(),
2025 |       pessoa,
2026 |       autor,
2027 |       buscarUsuario(autor).get("nome"),
2028 |       tipo,
2029 |       entidade,
2030 |       acao,
2031 |       Instant.now().toString(),
2032 |       conversorJson.writeValueAsString(estadoAnterior),
2033 |       conversorJson.writeValueAsString(estadoPosterior),
2034 |     };
2035 |   }
2036 | 
2037 |   Map<String, Object> contatoEmergencia(String pessoa) {
2038 |     var contatos = banco.consultar(
2039 |       "SELECT nome,telefone,nome_alternativo AS " +
```

O servidor usa o autor autenticado, copia os estados, retira mídia e grava UUID e horário UTC na trilha.

### Offline e conflitos

Fonte: `src/core/offline/armazenamento.native.ts`, linha 57. Os números à esquerda são as linhas reais.

```typescript
057 |     const suporte = await db.getFirstAsync<Record<string, string>>('PRAGMA cipher_version');
058 |     if (!suporte || !Object.values(suporte)[0]) {
059 |       throw new Error(
060 |         'Este aplicativo não tem SQLCipher. Instale uma build com armazenamento protegido para usar offline.',
061 |       );
062 |     }
063 |     // A chave é hexadecimal gerada localmente; nenhum texto de usuário entra no PRAGMA.
064 |     await db.execAsync('PRAGMA key = "x\'' + chave + '\'";');
065 |     await db.execAsync(
066 |       'CREATE TABLE IF NOT EXISTS cache (chave TEXT PRIMARY KEY, escopo TEXT NOT ' +
067 |         'NULL, dados TEXT NOT NULL, expires INTEGER NOT NULL); CREATE TABLE IF NOT ' +
068 |         'EXISTS pending (id TEXT PRIMARY KEY, escopo TEXT NOT NULL, caminho TEXT NOT ' +
069 |         'NULL, metodo TEXT NOT NULL, corpo TEXT NOT NULL, erro TEXT NOT NULL DEFAULT ' +
070 |         "'', instante INTEGER NOT NULL);",
071 |     );
072 |     banco = db;
073 |     return db;
074 |   } catch (erro) {
075 |     await db.closeAsync().catch(() => {});
```

O código exige SQLCipher. A chave aleatória fica no SecureStore e é aplicada antes das tabelas privadas.

### Consentimentos e direitos

Fonte: `backend/src/main/java/com/cuidadosamente/backend/controlador/EvolucaoController.java`, linha 961. Os números à esquerda são as linhas reais.

```java
961 |       if (!permitido) {
962 |         comandos.add(new Object[] { "DELETE FROM location_points WHERE idoso_id=?", id });
963 |         comandos.add(new Object[] { "DELETE FROM location_sharing WHERE idoso_id=?", id });
964 |         comandos.add(new Object[] { "DELETE FROM qr_access WHERE idoso_id=?", id });
965 |       }
966 |       comandos.add(
967 |         cuidados.evento(
968 |           id,
969 |           usuarioId,
970 |           "acesso",
971 |           id,
972 |           permitido ? "consentimento_registrado" : "consentimento_revogado",
973 |           Map.of(),
974 |           Map.of("representacao", papel)
975 |         )
976 |       );
```

Revogação remove ponto, compartilhamento e QR na transação. A validação central bloqueia novas operações de cuidado.

## 24. Tela do diário no celular

![Diário — tela real da prévia web, dados fictícios](imagens/tela-acompanhamento.png)

A aba marcada indica onde você está. Use Passagem de turno para a próxima equipe e Correção para acrescentar uma retificação. O conteúdo continua pela rolagem; a barra inferior preserva o tamanho de seus botões.

## 25. Tela do histórico

![Histórico — autor, instante e conteúdo sintético](imagens/tela-historico.png)

Escolha a categoria. Antes e Depois permitem conferir a alteração; eventos anteriores à atualização não ganham autoria retroativa.

## 26. Tela de leitura e avisos

![Configurações — preferências na prévia web](imagens/tela-configuracoes.png)

Escolha o tamanho da letra e role para ajustar lembretes. A web exibe as preferências; entrega de aviso exige a build Android/iOS. As capturas usam uma conta de demonstração, sem dados pessoais reais.

## 27. Encontre seu caminho na nova interface

![Painel no celular com dados fictícios](imagens/tela-painel-celular.png)

1. Veja a pessoa acompanhada e o resumo do dia no painel.
2. No celular, use Início, Rotina, Memórias e Perfil. Toque em Mais para acessar as demais telas. Com letras maiores, algumas opções passam ao menu.
3. No computador, use o menu lateral. O conteúdo fica centralizado e tem a mesma ordem do celular.

![Painel no computador com dados fictícios](imagens/tela-painel-desktop.png)

O perfil idoso prioriza Emergência. A cor roxa indica a área selecionada. Os cartões mostram também o nome do estado, para que você não precise interpretar apenas uma cor.

## 28. Contas de demonstração e acesso por senha

As contas citadas em capturas e roteiros são fictícias. Esta documentação não distribui credenciais nem garante que uma instalação contenha um conjunto de demonstração. O mantenedor pode preparar um ambiente separado conforme CONTAS_PREENCHIDAS.md.

1. Na entrada, escolha o perfil correspondente à sua conta.
2. Para a pessoa idosa, use e-mail e senha somente se esse acesso foi preparado pelo proprietário, ou utilize um QR válido.
3. Confira a pessoa acompanhada antes de abrir os registros.

Não execute uma carga de demonstração no banco de cuidado real para seguir um tutorial.

## 29. Atualização de organização do código

O clean code de 12/10/2026 reorganizou os fontes e atualizou os exemplos destes manuais. Os passos, telas, permissões e funcionalidades de uso permanecem os mesmos.

## 30. Guia de leitura e preparação para começar

Este manual atende pessoas idosas, cuidadores e responsáveis. A primeira parte apresenta cada recurso; esta parte reúne roteiros completos para usar esses recursos em conjunto. Não é necessário saber programação. Os capítulos de código da primeira parte são opcionais.

![Organização do cuidado por perfil](imagens/manuais/perfis.svg)

Antes de começar, tenha uma instalação funcionando, uma conta adequada ao seu papel e autorização válida para acompanhar a pessoa. Se você recebeu apenas o código-fonte do GitHub, será necessário executar ou instalar o projeto. O repositório não é, por si só, um serviço já hospedado.

| Se você quer... | Leia primeiro |
| --- | --- |
| Preparar o acompanhamento como responsável | Capítulos 31 a 34 |
| Entrar como cuidador convidado | Capítulos 35 e 36 |
| Usar o aparelho da pessoa idosa | Capítulo 37 |
| Cuidar dos registros no dia a dia | Capítulos 38 a 41 |
| Entender rede, lembretes e conflitos | Capítulos 42 e 43 |
| Resolver dificuldades | Capítulos 47 e 48 |

As capturas representam uma prévia web com dados fictícios. Podem mostrar datas anteriores à edição e opções que mudam conforme perfil, permissão e tamanho da tela. As figuras com setas são diagramas explicativos, não telas de botões que você deve procurar.

**Primeira conferência:** veja se o nome da conta e a pessoa acompanhada estão corretos. Em um aparelho compartilhado, cada adulto deve usar sua própria conta. Isso permite reconhecer quem escreveu e retirar acessos individualmente.

O aplicativo organiza informações declaradas por seus usuários. Registros, resumos e lembretes não substituem orientação profissional, atendimento de urgência nem confirmação presencial de um cuidado.

## 31. Preparar a execução ou receber uma instalação

Quem recebeu o aplicativo pronto deve pedir ao mantenedor o endereço ou a instalação correta. Confirme também quem atende pedidos de privacidade e suporte. Quem recebeu o código pode usar o roteiro abaixo com apoio técnico; as instruções completas ficam em `docs/COMO_EXECUTAR.md`.

| Requisito | Finalidade |
| --- | --- |
| Node.js 22.13 ou superior | Ferramentas do aplicativo |
| JDK 21 | Execução da API Java |
| Dependências com npm ci | Instalação conforme o arquivo de versões |
| API em funcionamento | Contas, permissões e registros |
| Navegador ou build Android/iOS | Interface de uso |

Na pasta raiz, execute `npm ci`. No Windows com PowerShell, inicie `npm run backend` em um terminal e `npm run web` em outro. Deixe os dois processos abertos durante o uso. Para parar, use Ctrl+C em cada terminal.

Em Linux ou macOS sem PowerShell, o mantenedor pode iniciar a API dentro de `backend` com `./mvnw spring-boot:run`, usando JDK 21. O banco padrão é relativo ao diretório de execução. Não mude esse destino de uma instalação existente sem planejar a continuidade dos dados.

No telefone, a API precisa ser alcançável pela rede configurada. `localhost` do telefone não aponta para o computador. O mantenedor deve configurar `EXPO_PUBLIC_API_URL` com a base correta terminando em `/api`, além das origens web permitidas quando aplicável.

**Resultado esperado:** a tela de entrada abre e uma conta de teste consegue consultar a API. Só ver a interface não comprova conexão. Lembretes, GPS e cache offline têm requisitos nativos adicionais; confira a comparação de plataformas no capítulo 46.

## 32. Criar sua conta adulta, etapa por etapa

Abra a entrada e escolha o perfil adequado, Cuidador ou Responsável. O cadastro adulto está dividido em cinco etapas. Use seu próprio e-mail e uma senha exclusiva; as contas citadas em exemplos não são acessos públicos prontos para entrar.

1. Informe um e-mail válido que você consiga consultar.
2. Crie uma senha atendendo aos quatro requisitos mostrados: ao menos oito caracteres, letras maiúsculas e minúsculas, número e símbolo.
3. Informe seu nome. Confira a grafia antes de avançar.
4. Preencha dados adicionais somente quando necessários. Se informar nascimento, use uma data válida; documentos e endereço não são obrigatórios.
5. Leia os Termos de Uso, a Política de Privacidade e a declaração sobre tratamento de dados de saúde. Confirme cada escolha e conclua o cadastro.

O limite técnico do servidor para senha é de 72 bytes; caracteres acentuados podem ocupar mais de um byte. Use o indicador da tela e evite uma frase tão longa que ultrapasse esse limite. Não registre a senha no diário nem a envie ao cuidador.

Se aparecer uma mensagem, leia o campo indicado e corrija a etapa. Avançar entre etapas ainda não significa criar a conta. O envio acontece na conclusão do fluxo. Evite repetir o toque enquanto o aplicativo indica que está salvando.

**Resultado esperado:** após o cadastro aceito, você chega ao painel. Uma lista vazia pode significar que ainda não há pessoas cadastradas ou vínculos aceitos. Não crie uma segunda conta apenas porque o painel começou vazio.

**Se o e-mail já estiver em uso:** volte à entrada e tente recuperar o acesso. O envio de códigos depende da integração de e-mail configurada pelo mantenedor. Sem essa configuração, será necessário suporte da instalação.

## 33. Cadastrar a pessoa acompanhada com o mínimo necessário

Na área de Pessoas ou Contas de idosos, confira se você está usando a conta adulta que deve administrar o acompanhamento. Informe o nome da pessoa e faça a declaração de autorização exigida. O perfil chamado Responsável no aplicativo não comprova, sozinho, representação legal.

![Antes de compartilhar: pessoa, autorização e acesso](imagens/manuais/autorizacao.svg)

1. Abra a ação de novo cadastro disponível ao seu perfil.
2. Informe o nome pelo qual a pessoa deve ser identificada.
3. Preencha dados opcionais apenas se forem necessários à finalidade do cuidado.
4. Leia a declaração e indique corretamente a autorização do titular ou a representação legal aplicável.
5. Salve e confira se o nome aparece na seleção de pessoas.

Ao acompanhar mais de uma pessoa, use os nomes na seleção e leia o cabeçalho completo antes de criar uma rotina, uma dose ou uma memória. Um título parecido não identifica a pessoa. Faça essa conferência novamente ao retornar de outra tela.

**Exemplo fictício:** uma família quer começar apenas com nome, rotinas e um contato de emergência. Ela pode deixar CPF, RG e endereço vazios. Esses campos não são requisitos para experimentar a organização inicial do cuidado.

**Resultado esperado:** o cadastro aparece na conta administradora e pode receber registros. Ele não se torna automaticamente visível para qualquer cuidador; será necessário convite, aceite e concessões de acesso.

Se não houver autorização válida, interrompa o cadastro de dados de cuidado e esclareça a situação com o responsável pela operação. Uma caixa marcada não substitui a verificação real necessária para tratar dados de outra pessoa.

## 34. Reconhecer o painel e navegar sem perder a pessoa

![Painel de demonstração no celular](imagens/tela-painel-celular.png)

O painel reúne o contexto da pessoa acompanhada, o resumo do dia e as próximas informações disponíveis ao perfil. Leia os rótulos junto com as cores: concluídas, pendentes e em atraso descrevem estados diferentes.

No celular, use a barra inferior e a opção Mais. No computador, o menu lateral oferece os destinos. Quando as letras aumentam, algumas opções mudam de lugar para preservar espaço. A ausência de um atalho na barra não significa necessariamente que o recurso foi removido.

1. Localize o cartão com a pessoa acompanhada.
2. Se houver várias pessoas, escolha a correta.
3. Abra a área desejada, como Rotina, Remédios, Consultas ou Memórias.
4. Confira de novo a pessoa e a data ou filtro selecionado.

**Resultado esperado:** a lista corresponde à pessoa e aos filtros atuais. Uma quantidade no resumo do dia não representa o histórico completo de todas as datas. Uma lista vazia também pode resultar de um filtro, de falta de permissão ou da inexistência de registros.

Quando um dado parecer ausente, confira a seleção antes de adicioná-lo outra vez. Isso evita duplicar uma consulta que estava em outro dia ou criar uma rotina para a pessoa errada.

## 35. Convidar um cuidador e conferir o aceite

Cada cuidador deve ter uma conta própria. O responsável usa o e-mail dessa conta para enviar o convite na área Permissões. O convite permanece pendente até a resposta do destinatário; apenas enviar o convite não libera os dados do cuidado.

1. Entre como administrador da pessoa e abra Permissões.
2. Selecione a pessoa correta e informe o e-mail do cuidador existente.
3. Envie o convite e peça ao destinatário que abra Configurações na própria conta.
4. O cuidador confere quem convidou e aceita ou recusa.
5. Depois do aceite, o administrador revisa as permissões específicas.

O convite vale sete dias. Após o aceite, o vínculo começa com validade de 90 dias. A revisão pode conceder nova validade dentro do limite previsto, até um ano. Planeje a revisão antes do vencimento para evitar interrupção do acesso no turno.

**Exemplo fictício:** Lucas recebe um convite para acompanhar a pessoa cadastrada por Marina. Antes do aceite, ele vê quem convidou, sem consultar os registros de cuidado. Após aceitar, as áreas disponíveis ainda dependem das concessões feitas para seu vínculo.

**Se o convite não aparece:** confira a conta e o e-mail exato, peça ao administrador para verificar a situação e a validade. Não compartilhe a senha do responsável como solução. Contas separadas preservam a autoria e permitem encerrar somente o vínculo necessário.

**Resultado esperado:** o cuidador vê a pessoa autorizada e consegue apenas as ações concedidas. Se o acesso vencer, é o administrador que deve revisar o vínculo; reinstalar o aplicativo não renova a autorização.

## 36. Escolher permissões de forma consciente

Permissões são específicas por pessoa, área e ação. Poder ver uma lista não implica poder editar ou excluir. A tela agrupa Rotina, Remédios, Consultas e Banco de memórias, além de acessos adicionais como contatos e relatórios.

| Ação | O que permite | Exemplo de decisão |
| --- | --- | --- |
| Ver | Consultar os itens autorizados | Ler a rotina do turno |
| Adicionar | Criar novos registros | Escrever uma atividade |
| Alterar | Corrigir campos existentes | Ajustar um horário informado |
| Concluir ou reabrir | Mudar o estado do item | Registrar a conclusão declarada |
| Excluir | Remover um item | Apagar um cadastro indevido |

Selecione primeiro a pessoa e depois quem receberá as permissões. Leia os grupos antes de salvar. As opções da pessoa idosa são limitadas ao que esse perfil suporta. Algumas ações administrativas pertencem ao proprietário e não são liberadas simplesmente por marcar todas as áreas.

**Roteiro de conferência:** conceda o necessário, peça ao cuidador para atualizar a tela e verifique uma ação permitida. Depois confira uma ação que deve permanecer bloqueada, sem tentar contornar o bloqueio. Repita para outra pessoa apenas se existir autorização própria para ela.

Localização tem controles específicos de compartilhamento e de autorização individual do cuidador. Ver medicamentos não concede automaticamente acesso ao mapa. A revogação também precisa considerar vínculos e validade, não só a visibilidade de um botão.

**Resultado esperado:** cada pessoa usa o acesso necessário ao seu papel. Se uma ação estiver ausente, o administrador deve conferir a concessão; um link direto não concede uma nova permissão.

## 37. Preparar o acesso da pessoa idosa

O acesso da pessoa idosa deve abrir somente seu próprio cuidado. O administrador pode gerar um QR de uso único ou preparar a alternativa de e-mail e senha. Não use a conta adulta no aparelho da pessoa para evitar que ela receba poderes administrativos.

![Sequência de acesso da pessoa idosa](imagens/manuais/acesso-idoso.svg)

1. No acesso adulto autorizado, selecione a pessoa correta.
2. Gere o QR e mantenha-o disponível somente durante a preparação.
3. No aparelho da pessoa, abra o acesso por QR, permita a câmera se necessário e leia o código; a digitação é a alternativa disponível.
4. Confira o nome apresentado e acompanhe a leitura dos documentos solicitados.
5. Abra a rotina e verifique os destinos adequados ao perfil.

O QR vale dez minutos e só pode ser usado uma vez. Se expirar, gere outro. Não publique a imagem nem a inclua em um tutorial público, pois ela funciona como credencial temporária de entrada.

A alternativa de senha precisa ser configurada pelo proprietário. Prepará-la invalida acessos técnicos anteriores conforme o fluxo do sistema. Não há uma senha universal para todas as pessoas idosas nem uma senha pública nas imagens deste manual.

**Ao desconectar o acesso:** QR, senha opcional e sessões vinculadas são desativados conforme a ação. Os registros de cuidado são preservados. Para voltar a usar o aparelho, prepare um novo acesso autorizado.

**Resultado esperado:** a pessoa vê seu próprio cuidado e as ações permitidas. Ajuste letras, confira contatos de emergência e peça que ela experimente a navegação com apoio, respeitando sua autonomia.

## 38. Roteiro completo: criar, corrigir e concluir uma rotina

Use um registro de demonstração para aprender antes de escrever informações reais. O roteiro vale como modelo para listas de rotina; medicamentos, consultas e memórias adaptam os campos e as permissões.

![Vida de um registro e retorno para correção](imagens/manuais/ciclo-registro.svg)

1. Abra Rotina e escolha a pessoa acompanhada.
2. Confira o dia e o filtro. Abra a ação de adicionar se ela estiver permitida.
3. Informe um título claro, data, horário e detalhes necessários.
4. Salve, aguarde o resultado e localize o item na lista.
5. Para corrigir, abra a edição, revise os campos e salve novamente.
6. Use Concluir somente quando quiser registrar a declaração correspondente. Reabrir retorna o item ao estado pendente, quando permitido.

**Exemplo fictício:** título “Leitura acompanhada”, dia 28/10/2026, horário 15:00 e detalhe “Separar o livro escolhido pela pessoa”. Se você estiver usando o roteiro em outra data, escolha uma data adequada ao exercício e confira o filtro.

Uma conclusão não comprova que a ação ocorreu fisicamente. Ao lidar com medicamentos, mantenha as orientações profissionais e a conferência do cuidado real. O aplicativo não deve ser usado para decidir uma dose a partir de um cartão pendente.

**Se o item não aparecer:** procure no dia informado, retire filtros de pesquisa e confira a pessoa. Se existir sinal de sincronização pendente, a operação ainda depende do envio ao servidor. Não adicione outra cópia sem investigar.

**Excluir ou corrigir?** Prefira a correção quando o objetivo for ajustar um campo e a permissão existir. Excluir é uma ação própria e deve ser usada com atenção à pessoa e ao item. Consulte o histórico para compreender as mudanças registradas.

## 39. Roteiro completo: doses recorrentes e lembretes

Use Doses recorrentes em Acompanhamento para registrar um plano já orientado. O aplicativo não prescreve a dose, não decide interações e não substitui a conferência da orientação por quem presta o cuidado.

1. Selecione a pessoa, o título e os detalhes necessários.
2. Informe início e fim do período, o intervalo de dias e os horários.
3. Confira o fuso, especialmente se a pessoa ou o aparelho estiver viajando.
4. Revise a quantidade de ocorrências e programe as doses.
5. Abra a lista de medicamentos e confira cada ocorrência.

**Exemplo fictício sem prescrição:** dois horários em dois dias consecutivos produzem quatro registros. Cada ocorrência possui seu próprio estado. Concluir uma não conclui as outras três. O plano usa o fuso informado, e não uma mudança casual de fuso do aparelho.

Os limites implementados incluem até um ano de período, oito horários, intervalo inteiro de 1 a 30 dias e até 730 doses. O começo precisa ser hoje ou depois no fuso escolhido. Se o plano ultrapassar um limite, reduza o período e revise a organização com quem acompanha o cuidado.

Cancelar o plano remove somente doses futuras ainda pendentes conforme o fluxo. Revise os registros restantes depois da confirmação; não presuma que todo o histórico foi apagado.

Para receber avisos, a build nativa deve suportar notificações, a permissão do sistema deve estar ativa e a preferência do aplicativo precisa estar ligada. São preparados até 50 avisos nas próximas 12 horas, dentro da validade da sessão. Abra o aplicativo diariamente e confira o funcionamento em aparelho real.

**Resultado esperado:** ocorrências corretas na lista e, quando todos os requisitos forem atendidos, agenda local de avisos. Tocar no aviso abre o contexto do cuidado; não marca automaticamente a dose como tomada.

## 40. Diário, passagem de turno e histórico de autoria

O diário registra informações de continuidade. O histórico mostra eventos de alteração. Eles respondem a perguntas diferentes: o diário explica o que precisa ser comunicado; o histórico ajuda a saber quem mudou um registro e o que mudou.

![Diário de demonstração](imagens/tela-acompanhamento.png)

No diário, escolha Observação, Passagem de turno ou Correção. Escreva de forma objetiva: o que foi observado, quando ocorreu e o que a próxima pessoa precisa conferir. Evite inserir documentos, senhas ou detalhes sem utilidade para o acompanhamento.

**Modelo fictício de passagem:** “Turno encerrado às 18:00. A atividade de leitura permanece pendente por escolha da pessoa. O livro está na sala. Próximo turno: confirmar se ela deseja retomar.” Esse texto comunica uma situação sem transformar uma intenção em fato concluído.

Uma correção do diário deve ser outra entrada, identificando o conteúdo que está sendo retificado. As anteriores permanecem. O limite de texto é de 4000 caracteres por entrada e a consulta apresenta até 200 entradas; não trate a tela como um arquivo ilimitado.

No histórico, escolha a categoria e confira ação, autor, instante e Antes/Depois. São mostrados até 300 eventos; a retenção técnica padrão é 365 dias, sujeita à configuração operacional. Alterações antigas sem eventos não recebem autoria retroativa.

**Resultado esperado:** a próxima pessoa entende a passagem e consegue consultar a mudança pertinente no histórico quando necessário. Nenhuma dessas telas comprova, sozinha, ingestão de medicamento ou presença física durante uma ação.

## 41. Memórias, arquivos e relatórios

No Banco de memórias, selecione a pessoa, a categoria ou pasta desejada e crie o registro autorizado. Use título e detalhes que ajudem a reconhecer o conteúdo. Peça autorização antes de acrescentar imagens ou relatos de outras pessoas.

Arquivos novos passam pelo envio autenticado e ficam em armazenamento privado da instalação. O fluxo aceita JPEG, PNG, WebP, MP3, WAV e MP4 com formato reconhecido, até 10 MB por arquivo e 200 MB por pessoa. Alterar apenas a extensão não converte um arquivo para um formato aceito.

1. Confirme a pessoa e a permissão de adicionar memórias.
2. Escolha um arquivo de teste permitido pelo seletor da plataforma.
3. Aguarde o envio antes de sair da tela.
4. Salve o registro e teste a abertura pela conta autorizada.

Links antigos para serviços externos podem continuar disponíveis, mas dependem desses serviços. Um arquivo privado exige sessão e permissão na abertura. Uma cópia exportada ou compartilhada passa a exigir cuidado fora do aplicativo.

Para exportar registros em Acompanhamento, escolha um período de até 366 dias e confira as áreas incluídas. Só entram dados autorizados. O formato de impressão ou compartilhamento depende do navegador e da plataforma; revise o resultado antes de entregar a outra pessoa.

**Relatório não é backup.** Ele contém um recorte de informações para leitura, sem necessariamente incluir todas as estruturas, arquivos e controles necessários para restauração. O backup da instalação é responsabilidade operacional e está descrito no capítulo 49.

**Resultado esperado:** a memória abre apenas para quem tem acesso, e a exportação contém a pessoa e o período pretendidos. Não publique relatórios de cuidado em repositórios ou links abertos.

## 42. Usar sem rede e resolver conflito com cuidado

O modo offline exige build nativa própria com SQLCipher e ativação do cache. Ele não é demonstrado pelo funcionamento da web ou do Expo Go. Prepare o recurso enquanto ainda houver rede e confira o comportamento com o mantenedor em um aparelho de teste.

![Decisões ao salvar e sincronizar](imagens/manuais/offline.svg)

O cache permite trabalhar com registros previamente armazenados dentro da validade de até 15 minutos desde a atualização de acesso prevista pelo fluxo. A fila aceita até 100 alterações. Mídias não fazem parte desse cache. Não conte com uma nova pessoa ou arquivo que nunca foi carregado.

1. Com rede, ative a opção e abra os dados autorizados.
2. Ao perder conexão, observe os avisos e identifique o que está pendente.
3. Reconecte mantendo a mesma sessão e acompanhe a sincronização.
4. Se houver conflito, compare o conteúdo local e o atual do servidor.
5. Copie para um destino privado autorizado somente o que precisa preservar, descarte a alteração local conforme a tela e faça uma nova edição consciente sobre a versão atual.

**Exemplo fictício:** você ajustou um título sem rede enquanto outra pessoa mudou o horário no servidor. Repetir sua cópia inteira sem ler o servidor pode apagar a correção do horário. A conferência deve preservar a informação correta de ambos quando fizer sentido.

Sair da conta, trocar de sessão ou receber uma recusa de acesso limpa cache e fila conforme o mecanismo de proteção. Alterações ainda não sincronizadas podem ser perdidas. Uma revogação feita enquanto o aparelho está desconectado só é conhecida ao reconectar, dentro dos limites de validade local.

**Resultado esperado:** a fila chega ao servidor após revalidação de acesso e versão, ou apresenta uma falha que precisa de decisão. Um item na fila ainda não é uma confirmação de gravação no banco central.

## 43. Ajustar notificações, letras e leitura

Em Perfil, abra Configurações. Escolha o tema e o tamanho de letra adequado, entre a escala padrão e o limite disponível de 160%. A escala do aparelho também pode influenciar a apresentação. Confira se os rótulos continuam legíveis e se você consegue rolar toda a tela.

![Preferências de leitura na prévia web](imagens/tela-configuracoes.png)

Para avisos, ative Lembretes do cuidado na build nativa e permita notificações no sistema. Escolha a antecedência de consulta. A opção de detalhes determina quanto conteúdo aparece; em um aparelho compartilhado ou na tela bloqueada, prefira a mensagem discreta.

**Se não chegou um aviso:** confira se o registro está no período agendado, se a sessão continua válida, se o limite da agenda foi atingido e se o sistema operacional permite a entrega. Abra o aplicativo para atualizar a agenda. Economia de bateria e configurações do aparelho precisam de avaliação real.

Receber um aviso não prova que a pessoa leu o conteúdo; tocar nele não conclui o registro. Para corrigir um cuidado, abra sua lista, leia o item e execute a ação apropriada com a permissão necessária.

**Conferência de acessibilidade:** percorra a tela com letras ampliadas, identifique os botões pelos rótulos e teste o leitor de tela se você o utiliza. Relate ao mantenedor qualquer campo cortado ou controle sem descrição, indicando aparelho, tela e tamanho de fonte.

## 44. Localização pontual e contatos de emergência

A localização é enviada por uma ação voluntária da conta idosa vinculada, no próprio aparelho, em primeiro plano. Primeiro o responsável habilita o compartilhamento; cuidadores recebem autorização individual para consultar. O perfil idoso envia sua posição, mas não recebe um mapa de outras pessoas.

1. O responsável confere a pessoa e habilita o compartilhamento autorizado.
2. Cada cuidador que precisa consultar recebe sua concessão específica.
3. No aparelho da pessoa, abra Configurações, permita localização e escolha Enviar minha posição agora.
4. Na conta autorizada, confira horário e precisão antes de interpretar o ponto.

Somente o ponto mais recente é mantido, por até 24 horas. O envio exige captura recente: até cinco minutos de idade, com tolerância técnica limitada para diferença de relógio. A tela não representa rastreamento contínuo nem garante que a pessoa continue naquele lugar.

Se a precisão for baixa, não interprete a posição como um endereço exato. Se não houver ponto, peça uma nova captura voluntária e confira as autorizações. Para interromper, use a ação de apagar o ponto e desligar o compartilhamento.

Contatos principal e alternativo são cadastrados por pessoa em Acompanhamento. Na tela Emergência, escolha o contato e confirme no discador. A chamada depende de aparelho e rede; não ocorre automaticamente e não substitui serviços de emergência.

**Resultado esperado:** o ponto disponível tem contexto de horário e precisão, e o contato correto é mostrado para a pessoa selecionada. Confira esses dados novamente sempre que houver mudança de telefone ou de responsável.

## 45. Privacidade, sessões e saída de pessoas da equipe

Na central de Privacidade, consulte o canal configurado e registre pedidos de acesso, correção, exclusão, revogação ou informação. Descreva o necessário e confira o protocolo. Enviar um pedido não executa automaticamente uma exclusão; existe atendimento operacional.

A revogação de autorização bloqueia novos pedidos de cuidado e remove controles como GPS e QR pendente conforme o fluxo. A central de direitos continua acessível pelas regras próprias da sessão. O mantenedor deve manter um canal real para acompanhar o pedido.

Em Sessões abertas, confira a sessão atual e encerre acessos que você não reconhece. A recuperação de senha encerra todas as sessões da conta. Códigos por e-mail valem 30 minutos e são de uso único. Login repetido pode atingir os limites de tentativas; não continue tentando sem revisar a entrada.

**Quando um cuidador sai:** ele pode retirar o próprio vínculo em Administração, ou o administrador remove o acesso correspondente. Confira todas as pessoas acompanhadas por esse cuidador. Não basta apagar o atalho ou desinstalar o aplicativo de um aparelho.

**Quando muda a administração:** a transferência exige a senha do administrador atual e a confirmação do destinatário com sua própria senha, em até 24 horas. Os registros são preservados, mas acessos técnicos e concessões precisam de nova revisão. O novo administrador deve revisar vínculos e preparar outro QR quando necessário.

**Exclusão exige atenção:** retirar um vínculo, desconectar o aparelho, revogar autorização, excluir uma pessoa e excluir uma conta são ações diferentes. Leia o texto da ação e o alcance antes de confirmar. A troca técnica de proprietário também não transfere representação jurídica.

## 46. Comparação entre web e aplicativo nativo

| Recurso | Web | Build Android/iOS preparada |
| --- | --- | --- |
| Contas e registros conectados | Disponíveis com API acessível | Disponíveis com API acessível |
| Permissões, diário e histórico | Dependem da API e do acesso | Dependem da API e do acesso |
| Preferências de leitura | Disponíveis na interface | Combinam-se com o aparelho |
| Lembretes locais | Não agenda | Exigem módulo, permissão e teste físico |
| GPS pontual do fluxo do projeto | Não é o fluxo nativo de captura | Exige permissão e ação voluntária |
| Fila offline cifrada | Não oferece a implementação nativa | Exige SQLCipher e build própria |
| Arquivos e compartilhamento | Dependem do navegador | Dependem do seletor e do sistema |

O Expo Go ajuda em partes do desenvolvimento, mas não comprova todas as capacidades de uma build própria. Não use um teste visual no navegador como prova de entrega de notificação, criptografia local ou comportamento da câmera e do GPS em aparelho.

Também há diferenças de navegação: menu lateral em janela larga, barra inferior e Mais em janela estreita. As rotas e permissões seguem as mesmas regras de acesso. Se um recurso não aparecer, confira primeiro perfil, concessão e plataforma.

**Para o mantenedor:** ao entregar uma instalação, informe quais plataformas foram avaliadas e quais recursos ainda dependem de configuração. Um PDF descreve o comportamento previsto no código; não certifica uma integração externa nem a disponibilidade de um serviço contratado.

## 47. Resolver problemas sem duplicar informações

![Roteiro de diagnóstico para o uso diário](imagens/manuais/diagnostico.svg)

| Situação | Primeira conferência | Ação apropriada |
| --- | --- | --- |
| Tela não mostra a pessoa | Conta, convite e validade | Entrar na conta correta ou pedir revisão |
| Lista vazia | Pessoa, data, pesquisa e área | Ajustar filtros antes de cadastrar novamente |
| Botão não aparece | Perfil e permissão da ação | Pedir conferência ao administrador |
| Não consegue entrar | E-mail, perfil e senha | Usar recuperação ou suporte configurado |
| Código não funciona | Tipo, validade e uso anterior | Solicitar um código novo pelo fluxo correto |
| Mudança não salva | Mensagem, conexão e versão | Tratar a causa antes de repetir |
| Arquivo não abre | Sessão, acesso e origem | Atualizar sessão e conferir o arquivo |
| Nenhuma posição | Compartilhamento e captura recente | Solicitar novo envio voluntário |

Se a interface abrir, mas nenhuma consulta funcionar, o problema pode ser a API ou seu endereço. Peça ao mantenedor para conferir o processo do servidor, a base terminando em `/api`, a rede do aparelho e as origens web autorizadas. Não altere dados do banco para tentar reparar uma falha de rede.

Se a conta foi criada, mas a confirmação por e-mail não chega, confira a mensagem da tela. A integração exige chave e remetente verificado do serviço de e-mail. Uma pasta de spam vazia não prova que o servidor conseguiu enviar.

Quando houver conflito, preserve a informação necessária em local privado e siga a comparação. Quando houver recusa de permissão, peça revisão. Reinstalar, repetir o toque ou trocar o relógio do aparelho não resolve esses motivos.

**Ao pedir suporte:** diga o perfil, a tela, a sequência e a mensagem. Use nomes fictícios na reprodução e oculte conteúdo de cuidado em capturas. Nunca envie a senha, o QR utilizável ou um token de sessão.

## 48. O que as mensagens e os estados significam

Os códigos técnicos abaixo ajudam quem presta suporte. Você não precisa decorá-los: a mensagem da tela deve orientar a ação. Anote o código quando aparecer, sem copiar informações privadas de uma requisição.

| Código ou estado | Significado prático | Como prosseguir |
| --- | --- | --- |
| 400 | Algum dado foi recusado | Rever campos e formato |
| 401 | Sessão não é válida | Entrar novamente |
| 403 | A ação não está autorizada | Conferir vínculo, autorização e concessão |
| 404 | Recurso indisponível naquele contexto | Conferir destino e conta com o suporte |
| 409 | Conflito de versão ou operação | Comparar conteúdos antes de reenviar |
| 413 | Arquivo ou envio acima do limite | Reduzir e conferir o arquivo |
| 428 | A versão exigida não foi enviada | Atualizar o fluxo com o mantenedor |
| 429 | Limite de tentativas atingido | Parar repetições e aguardar a janela |
| 503 | Integração indisponível | Pedir verificação da configuração |
| Pendente de sincronização | Alteração ainda precisa de confirmação | Reconectar na mesma sessão e acompanhar |

“Pendente” de uma rotina e “pendente de sincronização” não são equivalentes. O primeiro é o estado do cuidado registrado; o segundo é o estado do envio da alteração. Um item concluído localmente ainda pode aguardar sincronização.

Um indicador de carregamento também não prova sucesso. Aguarde a resposta, leia o aviso e confira o registro no contexto correto. Se o servidor pode ter recebido o envio antes da conexão cair, investigue a lista antes de criar uma nova cópia.

## 49. Atualização, conservação e cópia de segurança

Esta parte se destina ao mantenedor e a quem administra a instalação. Os usuários devem saber quem cuida das cópias e como solicitar continuidade. O banco e os arquivos privados precisam ser preservados separadamente dos fontes do aplicativo.

Os destinos padrão são `backend/data/cuidados.db` e `backend/data/media`, quando a API é iniciada no diretório esperado. Segredos e chaves não devem ser enviados ao GitHub. O repositório contém o código e esta documentação, não uma cópia pública dos dados de cuidado.

Antes de atualizar uma instalação real, planeje a parada, faça uma cópia restaurável e mantenha a versão anterior necessária à reversão. O script de backup usa SQLite e mídia para montar um pacote cifrado e autenticado. Sua operação exige a API parada para manter a consistência do conjunto.

Restaure primeiro em um diretório novo e verifique a integridade, o acesso autorizado e a presença das mídias. Não sobrescreva o banco ativo como teste. Uma cópia não verificada pode falhar justamente quando for necessária.

A chave de recuperação deve ter proteção e disponibilidade próprias. Perder a chave pode impedir a leitura; expor a chave junto da cópia enfraquece sua proteção. Siga `docs/OPERACAO.md` e as instruções do script em vez de improvisar uma rotina manual.

**Exclusões e restauração:** uma exclusão nos dados ativos não elimina automaticamente todas as cópias históricas. O processo de restauração precisa reconciliar exclusões, revogações e acessos. Defina essa responsabilidade operacional antes de depender de um backup para voltar ao serviço.

## 50. Treinamento guiado com dados fictícios

Use um ambiente de demonstração separado. O roteiro exercita a organização sem incluir dados reais e ajuda a identificar diferenças de aparelho, perfil e permissão. Combine o resultado esperado antes de começar.

1. Crie uma conta adulta de teste e uma pessoa fictícia com autorização de demonstração apropriada ao ambiente.
2. Crie uma rotina com título, data e horário fáceis de localizar.
3. Ajuste um detalhe, conclua e reabra o item quando a permissão permitir.
4. Abra o histórico e explique a diferença entre Antes e Depois.
5. Escreva uma passagem de turno e depois uma correção em nova entrada.
6. Convide outra conta de cuidador, aceite e confira uma ação permitida e uma bloqueada.
7. Ajuste letras e tema, localize Mais e volte ao painel.
8. Prepare o acesso da conta idosa, confira a pessoa e o contato de demonstração.
9. Gere um relatório de um período curto e verifique a pessoa e as áreas incluídas.
10. Retire o vínculo de teste e confira que novos pedidos de cuidado são recusados.

Avalie recursos nativos em uma etapa própria: permissão e entrega de avisos, captura voluntária, cache cifrado e reconexão com conflito. Não simule urgências nem faça ligações reais durante a demonstração de contatos.

**Critérios de aprendizado:** a pessoa consegue dizer qual conta está usando, qual pessoa está selecionada, se um item está pendente ou concluído e se uma alteração foi confirmada ou aguarda sincronização. Ela também sabe pedir ajuda sem compartilhar credenciais.

Se uma etapa falhar, registre a dificuldade e a plataforma. Corrija o roteiro ou a implementação com o mantenedor antes de ensinar a mesma sequência a outras pessoas. Ao encerrar, retire os acessos de demonstração e trate os dados de teste conforme a política da instalação.

## 51. Perguntas frequentes e glossário de uso

**Posso acompanhar duas pessoas?** Sim, quando a conta possuir cadastros ou vínculos autorizados para ambas. Confira a seleção antes de toda ação.

**Uma dose concluída significa medicamento ingerido?** Não. Significa que um usuário registrou a conclusão. A conferência real continua sob responsabilidade de quem presta o cuidado.

**O aplicativo marca consulta no estabelecimento?** Não. Ele organiza o registro informado e os avisos locais disponíveis; o agendamento externo precisa ser feito pelo canal adequado.

**O GPS acompanha continuamente?** Não. O fluxo implementado recebe uma captura voluntária e guarda o ponto mais recente por tempo limitado. Leia horário e precisão.

**Meu cuidador viu tudo depois do convite?** Não automaticamente. O convite precisa ser aceito e as ações dependem das permissões da pessoa e da validade do vínculo.

**Posso depender apenas dos avisos?** Não. A entrega depende do aparelho, da permissão, da agenda e da sessão. Mantenha a rotina de conferência adequada ao cuidado.

**O PDF contém senhas para entrar?** Não. Exemplos e imagens são fictícios. Receba credenciais ou convites por um canal privado do mantenedor.

| Palavra | Significado no uso |
| --- | --- |
| Pessoa acompanhada | Cadastro ao qual pertencem os registros |
| Vínculo | Relação de acesso entre conta e pessoa |
| Permissão | Ação específica concedida no contexto |
| Sessão | Entrada autenticada com validade |
| QR | Credencial temporária de acesso vinculado |
| Histórico | Eventos de mudanças nos dados |
| Diário | Anotações de continuidade do cuidado |
| Conflito | Alterações que precisam de comparação |
| Protocolo | Registro de pedido na central de direitos |
| Build nativa | Aplicativo compilado para Android ou iOS |

## 52. Referência rápida para o dia a dia

![Resumo das conferências antes de agir](imagens/manuais/rotina-segura.svg)

**Ao começar:** entre na sua conta, confira a pessoa e a data, leia a passagem de turno e observe os registros pendentes. Confirme se o aparelho tem conexão ou se existe uma fila ainda não enviada.

**Ao registrar:** escreva título e detalhes úteis, leia a mensagem de resultado e confira o item. Diferencie uma conclusão declarada de uma comprovação física. Não duplique um envio só porque o resultado demorou.

**Ao terminar:** revise o que permanece pendente, escreva uma passagem objetiva e sincronize alterações antes de encerrar a sessão. Em aparelho compartilhado, verifique a saída da conta depois de tratar a fila pendente.

**Periodicamente:** revise contatos, vínculos, validade e sessões. O mantenedor deve revisar integrações, canal de privacidade, cópias restauráveis e avaliações em aparelho real.

Para os procedimentos completos, consulte [Como executar](COMO_EXECUTAR.md), [Rotas](ROTAS.md), [API](API.md), [Operação](OPERACAO.md) e [situação das recomendações](RECOMENDACOES.md). Para aprender o código, use o Manual de sintaxe e o Manual-aula disponíveis no catálogo.

Edição documental: 27/10/2026. A versão dos documentos jurídicos é independente e deve ser conferida nos textos apresentados pelo aplicativo. Os exemplos deste manual não alteram os termos nem a política da instalação.
