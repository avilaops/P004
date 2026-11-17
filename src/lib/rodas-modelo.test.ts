import assert from "node:assert/strict";
import test from "node:test";
import type { Produto, Tenant } from "@prisma/client";
import type { IdentidadePublica } from "./identidade-publica";
import { catalogoDeDemonstracao } from "./previa-tema";
import { montarLojaRodas, montarProdutoRodas, bannersRodas } from "./rodas-modelo";
import { TemaSchema } from "./tema";

const base = (): Produto => catalogoDeDemonstracao().vitrine[0];

test("a projeção mantém contato discável, identificação legal e somente políticas publicadas", () => {
  const tenant = { nome: "Loja exemplo", slug: "exemplo", logoUrl: null, avisoTopo: null, tokenPrivado: "nao-publicar" } as unknown as Tenant;
  const identidade: IdentidadePublica = {
    nome: tenant.nome, razaoSocial: "Exemplo Ltda", cnpj: "12345678000100",
    telefone: { exibicao: "(11) 99999-9999", uri: "+5511999999999" },
    whatsapp: null, email: "contato@example.com", horario: null,
    enderecoLegal: { logradouro: "Rua Exemplo", numero: "10", cidade: "São Paulo", uf: "SP", cep: "01001-000", texto: "Rua Exemplo, 10 • São Paulo • SP" },
    enderecoVisita: null,
  };
  const politicas = [{ tipo: "aviso-legal", titulo: "Aviso legal" }];
  const loja = montarLojaRodas(tenant, TemaSchema.parse({ layout: "rodas-carbon" }), [], true, identidade, politicas);
  assert.equal(loja.telefoneUri, "tel:+5511999999999");
  assert.deepEqual(loja.identificacao, ["Exemplo Ltda", "CNPJ 12345678000100", identidade.enderecoLegal!.texto]);
  assert.equal(loja.endereco, null, "endereço legal não implica atendimento presencial");
  assert.deepEqual(loja.politicas, politicas);
  assert.equal("tokenPrivado" in loja, false);
  const semIdentidade = montarLojaRodas(tenant, TemaSchema.parse({}), [], false);
  assert.equal(semIdentidade.telefoneUri, null);
  assert.deepEqual(semIdentidade.politicas, []);
});

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
