import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { chromium } from "playwright";
import { prisma } from "../src/lib/db.ts";
import { emitirToken } from "../src/lib/sessao.ts";
import { salvarProdutoNoCatalogo } from "../src/lib/catalogo-escrita.ts";
import { codificarRascunho } from "../src/lib/previa-tema.ts";
import { TemaSchema } from "../src/lib/tema.ts";
import { ehTemplateRodas, mudarModoTemplateRodas, selecionarTemplateRodas } from "../src/lib/templates-rodas.ts";

assert.equal(process.env.CI, "true", "Verificação exclusiva do GitHub CI");
const banco = new URL(process.env.DATABASE_URL ?? "http://invalid");
assert.ok(["localhost", "127.0.0.1"].includes(banco.hostname) && banco.port === "5548" && banco.pathname.endsWith("_test"), "Banco isolado obrigatório");
const layouts = ["rodas-street", "rodas-racing", "rodas-carbon", "rodas-night"];
const pasta = "artifacts/templates-rodas-browser";
const porta = "3116";
const origem = `http://localhost:${porta}`;
const slug = `qa-rodas-${randomUUID().slice(0, 8)}`;
const lojaUrl = `http://${slug}.localhost:${porta}`;
const resultados: Array<Record<string, unknown>> = [];
const erros: string[] = [];
let tenantId: string | undefined;
const navegador = await chromium.launch({ headless: true });
const servidor = spawn(process.execPath, [".next/standalone/server.js"], {
  env: { ...process.env, PORT: porta, HOSTNAME: "0.0.0.0", LOJAS_BASE_DOMAIN: "localhost", ROTINAS_AGENDADOR: "0", SSO_APP_ID: "", LOJAS_OIDC_CLIENT_ID: "", LOJAS_OIDC_CLIENT_SECRET: "", PLATAFORMA_GTM_ID: "" },
  stdio: "inherit",
});

