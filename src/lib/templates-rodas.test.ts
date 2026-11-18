import assert from "node:assert/strict";
import test from "node:test";
import { layoutsOferecidos, temaNaVitrine } from "./flags";
import { codificarRascunho, examinarRascunho } from "./previa-tema";
import { TemaSchema } from "./tema";
import { contratoDo } from "./templates";
import { ehTemplateRodas, mudarModoTemplateRodas, selecionarTemplateRodas } from "./templates-rodas";
import { contraste } from "./tema";

const layouts = ["rodas-street", "rodas-racing", "rodas-carbon", "rodas-night"];

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

test("paletas iniciais têm contraste legível e mantêm conteúdo e fonte da loja", () => {
  const atual = TemaSchema.parse({ fonte: "montserrat", corFundo: "#123456", heroTitulo: "Meu catálogo" });
  for (const layout of layouts) {
    assert.ok(ehTemplateRodas(layout));
    const escolhido = selecionarTemplateRodas(atual, layout);
    assert.ok(contraste(escolhido.corPrimaria, escolhido.corPrimariaTexto) >= 4.5);
    assert.equal(escolhido.fonte, atual.fonte);
    assert.equal(escolhido.heroTitulo, atual.heroTitulo);
    assert.notEqual(escolhido.corFundo, atual.corFundo);
    // O escritor mescla o PATCH serializado com o JSON que já estava salvo.
    assert.deepEqual({ ...atual, ...JSON.parse(JSON.stringify(escolhido)) }, escolhido);
    assert.ok(TemaSchema.safeParse(escolhido).success);
  }
  assert.equal(ehTemplateRodas("__proto__"), false);
  assert.equal(atual.corFundo, "#123456");
});

test("trocar o modo dos templates substitui fundo e texto inclusive após serializar", () => {
  const escuro = selecionarTemplateRodas(TemaSchema.parse({}), "rodas-night");
  const claro = mudarModoTemplateRodas(escuro, "claro");
  assert.equal(claro.modo, "claro");
  assert.equal(claro.corFundo, "#ffffff");
  assert.ok(contraste(claro.corTexto!, claro.corFundo!) >= 4.5);
  assert.deepEqual({ ...escuro, ...JSON.parse(JSON.stringify(claro)) }, claro);
  assert.deepEqual(mudarModoTemplateRodas(claro, "escuro"), escuro);
});
