import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { after, test } from "node:test";
import forge from "node-forge";
import { prisma } from "../../src/lib/db";
import { manifestarDocumento } from "../../src/lib/fiscal-manifestacao";
import { selarCertificado } from "../../src/lib/fiscal-certificado";

const url = new URL(process.env.DATABASE_URL ?? "http://invalid");
if (!["127.0.0.1", "localhost"].includes(url.hostname) || !["5548", "5588"].includes(url.port) || !url.pathname.endsWith("_test")) throw new Error("Teste exige Postgres local isolado :5548 ou :5588 e base *_test.");
const lojas: string[] = [];
process.env.LOJAS_CERT_SECRET = "cd".repeat(32);
const chaves = forge.pki.rsa.generateKeyPair(2048);
async function prepararCertificado() {
  const cnpj = String(BigInt(`0x${randomUUID().replaceAll("-", "")}`) % 100000000000000n).padStart(14, "0");
  const cert = forge.pki.createCertificate();
  cert.publicKey = chaves.publicKey;
  cert.serialNumber = "01";
  cert.validity.notBefore = new Date(Date.now() - 86400000);
  cert.validity.notAfter = new Date(Date.now() + 86400000);
  cert.setSubject([{ name: "commonName", value: `QA:${cnpj}` }]);
  cert.setIssuer(cert.subject.attributes);
  cert.sign(chaves.privateKey, forge.md.sha256.create());
  const pfx = Buffer.from(forge.asn1.toDer(forge.pkcs12.toPkcs12Asn1(chaves.privateKey, cert, "senha", { algorithm: "3des" })).getBytes(), "binary");
  const loja = await prisma.tenant.create({ data: { slug: `manifestacao-${randomUUID()}`, nome: "QA manifestação", plano: "LOJA_PRO", status: "ATIVA", cnpj } });
  lojas.push(loja.id);
  await prisma.fiscalLoja.create({ data: { tenantId: loja.id, cnpj, uf: "SP", titular: "QA", certificadoEnc: selarCertificado(pfx, "senha"), validoAte: cert.validity.notAfter } });
  const chave = `352610${cnpj}550010000001231482917360`;
  assert.equal(chave.length, 44);
  const doc = await prisma.documentoFiscalLoja.create({ data: { tenantId: loja.id, cnpj, destinatarioDocumento: cnpj, chave, nsu: "000000000000001", schema: "resNFe.xsd", xml: "<resNFe/>" } });
  return { cnpj, dados: { tenantId: loja.id, documentoId: doc.id, tipo: "CIENCIA" as const, autor: "qa@example.test" }, chave };
}
after(async () => {
  await prisma.manifestacaoFiscalLoja.deleteMany({ where: { tenantId: { in: lojas } } });
  await prisma.tenant.deleteMany({ where: { id: { in: lojas } } });
  await prisma.$disconnect();
});

test("confirmações concorrentes transmitem uma vez e preservam o comando original", async () => {
  const { dados } = await prepararCertificado();
  let envios = 0;
  let recebidos = 0;
  let liberar!: () => void;
  const gate = new Promise<void>((resolve) => { liberar = resolve; });
  const transporte = {
    enviar: async () => { envios++; await gate; return "<retEnvEvento><cStat>128</cStat><retEvento><infEvento><cStat>573</cStat><xMotivo>QA sintético</xMotivo></infEvento></retEvento></retEnvEvento>"; },
    consultar: async () => { throw new Error("Não deve consultar XML de evento rejeitado"); },
  };
  try {
    const resultados = await Promise.all(Array.from({ length: 5 }, () => manifestarDocumento(dados, transporte).then((resultado) => {
      if (++recebidos === 4) liberar();
      return resultado;
    })));
    assert.equal(new Set(resultados.map((r) => r.id)).size, 1);
    assert.equal(envios, 1);
    const repetido = await manifestarDocumento({ ...dados, autor: "outro@example.test" }, transporte);
    assert.equal(repetido.status, "REJEITADA");
    assert.equal(repetido.autor, dados.autor);
    assert.equal(repetido.tentativas, 1);
    assert.equal(envios, 1);
  } finally { liberar(); }
});

test("falha de transporte preserva intenção incerta sem retransmitir", async () => {
  const { dados } = await prepararCertificado();
  let envios = 0;
  const transporte = {
    enviar: async () => { envios++; throw new Error("Falha sintética de transporte"); },
    consultar: async () => { throw new Error("Consulta inesperada"); },
  };
  await assert.rejects(manifestarDocumento(dados, transporte));
  const repetido = await manifestarDocumento(dados, transporte);
  assert.equal(repetido.status, "PENDENTE_CONFERENCIA");
  assert.equal(repetido.resultadoFinal, false);
  assert.equal(repetido.tentativas, 1);
  assert.equal(envios, 1);
});

test("falha posterior de auditoria não desfaz aceite ou protocolo persistidos", async () => {
  const { dados, chave } = await prepararCertificado();
  const criarAuditoria = prisma.auditoriaFiscalLoja.create;
  let falhasDeAuditoria = 0;
  // O delegate do Prisma é um Proxy sem descriptor de método para mock.method.
  prisma.auditoriaFiscalLoja.create = () => { falhasDeAuditoria++; throw new Error("Auditoria indisponível no teste"); };
  try {
    const resultado = await manifestarDocumento(dados, {
      enviar: async () => `<retEnvEvento><cStat>128</cStat><retEvento><infEvento><cStat>135</cStat><chNFe>${chave}</chNFe><nProt>135260000099999</nProt></infEvento></retEvento></retEnvEvento>`,
      consultar: async () => { throw new Error("Consulta não alcançada"); },
    });
    assert.equal(resultado.status, "ACEITA");
    assert.equal(resultado.protocolo, "135260000099999");
    assert.equal(resultado.resultadoFinal, true);
    assert.equal(falhasDeAuditoria, 1);
    const persistido = await prisma.manifestacaoFiscalLoja.findUniqueOrThrow({ where: { id: resultado.id } });
    assert.equal(persistido.status, "ACEITA");
    assert.equal(persistido.proximaTentativaEm, null);
  } finally { prisma.auditoriaFiscalLoja.create = criarAuditoria; }
});

test("CNPJ integrado não transmite pelo coletor local", async () => {
  const { dados, cnpj } = await prepararCertificado();
  const anteriores = { url: process.env.ERP_API_URL, keys: process.env.ERP_API_KEYS_BY_CNPJ };
  process.env.ERP_API_URL = "https://erp.example.test";
  process.env.ERP_API_KEYS_BY_CNPJ = JSON.stringify({ [cnpj]: "qa-sintetico" });
  try {
    await assert.rejects(manifestarDocumento(dados, {
      enviar: async () => { assert.fail("Nenhuma transmissão local é permitida"); },
      consultar: async () => { assert.fail("Nenhuma consulta local é permitida"); },
    }), /feita pelo ERP/);
    assert.equal(await prisma.manifestacaoFiscalLoja.count({ where: { tenantId: dados.tenantId } }), 0);
  } finally {
    if (anteriores.url === undefined) delete process.env.ERP_API_URL; else process.env.ERP_API_URL = anteriores.url;
    if (anteriores.keys === undefined) delete process.env.ERP_API_KEYS_BY_CNPJ; else process.env.ERP_API_KEYS_BY_CNPJ = anteriores.keys;
  }
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
