import assert from "node:assert/strict";
import type { Page } from "playwright";

type Capturar = (page: Page, nome: string) => Promise<void>;

export async function verificarRecuperacaoPedidos(page: Page, painel: string, pedido: { id: string; numero: number; status: string }, capturar: Capturar) {
  const largura = page.viewportSize()!.width;
  const filtros = new URLSearchParams({ q: String(pedido.numero), situacao: pedido.status, pagina: "1" });
  const url = `${painel}/painel/pedidos?${filtros}`;
  const api = (u: URL) => u.pathname === "/api/painel/pedidos" && u.searchParams.has("pagina");
  const tentar = page.getByRole("button", { name: "Tentar novamente" });
  const busca = page.getByPlaceholder("Número do pedido, nome ou telefone");
  const linha = page.locator(`a[href^="/painel/pedidos/${pedido.id}?"]:visible`).first();

  await page.route(api, route => route.fulfill({ status: 503, body: "" }), { times: 1 });
  await page.goto(url);
  await tentar.waitFor();
  assert.equal(await page.getByText("Carregando pedidos…", { exact: true }).count(), 0);
  await capturar(page, `pedidos-erro-${largura}.png`);
  await tentar.click();
  await linha.waitFor();
  assert.equal(await busca.inputValue(), String(pedido.numero));
  assert.equal(page.url(), url);
  await capturar(page, `pedidos-recuperados-${largura}.png`);
  await linha.click();
  await page.locator(`a[href="/painel/pedidos?${filtros}"]`).click();
  await page.waitForURL(url);
  await linha.click();
  await page.waitForURL(u => u.pathname.endsWith(pedido.id));
  await page.goBack();
  await page.waitForURL(url);
  await linha.waitFor();

  await page.route(api, route => route.abort("internetdisconnected"), { times: 1 });
  await busca.fill("sem-resultado-qa");
  await tentar.waitFor();
  await page.getByText(/último resultado carregado/).waitFor();
  assert.ok(await linha.isVisible());
  await tentar.click();
  await page.getByText("Nenhum pedido com esse filtro.", { exact: true }).waitFor();
  assert.equal(new URL(page.url()).searchParams.get("q"), "sem-resultado-qa");
  assert.equal(new URL(page.url()).searchParams.get("situacao"), pedido.status);
}

export async function verificarFormatoPix(page: Page, painel: string, capturar: Capturar) {
  await page.goto(`${painel}/painel/configuracoes/recebimento`);
  const cartao = page.locator("article").filter({ has: page.getByRole("heading", { name: "Pix na conta" }) });
  await cartao.getByRole("button", { name: "Cadastrar chave Pix" }).click();
  const validar = cartao.getByRole("button", { name: "Validar formato" });
  const salvar = cartao.getByRole("button", { name: "Salvar" });
  await validar.click();
  await cartao.getByText(/Preencha.*Chave Pix/).waitFor();
  assert.ok(await salvar.isDisabled());
  const chave = cartao.getByRole("textbox", { name: /^Chave Pix/ });
  await chave.fill("auditoria@example.invalid");
  await cartao.getByRole("textbox", { name: /^Nome de quem recebe/ }).fill("Loja QA");
  await validar.click();
  await cartao.getByRole("status").filter({ hasText: /Formato válido.*banco.*recebedor/ }).waitFor();
  assert.ok(await salvar.isEnabled());
  await capturar(page, `pix-formato-valido-${page.viewportSize()!.width}.png`);
  await chave.fill("");
  assert.ok(await salvar.isDisabled());
}
