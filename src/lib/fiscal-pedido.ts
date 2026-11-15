import { Prisma } from "@prisma/client";
import { prisma } from "./db";
import { ErroApi } from "./api-resposta";
import { fiscalErpConfigurado } from "./erp-fiscal";
import { conferirPedidoFiscal, type EnderecoConferenciaFiscal } from "./fiscal-pedido-contrato";

function enderecoComercial(valor: Prisma.JsonValue | null): EnderecoConferenciaFiscal | null {
  if (!valor || typeof valor !== "object" || Array.isArray(valor)) return null;
  const texto = (campo: string) => typeof valor[campo] === "string" ? (valor[campo] as string).trim().slice(0, 256) : "";
  return { logradouro: texto("logradouro"), numero: texto("numero"), bairro: texto("bairro"), cidade: texto("cidade"), uf: texto("uf"), cep: texto("cep"), complemento: texto("complemento") || null };
}

/** Snapshot consistente, sem chamadas externas ou alteração de dados. */
export async function prepararFiscalDoPedido(tenantId: string, pedidoId: string) {
  return prisma.$transaction(async tx => {
    const pedido = await tx.pedido.findFirst({ where: { tenantId, id: pedidoId }, select: {
      id: true, numero: true, referencia: true, status: true, atualizadoEm: true,
      clienteNome: true, clienteDocumento: true, entrega: true, meioPagamento: true, pagamentoStatus: true,
      freteNome: true, freteCentavos: true, subtotalCentavos: true, descontoCentavos: true, totalCentavos: true,
      itens: { orderBy: { id: "asc" }, select: { id: true, produtoId: true, varianteId: true, nome: true, sku: true, quantidade: true, precoUnitarioCentavos: true, quantidadeCancelada: true, quantidadeDevolvida: true } },
    } });
    if (!pedido) throw new ErroApi("nao_encontrado", "Pedido não encontrado nesta loja.");
    const loja = await tx.tenant.findUniqueOrThrow({ where: { id: tenantId }, select: { nome: true, razaoSocial: true, cnpj: true } });
    const produtos = await tx.produto.findMany({ where: { tenantId, id: { in: pedido.itens.flatMap(i => i.produtoId ? [i.produtoId] : []) } }, select: { id: true, ncm: true, cest: true } });
    const variantes = await tx.variante.findMany({ where: { tenantId, id: { in: pedido.itens.flatMap(i => i.varianteId ? [i.varianteId] : []) } }, select: { id: true, produtoId: true } });
    const porProduto = new Map(produtos.map(p => [p.id, p]));
    const porVariante = new Map(variantes.map(v => [v.id, v]));
    return conferirPedidoFiscal({
      pedido: { id: pedido.id, numero: pedido.numero, referencia: pedido.referencia, status: pedido.status, atualizadoEm: pedido.atualizadoEm.toISOString() },
      emitente: { nome: loja.razaoSocial || loja.nome, documento: loja.cnpj ?? "" },
      destinatario: { nome: pedido.clienteNome, documento: pedido.clienteDocumento, endereco: enderecoComercial(pedido.entrega) },
      pagamento: { meio: pedido.meioPagamento, situacao: pedido.pagamentoStatus },
      frete: { nome: pedido.freteNome, valorCentavos: pedido.freteCentavos },
      totais: { subtotalCentavos: pedido.subtotalCentavos, descontoCentavos: pedido.descontoCentavos, totalCentavos: pedido.totalCentavos },
      itens: pedido.itens.map(item => {
        const produto = item.produtoId ? porProduto.get(item.produtoId) : null;
        const variante = item.varianteId ? porVariante.get(item.varianteId) : null;
        return { id: item.id, produtoId: produto?.id ?? null, varianteId: variante?.produtoId === produto?.id ? variante?.id ?? null : null, nome: item.nome, sku: item.sku, quantidade: item.quantidade, precoUnitarioCentavos: item.precoUnitarioCentavos, quantidadeCancelada: item.quantidadeCancelada, quantidadeDevolvida: item.quantidadeDevolvida, classificacaoAtual: produto ? { ncm: produto.ncm, cest: produto.cest } : null };
      }),
    }, { consultaErpConfigurada: fiscalErpConfigurado(loja.cnpj ?? "") });
  }, { isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead, timeout: 10_000 });
}
