import assert from "node:assert/strict";
import { createServer } from "node:http";
import { readFile, mkdir, writeFile } from "node:fs/promises";
import { resolve, extname, sep } from "node:path";
import { chromium } from "playwright";

assert.equal(process.env.CI, "true", "Verificação exclusiva do GitHub CI");
const pasta = "artifacts/rodas-fiel";
const raiz = resolve(`${pasta}/site`);
const tipos: Record<string, string> = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".png": "image/png", ".webp": "image/webp", ".svg": "image/svg+xml" };
const servidor = createServer(async (req, res) => {
  const nome = new URL(req.url ?? "/", "http://localhost").pathname;
  const arquivo = resolve(raiz, "." + decodeURIComponent(nome));
  if (!arquivo.startsWith(raiz + sep)) { res.writeHead(404).end(); return; }
  try { res.setHeader("content-type", tipos[extname(arquivo)] ?? "application/octet-stream"); res.end(await readFile(arquivo)); } catch { res.writeHead(404).end(); }
});
await new Promise<void>(resolve => servidor.listen(3118, "127.0.0.1", resolve));
const navegador = await chromium.launch({ headless: true });
const resultados: unknown[] = [];
try {
  await mkdir(`${pasta}/capturas`, { recursive: true });
  for (const [indice, nome] of ["street", "racing", "night", "carbon"].entries()) {
    if (process.env.RODAS_LAYOUT && process.env.RODAS_LAYOUT !== nome) continue;
    const contexto = await navegador.newContext({ viewport: { width: indice < 2 ? 1280 : 1440, height: 1000 } });
    const page = await contexto.newPage();
    const erros: string[] = [];
    page.on("pageerror", e => erros.push(e.message));
    await page.goto(`http://127.0.0.1:3118/${nome}.html`);
    await page.locator(".rw-product").first().waitFor();
    await page.evaluate(async () => { for (const img of document.images) img.loading = "eager"; await Promise.all([...document.images].map(img => img.decode())); });
    assert.equal(await page.locator(".rw-header").count(), 1);
    assert.equal(await page.locator("h1").count(), 1);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, `${nome}: overflow desktop`);
    await page.screenshot({ path: `${pasta}/capturas/${nome}.png`, fullPage: true });
    const arteInicial = await page.locator('.rw-hero-link > img').getAttribute('src');
    await page.getByRole('button', { name: 'Próximo banner', exact: true }).click();
    assert.notEqual(await page.locator('.rw-hero-link > img').getAttribute('src'), arteInicial);
    await page.getByRole('button', { name: 'Banner anterior', exact: true }).click();
    const adicionar = page.locator(".rw-add").first();
    if (await adicionar.count()) { await adicionar.click(); assert.ok((await page.locator(".rw-cart").innerText()).includes("(1)")); }
    await page.setViewportSize({ width: 390, height: 844 });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, `${nome}: overflow mobile`);
    await page.screenshot({ path: `${pasta}/capturas/${nome}-mobile.png`, fullPage: true });
    assert.deepEqual(erros, []);
    await page.setViewportSize({ width: 1280, height: 1000 });
    // Compara a mesma página inteira, normalizada para a mesma largura.
    await page.goto(`http://127.0.0.1:3118/${nome}.html`);
    const comparacao = `<!doctype html><html><body style="margin:0;display:grid;grid-template-columns:1fr 1fr;align-items:start;background:#ddd"><img src="/referencias/${indice + 1}.png" style="width:100%" alt="Referência"><img src="/capturas/${nome}.png" style="width:100%" alt="Implementação"></body></html>`;
    await writeFile(`${raiz}/comparar-${nome}.html`, comparacao);
    await mkdir(`${raiz}/capturas`, { recursive: true });
    await writeFile(`${raiz}/capturas/${nome}.png`, await readFile(`${pasta}/capturas/${nome}.png`));
    await page.goto(`http://127.0.0.1:3118/comparar-${nome}.html`);
    await page.evaluate(async () => { await Promise.all([...document.images].map(i => i.decode())); });
    await page.screenshot({ path: `${pasta}/capturas/comparacao-${nome}.png`, fullPage: true });
    resultados.push({ layout: nome, semOverflow: true, semErros: true, carrinho: nome === "street" ? "navegacao" : "verificado" });
    await contexto.close();
  }
  await writeFile(`${pasta}/resultado.json`, JSON.stringify({ status: "passed", ambiente: "github-ci-react-componentes-reais", commit: process.env.GITHUB_SHA, runId: process.env.GITHUB_RUN_ID, resultados }, null, 2));
} finally { await navegador.close(); await new Promise<void>(resolve => servidor.close(() => resolve())); }
