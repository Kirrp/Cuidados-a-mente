# Avaliação de acessibilidade — 2026-10-11

Foram adicionados ampliação por conta de 100% a 160%, preservação de escala do sistema, textos secundários maiores, alvos principais com mínimo de 44/48/52, menu lateral a partir de 1024 px, navegação móvel com opção Mais e rolagem da semana, rótulos e estados de botões, ícones decorativos fora da leitura, destaque de foco e campos iniciais de modal com foco.

O teste scripts/test-core.mjs verifica 26 pares principais em claro/escuro e gera CONTRASTE.md. Corrigiu o contraste do texto da opção selecionada e do placeholder. Esses resultados não certificam todas as telas, imagens, estados ou conformidade completa.

Referência de avaliação: [WCAG 2.2](https://www.w3.org/TR/WCAG22/). Os testes nativos precisam combinar os critérios de leitura e operação com TalkBack/VoiceOver e experiência real.

## Roteiro com pessoas idosas

Use dados fictícios, explique a avaliação e registre somente dificuldades de uso necessárias. Evite gravar saúde ou imagem sem autorização específica.

| Tarefa | O que observar |
| --- | --- |
| Entrar por código QR digitado | Reconhece o próprio nome, consegue voltar e entende expiração |
| Encontrar medicamento pendente | Identifica pessoa, data e ação sem depender só de cor |
| Concluir e reabrir | Entende que é declaração; consegue corrigir engano |
| Ligar para contato alternativo | Encontra a opção e confirma no discador |
| Ampliar letras e usar tema escuro | Texto não corta, há rolagem e contraste |
| Usar leitor de tela | Ordem, rótulos, estado selecionado e anúncio de erro |
| Abrir/fechar modal com teclado | Foco visível e retorno ao acionador |
| Navegar em tela de 320 px | Abas acessíveis, botões alcançáveis e formulário rolável |
| Revogar compartilhamento | Entende destinatários e consegue interromper |
| Reconhecer falha de rede | Distingue salvo local de sincronizado |

Execute em Android e iOS, com fontes do sistema ampliadas, TalkBack e VoiceOver, redução de movimento quando aplicável e teclado na web. Registre dispositivo, tarefa, dificuldade, correção e resultado da repetição.

A avaliação com usuários e aparelhos físicos continua necessária; não foi realizada por esta entrega de código. O responsável pelo produto deve organizar os participantes e observar sem conduzir cada resposta.

## Conferência da atualização visual

A prévia web foi conferida em 320, 375 e 1280 px, incluindo tema escuro e fonte de 160%. Com letras ampliadas, a barra móvel usa menos destinos, preservando o acesso pelo menu Mais. As capturas usam dados de demonstração. A adaptação também considera a escala de fonte informada pelo aparelho; a verificação em aparelhos físicos permanece no roteiro acima.
