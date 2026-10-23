# Aplicação das recomendações — 2026-10-11

O documento recebido em Downloads analisava a versão de 05/10 e apresentava propostas para decisão. O usuário autorizou sua aplicação no projeto e a escolha dos fornecedores. Este relatório descreve o que foi implementado e o que depende de ativação ou avaliação fora do código. O original recebido permanece preservado.

**Implementado** indica código e fluxo preparados com as verificações descritas em ALTERACOES_E_TESTES.md. **Preparado** indica configuração entregue, sem serviço externo ativado. **Avaliação pendente** exige aparelho, tecnologia assistiva ou participantes reais; não equivale a conclusão de usabilidade.

## As 26 recomendações

| # | Recomendação | Entrega e limites |
| --- | --- | --- |
| 1 | Alertas de medicamentos com confirmação | Implementado: avisos locais e abertura da lista; conclusão continua explícita. Agenda limitada à sessão/12 horas, até 50 avisos. Entrega no aparelho pendente. |
| 2 | Doses recorrentes | Implementado: início/fim, até oito horários, intervalo inteiro de 1–30 dias, fuso, até 730 doses. Cancelar preserva concluídas e doses passadas. |
| 3 | Consultas | Implementado: antecedência ajustável de 5–1440 minutos, mesmas regras da agenda nativa. |
| 4 | Histórico e autoria | Implementado: autor do servidor, instante, antes/depois e versão; consulta por área autorizada, até 300 eventos. Eventos antigos não são reconstruídos. |
| 5 | Diário e passagem de turno | Implementado: observação, passagem e correção por nova anotação; adultos com permissões de rotina. |
| 6 | Revisão de vínculos | Implementado: vínculos vencem, revisão com validade de até um ano, histórico de acesso. Migração dá 90 dias aos vínculos antigos. |
| 7 | Convites e saída | Implementado: convite vence em sete dias; aceite antes do vínculo; cuidador pode sair. Destinatário precisa de conta de cuidador existente. |
| 8 | Transferência | Implementado: solicitação e aceite com senha, prazo de 24 horas; acessos/QR/GPS revogados para revisão pelo novo administrador. |
| 9 | Contatos por pessoa | Implementado: principal e alternativo; abrir discador sem ligação automática. |
| 10 | Acessibilidade com idosos | Preparado: roteiro de avaliação, fonte, estados, foco, rolagem e contraste corrigidos. Sessões com idosos não foram realizadas. |
| 11 | Fontes | Implementado: escala de 1 a 1,6 por conta e ampliação do sistema; espaçamentos não são multiplicados pela preferência. |
| 12 | Contraste | Implementado: 26 pares de texto medidos nos dois temas, mínimo 4,5:1 nos pares avaliados. O teste não certifica todos os pixels/estados. |
| 13 | Leitor de tela e foco | Implementado: rótulos, escolhas/abas anunciadas, ícones decorativos, foco de campo e menu com botão de fechar. TalkBack/VoiceOver físicos pendentes. |
| 14 | Navegação | Implementado: funções filtradas por permissão, abas com rolagem e menu rolável; destinos compartilhados. Avaliação de orientação com usuários pendente. |
| 15 | Offline | Implementado no nativo: SQLCipher, chave no SecureStore, leitura até 15 minutos e sessão válida, fila de registros, revalidação e conferência de conflitos. Web não persiste dados sensíveis offline. |
| 16 | Recuperação/e-mail | Implementado: código de uso único, hash, 30 minutos, recuperação com encerramento de sessões. Resend/remetente dependem de configuração real. |
| 17 | Tentativas e sessões | Implementado: limites por e-mail/IP, lista e revogação de sessões. Atrás do proxy, limite de IP é compartilhado; detalhe em OPERACAO.md. |
| 18 | Implantação e cópia | Preparado: VM São Paulo, Docker/Caddy HTTPS, disco e pasta privados; backup AES-GCM, timer e restauração testada. Containers, TLS e agendamento não foram ativados. |
| 19 | Direitos e consentimento | Implementado: protocolos/status/respostas e declaração por pessoa, revogação e bloqueio de novos acessos. Verificação humana de representação e canal responsável continuam necessários. |
| 20 | Cadastro mínimo | Implementado: nome e autorização obrigatórios, CPF/RG/endereço opcionais, inclusive QR. Sem verificação oficial de identidade. |
| 21 | GPS real | Implementado: captura voluntária em primeiro plano pela conta da pessoa idosa, precisão/horário e exclusão; último ponto por até 24 horas. Aparelho real pendente; sem rastreamento contínuo. |
| 22 | Privacidade dos avisos | Implementado: texto genérico por padrão, detalhes só por escolha, canal Android privado e limpeza ao sair. Sistema operacional pode limitar a apresentação. |
| 23 | Áudio/vídeo e mídia | Implementado: upload privado, formatos/assinaturas e limites de 10 MB/arquivo e 200 MB/pessoa; autorização em download/exclusão. Pasta persistente separada; serviço externo/varredura adicional não ativados. |
| 24 | Exportação legível | Implementado: período até 366 dias, só áreas autorizadas, HTML na web e PDF/compartilhamento no nativo. Sem documentos, GPS ou arquivos de mídia no relatório. |
| 25 | Regressão | Implementado: testes Java/SQLite, integração HTTP, backup, fuso, contraste, tipos e lint. Compilação nativa e usuários reais permanecem fora das verificações locais. |
| 26 | Monitoramento | Implementado: contadores/duração/erros agregados, endpoint protegido e erros públicos genéricos. Alertas do provedor e supervisão operacional precisam ser instalados. |

## Fornecedores escolhidos

- **Compute Engine, São Paulo:** mantém uma única API junto do disco persistente, compatível com SQLite e com localização regional definida.
- **Resend:** envio por HTTPS com domínio próprio; recebe destinatário e código, sem registros de cuidado.
- **Cloud Storage privado, São Paulo:** destino separado das cópias cifradas, com acesso público impedido. A mídia ativa permanece no disco privado da API para preservar a autorização existente.
- **Caddy:** publica a exportação web e termina HTTPS; bloqueia as rotas operacionais públicas.

Fontes e configuração: [DEPENDENCIAS_E_INTEGRACOES.md](DEPENDENCIAS_E_INTEGRACOES.md) e [OPERACAO.md](OPERACAO.md). Não há conta criada, cobrança, publicação, envio real de e-mail ou coleta de localização nesta entrega.

## Próxima ativação

O mantenedor deve fornecer domínio, credenciais dos serviços e contato real do responsável pelos dados. Depois deve executar a implantação, instalar/restaurar uma cópia em ambiente separado, validar a build no aparelho e realizar a avaliação com pessoas prevista em ACESSIBILIDADE.md. Os manuais explicam os fluxos já disponíveis sem prometer uma integração ativa.
