import { ErroApi } from "@/lib/api-resposta";
import { invalidarCatalogo } from "@/lib/catalogo-cache";
import { ErroCatalogo } from "@/lib/catalogo-oferta";
import { criarProdutoDaNota } from "@/lib/fiscal-entrada";
import { origemFiscalPermitida } from "@/lib/fiscal-origem";
import { lerComTeto, UploadInvalido } from "@/lib/limites-upload";
import { exigir, permite } from "@/lib/operadores";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const headers = { "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" };

export async function POST(request: Request, contexto: { params: Promise<{ id: string }> }) {
  const { s, erro } = await exigir("fiscal");
  if (erro) return erro;
  if (!permite(s.papel, "catalogo") || !origemFiscalPermitida(request)) return Response.json({ erro: "Origem ou permissão do cadastro recusada." }, { status: 403, headers });
  if (request.headers.get("content-type")?.split(";", 1)[0].trim() !== "application/json") return Response.json({ erro: "Envie JSON." }, { status: 415, headers });
  try {
    const corpo = JSON.parse((await lerComTeto(request, 4096)).toString("utf8")) as unknown;
    const produto = await criarProdutoDaNota(s.tenant.id, (await contexto.params).id, corpo);
    try { invalidarCatalogo(s.tenant.id); } catch { console.error("[fiscal/produtos] falha na invalidação de cache"); }
    return Response.json(produto, { headers });
  } catch (erro) {
    if (erro instanceof ErroApi || erro instanceof ErroCatalogo) return Response.json({ erro: erro.message }, { status: erro.status, headers });
    if (erro instanceof UploadInvalido) return Response.json({ erro: "Cadastro acima do limite permitido." }, { status: 413, headers });
    if (erro instanceof SyntaxError) return Response.json({ erro: "Envie JSON válido." }, { status: 400, headers });
    return Response.json({ erro: "Não foi possível cadastrar o produto. Consulte a nota antes de repetir." }, { status: 500, headers });
  }
}
