import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import { after, test } from "node:test";
import forge from "node-forge";
import { SignedXml } from "xml-crypto";
import { prisma } from "../../src/lib/db";
import { selarCertificado } from "../../src/lib/fiscal-certificado";
import { chaveNfe } from "../../src/lib/fiscal-emissao-xml";
import { prepararEmissao, emitirNfe, consultarNfe, type enviarNfe } from "../../src/lib/fiscal-emissao";
import { cancelarNfe, obterCancelamentoNfe } from "../../src/lib/fiscal-cancelamento";

const url = new URL(process.env.DATABASE_URL ?? "http://invalid");
if (!["127.0.0.1", "localhost"].includes(url.hostname) || !["5548", "5588"].includes(url.port) || !url.pathname.endsWith("_test")) throw new Error("Teste exige Postgres local isolado e base *_test.");
process.env.LOJAS_CERT_SECRET = "ca".repeat(32);
// O histórico fiscal é imutável; a base isolada é descartada pelo job.
after(async () => prisma.$disconnect());
async function autorizada() {
  const cnpj = String(BigInt(`0x${randomUUID().replaceAll("-", "")}`) % 100000000000000n).padStart(14, "0");
  const loja = await prisma.tenant.create({ data: { slug: `cancelamento-${randomUUID()}`, nome: "QA cancelamento", plano: "LOJA_PRO", status: "ATIVA", cnpj } });
  const chaves = forge.pki.rsa.generateKeyPair(2048), cert = forge.pki.createCertificate();
  cert.publicKey = chaves.publicKey; cert.serialNumber = "01";
  cert.validity.notBefore = new Date(Date.now() - 86400000); cert.validity.notAfter = new Date(Date.now() + 86400000);
  cert.setSubject([{ name: "commonName", value: `QA:${cnpj}` }]); cert.setIssuer(cert.subject.attributes); cert.sign(chaves.privateKey, forge.md.sha256.create());
  const pfx = Buffer.from(forge.asn1.toDer(forge.pkcs12.toPkcs12Asn1(chaves.privateKey, cert, "qa", { algorithm: "3des" })).getBytes(), "binary");
  await prisma.fiscalLoja.create({ data: { tenantId: loja.id, cnpj, uf: "SP", titular: "QA", validoAte: cert.validity.notAfter, certificadoEnc: selarCertificado(pfx, "qa") } });
  const fixture = readFileSync("tests/fixtures/nfe-entrada-qa.xml", "utf8").replaceAll("<CNPJ>12345678000195</CNPJ>", `<CNPJ>${cnpj}</CNPJ>`);
  const chave = chaveNfe("35", "2611", cnpj, 1, 123, "00000001");
  const xml = /<NFe>[\s\S]*?<\/NFe>/.exec(fixture)![0].replace("<NFe>", '<NFe xmlns="http://www.portalfiscal.inf.br/nfe">').replace(/Id="NFe\d{44}"/, `Id="NFe${chave}"`).replace(/<cDV>\d<\/cDV>/, `<cDV>${chave.at(-1)}</cDV>`);
  const pedido = await prisma.pedido.create({ data: { tenantId: loja.id, referencia: `cancelamento-${randomUUID()}`, status: "PAGO", clienteNome: "Comprador QA", clienteDocumento: "11222333000181", clienteEmail: "qa@example.test", clienteTelefone: "11999999999", freteNome: "Retirada", freteCentavos: 0, subtotalCentavos: 12500, totalCentavos: 12500, meioPagamento: "pix", pagamentoStatus: "approved" } });
  const preparada = await prepararEmissao({ tenantId: loja.id, pedidoId: pedido.id, xml, autor: "qa@example.test" });
  const assinada = await prisma.emissaoFiscalLoja.findUniqueOrThrow({ where: { id: preparada.id } });
  await emitirNfe({ tenantId: loja.id, id: preparada.id, ambiente: "2", resumoHash: preparada.resumoHash }, async () => `<retEnviNFe><tpAmb>2</tpAmb><cStat>104</cStat><protNFe versao="4.00"><infProt><tpAmb>2</tpAmb><chNFe>${chave}</chNFe><digVal>${assinada.digest}</digVal><nProt>135260000099999</nProt><cStat>100</cStat></infProt></protNFe></retEnviNFe>`);
  const documento = await prisma.emissaoFiscalLoja.findUniqueOrThrow({ where: { id: preparada.id } });
  const dados = { tenantId: loja.id, emissaoId: preparada.id, ambiente: "2", resumoHash: preparada.resumoHash, justificativa: "Documento sintético cancelado antes da circulação da mercadoria.", confirmacao: true, autor: "qa@example.test" };
  return { loja, pedido, documento, dados, cert };
}
function respostaEvento(chave: string, codigo: string) {
  return `<retEnvEvento><tpAmb>2</tpAmb><cStat>128</cStat><retEvento versao="1.00"><infEvento><tpAmb>2</tpAmb><chNFe>${chave}</chNFe><tpEvento>110111</tpEvento><nSeqEvento>1</nSeqEvento><nProt>135260000088888</nProt><cStat>${codigo}</cStat><xMotivo>QA sintético</xMotivo></infEvento></retEvento></retEnvEvento>`;
}

