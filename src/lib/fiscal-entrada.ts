import { createHash, randomUUID } from "node:crypto";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "./db";
import { ErroApi } from "./api-resposta";
import { fiscalErpConfigurado } from "./erp-fiscal";
import { eventoCancelaNota, interpretarNotaEntrada, normalizarDocumentoEntrada, type NotaEntrada, type ItemNotaEntrada } from "./fiscal-entrada-xml";
import { movimentarEstoqueMultilocalNaTransacao, type ReciboMovimento } from "./estoque-multilocal";
import { travarProduto, salvarProdutoNoCatalogoNaTransacao } from "./catalogo-escrita";

type Tx = Prisma.TransactionClient;
export type ReciboEntradaFiscal = { tipo: "ENTRADA_NFE"; id: string; chave: string; numero: string; documentoId: string; confirmadoEm: string; ator: string; local: string; fornecedor?: { id: string; documento: string; nome: string }; itens: Array<{ numero: number; varianteId: string; quantidade: number; descricaoFiscal: string; unidadeFiscal: string; quantidadeFiscal: string; custoTotalCentavos?: number; fiscal?: ItemNotaEntrada; movimento: ReciboMovimento }> };
export type ConferenciaEntradaFiscal = { documentoId: string; modo: "LOCAL" | "ERP"; erpUrl: string | null; nota: NotaEntrada | null; recibo: ReciboEntradaFiscal | null; impedimento: string | null };
const ORIGEM = "fiscal:entrada-nfe";
const comandoSchema = z.object({
  confirmacao: z.literal(true), local: z.string().trim().min(1).max(80).regex(/^[a-z0-9][a-z0-9_-]*$/),
  confirmarFornecedor: z.literal(true).optional(),
  itens: z.array(z.object({ numero: z.number().int().min(1).max(990), varianteId: z.string().min(1).max(100), quantidade: z.number().int().min(1).max(10_000_000), custoTotalCentavos: z.number().int().min(0).max(2_147_483_647).optional() }).strict()).min(1).max(990),
}).strict().refine(c => new Set(c.itens.map(i => i.numero)).size === c.itens.length, "Item fiscal repetido.")
  .refine(c => c.confirmarFornecedor ? c.itens.every(i => i.custoTotalCentavos !== undefined) : c.itens.every(i => i.custoTotalCentavos === undefined), "Confirme fornecedor e custos de todos os itens juntos.");
const chaveDoComando = (chave: string) => `nfe-entrada:${chave}`;

async function documentoDaLoja(tx: Tx, tenantId: string, id: string) {
  const registro = await tx.documentoFiscalLoja.findFirst({ where: { id, tenantId } });
  if (!registro) throw new ErroApi("nao_encontrado", "Documento não encontrado nesta loja.");
  if (/^resNFe/.test(registro.schema) && registro.chave) {
    const completo = await tx.documentoFiscalLoja.findFirst({ where: { tenantId, chave: registro.chave, schema: { startsWith: "procNFe" } }, orderBy: { recebidoEm: "desc" } });
    if (completo) return completo;
  }
  return registro;
}

function reciboSalvo(comando: { origem: string; resultado: Prisma.JsonValue } | null): ReciboEntradaFiscal | null {
  if (!comando) return null;
  const resultado = comando.resultado as unknown as ReciboEntradaFiscal;
  if (comando.origem !== ORIGEM || resultado?.tipo !== "ENTRADA_NFE") throw new ErroApi("conflito", "A identificação desta NF-e está ocupada por outro comando de estoque.");
  return resultado;
}

