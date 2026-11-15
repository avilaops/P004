# Fiscal do Lojas • plano de implementação

**Goal:** Completar conferência, fornecedor, produtos e custos da AVL-254 e
verificar o contrato externo exigido pela AVL-240.

**Architecture:** Next.js/Prisma; catálogo canônico; custo e fornecedor anexados
ao recibo imutável na mesma transação da entrada.

**Spec:** ../specs/2026-11-15-fiscal-lojas-design.md

## Restrições

- Somente GitHub CI executa builds e testes.
- Nenhuma operação fiscal ou entrada real como teste.
- Separador textual •; preservar histórico e alterações alheias.

## Tarefas

- [x] Regressões RED do parser detalhado e de fornecedor/custo transacional.
- [x] Enriquecer fiscal-entrada-xml.ts; validar todos os decimais opcionais.
- [x] Cadastro FornecedorLoja exato por tenant/documento e snapshot no recibo.
- [x] Custos confirmados por linha no recibo, sem alterar preço de venda.
- [x] Cadastro explícito de produto pela conferência usando catálogo canônico.
- [x] UI detalhada e histórico de recebimento/custo; ampliar QA responsiva.
- [x] Conferir contrato ERP para emissão e registrar dependências comprovadas.
- [ ] CI verde, revisão do diff, PR e evidências no Linear/controle.

## Progresso

Inspeção inicial: main d9521a3. AVL-254 contém prova histórica de publicação da
entrada e downloads, mas mantém fornecedor/produto/custo pendentes. AVL-240
depende de AVL-235 e AVL-250. Nenhuma declaração de conclusão global.

RED:43691594347(campos fiscais/fornecedor/custos) e43691725289(cadastro ausente).
Primeiro GREEN parcial8de363d: unitários, integração PostgreSQL em três partes,
lint, tipos e contratos aprovados em43692294861. Build/navegador em andamento.
Incremento seguinte amplia navegador para cadastro de produto e cinco larguras.
