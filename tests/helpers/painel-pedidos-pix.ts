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
  await capturar(page, `pedidos-retorno-filtrado-${largura}.png`);

  await page.route(api, route => route.abort("internetdisconnected"), { times: 1 });
  await busca.fill("sem-resultado-qa");
  await tentar.waitFor();
  await page.getByText(/último resultado carregado/).waitFor();
  assert.ok(await linha.isVisible());
  await tentar.click();
  await page.getByText("Nenhum pedido com esse filtro.", { exact: true }).waitFor();
  assert.equal(new URL(page.url()).searchParams.get("q"), "sem-resultado-qa");
  assert.equal(new URL(page.url()).searchParams.get("situacao"), pedido.status);
  const semResultado = page.url();
  await page.goBack();
  await page.waitForURL(url);
  await linha.waitFor();
  assert.equal(await busca.inputValue(), String(pedido.numero));
  await page.goForward();
  await page.waitForURL(semResultado);
  await page.getByText("Nenhum pedido com esse filtro.", { exact: true }).waitFor();
  assert.equal(await busca.inputValue(), "sem-resultado-qa");
}

export async function verificarConsultaPedidos(page: Page, painel: string, pedido: { id: string; clienteTelefone: string }, capturar: Capturar) {
  const largura = page.viewportSize()!.width;
  const movel = largura < 640;
  const seletor = page.getByRole("combobox", { name: "Todos os filtros" });
  await page.goto(`${painel}/painel/pedidos`);
  const busca = page.getByRole("textbox", { name: "Buscar", exact: true });
  const controles = movel ? seletor.locator("option") : page.locator("button[aria-pressed]:visible");
  await controles.first().waitFor({ state: "attached" });
  assert.deepEqual((await controles.allTextContents()).map(texto => texto.replace(/ \([\d.]+\)$/, "")), [
    "Todos", "A separar", "Separando", "Enviados", "Aguardando pagamento", "Entregues", "Cancelados", "Estornados",
  ]);

  for (const q of [pedido.clienteTelefone, "(11) 90000-0000"]) {
    const [resposta] = await Promise.all([
      page.waitForResponse(r => {
        const url = new URL(r.url());
        return url.pathname === "/api/painel/pedidos" && url.searchParams.get("q") === q;
      }),
      busca.fill(q),
    ]);
    assert.equal(resposta.status(), 200);
    assert.deepEqual((await resposta.json()).itens.map((item: { id: string }) => item.id), [pedido.id]);
  }

  for (const [valor, rotulo] of [["ENTREGUE", "Entregues"], ["ESTORNADO", "Estornados"], ["CANCELADO", "Cancelados"]]) {
    const [resposta] = await Promise.all([
      page.waitForResponse(r => {
        const url = new URL(r.url());
        return url.pathname === "/api/painel/pedidos" && url.searchParams.get("situacao") === valor;
      }),
      movel ? seletor.selectOption(valor) : page.getByRole("button", { name: new RegExp(`^${rotulo}\\b`) }).click(),
    ]);
    assert.equal(resposta.status(), 200);
    assert.deepEqual((await resposta.json()).itens.map((item: { id: string }) => item.id), valor === "CANCELADO" ? [pedido.id] : []);
  }
  const origem = new URL(page.url());
  const ficha = page.locator(`a[href^="/painel/pedidos/${pedido.id}?"]:visible`).first();
  await ficha.click();
  await page.locator(`a[href="${origem.pathname}${origem.search}"]`).click();
  await ficha.waitFor();
  assert.equal(await busca.inputValue(), "(11) 90000-0000");
  if (movel) assert.equal(await seletor.inputValue(), "CANCELADO");
  else assert.equal(await page.getByRole("button", { name: /^Cancelados\b/ }).getAttribute("aria-pressed"), "true");
  await capturar(page, `pedidos-consulta-cancelados-${largura}.png`);
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
