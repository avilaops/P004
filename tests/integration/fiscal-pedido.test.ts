import assert from "node:assert/strict";
import { after, test } from "node:test";
import { randomUUID } from "node:crypto";
import { prisma } from "../../src/lib/db";
import { salvarProdutoNoCatalogo } from "../../src/lib/catalogo-escrita";
import { prepararFiscalDoPedido } from "../../src/lib/fiscal-pedido";

const db = new URL(process.env.DATABASE_URL ?? "http://invalid");
if (!["localhost", "127.0.0.1"].includes(db.hostname) || db.port !== "5548" || !db.pathname.endsWith("_test")) throw new Error("QA exige PostgreSQL isolado :5548/*_test.");
const lojas: string[] = [];
after(async () => {
  await prisma.tenant.deleteMany({ where: { id: { in: lojas } } });
  await prisma.$disconnect();
});

async function fixture() {
  const tenant = await prisma.tenant.create({ data: { slug: `qa-fiscal-pedido-${randomUUID()}`, nome: "Loja QA", cnpj: "11222333000181", status: "ATIVA" } });
  lojas.push(tenant.id);
  const produto = await salvarProdutoNoCatalogo(tenant.id, null, { nome: "Nome atual do catálogo", slug: "produto-qa", precoCentavos: 99999, estoque: 5, ncm: "40111000" });
  const variante = await prisma.variante.findFirstOrThrow({ where: { tenantId: tenant.id, produtoId: produto.id } });
  const pedido = await prisma.pedido.create({ data: { tenantId: tenant.id, referencia: randomUUID(), status: "PAGO", clienteNome: "Comprador QA", clienteDocumento: "52998224725", clienteEmail: "qa@example.test", clienteTelefone: "11999999999", freteNome: "Entrega QA", freteCentavos: 500, subtotalCentavos: 20000, descontoCentavos: 1000, totalCentavos: 19500, meioPagamento: "pix", pagamentoStatus: "approved", entrega: { logradouro: "Rua QA", numero: "1", bairro: "Centro", cidade: "São Paulo", uf: "SP", cep: "01001000" }, itens: { create: { produtoId: produto.id, varianteId: variante.id, nome: "Nome comprado", sku: "QA", quantidade: 2, precoUnitarioCentavos: 10000 } } } });
  return { tenant, pedido, produto, variante };
}

test("conferência usa preço e descrição comprados e não altera pedido ou estoque", async () => {
  const f = await fixture();
  const antes = { eventos: await prisma.eventoPedido.count({ where: { tenantId: f.tenant.id } }), comandos: await prisma.comandoEstoque.count({ where: { tenantId: f.tenant.id } }) };
  const r = await prepararFiscalDoPedido(f.tenant.id, f.pedido.id);
  assert.equal(r.dados.itens[0].nome, "Nome comprado");
  assert.equal(r.dados.itens[0].precoUnitarioCentavos, 10000);
  assert.equal(r.dados.itens[0].classificacaoAtual?.ncm, "40111000");
  assert.equal((await prepararFiscalDoPedido(f.tenant.id, f.pedido.id)).resumoHash, r.resumoHash);
  assert.equal((await prisma.pedido.findUniqueOrThrow({ where: { id: f.pedido.id } })).atualizadoEm.getTime(), f.pedido.atualizadoEm.getTime());
  assert.equal((await prisma.saldoEstoque.findFirstOrThrow({ where: { tenantId: f.tenant.id, varianteId: f.variante.id } })).fisico, 5);
  assert.equal(await prisma.eventoPedido.count({ where: { tenantId: f.tenant.id } }), antes.eventos);
  assert.equal(await prisma.comandoEstoque.count({ where: { tenantId: f.tenant.id } }), antes.comandos);
  assert.equal(JSON.stringify(r).includes("senhaHash"), false);
});

test("pedido de outra loja é inexistente e mudança do catálogo invalida o hash", async () => {
  const f = await fixture(), outra = await fixture();
  await assert.rejects(() => prepararFiscalDoPedido(outra.tenant.id, f.pedido.id), /não encontrado/i);
  const antes = await prepararFiscalDoPedido(f.tenant.id, f.pedido.id);
  await salvarProdutoNoCatalogo(f.tenant.id, f.produto.id, { ncm: "40112000" });
  assert.notEqual((await prepararFiscalDoPedido(f.tenant.id, f.pedido.id)).resumoHash, antes.resumoHash);
});
