# Manuais ilustrados — Cuidados à Mente

Edição ampliada de **27 de outubro de 2026**, baseada nos fontes do projeto em `6dc5411905a762136eb84dc3c6bac9e34677b793`. O commit da publicação registra a ampliação documental e as ferramentas de geração. Não foram modificadas funcionalidades do aplicativo.

| Manual | PDF publicado | Extensão | Conteúdo |
| --- | --- | --- | --- |
| Sintaxe | [Abrir ou baixar PDF](../../output/pdf/manual-sintaxe-cuidados-a-mente.pdf) | 53 páginas, 46 capítulos | TypeScript, TSX/React, Java, SQL e Python; exemplos reais numerados, fundamentos, exercícios resolvidos e investigação de erros |
| Uso | [Abrir ou baixar PDF](../../output/pdf/manual-usuario-cuidados-a-mente.pdf) | 66 páginas, 52 capítulos | Cadastro, perfis, permissões, cuidado diário, registros, memórias, avisos, offline, privacidade, suporte e treinamento |
| Manual-aula complementar | [Abrir ou baixar PDF](../../output/pdf/manual-aula-cuidados-a-mente.pdf) | 31 páginas | Funcionalidades ligadas aos trechos da implementação |

Os dois manuais principais somam **119 páginas**. Todos têm capa, texto pesquisável, sumário com páginas e links internos, marcadores do leitor de PDF e links de referência. As capturas de tela contêm dados de demonstração; diagramas identificam sequências e regras. A data de uma captura pode ser anterior à edição.

## Escolha sua leitura

O manual de uso começa com uma consulta por funcionalidades e segue com roteiros completos por perfil, resolução de problemas, diferenças entre web e nativo e treinamento com dados fictícios. Os exemplos de código dessa primeira parte são opcionais para o usuário final.

O manual de sintaxe começa com trechos reais extraídos do projeto e segue com uma trilha de fundamentos, significado dos operadores, componentes e estado, requisições, classes, persistência e exercícios resolvidos. Exemplos simplificados aparecem explicitamente como didáticos.

As orientações descrevem o código existente. Não certificam uma implantação externa, a entrega real de notificações ou criptografia e GPS em aparelho. Esses recursos exigem a preparação e os testes descritos nos guias do projeto.

## Fontes editáveis

- [Manual de sintaxe completo em Markdown](../MANUAL-SINTAXE.md).
- [Manual de uso completo em Markdown](../MANUAL_USUARIO.md).
- [Manual-aula em Markdown](../MANUAL-AULA.md).
- [Capítulos de aprofundamento de sintaxe](aprofundamento-sintaxe.md).
- [Capítulos de aprofundamento de uso](aprofundamento-uso.md).
- [Diagramas SVG da edição](../imagens/manuais/).

Os três Markdown completos são saídas do gerador. Para alterar a primeira parte, edite `scripts/atualizar-manuais.mjs` ou `scripts/recursos-manuais.json`; para alterar o aprofundamento, edite os dois arquivos nesta pasta. Não altere apenas o resultado, pois uma nova geração o substituirá.

## Gerar e conferir

Prepare o ambiente Python e as fontes conforme [Como executar](../COMO_EXECUTAR.md). Com o ambiente virtual ativo, execute na raiz:

```bash
python -m pip install -r scripts/requirements-manuais.txt
npm run docs:manuals
npm run docs:pdf
npm run docs:check
```

`docs:manuals` usa Node.js e a biblioteca padrão para extrair os trechos e compor os Markdown. `docs:pdf` gera os dez novos diagramas e os três PDFs usando Python. `docs:check` requer Poppler, verifica texto e produz folhas de contato para inspeção visual. As saídas temporárias ficam em `tmp/pdfs/` e não devem ser publicadas.

Na conferência da edição, verificam-se imagens e links locais, contagem e texto das páginas, presença de sumário e marcadores, correspondência dos trechos numerados aos fontes e renderização dos PDFs. Validação documental não equivale a executar testes do aplicativo.

As dependências de Python estão fixadas em [requirements-manuais.txt](../../scripts/requirements-manuais.txt). Fontes DejaVu são detectadas no Linux; Windows utiliza Arial/Consolas quando disponíveis. `MANUAL_FONTS_DIR` permite selecionar as fontes DejaVu em outra pasta.

As contagens acima se referem aos PDFs publicados, gerados com DejaVu. Fontes alternativas podem alterar a paginação em uma nova geração.
