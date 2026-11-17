import assert from "node:assert/strict";
import type { Page } from "playwright";

type Capturar = (page: Page, arquivo: string) => Promise<void>;

export async function verificarCatalogo(page: Page, painel: string, capturar: Capturar) {
  const largura = page.viewportSize()!.width;
  await page.goto(`${painel}/painel/estoque`);
  const busca = page.getByPlaceholder("Nome ou código do produto");
  await busca.fill("QA-inexistente");
  await page.getByText("Nenhum produto com esse filtro.", { exact: true }).waitFor();
  await busca.fill("qa-sem-contagem");
  await page.getByText("Estoque ainda não controlado", { exact: true }).waitFor();
  await capturar(page, `inventario-sem-contagem-${largura}.png`);
  await page.getByRole("link", { name: "Informar saldo" }).click();
  await page.locator("#catalogo-estoque:focus").waitFor();

  const criar = page.getByRole("button", { name: "Criar variações" });
  if (largura === 360) await criar.press("Enter");
  else await criar.click();
  const titulo = page.locator("#titulo-grade-variantes:focus");
  await titulo.waitFor();
  const primeiro = page.getByPlaceholder("Opção (Tamanho)");
  await primeiro.waitFor();
  for (const controle of [titulo, primeiro]) {
    assert.ok(await controle.evaluate(el => el.getBoundingClientRect().top >= 0 && el.getBoundingClientRect().bottom <= innerHeight));
  }
  await capturar(page, `variacoes-abertas-${largura}.png`);
  await page.getByRole("button", { name: "Fechar", exact: true }).click();
  assert.ok(await criar.evaluate(el => el === document.activeElement));

  const preco = page.locator("#catalogo-preco");
  const anterior = await preco.inputValue();
  await preco.fill("");
  await page.getByRole("button", { name: "Salvar produto" }).click();
  await page.getByText("Informe um preço válido em reais.", { exact: true }).waitFor();
  assert.ok(await preco.evaluate(el => el === document.activeElement));
  assert.equal(await page.locator("#catalogo-nome").inputValue(), "Caneca QA");
  await capturar(page, `produto-preco-invalido-${largura}.png`);
  await preco.fill(anterior);

  if (largura < 600) {
    await page.goto(`${painel}/painel/produtos`);
    const filtros = page.getByRole("combobox", { name: "Todos os filtros" });
    const [resposta] = await Promise.all([
      page.waitForResponse(r => r.url().includes("/api/painel/catalogo?") && new URL(r.url()).searchParams.get("situacao") === "inativo"),
      filtros.selectOption("inativo"),
    ]);
    assert.ok(resposta.ok());
    await capturar(page, `catalogo-filtro-final-${largura}.png`);
    await filtros.press("Home");
    assert.equal(await filtros.inputValue(), "");
  }
}

export async function verificarAtendimento(page: Page, painel: string, capturar: Capturar) {
  const largura = page.viewportSize()!.width;
  const email = `atendimento-${largura}@example.invalid`;
  await page.goto(`${painel}/painel/clientes`);
  const novo = page.getByRole("button", { name: "Novo cliente" });
  const formulario = page.getByRole("form", { name: "Cadastro de cliente" });
  async function cadastrar(endereco: string) {
    await novo.click();
    await formulario.getByLabel(/^Nome/).fill("Contato de teste");
    await formulario.getByLabel(/^E-mail/).fill(endereco);
    await formulario.getByRole("button", { name: "Cadastrar cliente" }).click();
  }
  await cadastrar(email);
  await page.getByText("Cliente cadastrado.", { exact: true }).waitFor();
  await page.reload();
  await page.getByLabel("Buscar clientes").fill(email);
  await page.getByText("Cadastro sem pedido", { exact: true }).filter({ visible: true }).first().waitFor();
  await capturar(page, `cliente-sem-pedido-${largura}.png`);
  await cadastrar(email.toUpperCase());
  await formulario.getByRole("alert").filter({ hasText: /já está na lista/ }).waitFor();

  await page.goto(`${painel}/painel/promocoes`);
  await page.getByText("1 de 3 no ar.", { exact: true }).waitFor();
  assert.equal(await page.getByText(/^venceu em /).filter({ visible: true }).count(), 2);
  await capturar(page, `cupons-vigencia-${largura}.png`);
  await page.goto(`${painel}/painel/conexoes`);
  const canal = page.locator("article").filter({ has: page.getByRole("heading", { name: /Pagamento.*mercadopago/i }) });
  await canal.getByText("Configurado", { exact: true }).waitFor();
  await canal.getByText("Ainda sem teste registrado").waitFor();
  await capturar(page, `conexao-sem-teste-${largura}.png`);
}
