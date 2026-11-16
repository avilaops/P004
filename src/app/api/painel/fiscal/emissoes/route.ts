import { z } from "zod";
import { createHash } from "node:crypto";
import { prisma } from "@/lib/db";
import { ErroApi } from "@/lib/api-resposta";
import { ErroFiscal } from "@/lib/fiscal-certificado";
import { prepararEmissao, RESUMO_EMISSAO } from "@/lib/fiscal-emissao";
import { origemFiscalPermitida } from "@/lib/fiscal-origem";
import { exigir } from "@/lib/operadores";
import { prepararFiscalDoPedido } from "@/lib/fiscal-pedido";
import { montarNfeVenda, OpcoesVendaSchema } from "@/lib/fiscal-emissao-venda";
import { LimitadorPorJanela } from "@/lib/api-limite";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const headers = { "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" };
const limitador = new LimitadorPorJanela();
const substituir = z.object({ id: z.string().min(1).max(100), resumoHash: z.string().regex(/^[a-f0-9]{64}$/) }).optional();
const entrada = z.union([
  z.object({ xml: z.string().min(1).max(1024 * 1024), pedidoId: z.string().min(1).max(100).optional(), substituir }),
  z.object({ pedidoId: z.string().min(1).max(100), venda: OpcoesVendaSchema, substituir }),
]);

export async function GET(request: Request) {
  const { s, erro } = await exigir("fiscal");
  if (erro) { Object.entries(headers).forEach(([k, v]) => erro.headers.set(k, v)); return erro; }
  const pedidoId = new URL(request.url).searchParams.get("pedidoId");
  const emissoes = await prisma.emissaoFiscalLoja.findMany({ where: { tenantId: s.tenant.id, ...(pedidoId ? { pedidoId } : {}) }, select: RESUMO_EMISSAO, orderBy: { criadoEm: "desc" }, take: 50 });
  return Response.json({ emissoes }, { headers });
}

export async function POST(request: Request) {
  const { s, erro } = await exigir("fiscal");
  if (erro) { Object.entries(headers).forEach(([k, v]) => erro.headers.set(k, v)); return erro; }
  if (!origemFiscalPermitida(request)) return Response.json({ erro: "Origem da ação fiscal recusada." }, { status: 403, headers });
  if (!limitador.consumir(`${s.tenant.id}:preparacao-nfe`, 10).permitido) return Response.json({ erro: "Aguarde antes de preparar outra NF-e." }, { status: 429, headers });
  try {
    const reader = request.body?.getReader();
    if (!reader) throw new ErroFiscal("Envie o rascunho da NF-e.");
    const partes: Uint8Array[] = []; let tamanho = 0;
    try {
      while (true) {
        const { value, done } = await reader.read(); if (done) break;
        tamanho += value.byteLength;
        if (tamanho > 2 * 1024 * 1024) { await reader.cancel(); throw new ErroFiscal("Rascunho fiscal acima do limite."); }
        partes.push(value);
      }
    } finally { reader.releaseLock(); }
    const validado = entrada.safeParse(JSON.parse(Buffer.concat(partes).toString("utf8")));
    if (!validado.success) throw new ErroFiscal("Confira o rascunho e o pedido informado.");
    let preparacao: { xml: string; pedidoId?: string; intencaoHash?: string; substituir?: { id: string; resumoHash: string } };
    if ("venda" in validado.data) {
      const { venda, pedidoId } = validado.data;
      const conferencia = await prepararFiscalDoPedido(s.tenant.id, pedidoId);
      const emitente = await prisma.tenant.findUniqueOrThrow({ where: { id: s.tenant.id }, select: { endereco: true } });
      const xml = montarNfeVenda(conferencia, emitente.endereco, venda);
      const intencaoHash = createHash("sha256").update(JSON.stringify({ dados: conferencia.resumoHash, endereco: emitente.endereco, venda })).digest("hex");
      preparacao = { xml, pedidoId, intencaoHash, substituir: validado.data.substituir };
    } else { preparacao = validado.data; }
    const resultado = await prepararEmissao({ ...preparacao, tenantId: s.tenant.id, autor: s.operador?.email ?? s.tenant.loginEmail ?? "dono-da-loja" });
    return Response.json(resultado, { status: 201, headers });
  } catch (falha) {
    return Response.json({ erro: falha instanceof ErroApi || falha instanceof ErroFiscal ? falha.message : "Não foi possível preparar a NF-e." }, { status: falha instanceof ErroApi ? falha.status : 422, headers });
  }
}
