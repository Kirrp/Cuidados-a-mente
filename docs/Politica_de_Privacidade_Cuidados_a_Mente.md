# Política de Privacidade — Cuidados à Mente

Versão 2026-10-11. Esta Política descreve os dados e as funções efetivamente presentes no Cuidados à Mente e identifica os pontos ainda pendentes de implantação. Dados de saúde recebem confirmação específica e destacada, separada dos Termos. Localização possui controles próprios e o GPS ainda não está conectado.

## 1. Controlador e canais

Controlador, responsável pelas decisões sobre o tratamento: [NOME OU RAZÃO SOCIAL E IDENTIFICAÇÃO A PREENCHER]. Endereço e país de operação: [A PREENCHER]. Contato de privacidade e exercício de direitos: [E-MAIL OU CANAL A PREENCHER]. Encarregado, quando aplicável, ou canal de atendimento aos titulares: [A DEFINIR]. O perfil Responsável do aplicativo não identifica o controlador nem constitui representação legal. Antes de uso público, o mantenedor deve definir esses papéis, identificar eventuais operadores, divulgar os contatos e organizar o atendimento. Não fornecemos um endereço fictício.

## 2. Dados da conta e do acesso

Nome, e-mail, senha, perfil de acesso e aceites são necessários à conta adulta. CPF, RG, nascimento, telefones e endereço passaram a ser opcionais; informe apenas o necessário. Senhas usam hash BCrypt; tokens aleatórios de sessão, QR e e-mail ficam como hashes, com validade e uso controlados. A verificação por e-mail confirma acesso à caixa postal quando o serviço está configurado; não comprova identidade civil. Preferências incluem tema, escala de fonte e opções de lembretes.

## 3. Dados da pessoa acompanhada

O cadastro exige nome e declaração de autorização válida, incluindo indicação de autorização do titular ou representação legal. Nascimento, documentos, contatos, endereço e observações são opcionais. O projeto não valida documentos de representação. Existem contatos de emergência principal e alternativo por pessoa, com nome e telefone, e compatibilidade com contatos antigos. Avise esses contatos e mantenha-os atualizados.

## 4. Rotina, medicamentos e consultas

São guardados tipo, pessoa, título, data, horário, detalhes, estado, versão e plano de doses, quando existir. Planos guardam início, fim, intervalo, horários e fuso. O histórico acrescenta autor autenticado, instante da ação e valores anteriores e posteriores; não reconstrói autoria de registros antigos. O diário guarda observações, passagem de turno e correções como novas entradas com autor e horário. Os dados não comprovam ingestão nem constituem diagnóstico.

## 5. Memórias e conteúdo de mídia

Novos arquivos escolhidos ficam em pasta privada separada do banco, identificados por UUID; o banco conserva pessoa, tipo, tamanho, data e referência. Cada arquivo tem limite de dez MB, com duzentos MB por pessoa. Downloads revalidam a permissão. Mídias sem registro expiram após vinte e quatro horas. A exclusão retira a referência e elimina o arquivo se ele não for usado em outra memória; falhas de limpeza são retomadas pela manutenção. Fotos antigas codificadas são mantidas para compatibilidade. Links e cópias compartilhadas podem permanecer em serviços externos.

## 6. Preferência de tema e pesquisa

Tema, escala de fonte, ativação de lembretes, opção de expor títulos e antecedência de consultas são persistidos por conta. Por padrão não há notificações nem exposição de títulos. As escolhas podem ser recuperadas em outro aparelho; a permissão do sistema e o cache offline são específicos do aparelho. A pesquisa continua local às listas autorizadas e não é enviada a buscadores.

## 7. Finalidades e hipóteses de tratamento

Dados comuns de conta e acesso necessários à prestação solicitada são tratados para cadastro, autenticação e funcionamento, conforme a hipótese de execução contratual do art. 7º, V, da LGPD, quando aplicável. Dados de saúde utilizam consentimento específico e destacado para organizar medicamentos, consultas, rotina e acompanhamento, conforme art. 11, I. Localização requer decisão própria e autorização válida do titular para a finalidade de acompanhamento consentido. O simples aceite dos Termos ou ciência da Política não é consentimento geral para qualquer uso. Outra hipótese legal, inclusive obrigação legal ou exercício regular de direitos, só poderá ser usada quando realmente aplicável e documentada; legítimo interesse não é hipótese do art. 11.

## 8. Autonomia, autorização e dados de terceiros

A pessoa idosa deve compreender quais dados serão tratados e quem terá acesso, com apoio acessível quando necessário. A condição de pessoa idosa, familiar ou paciente não transfere automaticamente o poder de consentir. Quem cadastra outra pessoa deve obter sua autorização válida ou atuar dentro de poderes de representação legal efetivamente existentes. O sistema registra uma declaração de autorização, mas não valida procurações, curatela ou outros documentos. Se houver impossibilidade de manifestação de vontade, defina representação e hipótese jurídica adequada antes de inserir dados. Não use o aplicativo para vigilância clandestina ou para impor compartilhamento contra a vontade do titular.

