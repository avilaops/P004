import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { after, test } from "node:test";
import { prisma } from "../../src/lib/db";
import { manifestarDocumento } from "../../src/lib/fiscal-manifestacao";

const url = new URL(process.env.DATABASE_URL ?? "http://invalid");
if (!["127.0.0.1", "localhost"].includes(url.hostname) || !["5548", "5588"].includes(url.port) || !url.pathname.endsWith("_test")) throw new Error("Teste exige Postgres local isolado :5548 ou :5588 e base *_test.");
const lojas: string[] = [];
after(async () => {
  await prisma.manifestacaoFiscalLoja.deleteMany({ where: { tenantId: { in: lojas } } });
  await prisma.tenant.deleteMany({ where: { id: { in: lojas } } });
  await prisma.$disconnect();
});

test("manifestação inválida ou certificado indisponível não reservam a identidade fiscal", async () => {
  const cnpj = "12345678000195";
  const loja = await prisma.tenant.create({ data: { slug: `manifestacao-${randomUUID()}`, nome: "QA manifestação", plano: "LOJA_PRO", status: "ATIVA", cnpj } });
  lojas.push(loja.id);
  await prisma.fiscalLoja.create({ data: { tenantId: loja.id, cnpj, uf: "SP", titular: "QA", certificadoEnc: "invalido", validoAte: new Date(Date.now() + 86400000) } });
  const doc = await prisma.documentoFiscalLoja.create({ data: { tenantId: loja.id, cnpj, destinatarioDocumento: cnpj, chave: "35261012345678000195550010000001231482917360", nsu: "000000000000001", schema: "resNFe.xsd", xml: "<resNFe/>" } });
  const dados = { tenantId: loja.id, documentoId: doc.id, tipo: "NAO_REALIZADA" as const, autor: "qa@example.test" };
  await assert.rejects(manifestarDocumento({ ...dados, justificativa: "curta" }), /15 a 255/);
  assert.equal(await prisma.manifestacaoFiscalLoja.count({ where: { tenantId: loja.id } }), 0);
  await assert.rejects(manifestarDocumento({ ...dados, justificativa: "Mercadoria não entregue ao destinatário." }));
  assert.equal(await prisma.manifestacaoFiscalLoja.count({ where: { tenantId: loja.id } }), 0);
  await assert.rejects(manifestarDocumento({ ...dados, tenantId: "outra-loja" }));
  assert.equal(await prisma.auditoriaFiscalLoja.count({ where: { tenantId: loja.id } }), 0);
});
