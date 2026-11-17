import assert from "node:assert/strict";
import test from "node:test";
import type { Produto } from "@prisma/client";
import { catalogoDeDemonstracao } from "./previa-tema";
import { montarProdutoRodas, bannersRodas } from "./rodas-modelo";
import { TemaSchema } from "./tema";

const base = (): Produto => catalogoDeDemonstracao().vitrine[0];

test("o cartão de rodas preserva a disponibilidade e a escolha de variantes", () => {
  const produto = { ...base(), estoque: 3, opcoes: [] };
  assert.equal(montarProdutoRodas(produto, true, false).adicionar, true);
  assert.equal(montarProdutoRodas({ ...produto, estoque: 0 }, true, false).adicionar, false);
  assert.equal(montarProdutoRodas({ ...produto, precoCentavos: 0 }, true, false).adicionar, false);
  assert.equal(montarProdutoRodas({ ...produto, opcoes: ["Cor"] }, true, false).adicionar, false);
  assert.equal(montarProdutoRodas(produto, false, false).adicionar, false);
  assert.equal(montarProdutoRodas(produto, false, true).adicionar, true);
});

test("fotos representativas não viram promoção e mantêm a declaração de origem", () => {
  const foto = { ...base(), imagens: ["/foto.webp"], imagemOrigem: "representativa" };
  const cartao = montarProdutoRodas(foto, true, false);
  assert.equal(cartao.oferta, false);
  assert.equal(cartao.precoAnterior, null);
  assert.ok(cartao.seloImagem);
});

test("banner usa a arte própria do template e aceita campanhas cadastradas", () => {
  const tema = TemaSchema.parse({ layout: "rodas-street" });
  assert.equal(bannersRodas(tema, null)[0].imagem, "/media/templates-rodas/street-hero.png");
  const campanhasHome = [{ imagemUrl: "/arte.webp", alt: "Coleção especial", link: "/categoria/rodas" }];
  assert.deepEqual(bannersRodas({ ...tema, campanhasHome }, null), [{ imagem: "/arte.webp", alt: "Coleção especial", link: "/categoria/rodas" }]);
});
