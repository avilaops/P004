import assert from "node:assert/strict";
import test from "node:test";
import type { Tenant } from "@prisma/client";
import { sinaisConteudoLoja, textoRobotsComSinais } from "./robots-content-signals";

test("Content Signals da loja acompanham publicação e a escolha de treinamento", () => {
  const loja = (status: string, permiteTreinamentoIa: boolean) => ({ status, permiteTreinamentoIa }) as Pick<Tenant, "status" | "permiteTreinamentoIa">;
  for (const status of ["ATIVA", "SUSPENSA"]) {
    assert.deepEqual(sinaisConteudoLoja(loja(status, false)), { busca: true, entradaIa: true, treinamento: false });
    assert.deepEqual(sinaisConteudoLoja(loja(status, true)), { busca: true, entradaIa: true, treinamento: true });
  }
  for (const status of ["CANCELADA", "PROVISIONANDO"]) {
    assert.deepEqual(sinaisConteudoLoja(loja(status, true)), { busca: false, entradaIa: false, treinamento: false });
  }
});

test("texto mantém caminhos privados, grupos de robôs e sitemaps", () => {
  const texto = textoRobotsComSinais({ rules: [
    { userAgent: "*", allow: "/", disallow: ["/conta$", "/conta/", "/api/"] },
    { userAgent: ["GPTBot", "Google-Extended"], disallow: "/" },
  ], sitemap: ["https://loja.example/sitemap.xml", "https://loja.example/sitemap-produtos.xml"] }, { busca: true, entradaIa: true, treinamento: false });
  assert.match(texto, /^User-Agent: \*\nAllow: \/\n/);
  assert.match(texto, /Disallow: \/conta\$\nDisallow: \/conta\/\nDisallow: \/api\//);
  assert.match(texto, /User-Agent: GPTBot\nUser-Agent: Google-Extended\nDisallow: \/\n/);
  assert.doesNotMatch(texto, /Content-Signal:/i);
  assert.ok(texto.endsWith("Sitemap: https://loja.example/sitemap-produtos.xml\n"));
});

test("plataforma mantém as rotas de acesso sem emitir Content-Signal", () => {
  const texto = textoRobotsComSinais({ rules: { userAgent: "*", allow: "/", disallow: ["/painel", "/entrar"] } }, { busca: true, entradaIa: true, treinamento: true });
  assert.doesNotMatch(texto, /Content-Signal:/i);
  assert.match(texto, /Disallow: \/painel\nDisallow: \/entrar\n/);
});

test("host desconhecido continua fechado sem diretivas adicionais", () => {
  const texto = textoRobotsComSinais({ rules: { userAgent: "*", disallow: "/" } }, { busca: false, entradaIa: false, treinamento: false });
  assert.equal(texto, "User-Agent: *\nDisallow: /\n");
});
