import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import ts from 'typescript';
const root = path.resolve(import.meta.dirname, '..');
async function modulo(nome) {
  const texto = await fs.readFile(path.join(root, nome), 'utf8');
  const js = ts.transpileModule(texto, {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ES2022 },
  }).outputText;
  return import('data:text/javascript;base64,' + Buffer.from(js).toString('base64'));
}
const { instanteDoRegistro } = await modulo('src/core/notificacoes/horario.ts');
assert.equal(
  instanteDoRegistro('2026-10-12', '08:00', 'America/Sao_Paulo').toISOString(),
  '2026-10-12T11:00:00.000Z',
);
assert.equal(
  instanteDoRegistro('2026-07-01', '08:00', 'America/New_York').toISOString(),
  '2026-07-01T12:00:00.000Z',
);
assert.equal(
  instanteDoRegistro('2026-01-01', '08:00', 'America/New_York').toISOString(),
  '2026-01-01T13:00:00.000Z',
);
assert.equal(instanteDoRegistro('2026-03-08', '02:30', 'America/New_York'), null);
assert.equal(instanteDoRegistro('2026-10-12', '08:00', 'Fuso/Invalido'), null);
const { adaptarCor, adaptarEstilos, colors } = await modulo('src/core/tema/paleta.ts');
assert.deepEqual(adaptarEstilos({ fontSize: 20, lineHeight: 30, padding: 10 }, 'claro', 1.6), {
  fontSize: 32,
  lineHeight: 48,
  padding: 10,
});
function luminancia(hex) {
  const c = hex.replace('#', '');
  const rgb = [0, 2, 4]
    .map((i) => parseInt(c.slice(i, i + 2), 16) / 255)
    .map((v) => (v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)));
  return rgb[0] * 0.2126 + rgb[1] * 0.7152 + rgb[2] * 0.0722;
}
function contraste(a, b) {
  const x = luminancia(a);
  const y = luminancia(b);
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
}
const pares = [
  ['Corpo', colors.body, '#FFFFFF', 4.5],
  ['Secundário', colors.muted, '#FFFFFF', 4.5],
  ['Secundário no fundo', colors.muted, colors.surface, 4.5],
  ['Placeholder', colors.muted, '#FFFFFF', 4.5],
  ['Botão e seleção', '#FFFFFF', colors.purple, 4.5],
  ['Texto de opção', colors.purple, colors.nav, 4.5],
  ['Link', colors.purple, colors.pale, 4.5],
  ['Cabeçalho', colors.ink, '#FFFFFF', 4.5],
  ['Navegação lateral', '#FFFFFF', colors.sidebar, 4.5],
  ['Legenda lateral', '#DDD0EB', colors.sidebar, 4.5],
  ['Erro', colors.danger, colors.red, 4.5],
  ['Sucesso', colors.teal, colors.green, 4.5],
  ['Atenção', colors.amber, colors.yellow, 4.5],
];
const relatorio = [];
for (const tema of ['claro', 'escuro']) {
  for (const [nome, texto, fundo, minimo] of pares) {
    const a = adaptarCor(texto, tema, 'texto').replace('white', '#FFFFFF');
    const b = adaptarCor(fundo, tema, 'fundo');
    const valor = contraste(a, b);
    assert.ok(valor >= minimo, nome + ' ' + tema + ': ' + valor.toFixed(2));
    relatorio.push('| ' + [nome, tema, a, b, valor.toFixed(2) + ':1'].join(' | ') + ' |');
  }
}
await fs.writeFile(
  path.join(root, 'docs/CONTRASTE.md'),
  `# Contraste dos tokens principais

Gerado por scripts/test-core.mjs. Referência: contraste mínimo de 4,5:1 para estes pares de texto. Não certifica telas completas, imagens, estados desabilitados ou leitor de tela.

| Uso | Tema | Texto | Fundo | Contraste |
| --- | --- | --- | --- | --- |
` +
    relatorio.join('\n') +
    '\n',
);
console.log('OK: fuso, horário sazonal, fonte e ' + relatorio.length + ' pares de contraste.');
