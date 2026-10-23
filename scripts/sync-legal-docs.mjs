// Fonte única: o mesmo conteúdo exibido no aplicativo gera as cópias de revisão.
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import ts from 'typescript';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const source = await readFile(path.join(root, 'src/legal/content.ts'), 'utf8');
const sourceFile = ts.createSourceFile('content.ts', source, ts.ScriptTarget.Latest, true);
if (sourceFile.parseDiagnostics.length) {
  throw new Error('A fonte dos documentos jurídicos contém sintaxe inválida.');
}
const declarations = new Map();
for (const statement of sourceFile.statements) {
  if (
    !ts.isVariableStatement(statement) ||
    !(statement.declarationList.flags & ts.NodeFlags.Const) ||
    !statement.modifiers?.some((modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword)
  ) {
    continue;
  }
  for (const declaration of statement.declarationList.declarations) {
    if (ts.isIdentifier(declaration.name) && declaration.initializer) {
      declarations.set(declaration.name.text, declaration.initializer);
    }
  }
}

function readValue(expression) {
  if (ts.isStringLiteral(expression) || ts.isNoSubstitutionTemplateLiteral(expression)) {
    return expression.text;
  }
  if (ts.isParenthesizedExpression(expression)) {
    return readValue(expression.expression);
  }
  if (
    ts.isBinaryExpression(expression) &&
    expression.operatorToken.kind === ts.SyntaxKind.PlusToken
  ) {
    const left = readValue(expression.left);
    const right = readValue(expression.right);
    if (typeof left === 'string' && typeof right === 'string') {
      return left + right;
    }
  }
  if (ts.isArrayLiteralExpression(expression)) {
    return expression.elements.map(readValue);
  }
  if (ts.isObjectLiteralExpression(expression)) {
    return Object.fromEntries(
      expression.properties.map((property) => {
        if (
          !ts.isPropertyAssignment(property) ||
          !(ts.isIdentifier(property.name) || ts.isStringLiteral(property.name))
        ) {
          throw new Error('Os documentos jurídicos precisam conter apenas dados puros.');
        }
        return [property.name.text, readValue(property.initializer)];
      }),
    );
  }
  throw new Error('Os documentos jurídicos precisam conter apenas dados puros.');
}

function readData(name) {
  const expression = declarations.get(name);
  if (!expression) {
    throw new Error('Documento não encontrado: ' + name);
  }
  return readValue(expression);
}
const version = declarations.has('LEGAL_VERSION') ? readData('LEGAL_VERSION') : undefined;
if (typeof version !== 'string' || !version) {
  throw new Error('Versão jurídica não encontrada.');
}
const references = readData('legalReferences');
for (const [name, filename] of [
  ['terms', 'Termos_de_Uso_Cuidados_a_Mente.md'],
  ['privacy', 'Politica_de_Privacidade_Cuidados_a_Mente.md'],
]) {
  const document = readData(name);
  if (!document.intro.includes('Versão ' + version)) {
    throw new Error('Introdução com versão divergente: ' + name);
  }
  const markdown =
    [
      '# ' + document.title + ' — Cuidados à Mente',
      document.intro,
      ...document.sections.map((section) => '## ' + section.heading + '\n\n' + section.text),
      `## Referências oficiais para revisão jurídica

Fontes consultadas em 5 de outubro de 2026. A redação das cláusulas é própria do projeto; os links permitem conferir os fundamentos indicados.

` + references.map((reference) => '- [' + reference.title + '](' + reference.url + ')').join('\n'),
      'Esta cópia é gerada por `node scripts/sync-legal-docs.mjs` a partir de ' +
        '`src/legal/content.ts`. Edite a fonte, atualize a versão também no backend ' +
        'e gere novamente as cópias.',
    ].join('\n\n') + '\n';
  await writeFile(path.join(root, 'docs', filename), markdown, 'utf8');
  process.stdout.write(filename + ': versão ' + version + '\n');
}