## 9. Quem acessa os registros

O servidor verifica vínculo e permissão por pessoa em cada operação. Convites só liberam dados após aceite; a validade inicial do vínculo é de noventa dias e sua revisão fica no histórico. O cuidador pode encerrar o próprio vínculo. Transferir a administração exige confirmação de ambas as contas e remove os acessos delegados e QR anteriores. O nome de quem convidou ou transferiu pode ser mostrado antes do aceite, sem expor os dados de cuidado. Revogação de consentimento bloqueia novas operações de cuidado.

## 10. Localização e classificação

A coleta é pontual, iniciada pela pessoa idosa autenticada em seu aparelho Android/iOS, com autorização expressa e permissão do sistema. São recebidos latitude, longitude, precisão e instante; só a última posição válida é conservada. A localização continua tratada como informação de alta privacidade. O papel Responsável e a autorização de um cuidador não ativam o GPS por si só.

## 11. Coleta, compartilhamento e última posição

A posição precisa ter sido capturada nos últimos cinco minutos para ser aceita. O ponto fica disponível por até vinte e quatro horas e é substituído por captura mais recente; não há histórico de trajetos nem coleta contínua. A tela sinaliza pontos com mais de cinco minutos como desatualizados. Atualizar consulta o servidor. Somente o titular ou administrador autorizado pode interromper e apagar o ponto; o compartilhamento desligado também o elimina.

## 12. Autorizar ou revogar localização

Apenas o responsável que administra aquele cadastro pode autorizar um cuidador previamente vinculado, em Perfil → Configurações → Localização do idoso. O sistema grava o identificador da pessoa, do cuidador, de quem autorizou e a última data de alteração em location_access; a preferência de compartilhar e sua alteração ficam em location_sharing. Para compartilhar, o responsável confirma autorização válida da pessoa idosa ou representação legal pertinente. O cuidador não concede permissão a si mesmo, nem altera compartilhamento. Mesmo autorizado, não recebe um ponto quando compartilhar estiver desligado. Desligar a permissão individual bloqueia novas consultas desse cuidador; desligar o compartilhamento suspende a entrega de pontos aos cuidadores autorizados, mantendo as permissões para futura reativação. O perfil Idoso não possui mapa. Dados previamente vistos, capturados ou copiados por um destinatário não podem ser apagados remotamente pelo app; por isso conceda acesso somente a pessoas de confiança.

## 13. Histórico, relatórios e notificações

O histórico das novas ações registra autor, horário e alterações relevantes de registros, diário e acessos. Sua retenção técnica padrão é de trezentos e sessenta e cinco dias, configurável pelo operador. Exportações incluem somente áreas autorizadas, sem documentos, GPS ou arquivos de memória. Lembretes são agendados no sistema do aparelho por até doze horas e até cinquenta itens. O conteúdo é genérico por padrão; o usuário pode optar por título, com possibilidade de exposição na tela bloqueada. Não há serviço de push remoto. E-mails de recuperação e confirmação contêm endereço destinatário, código e instruções, sem registros de saúde.

## 14. Armazenamento no servidor e no dispositivo

O backend grava contas e registros no SQLite e mídias novas em pasta privada separada. O padrão de desenvolvimento permanece local. A infraestrutura escolhida para futura implantação é Google Cloud Compute Engine na região southamerica-east1, com disco persistente para dados e mídia, Cloud Storage privado para backups cifrados e Resend para e-mail. São escolhas técnicas ainda sem contratação ou ativação; identidade do operador, região efetiva de cada serviço e condições de transferência devem ser confirmadas e divulgadas na operação real. No nativo, sessão e chave do cache usam SecureStore; o cache opcional usa SQLCipher. Na web o token fica em sessionStorage e não há banco offline.

## 15. Prazo de conservação

Sessões duram até doze horas; QR dura dez minutos e é de uso único; códigos de e-mail duram trinta minutos e são de uso único; convites expiram em sete dias e propostas de transferência em vinte e quatro horas. A manutenção horária elimina tokens e propostas vencidos, pontos GPS com mais de vinte e quatro horas e eventos de auditoria além do prazo configurado (padrão: trezentos e sessenta e cinco dias). Uploads sem memória são eliminados após vinte e quatro horas. O cache de leitura expira em quinze minutos, com fila cifrada até sincronização, descarte ou saída da sessão. Cadastros e registros permanecem até exclusão ou providência do responsável. O plano de backup define rotação local de trinta dias, ajustável; o responsável deve estabelecer prazos definitivos e tratamento de exclusões antes do uso público.

## 16. Exclusão e encerramento da conta

Excluir um cadastro remove registros, diário, histórico, planos, contatos, posição, vínculos, QR e conta de acesso. Mídias privadas associadas são eliminadas, com nova tentativa pela manutenção em caso de falha. Encerrar conta adulta mediante senha remove cadastros de sua propriedade e suas sessões, sem apagar cadastros de outros responsáveis. Exportações, compartilhamentos e cópias anteriores fora do aplicativo precisam de providências do responsável. Desconectar QR remove sessões, mas conserva o cuidado. A central permite pedidos e revogação individual, inclusive sem novo aceite dos textos.

