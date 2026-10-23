# Identidade visual - 2026-10-11

A interface usa roxo intenso para ações e seleção, texto escuro, cartões brancos e fundo lilás discreto. Verde, âmbar e vermelho comunicam estados junto com rótulos escritos. As ilustrações e o logotipo existentes foram preservados.

## Organização

- A partir de 1024 px: menu lateral, área central com até 920 px e estrutura com até 1240 px.
- Abaixo de 1024 px: cabeçalho, conteúdo rolável e barra com os principais destinos. Mais abre todas as áreas permitidas.
- Com fontes a partir de 140%: menos opções na barra preservam a leitura. O menu mantém todos os destinos.
- No painel: saudação, pessoa acompanhada, resumo, próximo lembrete e atalhos, nessa ordem.
- Botões, campos, cartões, filtros e tipografia compartilham tokens. As seleções usam preenchimento roxo e texto branco.

## Código para manter a consistência

| Arquivo | Responsabilidade |
| --- | --- |
| src/core/tema/paleta.ts | Cores centrais, tema escuro e escala de texto |
| src/components/ui/design-system.tsx | Action, Choice, Input, cartões e tipografia |
| src/components/layout/estrutura-aplicativo.tsx | Navegação e largura do conteúdo |
| src/features/cuidados/screens/painel.tsx | Hierarquia do painel e resumo do dia |

Ao criar uma tela, use os componentes e cores centrais. Evite inventar mais tons de roxo ou estilos de título locais. A tipografia usa a fonte do sistema; o aplicativo não espera mais o download da fonte Jua para mostrar a entrada.

## Verificação

TypeScript, lint, exportação web e teste de 26 pares de contraste. A revisão visual usa contas e banco de demonstração, separados dos dados da instalação. Confira também docs/ACESSIBILIDADE.md e docs/CONTRASTE.md.

![Painel no celular](imagens/tela-painel-celular.png)

![Painel no computador](imagens/tela-painel-desktop.png)
