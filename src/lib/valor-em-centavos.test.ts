import assert from "node:assert/strict";
import test from "node:test";
import { precoDoCatalogoEmCentavos } from "./valor-em-centavos";

test("preço do catálogo preserva centavos, milhares e o limite da coluna", () => {
  for (const [entrada, esperado] of [
    ["R$ 1.234,56", 123456], ["1.234,56", 123456], ["1234.56", 123456],
    ["R$ 1.234", 123400], ["0", 0], [",90", 90], ["12,3", 1230],
    ["21.474.836,47", 2147483647],
  ] as const) assert.equal(precoDoCatalogoEmCentavos(entrada), esperado, entrada);
});

test("preço malformado ou ambíguo impede gravar", () => {
  for (const entrada of ["", "-2", "1.234", "12 reais", "10,50,3", "1.23,45", "2e3", "21.474.836,48"]) {
    assert.equal(precoDoCatalogoEmCentavos(entrada), null, entrada);
  }
});
