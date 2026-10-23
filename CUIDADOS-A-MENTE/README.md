# Cuidados à Mente
### Projeto de TCC — aplicativo de cuidado e acompanhamento

**Frontend:** Expo / React Native · **Backend:** Java 21 / Spring Boot · **Banco:** SQLite

## Comece aqui

1. Abra **Cuidados-a-Mente.code-workspace** no VS Code.
2. Se as bibliotecas ainda não estiverem instaladas, execute `npm ci` no terminal da raiz.
3. Acesse **Terminal → Executar Tarefa → Iniciar aplicativo completo**.
4. Aguarde o backend iniciar e abra o endereço mostrado pelo Expo.
5. Escolha **Inscreva-se aqui**, crie a conta e cadastre a pessoa acompanhada.

Você também pode abrir dois terminais na raiz: execute `npm run backend` em um e `npm run web` no outro.
Para parar, pressione **Ctrl+C** nos dois terminais.

## Onde encontrar cada coisa

| Pasta | Conteúdo |
| --- | --- |
| `src/` | Telas, componentes, sessão e chamadas da API |
| `assets/` | Imagens, ilustrações e ícones |
| `backend/` | Servidor Java e banco SQLite |
| `docs/` | Guias e documentação |
| `scripts/` | Inicialização e testes |
| `.vscode/` | Organização e tarefas do VS Code |
| `backups/` | Versões anteriores compactadas |
| `.local/` | Java portátil e dependências Maven deste computador |
| `work/` | Arquivos temporários e bancos de teste |

Pastas técnicas ficam ocultas no explorador do workspace, mas continuam no disco.

## Guias

- [Entenda as pastas e os arquivos](docs/ESTRUTURA.md)
- [Como executar e testar](docs/COMO_EXECUTAR.md)
- [Mapa das telas](docs/ROTAS.md)
- [Documentação da API](docs/API.md)
- [Registro da limpeza](docs/ORGANIZACAO.md)
- [Layouts do Figma e componentes novos](docs/LAYOUT_FIGMA.md)
- [Acesso do idoso por QR Code](docs/ACESSO_QR.md)

## Funcionalidades atuais

Cadastro em cinco etapas para cuidador e responsável. O idoso acessa por QR Code: sua conta é preparada em **Perfil → Configurar contas dos idosos** e não precisa de e-mail nem senha. Também há login/logout, edição de perfil e pessoas, consultas, doses de medicamentos, rotina, memórias com fotos e histórias, links de áudio/vídeo, relatórios de progresso e contato de emergência. Há uma roleta de atividades e um jogo de memória. Os registros podem ser criados, editados, concluídos e excluídos.

O idoso acessa os registros da pessoa vinculada à sua conta; o cuidador/responsável que o cadastrou acompanha os mesmos dados. Cada dose/atividade é um registro pontual; não há repetição automática.

Ainda faltam: compartilhamento de um idoso entre vários cuidadores/responsáveis, envio/validação de e-mail, recuperação de senha por e-mail, envio de arquivos de áudio/vídeo, notificações do sistema e integração com dispositivos. As telas distantes de Configurações no Figma continuam fora do escopo; a configuração de contas por QR Code foi solicitada separadamente.

**Não apague `backend/data/`: essa pasta guarda as contas e os registros reais.** Faça cópia com o backend parado.
