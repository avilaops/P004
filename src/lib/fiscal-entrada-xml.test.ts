import assert from "node:assert/strict";
import { test } from "node:test";
import { readFileSync } from "node:fs";
import { interpretarNotaEntrada } from "./fiscal-entrada-xml";

const XML = readFileSync(new URL("../../tests/fixtures/nfe-entrada-qa.xml", import.meta.url), "utf8");

test("conferência fiscal preserva identificação, quantidades decimais e valores originais", () => {
  const nota = interpretarNotaEntrada(XML);
  assert.equal(nota.numero, "123");
  assert.equal(nota.destinatario.documento, "11222333000181");
  assert.equal(nota.fornecedor.nome, "FORNECEDOR SINTETICO QA");
  assert.equal(nota.total, "125.00");
  assert.equal(nota.itens.length, 2);
  assert.equal(nota.itens[0].numero, 1);
  assert.equal(nota.itens[0].quantidade, "2.0000");
  assert.equal(nota.itens[0].valorUnitario, "50.0000000000");
  assert.equal(nota.itens[0].gtin, null);
  assert.equal(nota.itens[0].cfop, "5102");
});

test("conferência não aceita resumo, documento denegado, XML inseguro ou chave divergente", () => {
  for (const xml of ["<resNFe/>", XML.replace("<cStat>100</cStat>", "<cStat>110</cStat>"),
    '<!DOCTYPE x [<!ENTITY e SYSTEM "file:///etc/passwd">]>' + XML,
    XML.replace(/<chNFe>\d+<\/chNFe>/, "<chNFe>" + "9".repeat(44) + "</chNFe>")]) {
    assert.throws(() => interpretarNotaEntrada(xml));
  }
});

test("itens repetidos ou valores inválidos nunca viram entrada de estoque", () => {
  assert.throws(() => interpretarNotaEntrada(XML.replace('nItem="2"', 'nItem="1"')));
  assert.throws(() => interpretarNotaEntrada(XML.replace("<qCom>2.0000</qCom>", "<qCom>-2</qCom>")));
  assert.throws(() => interpretarNotaEntrada(XML.replace("<vUnCom>50.0000000000</vUnCom>", "<vUnCom>NaN</vUnCom>")));
});

test("conferência expõe componentes fiscais sem inferir custo ou crédito", () => {
  const nota = interpretarNotaEntrada(XML.replace("<vProd>100.00</vProd>", "<vProd>100.00</vProd><CEST>0100100</CEST><vDesc>3.00</vDesc><vFrete>4.00</vFrete><vSeg>1.00</vSeg><vOutro>2.00</vOutro>"));
  const item = nota.itens[0] as unknown as Record<string, unknown>;
  assert.equal(item.cest, "0100100");
  assert.equal(item.desconto, "3.00");
  assert.equal(item.frete, "4.00");
  assert.equal(item.seguro, "1.00");
  assert.equal(item.outrasDespesas, "2.00");
  assert.deepEqual(item.tributos, [
    { tipo: "ICMS", codigo: "00", base: "100.00", aliquota: "18.00", valor: "18.00" },
    { tipo: "PIS", codigo: "01", base: "100.00", aliquota: "1.65", valor: "1.65" },
    { tipo: "COFINS", codigo: "01", base: "100.00", aliquota: "7.60", valor: "7.60" },
  ]);
  assert.throws(() => interpretarNotaEntrada(XML.replace("<vProd>100.00</vProd>", "<vProd>100.00</vProd><vFrete>-1</vFrete>")));
});