test("cancelamento concorrente transmite uma vez, preserva XML e não estorna pedido/estoque", async () => {
  const { dados, documento, pedido, cert } = await autorizada();
  let envios = 0; const buffers: Buffer[] = [];
  const enviar: typeof enviarNfe = async req => {
    envios++; buffers.push(req.pfx); assert.equal(req.operacao, "cancelar");
    assert.match(req.corpo, /<nProt>135260000099999<\/nProt>/);
    return respostaEvento(documento.chave, "135");
  };
  const resultados = await Promise.all(Array.from({ length: 5 }, () => cancelarNfe(dados, enviar)));
  assert.equal(envios, 1); assert.equal(new Set(resultados.map(r => r.cancelamento!.id)).size, 1);
  const final = await obterCancelamentoNfe(dados.tenantId, dados.emissaoId);
  assert.equal(final.cancelamento!.status, "ACEITA"); assert.equal(final.emissao.status, "CANCELADA");
  assert.equal(final.cancelamento!.protocolo, "135260000088888");
  const salvo = await prisma.cancelamentoEmissaoFiscalLoja.findUniqueOrThrow({ where: { id: final.cancelamento!.id } });
  assert.match(salvo.xmlProcessado!, /<procEventoNFe/);
  const assinatura = new SignedXml({ publicCert: forge.pki.certificateToPem(cert) });
  assinatura.loadSignature(/<Signature\b[\s\S]*?<\/Signature>/.exec(salvo.xmlAssinado)![0]);
  assert.equal(assinatura.checkSignature(salvo.xmlAssinado), true);
  assert.equal((await cancelarNfe(dados, enviar)).cancelamento!.id, salvo.id); assert.equal(envios, 1);
  assert.ok(buffers.every(buffer => buffer.every(byte => byte === 0)));
  await assert.rejects(prisma.cancelamentoEmissaoFiscalLoja.update({ where: { id: salvo.id }, data: { justificativa: "Adulterada depois do envio fiscal." } }), /imutável/);
  await assert.rejects(prisma.cancelamentoEmissaoFiscalLoja.delete({ where: { id: salvo.id } }), /imutável/);
  assert.equal((await prisma.emissaoFiscalLoja.findUniqueOrThrow({ where: { id: documento.id } })).xmlAutorizado, documento.xmlAutorizado);
  const comercial = await prisma.pedido.findUniqueOrThrow({ where: { id: pedido.id } });
  assert.equal(comercial.status, pedido.status); assert.equal(comercial.pagamentoStatus, "approved"); assert.equal(comercial.atualizadoEm.getTime(), pedido.atualizadoEm.getTime());
  assert.equal(await prisma.comandoEstoque.count({ where: { tenantId: dados.tenantId } }), 0);
});

