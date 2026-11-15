import { ErroApi } from "@/lib/api-resposta";
import { historicoCustosFiscais } from "@/lib/fiscal-entrada";
import { exigir } from "@/lib/operadores";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const headers = { "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" };

export async function GET(request: Request) {
  const { s, erro } = await exigir("fiscal");
  if (erro) return erro;
  const varianteId = new URL(request.url).searchParams.get("varianteId") ?? "";
  if (!varianteId || varianteId.length > 100) return Response.json({ erro: "Informe uma variante válida." }, { status: 400, headers });
  try { return Response.json({ itens: await historicoCustosFiscais(s.tenant.id, varianteId) }, { headers }); }
  catch (erro) {
    if (erro instanceof ErroApi) return Response.json({ erro: erro.message }, { status: erro.status, headers });
    return Response.json({ erro: "Não foi possível consultar o histórico de custos." }, { status: 500, headers });
  }
}
