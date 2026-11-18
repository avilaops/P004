import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { spawn } from "node:child_process";
import { mkdir, readFile } from "node:fs/promises";
import { chromium } from "playwright";
import { prisma } from "../src/lib/db";
import { salvarProdutoNoCatalogo } from "../src/lib/catalogo-escrita";
import { emitirToken } from "../src/lib/sessao";
import forge from "node-forge";
import { selarCertificado } from "../src/lib/fiscal-certificado";
import { emitirNfe } from "../src/lib/fiscal-emissao";
import { cancelarNfe } from "../src/lib/fiscal-cancelamento";

assert.equal(process.env.CI, "true");
process.env.LOJAS_CERT_SECRET ??= "ab".repeat(32);
const db = new URL(process.env.DATABASE_URL ?? "http://invalid");
assert.ok(["localhost", "127.0.0.1"].includes(db.hostname) && db.port === "5548" && db.pathname.endsWith("_test"));
const base = "http://localhost:3108", output = "artifacts/fiscal-entry-browser";
const xml = (await readFile("tests/fixtures/nfe-entrada-qa.xml", "utf8")).replaceAll("<tpAmb>2</tpAmb>", "<tpAmb>1</tpAmb>");
const chave = /<chNFe>(\d{44})<\/chNFe>/.exec(xml)![1];
const loja = await prisma.tenant.create({ data: { slug: `qa-receber-${randomUUID()}`, nome: "Loja QA Fiscal", status: "ATIVA", cnpj: "11222333000181" } });
const outra = await prisma.tenant.create({ data: { slug: `qa-receber-outra-${randomUUID()}`, nome: "Outra loja QA", status: "ATIVA" } });
const browser = await chromium.launch();
const server = spawn(process.execPath, ["--import", "./scripts/qa-fiscal-sem-sefaz.mjs", ".next/standalone/server.js"], { env: { ...process.env, PORT: "3108", HOSTNAME: "0.0.0.0", LOJAS_BASE_DOMAIN: "localhost", ROTINAS_AGENDADOR: "0", LOJAS_INDEXNOW_ENABLED: "false" }, stdio: "inherit" });
const cookie = `lojas_sessao=${emitirToken(loja.slug)}`;
const erros: string[] = [];
try {
  let ready = false;
  for (let i = 0; i < 40; i++) {
    try { if ((await fetch(base + "/api/health")).ok) { ready = true; break; } } catch { /* aguarda servidor */ }
    await new Promise(resolve => setTimeout(resolve, 250));
  }
  assert.ok(ready);
  const produtos = await Promise.all([1, 2].map(n => salvarProdutoNoCatalogo(loja.id, null, { nome: `Produto fiscal QA ${n}`, slug: `produto-fiscal-qa-${n}`, estoque: 5, precoCentavos: 100 })));
  const variantes = await Promise.all(produtos.map(p => prisma.variante.findFirstOrThrow({ where: { tenantId: loja.id, produtoId: p.id } })));
  const doc = await prisma.documentoFiscalLoja.create({ data: { tenantId: loja.id, cnpj: loja.cnpj!, chave, nsu: "000000000000001", schema: "procNFe_v4.00.xsd", xml } });
  const foreign = await prisma.documentoFiscalLoja.create({ data: { tenantId: outra.id, cnpj: "99999999000191", chave, nsu: "000000000000001", schema: "procNFe_v4.00.xsd", xml } });
  const path = `/api/painel/fiscal/documentos/${doc.id}/entrada-estoque`;
  const prepared = await fetch(base + path, { headers: { cookie } });
  assert.equal(prepared.status, 200, "Conferência deve estar acessível pelo painel compilado");
  assert.match(prepared.headers.get("cache-control") ?? "", /no-store/);
  assert.equal((await prepared.json()).nota.itens.length, 2);
  assert.equal((await fetch(base + path)).status, 401);
  const cadastroPath = `/api/painel/fiscal/documentos/${doc.id}/produtos`;
  const cadastroCorpo = JSON.stringify({ confirmacao: true, numero: 2, nome: "Novo acessório fiscal QA", precoCentavos: 3500 });
  assert.equal((await fetch(base + cadastroPath, { method: "POST", headers: { origin: "https://localhost", "content-type": "application/json" }, body: cadastroCorpo })).status, 401);
  assert.equal((await fetch(base + cadastroPath, { method: "POST", headers: { cookie, origin: "https://other.example", "content-type": "application/json" }, body: cadastroCorpo })).status, 403);
  assert.equal((await fetch(base + `/api/painel/fiscal/documentos/${foreign.id}/entrada-estoque`, { headers: { cookie } })).status, 404);
  const corpo = { confirmacao: true, confirmarFornecedor: true, local: "principal", itens: [{ numero: 1, varianteId: variantes[0].id, quantidade: 2, custoTotalCentavos: 10000 }, { numero: 2, varianteId: variantes[1].id, quantidade: 1, custoTotalCentavos: 2500 }] };
  assert.equal((await fetch(base + path, { method: "POST", headers: { origin: "https://localhost", "content-type": "application/json" }, body: JSON.stringify(corpo) })).status, 401);
  assert.equal((await fetch(base + `/api/painel/fiscal/documentos/${foreign.id}/entrada-estoque`, { method: "POST", headers: { cookie, origin: "https://localhost", "content-type": "application/json" }, body: JSON.stringify(corpo) })).status, 404);
  const blocked = await fetch(base + path, { method: "POST", headers: { cookie, origin: "https://other.example", "content-type": "application/json" }, body: JSON.stringify(corpo) });
  assert.equal(blocked.status, 403);
  assert.equal(await prisma.comandoEstoque.count({ where: { tenantId: loja.id } }), 0);

  const context = await browser.newContext({ viewport: { width: 1440, height: 1100 } });
  await context.addCookies([{ name: "lojas_sessao", value: emitirToken(loja.slug), url: base }]);
  const page = await context.newPage();
  page.on("pageerror", e => erros.push(e.message));
  // The local HTTP fixture simulates the HTTPS ingress without weakening the
  // production Origin policy. API negative checks above use their real headers.
  await page.route("**/api/painel/fiscal/documentos/*/entrada-estoque", async route => {
    if (route.request().method() !== "POST") return route.continue();
    // Chromium owns Origin at the network layer. Forward the actual payload
    // through an HTTP ingress fixture instead of trying to override that header.
    const requestHeaders = await route.request().allHeaders();
    assert.ok(requestHeaders.cookie?.includes("lojas_sessao="), "O POST do navegador precisa levar a própria sessão");
    const response = await route.fetch({ headers: { ...requestHeaders, origin: "https://localhost" } });
    await route.fulfill({ response });
  });
  await page.route("**/api/painel/fiscal/documentos/*/produtos", async route => {
    const requestHeaders = await route.request().allHeaders();
    const response = await route.fetch({ headers: { ...requestHeaders, origin: "https://localhost" } });
    await route.fulfill({ response });
  });
  await page.goto(base + "/painel/configuracoes/fiscal");
  await page.getByRole("button", { name: "Conferir entrada da NF-e 123" }).click();
  const dialog = page.getByRole("dialog", { name: "Conferir entrada de estoque" });
  await dialog.waitFor();
  for (const n of [1, 2]) {
    await page.setViewportSize(n === 1 ? { width: 393, height: 852 } : { width: 1440, height: 1100 });
    if (n === 1) {
      await dialog.getByLabel(`Buscar produto do item ${n}`).fill(`Produto fiscal QA ${n}`);
      await dialog.getByRole("button", { name: new RegExp(`Selecionar Produto fiscal QA ${n}`) }).click();
    } else {
      await dialog.getByRole("button", { name: "Cadastrar novo produto para o item 2" }).click();
      await dialog.getByLabel("Nome do novo produto do item 2").fill("Novo acessório fiscal QA");
      await dialog.getByLabel("Preço de venda do item 2 (R$)").fill("35,00");
      await dialog.getByLabel(/Confirmo um produto novo no catálogo/).check();
      const respostaCadastro = page.waitForResponse(r => new URL(r.url()).pathname === cadastroPath && r.request().method() === "POST");
      await dialog.getByRole("button", { name: "Criar e selecionar produto do item 2" }).click();
      const cadastrado = await respostaCadastro;
      assert.equal(cadastrado.status(), 200, await cadastrado.text());
      const criado = await cadastrado.json();
      corpo.itens[1].varianteId = criado.id;
      variantes[1] = await prisma.variante.findUniqueOrThrow({ where: { id: criado.id } });
      const saldoNovo = await prisma.saldoEstoque.findFirstOrThrow({ where: { tenantId: loja.id, varianteId: criado.id, local: "principal" } });
      assert.equal(saldoNovo.fisico, 0, "Cadastrar produto não recebe estoque");
    }
    await dialog.getByLabel(`Custo total de aquisição do item ${n} (R$)`).fill(n === 1 ? "100,00" : "25,00");
  }
  await mkdir(output, { recursive: true });
  await page.screenshot({ path: output + "/desktop.png", fullPage: true });
  await page.setViewportSize({ width: 393, height: 852 });
  await dialog.getByLabel("Unidades de estoque do item 1").fill("2");
  await dialog.getByRole("combobox", { name: /^Local de estoque/ }).fill("principal");
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth));
  await page.screenshot({ path: output + "/mobile-form.png", fullPage: true });
  for (const width of [360, 393, 768, 1280, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    assert.ok(await dialog.evaluate(elemento => elemento.scrollWidth <= elemento.clientWidth), `Conferência sem vazamento lateral em${width}px`);
    await page.screenshot({ path: `${output}/conferencia-${width}.png`, fullPage: true });
  }
  await dialog.getByLabel("Conferi os produtos, quantidades e local de estoque, o fornecedor identificado pelo documento e os custos de aquisição").check();
  const invalidos = await dialog.locator("form").evaluate(form => Array.from((form as HTMLFormElement).elements).filter(e => e instanceof HTMLInputElement && !e.validity.valid).map(e => ({ name: (e as HTMLInputElement).name, value: (e as HTMLInputElement).value, message: (e as HTMLInputElement).validationMessage })));
  assert.deepEqual(invalidos, [], "A conferência preenchida precisa passar pela validação do navegador");
  const respostaConfirmacao = page.waitForResponse(r => new URL(r.url()).pathname === path && r.request().method() === "POST");
  await dialog.getByRole("button", { name: "Confirmar entrada no estoque", exact: true }).click();
  const confirmada = await respostaConfirmacao;
  assert.equal(confirmada.status(), 200, await confirmada.text());
  await dialog.getByRole("status").filter({ hasText: "Entrada registrada" }).waitFor();
  const saldos = await prisma.saldoEstoque.findMany({ where: { tenantId: loja.id, local: "principal" }, orderBy: { varianteId: "asc" } });
  assert.equal(saldos.find(s => s.varianteId === variantes[0].id)?.fisico, 7);
  assert.equal(saldos.find(s => s.varianteId === variantes[1].id)?.fisico, 1);
  const retry = await fetch(base + path, { method: "POST", headers: { cookie, origin: "https://localhost", "content-type": "application/json" }, body: JSON.stringify(corpo) });
  assert.equal(retry.status, 200);
  assert.equal(await prisma.razaoEstoque.count({ where: { tenantId: loja.id, origem: "fiscal:entrada-nfe" } }), 2);
  const custos = await fetch(base + `/api/painel/fiscal/entrada-estoque/custos?varianteId=${variantes[0].id}`, { headers: { cookie } });
  assert.equal(custos.status, 200);
  const historico = await custos.json();
  assert.equal(historico.itens[0].custoTotalCentavos, 10000);
  assert.equal(historico.itens[0].fornecedor.documento, "12345678000195");
  const custosAnonimos = await fetch(base + `/api/painel/fiscal/entrada-estoque/custos?varianteId=${variantes[0].id}`);
  assert.equal(custosAnonimos.status, 401);
  await page.setViewportSize({ width: 393, height: 852 });
  await page.screenshot({ path: output + "/mobile.png", fullPage: true });
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth));
  assert.equal(erros.length, 0, erros.join("; "));
  const pedido = await prisma.pedido.create({ data: { tenantId: loja.id, referencia: `qa-fiscal-${randomUUID()}`, status: "PAGO", clienteNome: "Comprador QA", clienteDocumento: "52998224725", clienteEmail: "qa@example.test", clienteTelefone: "11999999999", freteNome: "Retirada", freteCentavos: 0, subtotalCentavos: 10000, totalCentavos: 10000, meioPagamento: "pix", pagamentoStatus: "approved", itens: { create: { produtoId: produtos[0].id, varianteId: variantes[0].id, nome: "Peça comprada QA", quantidade: 1, precoUnitarioCentavos: 10000 } } } });
  const fiscalPath = `/api/painel/pedidos/${pedido.id}/fiscal`;
  const comandosAntes = await prisma.comandoEstoque.count({ where: { tenantId: loja.id } });
  const fiscalAnonimo = await fetch(base + fiscalPath);
  assert.equal(fiscalAnonimo.status, 401);
  assert.match(fiscalAnonimo.headers.get("cache-control") ?? "", /no-store/);
  const operador = await prisma.operadorLoja.create({ data: { tenantId: loja.id, nome: "Gerente QA", email: "gerente@example.test", senhaHash: "hash-sintetico-sem-login", papel: "GERENTE" } });
  const cookieGerente = `lojas_sessao=${emitirToken(loja.slug, operador.id)}`;
  assert.equal((await fetch(base + fiscalPath, { headers: { cookie: cookieGerente } })).status, 403);
  const manifestacaoPath = `/api/painel/fiscal/documentos/${doc.id}/manifestacao`;
  for (const [credencial, status] of [[undefined, 401], [cookieGerente, 403]] as const) {
    const resposta = await fetch(base + manifestacaoPath, { method: "POST", headers: credencial ? { cookie: credencial } : {} });
    assert.equal(resposta.status, status);
    assert.match(resposta.headers.get("cache-control") ?? "", /private.*no-store/);
  }
  for (const invalido of [null, { tipo: "toString", confirmacao: true }, { tipo: "CIENCIA", confirmacao: true, justificativa: {} }]) {
    const resposta = await fetch(base + manifestacaoPath, { method: "POST", headers: { cookie, origin: "https://localhost", "content-type": "application/json" }, body: JSON.stringify(invalido) });
    assert.equal(resposta.status, 422);
    assert.match(resposta.headers.get("cache-control") ?? "", /private.*no-store/);
    assert.equal((await resposta.json()).erro, "Confirme explicitamente a manifestação fiscal escolhida.");
  }
  assert.equal(await prisma.manifestacaoFiscalLoja.count({ where: { tenantId: loja.id } }), 0);
  const anotherOrder = await prisma.pedido.create({ data: { tenantId: outra.id, referencia: `qa-fiscal-outro-${randomUUID()}`, clienteNome: "Outra empresa QA", clienteDocumento: "52998224725", clienteEmail: "qa@example.test", clienteTelefone: "11999999999", freteNome: "Retirada", freteCentavos: 0, subtotalCentavos: 0, totalCentavos: 0, meioPagamento: "pix" } });
  assert.equal((await fetch(base + `/api/painel/pedidos/${anotherOrder.id}/fiscal`, { headers: { cookie } })).status, 404);
  await page.goto(base + `/painel/pedidos/${pedido.id}`);
  await page.getByRole("button", { name: "Conferir dados fiscais", exact: true }).click();
  await page.getByRole("status").filter({ hasText: "Conferência disponível" }).waitFor();
  await page.getByText("Pendências para revisão", { exact: true }).waitFor();
  assert.ok(await page.getByRole("link", { name: "Abrir cadastro" }).count());
  for (const width of [393, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth), `Pedido fiscal sem vazamento em${width}px`);
    await page.screenshot({ path: `${output}/pedido-${width}.png`, fullPage: true });
  }
  const consultaFiscal = await fetch(base + fiscalPath, { headers: { cookie } });
  assert.equal(consultaFiscal.status, 200);
  assert.match(consultaFiscal.headers.get("cache-control") ?? "", /no-store/);
  const snapshot = await consultaFiscal.json();
  assert.equal(snapshot.emissaoDisponivel, true);
  assert.equal(snapshot.modoEmissao, "DIRETA");
  assert.equal(snapshot.dados.itens[0].nome, "Peça comprada QA");
  assert.equal(JSON.stringify(snapshot).includes("senhaHash"), false);
  await page.getByRole("button", { name: "Atualizar conferência fiscal", exact: true }).click();
  await page.getByRole("status").filter({ hasText: "Conferência disponível" }).waitFor();
  await page.getByRole("link", { name: "Abrir cadastro" }).first().click();
  await page.getByText("Classificação fiscal", { exact: true }).click();
  await page.getByLabel("NCM", { exact: true }).fill("04011010");
  await page.getByLabel("CEST", { exact: true }).fill("0100100");
  const respostaProduto = page.waitForResponse(r => new URL(r.url()).pathname === "/api/painel/produtos" && r.request().method() === "PATCH");
  await page.getByRole("button", { name: "Salvar produto", exact: true }).click();
  const produtoAtualizado = await respostaProduto;
  assert.equal(produtoAtualizado.status(), 200, await produtoAtualizado.text());
  await page.getByText("Produto atualizado.", { exact: true }).waitFor();
  const classificacao = await prisma.produto.findUniqueOrThrow({ where: { id: produtos[0].id } });
  assert.equal(classificacao.ncm, "04011010");
  assert.equal(classificacao.cest, "0100100");
  await page.getByText("Sem alterações para salvar.", { exact: true }).waitFor();
  await page.goBack();
  await page.getByRole("button", { name: /^(Conferir dados fiscais|Atualizar conferência fiscal)$/ }).click();
  await page.getByRole("status").filter({ hasText: "Conferência disponível" }).waitFor();
  const depois = await (await fetch(base + fiscalPath, { headers: { cookie } })).json();
  assert.equal(depois.pendencias.some((p: { codigo: string }) => p.codigo === "ITEM_NCM"), false);
  assert.equal(depois.dados.itens[0].classificacaoAtual.ncm, "04011010");
  assert.equal(depois.dados.itens[0].precoUnitarioCentavos, 10000);
  assert.notEqual(depois.resumoHash, snapshot.resumoHash);
  assert.equal(await prisma.comandoEstoque.count({ where: { tenantId: loja.id } }), comandosAntes);
  assert.equal((await prisma.pedido.findUniqueOrThrow({ where: { id: pedido.id } })).atualizadoEm.getTime(), pedido.atualizadoEm.getTime());
  const contextoGerente = await browser.newContext();
  await contextoGerente.addCookies([{ name: "lojas_sessao", value: emitirToken(loja.slug, operador.id), url: base }]);
  const paginaGerente = await contextoGerente.newPage();
  await paginaGerente.goto(base + `/painel/pedidos/${pedido.id}`);
  assert.equal(await paginaGerente.getByRole("button", { name: "Conferir dados fiscais", exact: true }).count(), 0);
  await contextoGerente.close();
  // Certificado e dados sintéticos. Esta jornada prepara, mas não transmite.
  const chavesNfe = forge.pki.rsa.generateKeyPair(2048), certificadoNfe = forge.pki.createCertificate();
  certificadoNfe.publicKey = chavesNfe.publicKey; certificadoNfe.serialNumber = "01";
  certificadoNfe.validity.notBefore = new Date(Date.now() - 86400000); certificadoNfe.validity.notAfter = new Date(Date.now() + 86400000);
  certificadoNfe.setSubject([{ name: "commonName", value: `QA:${loja.cnpj}` }]); certificadoNfe.setIssuer(certificadoNfe.subject.attributes); certificadoNfe.sign(chavesNfe.privateKey, forge.md.sha256.create());
  const pfxNfe = Buffer.from(forge.asn1.toDer(forge.pkcs12.toPkcs12Asn1(chavesNfe.privateKey, certificadoNfe, "qa", { algorithm: "3des" })).getBytes(), "binary");
  await prisma.fiscalLoja.create({ data: { tenantId: loja.id, cnpj: loja.cnpj!, uf: "SP", titular: "QA sintético", validoAte: certificadoNfe.validity.notAfter, certificadoEnc: selarCertificado(pfxNfe, "qa") } });
  const enderecoNfe = { logradouro: "Rua QA", numero: "1", bairro: "Centro", cidade: "São Paulo", uf: "SP", cep: "01001000" };
  await prisma.tenant.update({ where: { id: loja.id }, data: { endereco: enderecoNfe } });
  await prisma.pedido.update({ where: { id: pedido.id }, data: { entrega: enderecoNfe } });
  await page.route("**/api/painel/fiscal/emissoes", async route => {
    if (route.request().method() !== "POST") return route.continue();
    const requestHeaders = await route.request().allHeaders();
    assert.ok(requestHeaders.cookie?.includes("lojas_sessao="));
    const response = await route.fetch({ headers: { ...requestHeaders, origin: "https://localhost" } });
    await route.fulfill({ response });
  });
  assert.equal((await fetch(base + "/api/painel/fiscal/emissoes", { method: "POST", headers: { cookie, origin: "https://other.example", "content-type": "application/json" }, body: "{}" })).status, 403);
  await page.getByRole("button", { name: "Atualizar conferência fiscal", exact: true }).click();
  await page.getByRole("status").filter({ hasText: "Conferência disponível" }).waitFor();
  await page.getByText("Preparar NF-e de venda deste pedido", { exact: true }).click();
  await page.getByLabel("Série da NF-e", { exact: true }).fill("1");
  await page.getByLabel("Número da NF-e", { exact: true }).fill("123");
  await page.getByLabel("Inscrição estadual do emitente", { exact: true }).fill("111111111111");
  await page.getByLabel("Município IBGE do emitente", { exact: true }).fill("3550308");
  await page.getByLabel("Município IBGE do destinatário", { exact: true }).fill("3550308");
  await page.getByLabel("Tributação revisada", { exact: true }).selectOption("SIMPLES_102_PIS07_COFINS07");
  await page.getByLabel("Pagamento da NF-e", { exact: true }).selectOption("17");
  await page.getByLabel("Responsável pelo frete", { exact: true }).selectOption("9");
  await page.getByLabel("CFOP do item 1", { exact: true }).selectOption("5102");
  await page.getByLabel("Origem do item 1", { exact: true }).selectOption("0");
  await page.getByLabel("Unidade fiscal do item 1", { exact: true }).fill("UN");
  await page.getByLabel("GTIN do item 1", { exact: true }).fill("SEM GTIN");
  await page.getByLabel("Confirmei que a venda é direta, sem intermediador, o destinatário é consumidor final não contribuinte de ICMS e a tributação selecionada se aplica.").check();
  const preparacaoNfe = page.waitForResponse(r => new URL(r.url()).pathname === "/api/painel/fiscal/emissoes" && r.request().method() === "POST");
  await page.getByRole("button", { name: "Preparar e assinar NF-e do pedido", exact: true }).click();
  const respostaNfe = await preparacaoNfe;
  assert.equal(respostaNfe.status(), 201, await respostaNfe.text());
  let preparadaNfe = await respostaNfe.json();
  const revisaoNfe = page.getByRole("region", { name: "Revisão da NF-e preparada" });
  await revisaoNfe.waitFor();
  assert.equal(await revisaoNfe.getByRole("button", { name: "Emitir NF-e em homologação", exact: true }).isDisabled(), true);
  await revisaoNfe.getByRole("checkbox").check();
  assert.equal(await revisaoNfe.getByRole("button", { name: "Emitir NF-e em homologação", exact: true }).isEnabled(), true);
  // Não clicar em emitir: envio é coberto no teste de integração com transporte sintético.
  await page.getByText("Preparar NF-e de venda deste pedido", { exact: true }).click();
  for (const width of [393, 1440]) {
    await page.setViewportSize({ width, height: 1100 });
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth), `Emissão sem overflow em ${width}px`);
    await page.screenshot({ path: `${output}/emissao-direta-${width}.png`, fullPage: true });
  }
  const rascunhoNfe = await fetch(base + `/api/painel/fiscal/emissoes/${preparadaNfe.id}?formato=rascunho`, { headers: { cookie } });
  assert.equal(rascunhoNfe.status, 200); assert.match(await rascunhoNfe.text(), /<Signature/);
  assert.equal((await fetch(base + `/api/painel/fiscal/emissoes/${preparadaNfe.id}?formato=xml`, { headers: { cookie } })).status, 409);
  const anteriorNfeId = preparadaNfe.id;
  await revisaoNfe.getByRole("button", { name: "Corrigir preparação desta NF-e", exact: true }).click();
  await page.getByText("Preparar NF-e de venda deste pedido", { exact: true }).click();
  await page.getByLabel("Natureza da operação", { exact: true }).fill("Venda revisada de mercadoria");
  const correcaoNfe = page.waitForResponse(r => new URL(r.url()).pathname === "/api/painel/fiscal/emissoes" && r.request().method() === "POST");
  await page.getByRole("button", { name: "Preparar e assinar NF-e do pedido", exact: true }).click();
  const corrigidaNfe = await correcaoNfe;
  assert.equal(corrigidaNfe.status(), 201, await corrigidaNfe.text());
  preparadaNfe = await corrigidaNfe.json();
  assert.notEqual(preparadaNfe.id, anteriorNfeId);
  assert.equal((await prisma.emissaoFiscalLoja.findUniqueOrThrow({ where: { id: anteriorNfeId } })).status, "SUBSTITUIDA");
  assert.equal(await revisaoNfe.getByRole("button", { name: "Emitir NF-e em homologação", exact: true }).isDisabled(), true);
  const cookieOutra = `lojas_sessao=${emitirToken(outra.slug)}`;
  assert.equal((await fetch(base + `/api/painel/fiscal/emissoes/${preparadaNfe.id}?formato=rascunho`, { headers: { cookie: cookieOutra } })).status, 404);
  const corpoEmissao = { acao: "emitir", ambiente: preparadaNfe.ambiente, resumoHash: preparadaNfe.resumoHash, confirmacao: true };
  assert.equal((await fetch(base + `/api/painel/fiscal/emissoes/${preparadaNfe.id}`, { method: "POST", headers: { cookie: cookieOutra, origin: "https://localhost", "content-type": "application/json" }, body: JSON.stringify(corpoEmissao) })).status, 404);
  assert.equal((await fetch(base + `/api/painel/fiscal/emissoes/${preparadaNfe.id}`, { method: "POST", headers: { cookie, origin: "https://localhost", "content-type": "application/json" }, body: JSON.stringify({ ...corpoEmissao, confirmacao: false }) })).status, 422);
  for (const [credencial, status] of [[undefined, 401], [cookieGerente, 403]] as const) {
    const resposta = await fetch(base + "/api/painel/fiscal/emissoes", { headers: credencial ? { cookie: credencial } : {} });
    assert.equal(resposta.status, status); assert.match(resposta.headers.get("cache-control") ?? "", /no-store/);
  }
  const protegidaNfe = await prisma.emissaoFiscalLoja.findUniqueOrThrow({ where: { id: preparadaNfe.id } });
  assert.equal(protegidaNfe.status, "PREPARADA"); assert.equal(protegidaNfe.enviadoEm, null);
  // Autoriza e cancela exclusivamente pela camada de serviço com transporte
  // sintético. O servidor compilado bloqueia conexões fiscais externas.
  await emitirNfe({ tenantId: loja.id, id: preparadaNfe.id, ambiente: "2", resumoHash: preparadaNfe.resumoHash }, async () => `<retEnviNFe><tpAmb>2</tpAmb><cStat>104</cStat><protNFe versao="4.00"><infProt><tpAmb>2</tpAmb><chNFe>${protegidaNfe.chave}</chNFe><digVal>${protegidaNfe.digest}</digVal><nProt>135260000099999</nProt><cStat>100</cStat></infProt></protNFe></retEnviNFe>`);
  const pedidoAntesCancelamento = await prisma.pedido.findUniqueOrThrow({ where: { id: pedido.id } });
  const autorizadaAntesCancelamento = await prisma.emissaoFiscalLoja.findUniqueOrThrow({ where: { id: preparadaNfe.id } });
  const cancelamentoPath = `/api/painel/fiscal/emissoes/${preparadaNfe.id}/cancelamento`;
  const comandoCancelamento = { confirmacao: true, ambiente: "2", resumoHash: preparadaNfe.resumoHash, justificativa: "Cancelamento exclusivamente sintético de homologação QA." };
  for (const [credencial, status] of [[undefined, 401], [cookieGerente, 403], [cookieOutra, 404]] as const) {
    const resposta = await fetch(base + cancelamentoPath, { headers: credencial ? { cookie: credencial } : {} });
    assert.equal(resposta.status, status); assert.match(resposta.headers.get("cache-control") ?? "", /no-store/);
  }
  assert.equal((await fetch(base + `${cancelamentoPath}?formato=xml`, { headers: { cookie } })).status, 409);
  assert.equal((await fetch(base + cancelamentoPath, { method: "POST", headers: { cookie, origin: "https://other.example", "content-type": "application/json" }, body: JSON.stringify(comandoCancelamento) })).status, 403);
  assert.equal((await fetch(base + cancelamentoPath, { method: "POST", headers: { cookie, origin: "https://localhost", "content-type": "application/json" }, body: JSON.stringify({ ...comandoCancelamento, confirmacao: false }) })).status, 422);
  assert.equal((await fetch(base + cancelamentoPath, { method: "POST", headers: { cookie: cookieOutra, origin: "https://localhost", "content-type": "application/json" }, body: JSON.stringify(comandoCancelamento) })).status, 404);
  let cancelamentosEnviados = 0;
  await page.route(`**${cancelamentoPath}`, async route => {
    if (route.request().method() !== "POST") return route.continue();
    const requestHeaders = await route.request().allHeaders();
    assert.ok(requestHeaders.cookie?.includes("lojas_sessao="));
    const corpo = route.request().postDataJSON();
    const resultado = await cancelarNfe({ ...corpo, tenantId: loja.id, emissaoId: preparadaNfe.id, autor: "qa@example.test" }, async req => {
      cancelamentosEnviados++; assert.equal(req.operacao, "cancelar");
      return `<retEnvEvento><tpAmb>2</tpAmb><cStat>128</cStat><retEvento versao="1.00"><infEvento><tpAmb>2</tpAmb><chNFe>${protegidaNfe.chave}</chNFe><tpEvento>110111</tpEvento><nSeqEvento>1</nSeqEvento><nProt>135260000088888</nProt><cStat>135</cStat><xMotivo>QA sintético</xMotivo></infEvento></retEvento></retEnvEvento>`;
    });
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(resultado) });
  });
  await page.reload();
  await page.getByRole("button", { name: "Conferir dados fiscais", exact: true }).click();
  await page.getByRole("button", { name: "Revisar NF-e 123", exact: true }).first().click();
  const cancelamentoUi = page.getByRole("region", { name: "Cancelamento fiscal da NF-e" });
  await cancelamentoUi.getByText("Solicitar cancelamento desta NF-e", { exact: true }).click();
  await cancelamentoUi.getByLabel("Justificativa do cancelamento", { exact: true }).fill(comandoCancelamento.justificativa);
  assert.equal(await cancelamentoUi.getByRole("button", { name: "Cancelar NF-e em homologação", exact: true }).isDisabled(), true);
  await cancelamentoUi.getByLabel("Confirmo o cancelamento desta NF-e na SEFAZ e a justificativa informada.").check();
  await cancelamentoUi.getByRole("button", { name: "Cancelar NF-e em homologação", exact: true }).click();
  await cancelamentoUi.getByRole("status").filter({ hasText: "Cancelamento aceito pela SEFAZ" }).waitFor();
  assert.equal(cancelamentosEnviados, 1);
  const comprovante = await fetch(base + `${cancelamentoPath}?formato=xml`, { headers: { cookie } });
  assert.equal(comprovante.status, 200); assert.match(comprovante.headers.get("cache-control") ?? "", /no-store/); assert.match(await comprovante.text(), /<procEventoNFe/);
  for (const width of [393, 1440]) {
    await page.setViewportSize({ width, height: 1100 });
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth), `Cancelamento sem overflow em ${width}px`);
    await page.screenshot({ path: `${output}/cancelamento-direto-${width}.png`, fullPage: true });
  }
  const pedidoAposCancelamento = await prisma.pedido.findUniqueOrThrow({ where: { id: pedido.id } });
  assert.equal(pedidoAposCancelamento.status, pedidoAntesCancelamento.status);
  assert.equal(pedidoAposCancelamento.pagamentoStatus, pedidoAntesCancelamento.pagamentoStatus);
  assert.equal(pedidoAposCancelamento.atualizadoEm.getTime(), pedidoAntesCancelamento.atualizadoEm.getTime());
  assert.equal((await prisma.emissaoFiscalLoja.findUniqueOrThrow({ where: { id: preparadaNfe.id } })).xmlAutorizado, autorizadaAntesCancelamento.xmlAutorizado);
  assert.equal(await prisma.comandoEstoque.count({ where: { tenantId: loja.id } }), comandosAntes);
  assert.equal(erros.length, 0, erros.join("; "));
  console.log(JSON.stringify({ fiscalEntryBrowser: "pass", duplicateEntry: "prevented", tenantIsolation: "pass" }));
} finally {
  await browser.close();
  server.kill("SIGTERM");
  // O banco isolado é descartado no fim do job. Recibos são imutáveis,
  // inclusive no QA: não tentar apagá-los nem mascarar a falha da jornada.
  await prisma.$disconnect();
}
