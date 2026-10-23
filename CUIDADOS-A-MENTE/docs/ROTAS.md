# Mapa das telas

## Fluxo integrado

| Endereço | Tela |
| --- | --- |
| / | Entrada |
| /login | Login |
| /cadastro | Escolha do perfil |
| /cadastro/cadastro_responsavel | Cadastro de responsável |
| /cadastro/cadastro_cuidador | Cadastro de cuidador |
| /cadastro/cadastro_idoso | Redireciona para o acesso por QR Code do idoso |
| /contas-idosos | Cadastro completo do idoso, edição e geração do QR Code pelo cuidador/responsável |
| /acesso-idoso | Leitura do QR Code e entrada do idoso |
| /painel | Menu principal |
| /pessoas | Pessoas acompanhadas |
| /meu-perfil | Dados da conta |
| /consultas | Consultas |
| /medicamentos | Doses de medicamentos |
| /registros?tipo=rotinas | Atividades |
| /registros?tipo=memorias | Memórias em texto |

## Endereços de compatibilidade

As pastas responsavel, cuidador e idoso preservam os endereços anteriores.
Suas telas iniciais usam o painel integrado. Rotinas, consultas e bancos de memórias usam registros-screen.tsx.

Os arquivos pequenos que apenas importam outra tela são atalhos de compatibilidade, não cópias desnecessárias.

## Telas antigas preservadas

Confirmação/verificação de e-mail, chave de acesso, emergência, atividade do idoso, pasta de memórias e relatório do responsável.
Algumas ainda usam dados de exemplo e ações em desenvolvimento; não estão no painel integrado.
