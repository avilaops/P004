# Conferência fiscal do pedido • plano

**Goal:** Entregar conferência fiscal e pendências dos pedidos somente no Lojas.

**Architecture:** Projeção tipada pura, consulta Prisma em snapshot consistente,
GET privado por permissão fiscal e seção no detalhe do pedido.

**Spec:** ../specs/2026-11-15-fiscal-pedido-design.md

## Tarefas

- [ ] Observar RED dos casos de totais, classificação, documento e hash no CI.
- [ ] Implementar contrato puro `fiscal-pedido-contrato.ts`, sem cálculo fiscal.
- [ ] Implementar leitura `fiscal-pedido.ts` e GET protegido por tenant/permissão.
- [ ] Exibir conferência e links de correção do catálogo somente ao dono.
- [ ] Cobrir leitura sem efeitos, isolamento e jornada responsiva no CI.
- [ ] Revisar, integrar, publicar e registrar evidências no Linear/controle.

## Restrições

- Não alterar ERP, emitir documentos ou movimentar dados reais como teste.
- Builds e testes somente no GitHub CI; preservar dados e arquivos alheios.
- Distinguir preço do pedido, cadastro atual e tributação ainda não revisada.
