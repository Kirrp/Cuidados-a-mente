// Atualize esta versão também no backend e nos testes quando mudar os textos.
// Dados puros, utilizados pelo renderizador e por scripts/sync-legal-docs.mjs.
export const LEGAL_VERSION = '2026-10-11';

export type LegalSection = { heading: string; text: string };
export type LegalText = { title: string; intro: string; sections: LegalSection[] };

export const terms: LegalText = {
  title: 'Termos de Uso',
  intro:
    'Versão 2026-10-11. Estes Termos regulam o uso do Cuidados à Mente, projeto ' +
    'de TCC para apoiar a organização do cuidado. Leia também a Política de ' +
    'Privacidade. Os campos de identificação e contato ainda pendentes devem ser ' +
    'preenchidos antes de disponibilizar o serviço ao público.',
  sections: [
    {
      heading: '1. Identificação e contato',
      text:
        'Responsável pela oferta do aplicativo: [NOME OU RAZÃO SOCIAL A PREENCHER]. ' +
        'Identificação e endereço: [A PREENCHER]. Contato de suporte: [E-MAIL A ' +
        'PREENCHER]. Contato para privacidade: [E-MAIL OU CANAL A PREENCHER]. A ' +
        'instituição de ensino não deve ser indicada como fornecedora ou ' +
        'controladora sem definição expressa dessa participação. Não há, nesta ' +
        'versão, canal operacional de atendimento identificado; o mantenedor deve ' +
        'divulgá-lo antes do uso com dados reais por terceiros.',
    },
    {
      heading: '2. Objetivo e público-alvo',
      text:
        'O Cuidados à Mente apoia pessoas idosas, cuidadores e responsáveis na ' +
        'organização de rotina, medicamentos, tarefas, consultas, contatos e ' +
        'memórias. A pessoa idosa é participante do cuidado e deve receber ' +
        'explicações acessíveis sobre as decisões que a envolvem. As contas de ' +
        'cuidador e responsável destinam-se a pessoas capazes de assumir as ' +
        'responsabilidades de uso. O aplicativo não é prontuário clínico ' +
        'certificado, serviço de telemedicina, dispositivo médico, central de ' +
        'vigilância ou serviço de resgate.',
    },
    {
      heading: '3. Funções disponíveis',
      text:
        'Além dos registros de cuidado, QR e perfis, o aplicativo oferece planos de ' +
        'doses, diário de observações e passagem de turno, histórico de autoria, ' +
        'contatos principal e alternativo por pessoa, convites confirmados, revisão ' +
        'de acessos com validade, transferência de administração, exportação e ' +
        'central de privacidade. Há tema e ampliação de fontes por conta, ' +
        'recuperação e confirmação de e-mail quando configurados. A disponibilidade ' +
        'depende da plataforma e das integrações indicadas na interface.',
    },
    {
      heading: '4. Contas, credenciais e aceite',
      text:
        'Cuidador e responsável entram com e-mail e senha; o cadastro possui etapas ' +
        'e confirmações separadas dos Termos, da leitura da Política e do tratamento ' +
        'de dados de saúde. A conta da pessoa idosa é preparada a partir de seu ' +
        'cadastro e acessada por QR Code temporário de uso único ou pelo código ' +
        'correspondente. O código tem validade de dez minutos. Não entregue senha ou ' +
        'QR Code a pessoas indevidas. A sessão expira em até doze horas e pode ' +
        'exigir nova entrada. Informe dados corretos, mantenha o aparelho protegido ' +
        'e comunique suspeitas de acesso indevido. O registro de aceite contém ' +
        'versões e data; não comprova, por si só, poderes de representação sobre ' +
        'outra pessoa.',
    },
    {
      heading: '5. Diferenças entre os perfis',
      text:
        'O Idoso recebe uma interface simplificada e acessa somente a pessoa ' +
        'vinculada à própria conta, com ações liberadas para ela. O Cuidador acessa ' +
        'os cadastros que criou e aqueles aos quais foi vinculado, conforme ' +
        'autorizações de cada pessoa acompanhada. O Responsável dispõe de maior ' +
        'controle sobre os cadastros sob sua administração, podendo vincular ' +
        'cuidadores e definir permissões. O perfil denominado Responsável no ' +
        'aplicativo é uma função administrativa: não confere automaticamente a ' +
        'qualidade jurídica de representante legal. Ser familiar ou cuidador também ' +
        'não autoriza decidir contra a vontade da pessoa idosa.',
    },
    {
      heading: '6. Permissões e dados de outras pessoas',
      text:
        'As autorizações são específicas por pessoa e ação. Convites para cuidadores ' +
        'precisam ser aceitos em até sete dias; o vínculo inicial vale noventa dias ' +
        'e pode ser revisado pelo responsável por até um ano. O cuidador pode ' +
        'retirar seu vínculo. A transferência de administração requer senhas e ' +
        'confirmação do destinatário em até vinte e quatro horas; os vínculos e o QR ' +
        'anteriores são retirados. O servidor verifica acessos em cada operação. O ' +
        'cadastro registra declaração de autorização do titular ou representação ' +
        'legal válida, que precisa de verificação pelo responsável pelos dados.',
    },
    {
      heading: '7. Localização: acesso e compartilhamento',
      text:
        'A localização fica somente em Perfil → Configurações → Localização do ' +
        'idoso. O responsável que administra aquele cadastro pode acessar essa ' +
        'configuração por padrão; cuidadores começam sem autorização, e o perfil ' +
        'Idoso não possui mapa. A autorização de um cuidador é individual e separada ' +
        'das demais permissões. Apenas o responsável do cadastro pode concedê-la ou ' +
        'retirá-la. O compartilhamento com cuidadores começa desligado e exige ' +
        'confirmação de autorização válida da pessoa idosa ou representação legal ' +
        'pertinente para ser ativado. Autorizar a tela, permitir compartilhar, ' +
        'coletar GPS e possuir uma posição recente são situações diferentes. Um ' +
        'cuidador autorizado só recebe coordenadas quando o compartilhamento estiver ' +
        'habilitado.',
    },
    {
      heading: '8. Localização: limites atuais e responsabilidades',
      text:
        'A pessoa idosa autenticada pode enviar a posição do próprio aparelho ' +
        'Android/iOS em Configurações, após escolha expressa, permissão do sistema e ' +
        'habilitação do compartilhamento. A captura é pontual, sem coleta em segundo ' +
        'plano, geocerca ou histórico de trajetos. A API conserva apenas a última ' +
        'posição válida por até vinte e quatro horas, com precisão e horário; mais ' +
        'de cinco minutos indica desatualização. Atualizar a tela consulta o ' +
        'servidor e não captura GPS. A cartografia externa depende de configuração e ' +
        'escolha em Carregar mapa externo; o aviso identifica envio de IP e área ' +
        'consultada. Desligar o compartilhamento apaga o ponto ativo. Nenhum serviço ' +
        'externo foi contratado automaticamente.',
    },
    {
      heading: '9. Medicamentos, rotina e tarefas',
      text:
        'Cada dose corresponde a um registro com estado próprio. Um adulto ' +
        'autorizado pode criar um plano com início, fim, intervalo inteiro de dias, ' +
        'horários e fuso, gerando até setecentas e trinta doses em até um ano. ' +
        'Cancelar o plano remove somente doses futuras ainda pendentes. Marcar ' +
        'Concluído é uma declaração do usuário, com autoria e instante registrados; ' +
        'tocar em um lembrete nunca confirma ingestão. O aplicativo não calcula ' +
        'dosagem nem prescreve tratamentos. Use as orientações da equipe de cuidado ' +
        'e corrija divergências de forma rastreável.',
    },
    {
      heading: '10. Consultas, lembretes e relatórios',
      text:
        'Consultas registram compromissos informados pelo usuário, sem agendamento ' +
        'junto ao estabelecimento. Em versão nativa, lembretes locais de ' +
        'medicamentos e consultas dependem de permissão do sistema, bateria e estado ' +
        'do aparelho. A agenda contém até cinquenta avisos nas próximas doze horas, ' +
        'limitada à validade da sessão, e deve ser renovada ao abrir o aplicativo. O ' +
        'texto é genérico por padrão; exibir título exige escolha do usuário. Há ' +
        'histórico das ações novas e exportação das áreas autorizadas em relatório ' +
        'imprimível na web e PDF no aplicativo nativo. Não há push remoto, SMS ou ' +
        'garantia de entrega de alarmes.',
    },
    {
      heading: '11. Fotos, vídeos, áudios e histórias',
      text:
        'As memórias podem conter histórias, links e arquivos escolhidos ' +
        'individualmente: JPEG, PNG, WebP, MP3, WAV ou MP4. Novos uploads ficam em ' +
        'pasta privada separada do SQLite, com limite de dez MB por arquivo e ' +
        'duzentos MB por pessoa; downloads exigem sessão e permissão. Fotos antigas ' +
        'podem continuar codificadas no banco. Ao abrir ou compartilhar um arquivo ' +
        'baixado, podem existir cópias fora do controle do aplicativo. Links ' +
        'externos seguem as práticas de seus provedores. Inclua apenas conteúdo ' +
        'autorizado e respeite imagem, autoria e privacidade.',
    },
    {
      heading: '12. Contatos e situações de emergência',
      text:
        'O recurso Emergência mostra o contato cadastrado e tenta abrir o discador ' +
        'do dispositivo. A ligação depende de telefone compatível, rede e ação do ' +
        'usuário; não há acionamento automático nem garantia de atendimento. Um ' +
        'computador pode não conseguir efetuar chamadas. O aplicativo é ferramenta ' +
        'de apoio e não substitui presença, acompanhamento profissional ou serviços ' +
        'de emergência. Em risco imediato, procure os serviços competentes e não ' +
        'aguarde atualização de tela, notificação ou posição.',
    },
    {
      heading: '13. Segurança e deveres de uso',
      text:
        'Não acesse dados alheios sem autorização, não compartilhe credenciais, não ' +
        'explore vulnerabilidades nem insira conteúdo ilícito ou deliberadamente ' +
        'falso. Restrinja os acessos ao necessário e encerre a sessão em aparelhos ' +
        'compartilhados. O projeto possui proteção de senhas, tokens, sessão e ' +
        'verificações de permissão no servidor, mas depende de configuração segura ' +
        'do ambiente. Quem opera o aplicativo deve proteger o banco, as cópias e os ' +
        'canais de comunicação, corrigir falhas conhecidas e tratar incidentes. Os ' +
        'detalhes e limites atuais constam da Política de Privacidade.',
    },
    {
      heading: '14. Disponibilidade e responsabilidade',
      text:
        'Falhas de conexão, bateria, permissões e serviços externos podem impedir o ' +
        'uso. A versão nativa com SQLCipher permite cache e fila de registros, ' +
        'quando ativados, por até quinze minutos após atualizar os acessos; mídias ' +
        'não ficam no cache. A web requer conexão. Alterações offline somente chegam ' +
        'ao servidor após nova autorização, e conflitos exigem conferência, sem ' +
        'sobrescrita automática. A revogação de acesso é conhecida ao reconectar; ' +
        'existe uma janela offline limitada. As responsabilidades e direitos legais ' +
        'permanecem conforme a operação efetiva.',
    },
    {
      heading: '15. Restrição, suspensão e encerramento',
      text:
        'O mantenedor pode restringir acesso para conter incidente, cumprir ' +
        'determinação válida ou apurar uso ilícito, utilizando medida proporcional e ' +
        'informando o motivo quando isso não comprometer a segurança ou obrigação ' +
        'legal. Deve oferecer canal para esclarecimento e revisão. Não há painel ' +
        'automático de suspensão administrativa nesta versão. Cuidador e responsável ' +
        'podem encerrar a própria conta após confirmar a senha; isso apaga também os ' +
        'cadastros de idosos criados por essa conta, registros, memórias e acessos ' +
        'vinculados. Excluir a conta de um cuidador vinculado não apaga cadastros ' +
        'pertencentes a outro responsável. A pessoa idosa ou seu representante pode ' +
        'solicitar providências pelo canal de privacidade.',
    },
    {
      heading: '16. Exclusão individual e revogação',
      text:
        'O dono do cadastro pode excluir individualmente a pessoa acompanhada e seus ' +
        'registros. Desconectar o QR Code encerra sessões e invalida o código atual, ' +
        'mantendo os registros; gerar outro código permite novo acesso. Revogar o ' +
        'vínculo de um cuidador remove as permissões daquele vínculo, inclusive ' +
        'localização. Retirar apenas a autorização de localização não elimina os ' +
        'demais acessos concedidos. A exclusão no aplicativo é permanente no banco ' +
        'ativo; o tratamento de cópias de segurança ou conservação legal, caso ' +
        'adotados, deve ser informado pelo mantenedor. Revogação de consentimento e ' +
        'demais direitos seguem a Política de Privacidade.',
    },
    {
      heading: '17. Propriedade intelectual',
      text:
        'Marca, ilustrações, textos e código possuem autores ou titulares próprios e ' +
        'devem ser usados conforme as licenças aplicáveis ao projeto e às ' +
        'dependências. Estes Termos não concedem direitos além daqueles previstos ' +
        'nessas licenças. Conteúdo inserido pelo usuário continua sujeito aos ' +
        'direitos de seus titulares, inclusive imagem e autoria. Reprodução, ' +
        'distribuição e outras utilizações devem observar a Lei nº 9.610/1998, ' +
        'especialmente o art. 29 e suas exceções legais. A interface de localização ' +
        'utiliza elementos próprios do Cuidados à Mente e não autoriza copiar marcas ' +
        'ou recursos protegidos de outros aplicativos.',
    },
    {
      heading: '18. Fundamentação jurídica',
      text:
        'A Lei nº 10.741/2003, com a nomenclatura atualizada pela Lei nº ' +
        '14.423/2022, protege as pessoas com 60 anos ou mais. Seus arts. 2º, 3º e 10 ' +
        'orientam respeito à dignidade, liberdade, autonomia e cuidado, inclusive ao ' +
        'decidir quem vê dados pessoais. A Lei nº 13.709/2018 (LGPD) exige ' +
        'tratamento conforme finalidade, necessidade, transparência e segurança; ' +
        'dados de saúde requerem hipótese do art. 11, diferente das hipóteses do ' +
        'art. 7º para dados comuns. O Código Civil (Lei nº 10.406/2002), arts. 11 a ' +
        '21, protege personalidade, imagem e vida privada; os arts. 186 e 927 tratam ' +
        'de reparação por atos ilícitos. O Marco Civil da Internet (Lei nº ' +
        '12.965/2014), arts. 7º e 10, fundamenta privacidade e proteção de dados no ' +
        'serviço. Havendo relação de consumo, o Código de Defesa do Consumidor (Lei ' +
        'nº 8.078/1990), arts. 6º, 14 e 51, preserva informação adequada, ' +
        'responsabilidade e proteção contra cláusulas abusivas. A indicação de ' +
        'projeto acadêmico não afasta normas efetivamente aplicáveis.',
    },
    {
      heading: '19. Alterações dos Termos',
      text:
        'A versão e a data identificam o texto apresentado. Mudanças relevantes ' +
        'serão explicadas e exigirão nova apresentação e aceite antes de acesso às ' +
        'funções protegidas. Contas antigas e contas de idoso também passam por essa ' +
        'confirmação. A leitura da Política e o consentimento para saúde são ' +
        'escolhas separadas; aceitar estes Termos não autoriza indiscriminadamente ' +
        'novas finalidades ou localização. É possível sair sem aceitar; contas ' +
        'adultas podem solicitar exclusão na própria tela de confirmação.',
    },
    {
      heading: '20. Disposições gerais',
      text:
        'Aplica-se a legislação brasileira. Estes Termos devem ser interpretados de ' +
        'modo compatível com os direitos da pessoa idosa, a proteção de dados e as ' +
        'normas de consumo quando cabíveis. A eventual invalidade de uma cláusula ' +
        'não afeta disposições válidas separáveis. Conflitos serão submetidos às ' +
        'autoridades e ao foro competentes pelas regras legais, sem retirada de ' +
        'direitos ou imposição de foro abusivo. Dúvidas, pedidos de correção e ' +
        'reclamações devem utilizar os canais identificados na seção 1.',
    },
  ],
};

