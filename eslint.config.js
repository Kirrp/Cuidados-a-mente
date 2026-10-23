const { defineConfig, globalIgnores } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  globalIgnores(['dist/*', 'work/*', 'backups/*']),
  expoConfig,
  {
    // O TypeScript e o Metro resolvem @/ pela configuração de paths do
    // tsconfig. O resolvedor padrão do ESLint não conhece esse alias.
    rules: {
      'import/no-unresolved': ['error', { ignore: ['^@/'] }],
    },
  },
]);
