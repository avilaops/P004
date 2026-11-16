import { z } from "zod";
import { prisma } from "@/lib/db";
import { ErroApi } from "@/lib/api-resposta";
import { ErroFiscal } from "@/lib/fiscal-certificado";
import { cancelarNfe, obterCancelamentoNfe } from "@/lib/fiscal-cancelamento";
import { origemFiscalPermitida } from "@/lib/fiscal-origem";
import { LimitadorPorJanela } from "@/lib/api-limite";
import { exigir } from "@/lib/operadores";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const headers = { "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" };
const limitador = new LimitadorPorJanela();
const entrada = z.object({ confirmacao: z.literal(true), ambiente: z.enum(["1", "2"]), resumoHash: z.string().regex(/^[a-f0-9]{64}$/), justificativa: z.string().min(15).max(255), anterior: z.object({ id: z.string().min(1).max(100), resumoHash: z.string().regex(/^[a-f0-9]{64}$/) }).optional() });
type Contexto = { params: Promise<{ id: string }> };
function falha(erro: unknown) {
  return Response.json({ erro: erro instanceof ErroApi || erro instanceof ErroFiscal ? erro.message : "Não foi possível confirmar o cancelamento. Consulte a situação antes de repetir." }, { status: erro instanceof ErroApi ? erro.status : 422, headers });
}
export async function GET(request: Request, contexto: Contexto) {
  const { s, erro } = await exigir("fiscal");
  if (erro) { Object.entries(headers).forEach(([k, v]) => erro.headers.set(k, v)); return erro; }
  const { id } = await contexto.params;
  try {
    if (new URL(request.url).searchParams.get("formato") === "xml") {
      const cancelamento = await prisma.cancelamentoEmissaoFiscalLoja.findFirst({ where: { tenantId: s.tenant.id, emissaoId: id, status: "ACEITA" }, select: { xmlProcessado: true, emissao: { select: { chave: true } } } });
      if (!cancelamento?.xmlProcessado) {
        await obterCancelamentoNfe(s.tenant.id, id);
        return Response.json({ erro: "Comprovante de evento ainda não disponível. A consulta da situação não substitui o protocolo do evento." }, { status: 409, headers });
      }
      return new Response(cancelamento.xmlProcessado, { headers: { ...headers, "Content-Type": "application/xml; charset=utf-8", "Content-Disposition": `attachment; filename="cancelamento-${cancelamento.emissao.chave}.xml"` } });
    }
    return Response.json(await obterCancelamentoNfe(s.tenant.id, id), { headers });
  } catch (erro) { return falha(erro); }
}
export async function POST(request: Request, contexto: Contexto) {
  const { s, erro } = await exigir("fiscal");
  if (erro) { Object.entries(headers).forEach(([k, v]) => erro.headers.set(k, v)); return erro; }
  if (!origemFiscalPermitida(request)) return Response.json({ erro: "Origem da ação fiscal recusada." }, { status: 403, headers });
  if (!limitador.consumir(`${s.tenant.id}:cancelamento-nfe`, 5).permitido) return Response.json({ erro: "Aguarde antes de solicitar outro cancelamento." }, { status: 429, headers });
  try {
    const texto = await request.text();
    if (Buffer.byteLength(texto) > 4096) throw new ErroFiscal("Confirmação de cancelamento inválida.");
    const corpo = entrada.safeParse(JSON.parse(texto));
    if (!corpo.success) throw new ErroFiscal("Confira justificativa, documento, ambiente e confirmação do cancelamento.");
    const { id } = await contexto.params;
    return Response.json(await cancelarNfe({ ...corpo.data, emissaoId: id, tenantId: s.tenant.id, autor: s.operador?.email ?? s.tenant.loginEmail ?? "dono-da-loja" }), { headers });
  } catch (erro) { return falha(erro); }
}
