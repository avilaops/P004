import assert from "node:assert/strict";
import { test } from "node:test";
import { montarCancelamentoNfe, lerRetornoCancelamento } from "./fiscal-cancelamento-xml";
import { chaveNfe } from "./fiscal-emissao-xml";

const chave = chaveNfe("35", "2611", "12345678000195", 1, 123, "00000001");
const dados = { chave, cnpj: "12345678000195", uf: "SP", ambiente: "2", protocolo: "135260000099999", justificativa: "Pedido cancelado antes da circulação da mercadoria.", data: new Date("2026-11-16T14:00:00Z") };
test("cancelamento prepara evento110111 ligado ao protocolo de autorização", () => {
  const evento = montarCancelamentoNfe(dados);
  assert.match(evento.xml, /<tpEvento>110111<\/tpEvento>/);
  assert.match(evento.xml, /<nSeqEvento>1<\/nSeqEvento>/);
  assert.match(evento.xml, /<nProt>135260000099999<\/nProt>/);
  assert.throws(() => montarCancelamentoNfe({ ...dados, justificativa: "curta" }), /15 a 255/);
  assert.throws(() => montarCancelamentoNfe({ ...dados, protocolo: "" }), /protocolo/);
});
test("cancelamento só confirma evento aceito da mesma chave, ambiente e sequência", () => {
  const resposta = (codigo: string) => `<retEnvEvento><tpAmb>2</tpAmb><cStat>128</cStat><retEvento versao="1.00"><infEvento><tpAmb>2</tpAmb><chNFe>${chave}</chNFe><tpEvento>110111</tpEvento><nSeqEvento>1</nSeqEvento><nProt>135260000088888</nProt><cStat>${codigo}</cStat><xMotivo>QA</xMotivo></infEvento></retEvento></retEnvEvento>`;
  for (const codigo of ["135", "155"]) assert.equal(lerRetornoCancelamento(resposta(codigo), dados).status, "ACEITA");
  for (const codigo of ["136", "573"]) assert.equal(lerRetornoCancelamento(resposta(codigo), dados).status, "PENDENTE_CONFERENCIA");
  assert.equal(lerRetornoCancelamento(resposta("501"), dados).status, "REJEITADA");
  assert.throws(() => lerRetornoCancelamento(resposta("135").replace("<tpEvento>110111", "<tpEvento>210210"), dados), /evento/);
  assert.throws(() => lerRetornoCancelamento(resposta("135"), { ...dados, ambiente: "1" }), /ambiente/);
  assert.throws(() => lerRetornoCancelamento(resposta("135"), { ...dados, chave: "9".repeat(44) }), /chave/);
});