## 17. Medidas de segurança e limites

Além de BCrypt, tokens hashed, SQL parametrizado e autorização, há limitação de tentativas, gestão de sessões, versão de registros contra edição concorrente, arquivos privados e cache nativo cifrado opcional. A implantação preparada utiliza HTTPS no proxy, API sem porta pública, disco persistente e backups cifrados com restauração em pasta nova. São configurações que precisam ser ativadas e verificadas pelo operador; o SQLite do servidor continua sem criptografia própria e depende da proteção do disco. Métricas operacionais agregam contagens e duração, sem conteúdo de saúde nos logs. Não há promessa de segurança absoluta nem de conformidade jurídica automática.

## 18. Serviços externos e terceiros

Google Cloud e Resend foram escolhidos como opções de infraestrutura e envio de códigos. As integrações aguardam contas, domínio, chaves e configuração real; a configuração técnica não representa contrato. Somente e-mail e código são enviados ao provedor de mensagens. Mídias privadas passam pela API do projeto, sem URL pública. Mapas externos continuam opcionais e exigem escolha informada; links, compartilhamento de arquivos e discador envolvem outros serviços. O código não contém anúncios, venda de dados nem análise comportamental. Operadores e transferências efetivas precisam ser identificados antes de ativação.

## 19. Permissões do dispositivo

Câmera serve ao QR; seletor de arquivos recebe somente o item escolhido para memória; localização em primeiro plano é pedida para captura pontual no aparelho da pessoa idosa; notificações são pedidas ao ativar lembretes. Não há permissão de localização em segundo plano nem gravação pelo microfone. Print e Sharing podem gerar e enviar relatório ou abrir arquivo escolhido. O discador não dá acesso geral à agenda. Você pode retirar permissões nas configurações do aparelho.

## 20. Direitos e atendimento aos titulares

A central de privacidade registra pedidos de informação, acesso, correção, exclusão e revogação por conta ou titular acompanhado, com protocolo. O titular ou representante legitimado mantém os direitos previstos em lei. A revogação individual interrompe novas operações de cuidado, remove posição e compartilhamento e invalida QR. A análise da legitimidade, execução de providências, prazos legais e tratamento de cópias são responsabilidades do controlador; o código não substitui esse processo. O canal administrativo permite registrar estado e resposta, que aparecem no protocolo. O contato efetivo continua pendente de identificação pelo mantenedor.

## 21. Fundamentos, atualização e transparência

Esta Política se apoia na LGPD, nos direitos de privacidade do Marco Civil da Internet e na proteção da dignidade, respeito e autonomia do Estatuto da Pessoa Idosa, com suas atualizações. Mudanças relevantes ou novas integrações exigem atualização deste documento e informação acessível ao titular. A versão atual é registrada no aceite do aplicativo; novas versões dos documentos são reapresentadas antes das funções protegidas. Preencher os campos pendentes deve refletir a operação real, sem transformar uma limitação atual em promessa de serviço disponível.

## Referências oficiais para revisão jurídica

Fontes consultadas em 5 de outubro de 2026. A redação das cláusulas é própria do projeto; os links permitem conferir os fundamentos indicados.

- [Estatuto da Pessoa Idosa — Lei nº 10.741/2003, texto compilado](https://www.planalto.gov.br/ccivil_03/leis/2003/l10.741compilado.htm)
- [LGPD — Lei nº 13.709/2018, texto compilado](https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709compilado.htm)
- [Código Civil — Lei nº 10.406/2002, texto compilado](https://www.planalto.gov.br/ccivil_03/leis/2002/l10406compilada.htm)
- [Código de Defesa do Consumidor — Lei nº 8.078/1990, texto compilado](https://www.planalto.gov.br/ccivil_03/leis/l8078compilado.htm)
- [Marco Civil da Internet — Lei nº 12.965/2014](https://www.planalto.gov.br/ccivil_03/_ato2011-2014/2014/lei/l12965.htm)
- [Lei de Direitos Autorais — Lei nº 9.610/1998](https://www.planalto.gov.br/ccivil_03/leis/l9610.htm)
- [ANPD — Direito dos Titulares](https://www.gov.br/anpd/pt-br/assuntos/titular-de-dados/direito-dos-titulares)
- [ANPD — Guia sobre agentes de tratamento e encarregado](https://www.gov.br/anpd/pt-br/centrais-de-conteudo/materiais-educativos-e-publicacoes/guia-orientativo-para-definicoes-dos-agentes-de-tratamento-de-dados-pessoais-e-do-encarregado)

Esta cópia é gerada por `node scripts/sync-legal-docs.mjs` a partir de `src/legal/content.ts`. Edite a fonte, atualize a versão também no backend e gere novamente as cópias.
