import { strict as assert } from "node:assert";
import { test } from "node:test";
import { digitoVerificadorGtin, gerarEan13, gtinValido } from "./gtin";

test("dígito verificador confere com EANs conhecidos", () => {
  // Exemplo clássico da GS1: 400638133393 -> dígito 1.
  assert.equal(digitoVerificadorGtin("400638133393"), 1);
  // 1*3 + 9*1 + 8*3 + 7*1 = 43 -> (10 - 3) % 10 = 7.
  assert.equal(digitoVerificadorGtin("789100000000"), 7);
});

test("gtinValido aceita o certo e recusa o errado", () => {
  assert.equal(gtinValido("4006381333931"), true);
  assert.equal(gtinValido("4006381333932"), false);
  assert.equal(gtinValido("123"), false);
  assert.equal(gtinValido("40063813339X1"), false);
});

test("gerarEan13 monta prefixo + referência + dígito, e o resultado valida", () => {
  const ean = gerarEan13("789123456", 7);
  assert.equal(ean.length, 13);
  assert.ok(ean.startsWith("789123456007"));
  assert.equal(gtinValido(ean), true);
});

test("itens diferentes geram GTINs diferentes", () => {
  assert.notEqual(gerarEan13("789123456", 1), gerarEan13("789123456", 2));
});

test("prefixo que não é da GS1 Brasil é recusado", () => {
  assert.throws(() => gerarEan13("200000000", 1), /Prefixo/);
  assert.throws(() => gerarEan13("78912", 1), /Prefixo/);
  assert.throws(() => gerarEan13("abc123456", 1), /Prefixo/);
});

test("referência que não cabe no prefixo é recusada em vez de truncada", () => {
  assert.throws(() => gerarEan13("789123456", 1000), /até 3 dígitos/);
  assert.throws(() => gerarEan13("789123456", -1), /dígitos/);
});