export const privacy: LegalText = {
  title: 'Política de Privacidade',
  intro:
    'Versão 2026-10-11. Esta Política descreve os dados e as funções ' +
    'efetivamente presentes no Cuidados à Mente e identifica os pontos ainda ' +
    'pendentes de implantação. Dados de saúde recebem confirmação específica e ' +
    'destacada, separada dos Termos. Localização possui controles próprios e o ' +
    'GPS ainda não está conectado.',
  sections: [
    {
      heading: '1. Controlador e canais',
      text:
        'Controlador, responsável pelas decisões sobre o tratamento: [NOME OU RAZÃO ' +
        'SOCIAL E IDENTIFICAÇÃO A PREENCHER]. Endereço e país de operação: [A ' +
        'PREENCHER]. Contato de privacidade e exercício de direitos: [E-MAIL OU ' +
        'CANAL A PREENCHER]. Encarregado, quando aplicável, ou canal de atendimento ' +
        'aos titulares: [A DEFINIR]. O perfil Responsável do aplicativo não ' +
        'identifica o controlador nem constitui representação legal. Antes de uso ' +
        'público, o mantenedor deve definir esses papéis, identificar eventuais ' +
        'operadores, divulgar os contatos e organizar o atendimento. Não fornecemos ' +
        'um endereço fictício.',
    },
    {
      heading: '2. Dados da conta e do acesso',
      text:
        'Nome, e-mail, senha, perfil de acesso e aceites são necessários à conta ' +
        'adulta. CPF, RG, nascimento, telefones e endereço passaram a ser opcionais; ' +
        'informe apenas o necessário. Senhas usam hash BCrypt; tokens aleatórios de ' +
        'sessão, QR e e-mail ficam como hashes, com validade e uso controlados. A ' +
        'verificação por e-mail confirma acesso à caixa postal quando o serviço está ' +
        'configurado; não comprova identidade civil. Preferências incluem tema, ' +
        'escala de fonte e opções de lembretes.',
    },
    {
      heading: '3. Dados da pessoa acompanhada',
      text:
        'O cadastro exige nome e declaração de autorização válida, incluindo ' +
        'indicação de autorização do titular ou representação legal. Nascimento, ' +
        'documentos, contatos, endereço e observações são opcionais. O projeto não ' +
        'valida documentos de representação. Existem contatos de emergência ' +
        'principal e alternativo por pessoa, com nome e telefone, e compatibilidade ' +
        'com contatos antigos. Avise esses contatos e mantenha-os atualizados.',
    },
    {
      heading: '4. Rotina, medicamentos e consultas',
      text:
        'São guardados tipo, pessoa, título, data, horário, detalhes, estado, versão ' +
        'e plano de doses, quando existir. Planos guardam início, fim, intervalo, ' +
        'horários e fuso. O histórico acrescenta autor autenticado, instante da ação ' +
        'e valores anteriores e posteriores; não reconstrói autoria de registros ' +
        'antigos. O diário guarda observações, passagem de turno e correções como ' +
        'novas entradas com autor e horário. Os dados não comprovam ingestão nem ' +
        'constituem diagnóstico.',
    },
    {
      heading: '5. Memórias e conteúdo de mídia',
      text:
        'Novos arquivos escolhidos ficam em pasta privada separada do banco, ' +
        'identificados por UUID; o banco conserva pessoa, tipo, tamanho, data e ' +
        'referência. Cada arquivo tem limite de dez MB, com duzentos MB por pessoa. ' +
        'Downloads revalidam a permissão. Mídias sem registro expiram após vinte e ' +
        'quatro horas. A exclusão retira a referência e elimina o arquivo se ele não ' +
        'for usado em outra memória; falhas de limpeza são retomadas pela ' +
        'manutenção. Fotos antigas codificadas são mantidas para compatibilidade. ' +
        'Links e cópias compartilhadas podem permanecer em serviços externos.',
    },
    {
      heading: '6. Preferência de tema e pesquisa',
      text:
        'Tema, escala de fonte, ativação de lembretes, opção de expor títulos e ' +
        'antecedência de consultas são persistidos por conta. Por padrão não há ' +
        'notificações nem exposição de títulos. As escolhas podem ser recuperadas em ' +
        'outro aparelho; a permissão do sistema e o cache offline são específicos do ' +
        'aparelho. A pesquisa continua local às listas autorizadas e não é enviada a ' +
        'buscadores.',
    },
    {
      heading: '7. Finalidades e hipóteses de tratamento',
      text:
        'Dados comuns de conta e acesso necessários à prestação solicitada são ' +
        'tratados para cadastro, autenticação e funcionamento, conforme a hipótese ' +
        'de execução contratual do art. 7º, V, da LGPD, quando aplicável. Dados de ' +
        'saúde utilizam consentimento específico e destacado para organizar ' +
        'medicamentos, consultas, rotina e acompanhamento, conforme art. 11, I. ' +
        'Localização requer decisão própria e autorização válida do titular para a ' +
        'finalidade de acompanhamento consentido. O simples aceite dos Termos ou ' +
        'ciência da Política não é consentimento geral para qualquer uso. Outra ' +
        'hipótese legal, inclusive obrigação legal ou exercício regular de direitos, ' +
        'só poderá ser usada quando realmente aplicável e documentada; legítimo ' +
        'interesse não é hipótese do art. 11.',
    },
    {
      heading: '8. Autonomia, autorização e dados de terceiros',
      text:
        'A pessoa idosa deve compreender quais dados serão tratados e quem terá ' +
        'acesso, com apoio acessível quando necessário. A condição de pessoa idosa, ' +
        'familiar ou paciente não transfere automaticamente o poder de consentir. ' +
        'Quem cadastra outra pessoa deve obter sua autorização válida ou atuar ' +
        'dentro de poderes de representação legal efetivamente existentes. O sistema ' +
        'registra uma declaração de autorização, mas não valida procurações, ' +
        'curatela ou outros documentos. Se houver impossibilidade de manifestação de ' +
        'vontade, defina representação e hipótese jurídica adequada antes de inserir ' +
        'dados. Não use o aplicativo para vigilância clandestina ou para impor ' +
        'compartilhamento contra a vontade do titular.',
    },
    {
      heading: '9. Quem acessa os registros',
      text:
        'O servidor verifica vínculo e permissão por pessoa em cada operação. ' +
        'Convites só liberam dados após aceite; a validade inicial do vínculo é de ' +
        'noventa dias e sua revisão fica no histórico. O cuidador pode encerrar o ' +
        'próprio vínculo. Transferir a administração exige confirmação de ambas as ' +
        'contas e remove os acessos delegados e QR anteriores. O nome de quem ' +
        'convidou ou transferiu pode ser mostrado antes do aceite, sem expor os ' +
        'dados de cuidado. Revogação de consentimento bloqueia novas operações de ' +
        'cuidado.',
    },
    {
      heading: '10. Localização e classificação',
      text:
        'A coleta é pontual, iniciada pela pessoa idosa autenticada em seu aparelho ' +
        'Android/iOS, com autorização expressa e permissão do sistema. São recebidos ' +
        'latitude, longitude, precisão e instante; só a última posição válida é ' +
        'conservada. A localização continua tratada como informação de alta ' +
        'privacidade. O papel Responsável e a autorização de um cuidador não ativam ' +
        'o GPS por si só.',
    },
    {
      heading: '11. Coleta, compartilhamento e última posição',
      text:
        'A posição precisa ter sido capturada nos últimos cinco minutos para ser ' +
        'aceita. O ponto fica disponível por até vinte e quatro horas e é ' +
        'substituído por captura mais recente; não há histórico de trajetos nem ' +
        'coleta contínua. A tela sinaliza pontos com mais de cinco minutos como ' +
        'desatualizados. Atualizar consulta o servidor. Somente o titular ou ' +
        'administrador autorizado pode interromper e apagar o ponto; o ' +
        'compartilhamento desligado também o elimina.',
    },
    {
      heading: '12. Autorizar ou revogar localização',
      text:
        'Apenas o responsável que administra aquele cadastro pode autorizar um ' +
        'cuidador previamente vinculado, em Perfil → Configurações → Localização do ' +
        'idoso. O sistema grava o identificador da pessoa, do cuidador, de quem ' +
        'autorizou e a última data de alteração em location_access; a preferência de ' +
        'compartilhar e sua alteração ficam em location_sharing. Para compartilhar, ' +
        'o responsável confirma autorização válida da pessoa idosa ou representação ' +
        'legal pertinente. O cuidador não concede permissão a si mesmo, nem altera ' +
        'compartilhamento. Mesmo autorizado, não recebe um ponto quando compartilhar ' +
        'estiver desligado. Desligar a permissão individual bloqueia novas consultas ' +
        'desse cuidador; desligar o compartilhamento suspende a entrega de pontos ' +
        'aos cuidadores autorizados, mantendo as permissões para futura reativação. ' +
        'O perfil Idoso não possui mapa. Dados previamente vistos, capturados ou ' +
        'copiados por um destinatário não podem ser apagados remotamente pelo app; ' +
        'por isso conceda acesso somente a pessoas de confiança.',
    },
    {
      heading: '13. Histórico, relatórios e notificações',
      text:
        'O histórico das novas ações registra autor, horário e alterações relevantes ' +
        'de registros, diário e acessos. Sua retenção técnica padrão é de trezentos ' +
        'e sessenta e cinco dias, configurável pelo operador. Exportações incluem ' +
        'somente áreas autorizadas, sem documentos, GPS ou arquivos de memória. ' +
        'Lembretes são agendados no sistema do aparelho por até doze horas e até ' +
        'cinquenta itens. O conteúdo é genérico por padrão; o usuário pode optar por ' +
        'título, com possibilidade de exposição na tela bloqueada. Não há serviço de ' +
        'push remoto. E-mails de recuperação e confirmação contêm endereço ' +
        'destinatário, código e instruções, sem registros de saúde.',
    },
    {
      heading: '14. Armazenamento no servidor e no dispositivo',
      text:
        'O backend grava contas e registros no SQLite e mídias novas em pasta ' +
        'privada separada. O padrão de desenvolvimento permanece local. A ' +
        'infraestrutura escolhida para futura implantação é Google Cloud Compute ' +
        'Engine na região southamerica-east1, com disco persistente para dados e ' +
        'mídia, Cloud Storage privado para backups cifrados e Resend para e-mail. ' +
        'São escolhas técnicas ainda sem contratação ou ativação; identidade do ' +
        'operador, região efetiva de cada serviço e condições de transferência devem ' +
        'ser confirmadas e divulgadas na operação real. No nativo, sessão e chave do ' +
        'cache usam SecureStore; o cache opcional usa SQLCipher. Na web o token fica ' +
        'em sessionStorage e não há banco offline.',
    },
    {
      heading: '15. Prazo de conservação',
      text:
        'Sessões duram até doze horas; QR dura dez minutos e é de uso único; códigos ' +
        'de e-mail duram trinta minutos e são de uso único; convites expiram em sete ' +
        'dias e propostas de transferência em vinte e quatro horas. A manutenção ' +
        'horária elimina tokens e propostas vencidos, pontos GPS com mais de vinte e ' +
        'quatro horas e eventos de auditoria além do prazo configurado (padrão: ' +
        'trezentos e sessenta e cinco dias). Uploads sem memória são eliminados após ' +
        'vinte e quatro horas. O cache de leitura expira em quinze minutos, com fila ' +
        'cifrada até sincronização, descarte ou saída da sessão. Cadastros e ' +
        'registros permanecem até exclusão ou providência do responsável. O plano de ' +
        'backup define rotação local de trinta dias, ajustável; o responsável deve ' +
        'estabelecer prazos definitivos e tratamento de exclusões antes do uso ' +
        'público.',
    },
    {
      heading: '16. Exclusão e encerramento da conta',
      text:
        'Excluir um cadastro remove registros, diário, histórico, planos, contatos, ' +
        'posição, vínculos, QR e conta de acesso. Mídias privadas associadas são ' +
        'eliminadas, com nova tentativa pela manutenção em caso de falha. Encerrar ' +
        'conta adulta mediante senha remove cadastros de sua propriedade e suas ' +
        'sessões, sem apagar cadastros de outros responsáveis. Exportações, ' +
        'compartilhamentos e cópias anteriores fora do aplicativo precisam de ' +
        'providências do responsável. Desconectar QR remove sessões, mas conserva o ' +
        'cuidado. A central permite pedidos e revogação individual, inclusive sem ' +
        'novo aceite dos textos.',
    },
    {
      heading: '17. Medidas de segurança e limites',
      text:
        'Além de BCrypt, tokens hashed, SQL parametrizado e autorização, há ' +
        'limitação de tentativas, gestão de sessões, versão de registros contra ' +
        'edição concorrente, arquivos privados e cache nativo cifrado opcional. A ' +
        'implantação preparada utiliza HTTPS no proxy, API sem porta pública, disco ' +
        'persistente e backups cifrados com restauração em pasta nova. São ' +
        'configurações que precisam ser ativadas e verificadas pelo operador; o ' +
        'SQLite do servidor continua sem criptografia própria e depende da proteção ' +
        'do disco. Métricas operacionais agregam contagens e duração, sem conteúdo ' +
        'de saúde nos logs. Não há promessa de segurança absoluta nem de ' +
        'conformidade jurídica automática.',
    },
    {
      heading: '18. Serviços externos e terceiros',
      text:
        'Google Cloud e Resend foram escolhidos como opções de infraestrutura e ' +
        'envio de códigos. As integrações aguardam contas, domínio, chaves e ' +
        'configuração real; a configuração técnica não representa contrato. Somente ' +
        'e-mail e código são enviados ao provedor de mensagens. Mídias privadas ' +
        'passam pela API do projeto, sem URL pública. Mapas externos continuam ' +
        'opcionais e exigem escolha informada; links, compartilhamento de arquivos e ' +
        'discador envolvem outros serviços. O código não contém anúncios, venda de ' +
        'dados nem análise comportamental. Operadores e transferências efetivas ' +
        'precisam ser identificados antes de ativação.',
    },
    {
      heading: '19. Permissões do dispositivo',
      text:
        'Câmera serve ao QR; seletor de arquivos recebe somente o item escolhido ' +
        'para memória; localização em primeiro plano é pedida para captura pontual ' +
        'no aparelho da pessoa idosa; notificações são pedidas ao ativar lembretes. ' +
        'Não há permissão de localização em segundo plano nem gravação pelo ' +
        'microfone. Print e Sharing podem gerar e enviar relatório ou abrir arquivo ' +
        'escolhido. O discador não dá acesso geral à agenda. Você pode retirar ' +
        'permissões nas configurações do aparelho.',
    },
    {
      heading: '20. Direitos e atendimento aos titulares',
      text:
        'A central de privacidade registra pedidos de informação, acesso, correção, ' +
        'exclusão e revogação por conta ou titular acompanhado, com protocolo. O ' +
        'titular ou representante legitimado mantém os direitos previstos em lei. A ' +
        'revogação individual interrompe novas operações de cuidado, remove posição ' +
        'e compartilhamento e invalida QR. A análise da legitimidade, execução de ' +
        'providências, prazos legais e tratamento de cópias são responsabilidades do ' +
        'controlador; o código não substitui esse processo. O canal administrativo ' +
        'permite registrar estado e resposta, que aparecem no protocolo. O contato ' +
        'efetivo continua pendente de identificação pelo mantenedor.',
    },
    {
      heading: '21. Fundamentos, atualização e transparência',
      text:
        'Esta Política se apoia na LGPD, nos direitos de privacidade do Marco Civil ' +
        'da Internet e na proteção da dignidade, respeito e autonomia do Estatuto da ' +
        'Pessoa Idosa, com suas atualizações. Mudanças relevantes ou novas ' +
        'integrações exigem atualização deste documento e informação acessível ao ' +
        'titular. A versão atual é registrada no aceite do aplicativo; novas versões ' +
        'dos documentos são reapresentadas antes das funções protegidas. Preencher ' +
        'os campos pendentes deve refletir a operação real, sem transformar uma ' +
        'limitação atual em promessa de serviço disponível.',
    },
  ],
};