test("resultado incerto não retransmite; consulta cancelada prevalece sobre protocolo autorizado", async () => {
  const { dados, documento } = await autorizada(); let envios = 0;
  const enviar: typeof enviarNfe = async () => { envios++; throw new Error("Falha sintética de rede"); };
  const pendente = await cancelarNfe(dados, enviar);
  assert.equal(pendente.cancelamento!.status, "PENDENTE_CONFERENCIA"); assert.equal(pendente.emissao.status, "AUTORIZADA");
  await cancelarNfe(dados, enviar); assert.equal(envios, 1);
  await consultarNfe(dados.tenantId, dados.emissaoId, async () => `<retConsSitNFe><tpAmb>2</tpAmb><chNFe>${documento.chave}</chNFe><cStat>101</cStat><xMotivo>Cancelamento homologado</xMotivo><protNFe versao="4.00"><infProt><tpAmb>2</tpAmb><chNFe>${documento.chave}</chNFe><digVal>${documento.digest}</digVal><nProt>135260000099999</nProt><cStat>100</cStat></infProt></protNFe></retConsSitNFe>`);
  const final = await obterCancelamentoNfe(dados.tenantId, dados.emissaoId);
  assert.equal(final.emissao.status, "CANCELADA"); assert.equal(final.cancelamento!.status, "CONFIRMADA_CONSULTA"); assert.equal(final.cancelamento!.protocolo, null);
  const registro = await prisma.cancelamentoEmissaoFiscalLoja.findUniqueOrThrow({ where: { id: final.cancelamento!.id } });
  assert.equal(registro.xmlProcessado, null); assert.match(registro.xmlConsulta!, /<cStat>101<\/cStat>/);
  await consultarNfe(dados.tenantId, dados.emissaoId, async () => '<retConsSitNFe><tpAmb>2</tpAmb><cStat>217</cStat></retConsSitNFe>');
  assert.equal((await obterCancelamentoNfe(dados.tenantId, dados.emissaoId)).emissao.status, "CANCELADA");
  assert.equal((await prisma.emissaoFiscalLoja.findUniqueOrThrow({ where: { id: documento.id } })).xmlAutorizado, documento.xmlAutorizado);
});

test("rejeição só permite nova versão após revisão explícita, sem apagar a primeira", async () => {
  const { dados, documento } = await autorizada(); let envios = 0;
  const rejeitada = await cancelarNfe(dados, async () => { envios++; return respostaEvento(documento.chave, "501"); });
  assert.equal(rejeitada.cancelamento!.status, "REJEITADA"); assert.equal(rejeitada.emissao.status, "AUTORIZADA");
  const revisada = { ...dados, justificativa: "Justificativa revisada para documento exclusivamente sintético." };
  await assert.rejects(cancelarNfe(revisada), { status: 409 });
  const aceita = await cancelarNfe({ ...revisada, anterior: { id: rejeitada.cancelamento!.id, resumoHash: rejeitada.cancelamento!.resumoHash } }, async () => { envios++; return respostaEvento(documento.chave, "155"); });
  assert.equal(aceita.cancelamento!.status, "ACEITA"); assert.equal(aceita.historico.length, 2); assert.equal(envios, 2);
  assert.equal(aceita.historico.find(item => item.id === rejeitada.cancelamento!.id)!.status, "SUBSTITUIDA");
});

test("confirmação, justificativa, tenant, ambiente e hash inválidos não reservam cancelamento", async () => {
  const { dados } = await autorizada();
  for (const alteracao of [{ confirmacao: false }, { justificativa: "curta" }, { tenantId: "outra-loja" }, { ambiente: "1" }, { resumoHash: "0".repeat(64) }]) await assert.rejects(cancelarNfe({ ...dados, ...alteracao }));
  assert.equal(await prisma.cancelamentoEmissaoFiscalLoja.count({ where: { tenantId: dados.tenantId } }), 0);
});
