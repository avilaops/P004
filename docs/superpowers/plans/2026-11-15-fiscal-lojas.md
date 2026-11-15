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

- [ ] Regressões RED do parser detalhado e de fornecedor/custo transacional.
- [ ] Enriquecer fiscal-entrada-xml.ts; validar todos os decimais opcionais.
- [ ] Cadastro FornecedorLoja exato por tenant/documento e snapshot no recibo.
- [ ] Custos confirmados por linha no recibo, sem alterar preço de venda.
- [ ] Cadastro explícito de produto pela conferência usando catálogo canônico.
- [ ] UI detalhada e histórico de recebimento/custo; ampliar QA responsiva.
- [ ] Conferir contrato ERP para emissão e registrar dependências comprovadas.
- [ ] CI verde, revisão do diff, PR e evidências no Linear/controle.

## Progresso

Inspeção inicial: main d9521a3. AVL-254 contém prova histórica de publicação da
entrada e downloads, mas mantém fornecedor/produto/custo pendentes. AVL-240
depende de AVL-235 e AVL-250. Nenhuma declaração de conclusão global.