export const legalReferences: { title: string; url: string }[] = [
  {
    title: 'Estatuto da Pessoa Idosa — Lei nº 10.741/2003, texto compilado',
    url: 'https://www.planalto.gov.br/ccivil_03/leis/2003/l10.741compilado.htm',
  },
  {
    title: 'LGPD — Lei nº 13.709/2018, texto compilado',
    url: 'https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709compilado.htm',
  },
  {
    title: 'Código Civil — Lei nº 10.406/2002, texto compilado',
    url: 'https://www.planalto.gov.br/ccivil_03/leis/2002/l10406compilada.htm',
  },
  {
    title: 'Código de Defesa do Consumidor — Lei nº 8.078/1990, texto compilado',
    url: 'https://www.planalto.gov.br/ccivil_03/leis/l8078compilado.htm',
  },
  {
    title: 'Marco Civil da Internet — Lei nº 12.965/2014',
    url: 'https://www.planalto.gov.br/ccivil_03/_ato2011-2014/2014/lei/l12965.htm',
  },
  {
    title: 'Lei de Direitos Autorais — Lei nº 9.610/1998',
    url: 'https://www.planalto.gov.br/ccivil_03/leis/l9610.htm',
  },
  {
    title: 'ANPD — Direito dos Titulares',
    url: 'https://www.gov.br/anpd/pt-br/assuntos/titular-de-dados/direito-dos-titulares',
  },
  {
    title: 'ANPD — Guia sobre agentes de tratamento e encarregado',
    url: 'https://www.gov.br/anpd/pt-br/centrais-de-conteudo/materiais-educativos-e-publicacoes/guia-orientativo-para-definicoes-dos-agentes-de-tratamento-de-dados-pessoais-e-do-encarregado',
  },
];
