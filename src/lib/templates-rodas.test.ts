import assert from "node:assert/strict";
import test from "node:test";
import { layoutsOferecidos, temaNaVitrine } from "./flags";
import { codificarRascunho, examinarRascunho } from "./previa-tema";
import { TemaSchema } from "./tema";
import { contratoDo } from "./templates";

const layouts = ["rodas-performance", "rodas-showroom", "rodas-catalogo"];

for (const layout of layouts) {
  test(`${layout}: pode ser escolhido e visualizado sem perder a identidade`, () => {
    const resultado = TemaSchema.safeParse({ layout, corPrimaria: "#f2cb05", fonte: "montserrat", heroTitulo: "Seu próximo conjunto começa aqui" });
    assert.ok(resultado.success, `O schema deve aceitar ${layout}`);
    const tema = resultado.data;
    assert.ok(layoutsOferecidos({}).some((item) => item.valor === layout));
    assert.deepEqual(temaNaVitrine(tema, false), tema);
    const previa = examinarRascunho(codificarRascunho(tema));
    assert.deepEqual(previa.tema, tema);
    assert.equal(contratoDo(tema).escopo, "home");
  });
}

test("adicionar templates não muda o layout padrão de lojas existentes", () => {
  assert.equal(TemaSchema.parse({}).layout, "classico");
  assert.equal(TemaSchema.parse({ layout: "distribuidora" }).layout, "distribuidora");
});