try {
  await mkdir(pasta, { recursive: true });
  const temaInicial = TemaSchema.parse({ layout: "classico", corPrimaria: "#f2cb05", fonte: "montserrat", corFundo: "#123456", corTexto: "#ffffff" });
  const t = await prisma.tenant.create({ data: {
    slug, nome: "Rodas • demonstração", status: "ATIVA", tema: temaInicial,
    slogan: "Seu próximo conjunto começa aqui", sobre: "Compare os produtos do catálogo e consulte a equipe para escolher.",
    bannerUrl: "/media/bereta/hero/bereta-hero-desktop.webp",
  } });
  tenantId = t.id;
  const categoria = await prisma.categoria.create({ data: { tenantId: t.id, nome: "Rodas com acabamento especial e medidas para conferir no catálogo", slug: "rodas", imagemUrl: "/media/bereta/categories/rodas.webp" } });
  await prisma.categoria.createMany({ data: [
    { tenantId: t.id, nome: "Pneus", slug: "pneus", imagemUrl: "/media/bereta/categories/pneus.webp" },
    { tenantId: t.id, nome: "Acessórios", slug: "acessorios", imagemUrl: "/media/bereta/categories/acessorios.webp" },
  ] });
  await salvarProdutoNoCatalogo(t.id, null, { nome: "Roda de demonstração • confirme medidas e aplicação", slug: "roda-demonstracao", precoCentavos: 120000, categoriaId: categoria.id, destaque: true }, { origem: "qa-templates-rodas" });
  for (let numero = 2; numero <= 8; numero++) {
    await salvarProdutoNoCatalogo(t.id, null, {
      nome: `Roda de demonstração ${numero}`, slug: `roda-demo-${numero}`,
      precoCentavos: 90000 + numero * 1000, estoque: 10, categoriaId: categoria.id, destaque: true,
      imagens: ["/media/bereta/categories/rodas.webp"], imagemOrigem: "representativa", imagemFamilia: "fixture-qa-rodas",
    }, { origem: "qa-templates-rodas" });
  }
  let pronto = false;
  for (let i = 0; i < 60; i++) {
    try { if ((await fetch(origem + "/api/health")).ok) { pronto = true; break; } } catch { /* aguarda o servidor compilado */ }
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  assert.ok(pronto, "Aplicação compilada iniciou");
  const contexto = await navegador.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: "reduce" });
  await contexto.addCookies([{ name: "lojas_sessao", value: emitirToken(slug), url: origem }]);
  await contexto.route("**/*", rota => {
    const url = new URL(rota.request().url());
    return (url.hostname === "localhost" || url.hostname === `${slug}.localhost`) && url.port === porta ? rota.continue() : rota.abort();
  });
  const page = await contexto.newPage();
  page.on("pageerror", erro => erros.push(erro.message));
  // A escolha no editor é rascunho: nenhum clique de salvar nesta prova.
  await page.goto(origem + "/painel/configuracoes/marca?bloco=vitrine");
  for (const rotulo of ["Rodas • Street", "Rodas • Racing", "Rodas • Carbon", "Rodas • Night"]) {
    const botao = page.getByRole("button", { name: rotulo });
    await botao.click();
    assert.equal(await botao.getAttribute("aria-pressed"), "true");
  }
  assert.deepEqual((await prisma.tenant.findUniqueOrThrow({ where: { id: t.id } })).tema, temaInicial);
  resultados.push({ caso: "selecao_sem_publicar", passou: true });
  for (const layout of layouts) {
    for (const modo of ["claro", "escuro"] as const) {
      for (const width of [390, 1440]) {
        await page.setViewportSize({ width, height: 900 });
        assert.ok(ehTemplateRodas(layout));
        const tema = TemaSchema.parse({ ...mudarModoTemplateRodas(selecionarTemplateRodas(temaInicial, layout), modo), heroTitulo: "Escolha o próximo visual do seu carro" });
        const resposta = await page.goto(`${origem}/painel/previa?t=${codificarRascunho(tema)}`);
        assert.equal(resposta?.status(), 200);
        await page.locator(`[data-rodas="${layout}"]`).waitFor();
        await page.waitForLoadState("networkidle");
        await page.screenshot({ path: `${pasta}/${layout}-${modo}-${width}.png`, fullPage: true });
        assert.ok((await page.locator("h1").textContent())?.includes(tema.heroTitulo!));
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, `${layout} ${modo} ${width}: overflow`);
        assert.equal(await page.locator(`[data-rodas="${layout}"] a[href="/produtos"]`).count() > 0, true);
        const imagem = page.locator(`[data-rodas="${layout}"] img`).first();
        if (await imagem.count()) assert.ok(await imagem.evaluate(img => (img as HTMLImageElement).naturalWidth > 0), "Imagem local carregada");
        resultados.push({ layout, modo, width, previa: true, passou: true });
      }
    }
    // A prévia não escreve, inclusive após todas as variantes.
    assert.deepEqual((await prisma.tenant.findUniqueOrThrow({ where: { id: t.id } })).tema, temaInicial);
  }
  for (const layout of layouts) {
    assert.ok(ehTemplateRodas(layout));
    const tema = selecionarTemplateRodas(temaInicial, layout);
    const resposta = await fetch(origem + "/api/painel/loja", {
      method: "PATCH", headers: { "content-type": "application/json", origin: origem, cookie: `lojas_sessao=${emitirToken(slug)}` },
      body: JSON.stringify({ tema }),
    });
    assert.equal(resposta.status, 200);
    assert.deepEqual((await prisma.tenant.findUniqueOrThrow({ where: { id: t.id } })).tema, tema, "A paleta da prévia é preservada ao salvar");
    await page.goto(lojaUrl);
    await page.locator(`[data-rodas="${layout}"]`).waitFor();
    for (const width of [390, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      await page.waitForLoadState("networkidle");
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, `${layout} publicado ${width}: overflow`);
      await page.screenshot({ path: `${pasta}/${layout}-catalogo-${width}.png`, fullPage: true });
      resultados.push({ layout, width, caso: "catalogo_com_fotos_e_nomes_longos", passou: true });
    }
    // Os links da home publicada levam aos produtos reais deste tenant.
    const produto = page.locator(`[data-rodas="${layout}"] a[href="/produtos/roda-demonstracao"]`).first();
    await produto.click();
    await page.waitForURL(/\/produtos\/roda-demonstracao$/);
    assert.ok((await page.locator("h1").innerText()).includes("Roda de demonstração"));
    await page.goto(lojaUrl);
    await page.locator('.rw-header input[name="q"]').fill("roda & medidas");
    await page.locator('.rw-header button[type="submit"]').click();
    await page.waitForURL(/\/produtos\?/);
    assert.equal(new URL(page.url()).searchParams.get("q"), "roda & medidas");
    resultados.push({ layout, caso: "links_e_busca", passou: true });
  }
  await prisma.produto.deleteMany({ where: { tenantId: t.id } });
  await prisma.categoria.deleteMany({ where: { tenantId: t.id } });
  for (const layout of layouts) {
    await prisma.tenant.update({ where: { id: t.id }, data: { bannerUrl: null, tema: TemaSchema.parse({ ...temaInicial, layout }) } });
    await page.goto(lojaUrl);
    await page.locator(`[data-rodas="${layout}"]`).waitFor();
    assert.equal(await page.locator("h1").count(), 1);
    assert.equal(await page.getByText("O catálogo está sendo preparado.", { exact: true }).count(), 1);
    await page.screenshot({ path: `${pasta}/${layout}-vazio.png`, fullPage: true });
    resultados.push({ layout, caso: "sem_foto_sem_catalogo", passou: true });
  }
  assert.deepEqual(erros, [], "Sem exceções de página");
  await contexto.close();
  await writeFile(`${pasta}/resultado.json`, JSON.stringify({ status: "passed", commit: process.env.GITHUB_SHA, runId: process.env.GITHUB_RUN_ID, ambiente: "github-ci-loopback-postgresql", resultados }, null, 2));
} catch (erro) {
  await writeFile(`${pasta}/falha.json`, JSON.stringify({ erro: String(erro), erros, resultados }, null, 2));
  throw erro;
} finally {
  await navegador.close();
  servidor.kill("SIGTERM");
  if (tenantId) await prisma.tenant.delete({ where: { id: tenantId } });
  await prisma.$disconnect();
}
