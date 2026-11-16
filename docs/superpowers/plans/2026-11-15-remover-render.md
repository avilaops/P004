# Remover infraestrutura antiga do Render

**Objetivo:** Atender à determinação do proprietário de15/11/2026, mantendo o
destino SSH ativo e o fiscal em funcionamento.

## Plano

- [x] Conferir o destino real: GitHub `DEPLOY_TARGET=ssh` e health público200.
- [x] Remover jobs, workflow de backup e scripts exclusivos do Render.
- [x] Remover o proxy de recuperação que exigia origem `.onrender.com`.
- [x] Preservar R2, PostgreSQL, host por tenant e geração privada de DANFE.
- [x] Ajustar a política de timeout e a documentação operacional atual.
- [x] Validar no GitHub CI e integrar por PR.
- [x] Remover os segredos/variáveis Render do repositório e ambiente de produção.
- [x] Conferir publicação e registrar evidências, incluindo o incremento fiscal.

Serviços/bancos externos e seus dados não são excluídos sem inventário e prova
de que não atendem uma operação atual. Este plano remove a integração executável
do repositório e suas credenciais de CI; não declara exclusão remota.

## Resultado

PR267, versão `a3a3456293d65e37e44a42e0c844da54bbd87be9`. CI43694069556 e
produção43694671482 aprovados, produção na tentativa2. A primeira transferência
baixou a imagem, mas atingiu1min ao finalizar; repetição aproveitou a imagem
disponível. Deploy SSH e fumaça aprovados. Versão pública conferida em
`data-dpl-id`, home200 e banco saudável. Listagens GitHub sem segredos ou
variáveis `RENDER_*`. Evidências em
`evidencias/fiscal-e-remocao-render-2026-11-15.md`.
