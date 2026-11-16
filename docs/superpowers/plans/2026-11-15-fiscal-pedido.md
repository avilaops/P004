# Conferência fiscal do pedido • plano

**Goal:** Entregar conferência fiscal e pendências dos pedidos somente no Lojas.

**Architecture:** Projeção tipada pura, consulta Prisma em snapshot consistente,
GET privado por permissão fiscal e seção no detalhe do pedido.

**Spec:** ../specs/2026-11-15-fiscal-pedido-design.md

## Tarefas

- [x] Observar RED dos casos de totais, classificação, documento e hash no CI.
- [x] Implementar contrato puro `fiscal-pedido-contrato.ts`, sem cálculo fiscal.
- [x] Implementar leitura `fiscal-pedido.ts` e GET protegido por tenant/permissão.
- [x] Exibir conferência e links de correção do catálogo somente ao dono.
- [x] Completar edição de NCM/CEST no formulário e contrato do catálogo.
- [x] Cobrir leitura sem efeitos, isolamento e jornada responsiva no CI.
- [x] Revisar, integrar, publicar e registrar evidências no Linear/controle.

## Restrições

- Não alterar ERP, emitir documentos ou movimentar dados reais como teste.
- Builds e testes somente no GitHub CI; preservar dados e arquivos alheios.
- Distinguir preço do pedido, cadastro atual e tributação ainda não revisada.

## Progresso

PR268. RED confirmado em43696155490 por ausência do contrato e43696270463 por
ausência do serviço. Implementação permanece somente no Lojas, conforme resposta
explícita do proprietário. Nenhuma operação fiscal externa executada.

Revisão encontrou os campos NCM/CEST no modelo, mas ausentes no formulário e no
schema de edição. Regressão adicionada em `admin-schemas.test.ts` antes da
correção, para que o link de pendência permita corrigir e atualizar a conferência.

## Entrega

PR268, versão `4fe4d40b982538864bacdf359c31576906b6ac68`. CI final43698281827 e
produção43698926994 aprovados, produção na tentativa2. Home pública200com versão
exata; rota privada401JSON/no-storesem sessão. Jornada confirmou dono, gerente403,
outro tenant404, leitura sem efeitos e correção NCM/CEST com retorno ao pedido,
novo hash e preço comprado preservado. Conferência393/1440px sem vazamento lateral.

A emissão permanece indisponível no contrato atual. Nenhum código do ERP ou
documento fiscal real foi alterado. Evidências em
`evidencias/fiscal-conferencia-pedido-2026-11-15.md`.