async function contexto(tx: Tx, tenantId: string, id: string): Promise<ConferenciaEntradaFiscal> {
  const documento = await documentoDaLoja(tx, tenantId, id);
  const tenant = await tx.tenant.findUniqueOrThrow({ where: { id: tenantId }, select: { cnpj: true, status: true } });
  const cnpj = normalizarDocumentoEntrada(tenant.cnpj ?? "");
  const modo = fiscalErpConfigurado(cnpj) ? "ERP" as const : "LOCAL" as const;
  const painel = (process.env.ERP_APP_URL || process.env.ERP_API_URL || "").replace(/\/$/, "");
  const erpUrl = modo === "ERP" && /^https:\/\//.test(painel) ? `${painel}/fiscal?ver=recebidas` : null;
  const recibo = documento.chave ? reciboSalvo(await tx.comandoEstoque.findUnique({ where: { tenantId_chave: { tenantId, chave: chaveDoComando(documento.chave) } } })) : null;
  if (!/^procNFe/.test(documento.schema)) return { documentoId: documento.id, modo, erpUrl, nota: null, recibo, impedimento: "Esta nota contém apenas resumo. Aguarde o XML completo para conferir seus produtos." };
  const nota = interpretarNotaEntrada(documento.xml);
  if (documento.chave !== nota.chave) throw new ErroApi("conflito", "A chave do XML diverge da identificação armazenada.");
  const eventos = await tx.documentoFiscalLoja.findMany({ where: { tenantId, chave: nota.chave, OR: [{ cancelada: true }, { schema: { contains: "Evento", mode: "insensitive" } }] }, select: { xml: true, cancelada: true } });
  let impedimento: string | null = null;
  if (tenant.status !== "ATIVA") impedimento = "A loja precisa estar ativa para registrar entradas.";
  else if (modo === "ERP") impedimento = "Este CNPJ controla a entrada pelo ERP. Faça a conferência no ERP para evitar duplicidade.";
  else if (!cnpj || nota.destinatario.documento !== cnpj) impedimento = "O destinatário desta NF-e não corresponde ao CNPJ da loja.";
  else if (nota.ambiente !== "1") impedimento = "NF-e de homologação não pode movimentar o estoque real.";
  else if (documento.cancelada || eventos.some(e => e.cancelada || eventoCancelaNota(e.xml, nota.chave))) impedimento = "Esta NF-e foi cancelada. Revise o recebimento e o estoque antes de continuar.";
  return { documentoId: documento.id, modo, erpUrl, nota, recibo, impedimento };
}

/** Somente leitura: abrir documento nunca cria produto, reserva ou entrada. */
export async function prepararEntradaFiscal(tenantId: string, id: string) {
  return contexto(prisma, tenantId, id);
}

const produtoDaNotaSchema = z.object({ confirmacao: z.literal(true), numero: z.number().int().min(1).max(990), nome: z.string().trim().min(1).max(180), precoCentavos: z.number().int().min(0).max(2_147_483_647) }).strict();

/** Cadastro independente da entrada; retry do mesmo item nunca cria outro produto. */
export async function criarProdutoDaNota(tenantId: string, documentoId: string, entrada: unknown) {
  const lido = produtoDaNotaSchema.safeParse(entrada);
  if (!lido.success) throw new ErroApi("parametro_invalido", "Confirme item, nome e preço de venda em centavos para cadastrar o produto.");
  const comando = lido.data;
  const resumoHash = createHash("sha256").update(JSON.stringify(comando)).digest("hex");
  return prisma.$transaction(async tx => {
    const documento = await documentoDaLoja(tx, tenantId, documentoId);
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${JSON.stringify([tenantId, chaveDoComando(documento.chave ?? documento.id)])}, 0))`;
    const estado = await contexto(tx, tenantId, documentoId);
    if (estado.impedimento || !estado.nota) throw new ErroApi("conflito", estado.impedimento ?? "XML completo necessário.");
    const fiscal = estado.nota.itens.find(i => i.numero === comando.numero);
    if (!fiscal) throw new ErroApi("parametro_invalido", "Item não encontrado nesta NF-e.");
    const chave = estado.nota.chave;
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${JSON.stringify([tenantId, "cadastro-nfe", chave, comando.numero])}, 0))`;
    const anterior = await tx.cadastroProdutoFiscal.findUnique({ where: { tenantId_chave_numero: { tenantId, chave, numero: comando.numero } } });
    let varianteId: string;
    if (anterior) {
      if (anterior.resumoHash !== resumoHash) throw new ErroApi("conflito", "Este item já criou um produto com outros dados. Localize-o em Produtos.");
      varianteId = anterior.varianteId;
    } else {
      if (estado.recibo) throw new ErroApi("conflito", "A entrada desta nota já foi concluída. Use o cadastro de Produtos.");
      const produto = await salvarProdutoNoCatalogoNaTransacao(tx, tenantId, null, { nome: comando.nome, slug: `produto-${randomUUID()}`, precoCentavos: comando.precoCentavos, estoque: 0, ativo: true }, { origem: "fiscal:cadastro-confirmado" });
      const variante = await tx.variante.findFirstOrThrow({ where: { tenantId, produtoId: produto.id, padrao: true } });
      varianteId = variante.id;
      await tx.cadastroProdutoFiscal.create({ data: { tenantId, chave, numero: comando.numero, resumoHash, varianteId } });
    }
    const variante = await tx.variante.findFirstOrThrow({ where: { tenantId, id: varianteId }, include: { produto: { select: { nome: true, ativo: true } } } });
    return { id: variante.id, produtoId: variante.produtoId, nome: variante.produto.nome, variacao: variante.nome, sku: variante.sku, gtin: variante.gtin, ativo: variante.produto.ativo };
  }, { timeout: 20_000 });
}

