import assert from "node:assert/strict";
import { test } from "node:test";
import { montarNfeVenda, OpcoesVendaSchema } from "./fiscal-emissao-venda";
import { conferirPedidoFiscal } from "./fiscal-pedido-contrato";
import { validarRascunhoNfe } from "./fiscal-emissao-xml";

test("venda revisada gera NF-e com rateio exato e tributação explicitamente escolhida", () => {
  const endereco = { logradouro: "Rua QA", numero: "1", bairro: "Centro", cidade: "São Paulo", uf: "SP", cep: "01001000", complemento: null };
  const conferencia = conferirPedidoFiscal({ pedido: { id: "qa", referencia: "qa", numero: 1, status: "PAGO", atualizadoEm: new Date().toISOString() }, emitente: { nome: "Loja QA", documento: "12345678000195" }, destinatario: { nome: "Comprador", documento: "52998224725", endereco }, pagamento: { meio: "pix", situacao: "approved" }, frete: { nome: "Correio", valorCentavos: 101 }, totais: { subtotalCentavos: 3000, descontoCentavos: 101, totalCentavos: 3000 }, itens: ["a", "b", "c"].map(id => ({ id, nome: `Item ${id}`, produtoId: id, varianteId: id, sku: id, quantidade: 1, precoUnitarioCentavos: 1000, classificacaoAtual: { ncm: "40111000", cest: null } })) });
  const opcoes = OpcoesVendaSchema.parse({ ambiente: "2", serie: 1, numero: 123, natureza: "Venda de mercadoria", inscricaoEstadual: "111111111111", municipioEmitente: "3550308", municipioDestinatario: "3550308", tributacao: "SIMPLES_102_PIS07_COFINS07", destinatarioNaoContribuinte: true, semIntermediador: true, pagamento: "17", modalidadeFrete: "0", itens: conferencia.dados.itens.map(i => ({ itemId: i.id, cfop: "5102", origem: "0", unidade: "UN", gtin: "SEM GTIN" })) });
  const xml = montarNfeVenda(conferencia, endereco, opcoes, new Date("2026-11-16T12:00:00Z"), "00000001");
  const nota = validarRascunhoNfe(xml, "12345678000195");
  assert.equal(nota.total, "30.00"); assert.equal(nota.itens, 3);
  assert.match(xml, /<CSOSN>102<\/CSOSN>/); assert.match(xml, /<vDesc>1.01<\/vDesc>/); assert.match(xml, /<vFrete>1.01<\/vFrete>/);
  assert.match(xml, /SEM VALOR FISCAL/);
  assert.deepEqual([...xml.matchAll(/<vFrete>(.*?)<\/vFrete>/g)].map(m => m[1]), ["0.34", "0.34", "0.33", "1.01"]);
  assert.deepEqual([...xml.matchAll(/<vDesc>(.*?)<\/vDesc>/g)].map(m => m[1]), ["0.34", "0.34", "0.33", "1.01"]);
  assert.throws(() => montarNfeVenda(conferencia, endereco, { ...opcoes, modalidadeFrete: "9" }), /frete/);
  assert.equal(OpcoesVendaSchema.safeParse({ ...opcoes, tributacao: undefined }).success, false);
  assert.equal(OpcoesVendaSchema.safeParse({ ...opcoes, pagamento: "03" }).success, false);
  assert.equal(OpcoesVendaSchema.safeParse({ ...opcoes, semIntermediador: false }).success, false);
  const cartao = { integracao: "1" as const, cnpj: "11222333000181", autorizacao: "QA123", bandeira: "01" };
  assert.match(montarNfeVenda(conferencia, endereco, { ...opcoes, pagamento: "03", cartao }), /<tpIntegra>1<\/tpIntegra><CNPJ>11222333000181<\/CNPJ><tBand>01<\/tBand><cAut>QA123<\/cAut>/);
});
