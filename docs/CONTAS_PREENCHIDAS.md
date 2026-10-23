# Contas preenchidas no aplicativo

Conjunto criado em 11/10/2026 no banco persistente backend/data/cuidados.db. Responsável Marina Costa, cuidador Lucas Martins e idoso Antônio Costa estão vinculados ao mesmo cadastro. Nomes, documentos, contatos, relatos e itens de medicamento são fictícios.

- 32 registros de consultas (7 concluídos).
- 504 registros de medicamentos (69 concluídos).
- 60 registros de memorias (60 concluídos).
- 704 registros de rotinas (149 concluídos).
- 6 planos recorrentes de medicamentos demonstrativos.
- 84 anotações de diário e passagem de turno.
- 12 ilustrações privadas em memórias.
- 1687 eventos de autoria, incluindo a importação local fictícia.

O conjunto cobre oito semanas de rotinas, seis semanas futuras de lembretes, compromissos e memórias distribuídas em vários meses. O responsável administra; o cuidador acessa por vínculo aceito; o idoso vê somente seu próprio cadastro, com as ações permitidas ao seu perfil.

Credenciais ficam somente no arquivo local ignorado work/contas-app/ACESSOS.md, não nos manuais. Para recriar ou retomar, com a API usando este banco: node scripts/criar-contas-preenchidas.mjs --confirmar-banco-persistente. A reexecução preserva as contas, não redefine senhas e não duplica o conjunto.

O login do idoso permite e-mail e senha quando configurados pelo proprietário. A alternativa QR permanece. Uma desconexão ou transferência desativa a senha e encerra sessões para revisão pelo proprietário.
