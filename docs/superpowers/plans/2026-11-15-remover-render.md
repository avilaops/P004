# Remover infraestrutura antiga do Render

**Objetivo:** Atender à determinação do proprietário de15/11/2026, mantendo o
destino SSH ativo e o fiscal em funcionamento.

## Plano

- [x] Conferir o destino real: GitHub `DEPLOY_TARGET=ssh` e health público200.
- [x] Remover jobs, workflow de backup e scripts exclusivos do Render.
- [x] Remover o proxy de recuperação que exigia origem `.onrender.com`.
- [x] Preservar R2, PostgreSQL, host por tenant e geração privada de DANFE.
- [x] Ajustar a política de timeout e a documentação operacional atual.
- [ ] Validar no GitHub CI e integrar por PR.
- [ ] Remover os segredos/variáveis Render do repositório e ambiente de produção.
- [ ] Conferir publicação e registrar evidências, incluindo o incremento fiscal.

Serviços/bancos externos e seus dados não são excluídos sem inventário e prova
de que não atendem uma operação atual. Este plano remove a integração executável
do repositório e suas credenciais de CI; não declara exclusão remota.
