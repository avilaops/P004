import { ErroApi } from "@/lib/api-resposta";
import { prepararFiscalDoPedido } from "@/lib/fiscal-pedido";
import { exigir, permite } from "@/lib/operadores";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const headers = { "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" };

export async function GET(_request: Request, contexto: { params: Promise<{ id: string }> }) {
  const { s, erro } = await exigir("fiscal");
  if (erro) {
    for (const [nome, valor] of Object.entries(headers)) erro.headers.set(nome, valor);
    return erro;
  }
  if (!permite(s.papel, "pedidos")) return Response.json({ erro: "Sem permissão para consultar pedidos." }, { status: 403, headers });
  const { id } = await contexto.params;
  if (!id || id.length > 100) return Response.json({ erro: "Informe um pedido válido." }, { status: 400, headers });
  try { return Response.json(await prepararFiscalDoPedido(s.tenant.id, id), { headers }); }
  catch (erro) {
    if (erro instanceof ErroApi) return Response.json({ erro: erro.message }, { status: erro.status, headers });
    return Response.json({ erro: "Não foi possível conferir os dados fiscais deste pedido. Tente atualizar a conferência." }, { status: 500, headers });
  }
}
