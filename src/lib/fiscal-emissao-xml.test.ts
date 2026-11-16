import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { validarRascunhoNfe, chaveNfe, lerRespostaNfe, destinoNfe } from "./fiscal-emissao-xml";

const rascunho = () => {
  const fixture = readFileSync("tests/fixtures/nfe-entrada-qa.xml", "utf8");
  return /<NFe>[\s\S]*?<\/NFe>/.exec(fixture)![0].replace("<NFe>", '<NFe xmlns="http://www.portalfiscal.inf.br/nfe">');
};

test("emissão direta valida emitente, ambiente, modelo e numeração sem ERP", () => {
  const xml = rascunho();
  const dados = validarRascunhoNfe(xml, "12345678000195");
  assert.equal(dados.ambiente, "2");
  assert.equal(dados.numero, 123);
  assert.equal(dados.serie, 1);
  assert.equal(dados.uf, "SP");
  assert.throws(() => validarRascunhoNfe(xml, "11222333000181"), /emitente/);
  assert.throws(() => validarRascunhoNfe(xml.replace("<mod>55</mod>", "<mod>65</mod>"), "12345678000195"), /modelo/);
  assert.throws(() => validarRascunhoNfe(xml.replace("<tpAmb>2</tpAmb>", "<tpAmb>3</tpAmb>"), "12345678000195"), /ambiente/);
  assert.throws(() => validarRascunhoNfe(`<!DOCTYPE NFe>${xml}`, "12345678000195"), /XML/);
});

test("destinos oficiais não aceitam UF nem ambiente arbitrários", () => {
  assert.equal(destinoNfe("SP", "2", "autorizar"), "https://homologacao.nfe.fazenda.sp.gov.br/ws/nfeautorizacao4.asmx");
  assert.equal(destinoNfe("SP", "1", "consultar"), "https://nfe.fazenda.sp.gov.br/ws/nfeconsultaprotocolo4.asmx");
  assert.throws(() => destinoNfe("https://evil.example", "1", "autorizar"));
});

test("chave tem dígito verificador consistente e retorno exige mesmo ambiente e digest", () => {
  const chave = chaveNfe("35", "2611", "12345678000195", 1, 123, "00000001");
  assert.match(chave, /^\d{44}$/);
  const protocolo = `<retEnviNFe xmlns="http://www.portalfiscal.inf.br/nfe"><tpAmb>2</tpAmb><cStat>104</cStat><protNFe versao="4.00"><infProt><tpAmb>2</tpAmb><chNFe>${chave}</chNFe><digVal>digest-qa</digVal><nProt>135260000099999</nProt><cStat>100</cStat><xMotivo>QA</xMotivo></infProt></protNFe></retEnviNFe>`;
  assert.equal(lerRespostaNfe(protocolo, { chave, ambiente: "2", digest: "digest-qa" }).status, "AUTORIZADA");
  assert.throws(() => lerRespostaNfe(protocolo, { chave, ambiente: "1", digest: "digest-qa" }), /ambiente/);
  assert.throws(() => lerRespostaNfe(protocolo, { chave, ambiente: "2", digest: "outro" }), /digest/);
  assert.equal(lerRespostaNfe('<retConsSitNFe><tpAmb>2</tpAmb><cStat>217</cStat></retConsSitNFe>', { chave, ambiente: "2", digest: "digest-qa" }).status, "PENDENTE_CONFERENCIA");
});
