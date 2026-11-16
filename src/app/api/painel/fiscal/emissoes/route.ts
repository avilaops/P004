import { z } from "zod";
import { prisma } from "@/lib/db";
import { ErroApi } from "@/lib/api-resposta";
import { ErroFiscal } from "@/lib/fiscal-certificado";
import { prepararEmissao, RESUMO_EMISSAO } from "@/lib/fiscal-emissao";
import { origemFiscalPermitida } from "@/lib/fiscal-origem";
import { exigir } from "@/lib/operadores";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const headers = { "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" };
const entrada = z.object({ xml: z.string().min(1).max(1024 * 1024), pedidoId: z.string().min(1).max(100).optional() });

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
    const resultado = await prepararEmissao({ ...validado.data, tenantId: s.tenant.id, autor: s.operador?.email ?? s.tenant.loginEmail ?? "dono-da-loja" });
    return Response.json(resultado, { status: 201, headers });
  } catch (falha) {
    return Response.json({ erro: falha instanceof ErroApi || falha instanceof ErroFiscal ? falha.message : "Não foi possível preparar a NF-e." }, { status: falha instanceof ErroApi ? falha.status : 422, headers });
  }
}
