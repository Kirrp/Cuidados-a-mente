# Acesso da pessoa idosa por QR Code

## Passo a passo

1. Entre como adulto autorizado e abra Perfil → Configurar contas dos idosos, ou o botão de QR da pessoa.
2. Cadastre uma pessoa com nome e declaração de autorização. CPF, RG, nascimento e endereço são opcionais; não impedem gerar o código.
3. Escolha Gerar QR Code de acesso.
4. No aparelho da pessoa, abra o leitor pelo ícone de QR da tela inicial.
5. Permita a câmera e escaneie. Se necessário, copie o código para Usar código de acesso.
6. Confira os documentos e autorizações exigidos para acessar os registros permitidos.

O código é uma credencial. Compartilhe somente com a pessoa a quem o acesso pertence. Não é um link público para a câmera padrão do celular.

![Código, sessão e permissões](imagens/evolucao-registros.svg)

## Validade e permissões

O código contém 256 bits aleatórios, vence em dez minutos e só funciona uma vez. Gerar outro cancela o anterior; o banco guarda o hash. A sessão dura até 12 horas. Desconectar o acesso revoga QR e sessões, preservando os registros.

A conta técnica vê apenas sua pessoa e ações autorizadas. A autorização do titular pode ser revogada na Central de privacidade. A transferência de administração também revoga as sessões técnicas e exige revisão. Cuidadores entram por suas contas e recebem convite; a conta técnica da pessoa não deve ser compartilhada entre adultos.

## Aparelhos e testes

Todos os aparelhos precisam alcançar a mesma API, configurada em `EXPO_PUBLIC_API_URL`. `localhost` no celular aponta para o próprio aparelho. Câmera web exige contexto seguro; HTTP por IP local pode impedir a captura. A alternativa manual permanece disponível.

Os testes de integração usam SQLite temporário, conferem expiração, rotação, consumo concorrente único, revogação, isolamento e persistência após reinício. Leitura óptica, armazenamento seguro e acesso em aparelho real precisam de avaliação nativa. Consulte COMO_EXECUTAR.md e ALTERACOES_E_TESTES.md.

## Acesso opcional por e-mail e senha

Uma conta idosa vinculada pode receber credenciais preparadas pelo proprietário do cadastro. A API `PUT /idosos/ID/acesso-senha` exige a sessão do proprietário e valida o e-mail e a senha; cuidadores vinculados não podem redefinir esse acesso. A tela Idoso oferece **Entrar com e-mail e senha**, além das opções de QR e código.

A senha usa BCrypt. Contas que usam somente QR continuam sem login por senha até a configuração explícita. O primeiro acesso mantém a conferência dos documentos. O idoso continua limitado à própria pessoa e às permissões do seu perfil. Desconectar o acesso ou transferir a administração desativa o login por senha e encerra sessões; a autorização revogada também bloqueia o acesso aos dados.