export async function confirmarEntradaFiscal(tenantId: string, id: string, entrada: unknown, ator: string): Promise<ReciboEntradaFiscal> {
  const lido = comandoSchema.safeParse(entrada);
  if (!lido.success) throw new ErroApi("parametro_invalido", "Confirme os produtos, unidades inteiras e local de estoque de todos os itens.");
  const comando = { local: lido.data.local, itens: [...lido.data.itens].sort((a, b) => a.numero - b.numero), ...(lido.data.confirmarFornecedor ? { confirmarFornecedor: true } : {}) };
  const resumoHash = createHash("sha256").update(JSON.stringify(comando)).digest("hex");
  return prisma.$transaction(async tx => {
    const documento = await documentoDaLoja(tx, tenantId, id);
    if (!documento.chave || !/^\d{44}$/.test(documento.chave)) throw new ErroApi("conflito", "A nota ainda não tem XML completo para entrada.");
    const chave = chaveDoComando(documento.chave);
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${JSON.stringify([tenantId, chave])}, 0))`;
    const anterior = await tx.comandoEstoque.findUnique({ where: { tenantId_chave: { tenantId, chave } } });
    if (anterior) {
      const recibo = reciboSalvo(anterior)!;
      if (anterior.resumoHash !== resumoHash) throw new ErroApi("conflito", "Esta NF-e já tem entrada registrada com produtos, quantidades ou local diferentes.");
      return recibo;
    }
    const estado = await contexto(tx, tenantId, documento.id);
    if (estado.impedimento || !estado.nota) throw new ErroApi("conflito", estado.impedimento ?? "XML completo necessário para entrada.");
    const nota = estado.nota;
    let fornecedor: ReciboEntradaFiscal["fornecedor"];
    if (lido.data.confirmarFornecedor) {
      if (!/^(?:\d{11}|[A-Z0-9]{12}\d{2})$/.test(nota.fornecedor.documento) || !nota.fornecedor.nome) throw new ErroApi("conflito", "Confira a identificação do fornecedor antes de registrar a entrada.");
      const cadastro = await tx.fornecedorLoja.upsert({ where: { tenantId_documento: { tenantId, documento: nota.fornecedor.documento } }, create: { tenantId, documento: nota.fornecedor.documento, nome: nota.fornecedor.nome }, update: {} });
      fornecedor = { id: cadastro.id, documento: nota.fornecedor.documento, nome: nota.fornecedor.nome };
    }
    if (comando.itens.length !== nota.itens.length || comando.itens.some(i => !nota.itens.some(n => n.numero === i.numero))) throw new ErroApi("parametro_invalido", "Confira todos os itens da nota; não há recebimento parcial nesta confirmação.");
    const ids = [...new Set(comando.itens.map(i => i.varianteId))];
    const variantes = await tx.variante.findMany({ where: { tenantId, id: { in: ids }, ativo: true, produto: { ativo: true } }, select: { id: true, produtoId: true } });
    if (variantes.length !== ids.length) throw new ErroApi("nao_encontrado", "Produto ou variante não encontrado entre os cadastros ativos desta loja.");
    const produtos = new Map(variantes.map(v => [v.id, v.produtoId]));
    for (const produtoId of [...new Set(variantes.map(v => v.produtoId))].sort()) {
      const produto = await travarProduto(tx, tenantId, produtoId);
      if (!produto.ativo) throw new ErroApi("conflito", "Um produto foi desativado durante a conferência. Revise os itens ativos.");
    }
    const comparar = (a: string, b: string) => a < b ? -1 : a > b ? 1 : 0;
    const ordenados = [...comando.itens].sort((a, b) => comparar(produtos.get(a.varianteId)!, produtos.get(b.varianteId)!) || comparar(a.varianteId, b.varianteId) || a.numero - b.numero);
    const itens: ReciboEntradaFiscal["itens"] = [];
    for (const item of ordenados) {
      const chaveItem = `nfe-item:${nota.chave}:${item.numero}`;
      const ocupado = await tx.comandoEstoque.findUnique({ where: { tenantId_chave: { tenantId, chave: chaveItem } } });
      if (ocupado) throw new ErroApi("conflito", "Um item desta NF-e já possui comando de estoque; confira o histórico antes de continuar.");
      const movimento = await movimentarEstoqueMultilocalNaTransacao(tx, tenantId, chaveItem, { tipo: "entrada", varianteId: item.varianteId, local: comando.local, quantidade: item.quantidade, motivo: `Entrada NF-e ${nota.numero} item${item.numero} · ${nota.chave}` }, ORIGEM);
      const fiscal = nota.itens.find(i => i.numero === item.numero)!;
      itens.push({ ...item, descricaoFiscal: fiscal.descricao, unidadeFiscal: fiscal.unidade, quantidadeFiscal: fiscal.quantidade, ...(fornecedor ? { fiscal } : {}), movimento });
    }
    itens.sort((a, b) => a.numero - b.numero);
    const recibo: ReciboEntradaFiscal = { tipo: "ENTRADA_NFE", id: randomUUID(), chave: nota.chave, numero: nota.numero, documentoId: documento.id, confirmadoEm: new Date().toISOString(), ator: ator.slice(0, 120), local: comando.local, ...(fornecedor ? { fornecedor } : {}), itens };
    await tx.comandoEstoque.create({ data: { id: recibo.id, tenantId, chave, resumoHash, origem: ORIGEM, resultado: recibo as unknown as Prisma.InputJsonValue } });
    return recibo;
  }, { timeout: 30_000 });
}

/** Histórico derivado dos recibos imutáveis; não depende do custo atual do catálogo. */
export async function historicoCustosFiscais(tenantId: string, varianteId: string) {
  if (!await prisma.variante.findFirst({ where: { tenantId, id: varianteId }, select: { id: true } })) throw new ErroApi("nao_encontrado", "Variante não encontrada nesta loja.");
  const registros = await prisma.comandoEstoque.findMany({ where: { tenantId, origem: ORIGEM, resultado: { path: ["itens"], array_contains: [{ varianteId }] } }, orderBy: [{ criadoEm: "desc" }, { id: "desc" }], take: 20, select: { resultado: true } });
  return registros.flatMap(r => {
    const recibo = r.resultado as unknown as ReciboEntradaFiscal;
    return recibo.itens.filter(i => i.varianteId === varianteId && i.custoTotalCentavos !== undefined).map(i => ({ reciboId: recibo.id, numero: recibo.numero, chave: recibo.chave, confirmadoEm: recibo.confirmadoEm, fornecedor: recibo.fornecedor ?? null, quantidade: i.quantidade, custoTotalCentavos: i.custoTotalCentavos!, item: i.numero }));
  });
}
