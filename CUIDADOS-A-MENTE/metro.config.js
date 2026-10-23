const { getDefaultConfig } = require('expo/metro-config');
const path = require('node:path');
const config = getDefaultConfig(__dirname);
// Exclui ferramentas e arquivos que não fazem parte do aplicativo.
const escapeRegex = value => value.replace(/[.*+?^${}()|[\]\\]/g, match => '\\' + match);
const ignored = ['work', 'backend', 'backups', '.local'].map(folder =>
  new RegExp('^' + escapeRegex(path.join(__dirname, folder)) + '[/\\\\]'));
const previous = config.resolver.blockList;
config.resolver.blockList = [...(Array.isArray(previous) ? previous : previous ? [previous] : []), ...ignored];
module.exports = config;
