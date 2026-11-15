import assert from "node:assert/strict";
import test from "node:test";
import { XMLParser, XMLValidator } from "fast-xml-parser";
import { sitemapDeImagens } from "./sitemap-imagens";

const base = "https://beretarodas.com";
const produto = (slug: string, imagens: string[], imagemOrigem: string | null = "representativa") => ({
  slug, imagens, imagemOrigem, ativo: true, precoCentavos: 100,
});

test("sitemap separado inclui fotos de fabricante uma vez e conserva o vínculo público", () => {
  const xml = sitemapDeImagens(base, [
    produto("roda-14", ["/uploads/roda.webp", "/uploads/roda.webp"]),
    produto("roda-15", ["/uploads/roda.webp", "https://lojas.avilaops.com/uploads/outra.webp"], "propria"),
  ]);
  assert.equal(XMLValidator.validate(xml), true);
  const parsed = new XMLParser({ ignoreAttributes: false }).parse(xml).urlset;
  assert.equal(parsed["@_xmlns:image"], "http://www.google.com/schemas/sitemap-image/1.1");
  assert.deepEqual(parsed.url, [
    { loc: `${base}/produtos/roda-14`, "image:image": { "image:loc": `${base}/uploads/roda.webp` } },
    { loc: `${base}/produtos/roda-15`, "image:image": { "image:loc": "https://lojas.avilaops.com/uploads/outra.webp" } },
  ]);
});

test("XML escapa parâmetros e recusa imagens sem protocolo público ou origem conhecida", () => {
  const xml = sitemapDeImagens(base, [
    produto("pneu", ["https://cdn.example/foto.webp?a=1&b=2", "data:image/png;base64,AA", "javascript:alert(1)", "http://[", " "]),
    produto("ilustracao", ["/desenho.webp"], "ilustracao"),
    produto("origem-desconhecida", ["/sem-origem.webp"], null),
    { ...produto("inativo", ["/inativo.webp"]), ativo: false },
  ]);
  assert.equal(XMLValidator.validate(xml), true);
  assert.match(xml, /a=1&amp;b=2/);
  const parsed = new XMLParser().parse(xml).urlset;
  assert.equal(parsed.url.loc, `${base}/produtos/pneu`);
  assert.equal(parsed.url["image:image"]["image:loc"], "https://cdn.example/foto.webp?a=1&b=2");
});

test("catálogo sem fotos elegíveis continua produzindo XML válido", () => {
  const xml = sitemapDeImagens(base, [produto("sem-foto", [])]);
  assert.equal(XMLValidator.validate(xml), true);
  assert.doesNotMatch(xml, /<url>/);
});

test("cada página respeita o teto de mil imagens", () => {
  const xml = sitemapDeImagens(base, [produto("galeria", Array.from({ length: 1002 }, (_, i) => `/foto-${i}.webp`), "propria")]);
  assert.equal((xml.match(/<image:image>/g) ?? []).length, 1000);
});
