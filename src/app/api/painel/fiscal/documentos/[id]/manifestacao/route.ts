import { ErroFiscal } from "@/lib/fiscal-certificado";
import { z } from "zod";
import { cabecalhosDoLimite, LimitadorPorJanela } from "@/lib/api-limite";
import { manifestarDocumento } from "@/lib/fiscal-manifestacao";
import { origemFiscalPermitida } from "@/lib/fiscal-origem";
import { exigir } from "@/lib/operadores";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const limitador = new LimitadorPorJanela();
const entrada = z.object({
  tipo: z.enum(["CIENCIA", "CONFIRMACAO", "DESCONHECIMENTO", "NAO_REALIZADA"]),
  justificativa: z.string().max(2000).nullish(),
  confirmacao: z.literal(true),
});
const privados = { "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" };

export async function POST(request: Request, contexto: { params: Promise<{ id: string }> }) {
  const { s, erro } = await exigir("fiscal");
  if (erro) {
    for (const [nome, valor] of Object.entries(privados)) erro.headers.set(nome, valor);
    return erro;
  }
  const limite = limitador.consumir(`${s.tenant.id}:manifestacao`, 5);
  if (!limite.permitido) return Response.json({ erro: "Aguarde antes de enviar outra manifestação fiscal." }, { status: 429, headers: { ...privados, ...cabecalhosDoLimite(limite), "Retry-After": String(limite.reiniciaEm) } });
  if (!origemFiscalPermitida(request)) return Response.json({ erro: "Origem da ação fiscal recusada." }, { status: 403, headers: privados });
  try {
    const validado = entrada.safeParse(await request.json());
    if (!validado.success) {
      throw new ErroFiscal("Confirme explicitamente a manifestação fiscal escolhida.");
    }
    const corpo = validado.data;
    const { id } = await contexto.params;
    const resultado = await manifestarDocumento({
      tenantId: s.tenant.id,
      documentoId: id,
      tipo: corpo.tipo,
      justificativa: corpo.justificativa,
      autor: s.operador?.email ?? s.tenant.loginEmail ?? "dono-da-loja",
    });
    return Response.json({
      status: resultado.status,
      codigo: resultado.codigoRetorno,
      motivo: resultado.motivoRetorno,
      protocolo: resultado.protocolo,
      aceita: resultado.status === "ACEITA",
    }, { headers: privados });
  } catch (falha) {
    const mensagem = falha instanceof ErroFiscal ? falha.message : "Não foi possível concluir a manifestação fiscal.";
    return Response.json({ erro: mensagem }, { status: 422, headers: privados });
  }
}
