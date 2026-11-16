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
- [x] CI verde, revisão do diff, PR e evidências no Linear/controle.

## Progresso

Inspeção inicial: main d9521a3. AVL-254 contém prova histórica de publicação da
entrada e downloads, mas mantém fornecedor/produto/custo pendentes. AVL-240
depende de AVL-235 e AVL-250. Nenhuma declaração de conclusão global.

RED:43691594347(campos fiscais/fornecedor/custos) e43691725289(cadastro ausente).
Primeiro GREEN parcial8de363d: unitários, integração PostgreSQL em três partes,
lint, tipos e contratos aprovados em43692294861. Build/navegador em andamento.
Incremento seguinte amplia navegador para cadastro de produto e cinco larguras.

Entrega do recebimento concluída: PR265 integrado em
`20ddb6603d57da7a7baf62183714835bfc30d971`. CI final do PR43692768983 e produção
43693482933 aprovados, produção na tentativa3. Backup pré-migração conferido,
duas tabelas aditivas aplicadas, fumaça aprovada e versão pública conferida.
Fornecedor, produtos e custos foram verificados no navegador sintético em
360,393,768,1280e1440px. Nenhuma entrada ou manifestação real de teste.

O texto do GREEN parcial acima é histórico. Emissão de pedidos permanece
dependente da AVL-250; este plano não declara o módulo fiscal inteiro concluído.
