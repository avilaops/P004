import assert from "node:assert/strict";
import test from "node:test";
import { CAMINHOS_PRIVADOS_DA_LOJA } from "./descoberta";
import { regrasRobots } from "./descoberta";
import type { Tenant } from "@prisma/client";

/** Casa um caminho com uma regra de robots.txt: prefixo, com `$` fechando o fim. */
const bloqueia = (regra: string, caminho: string) => (regra.endsWith("$") ? caminho === regra.slice(0, -1) : caminho.startsWith(regra));
const bloqueado = (caminho: string) => CAMINHOS_PRIVADOS_DA_LOJA.some((r) => bloqueia(r, caminho));

test("robots anuncia sitemap principal e imagens no domínio canônico da loja", () => {
  const loja = { status: "ATIVA", slug: "bereta-rodas", dominioPrincipal: "beretarodas.com", permiteTreinamentoIa: true } as Tenant;
  assert.deepEqual(regrasRobots(loja).sitemap, [
    "https://beretarodas.com/sitemap.xml", "https://beretarodas.com/sitemap-imagens.xml",
  ]);
  for (const status of ["CANCELADA", "PROVISIONANDO"] as const) {
    assert.equal(regrasRobots({ ...loja, status }).sitemap, undefined);
  }
});

test("o robots.txt da loja fecha a conta do comprador sem fechar a página de contato", () => {
  for (const privado of ["/conta", "/conta/pedidos", "/carrinho", "/checkout", "/pedido/123", "/api/frete"]) assert.equal(bloqueado(privado), true, privado);
  for (const publico of ["/contato", "/", "/produtos", "/categoria/anel-guia", "/sobre", "/politicas/envio"]) assert.equal(bloqueado(publico), false, publico);
});
