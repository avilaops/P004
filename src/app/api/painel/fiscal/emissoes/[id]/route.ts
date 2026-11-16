import { z } from "zod";
import { prisma } from "@/lib/db";
import { ErroApi } from "@/lib/api-resposta";
import { ErroFiscal } from "@/lib/fiscal-certificado";
import { consultarNfe, emitirNfe } from "@/lib/fiscal-emissao";
import { origemFiscalPermitida } from "@/lib/fiscal-origem";
import { gerarDanfeCompartilhado } from "@/lib/fiscal-danfe-compartilhado";
import { LimitadorPorJanela } from "@/lib/api-limite";
import { exigir } from "@/lib/operadores";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const headers = { "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" };
const limitador = new LimitadorPorJanela();
const entrada = z.discriminatedUnion("acao", [z.object({ acao: z.literal("emitir"), confirmacao: z.literal(true), ambiente: z.enum(["1", "2"]), resumoHash: z.string().regex(/^[a-f0-9]{64}$/) }), z.object({ acao: z.literal("consultar") })]);
type Contexto = { params: Promise<{ id: string }> };

export async function POST(request: Request, contexto: Contexto) {
  const { s, erro } = await exigir("fiscal");
  if (erro) { Object.entries(headers).forEach(([k, v]) => erro.headers.set(k, v)); return erro; }
  if (!origemFiscalPermitida(request)) return Response.json({ erro: "Origem da ação fiscal recusada." }, { status: 403, headers });
  if (!limitador.consumir(`${s.tenant.id}:emissao`, 10).permitido) return Response.json({ erro: "Aguarde antes de consultar ou emitir novamente." }, { status: 429, headers });
  try {
    const corpo = await request.text();
    if (Buffer.byteLength(corpo) > 4096) throw new ErroFiscal("Confirmação fiscal inválida.");
    const validado = entrada.safeParse(JSON.parse(corpo));
    if (!validado.success) throw new ErroFiscal("Confirme o documento e o ambiente antes de emitir.");
    const { id } = await contexto.params;
    const resultado = validado.data.acao === "emitir" ? await emitirNfe({ tenantId: s.tenant.id, id, ...validado.data }) : await consultarNfe(s.tenant.id, id);
    return Response.json(resultado, { headers });
  } catch (falha) {
    return Response.json({ erro: falha instanceof ErroApi || falha instanceof ErroFiscal ? falha.message : "Não foi possível confirmar a situação na SEFAZ. Consulte novamente, sem reenviar." }, { status: falha instanceof ErroApi ? falha.status : 422, headers });
  }
}

export async function GET(request: Request, contexto: Contexto) {
  const { s, erro } = await exigir("fiscal");
  if (erro) { Object.entries(headers).forEach(([k, v]) => erro.headers.set(k, v)); return erro; }
  const { id } = await contexto.params;
  const doc = await prisma.emissaoFiscalLoja.findFirst({ where: { tenantId: s.tenant.id, id }, select: { chave: true, xmlAssinado: true, xmlAutorizado: true, status: true } });
  if (!doc) return Response.json({ erro: "Emissão não encontrada." }, { status: 404, headers });
  const formato = new URL(request.url).searchParams.get("formato");
  if (formato === "rascunho") return new Response(doc.xmlAssinado, { headers: { ...headers, "Content-Type": "application/xml; charset=utf-8", "Content-Disposition": `attachment; filename="rascunho-${doc.chave}.xml"` } });
  if (!doc.xmlAutorizado) return Response.json({ erro: "XML autorizado ainda não disponível. Consulte a situação da NF-e." }, { status: 409, headers });
  if (formato === "xml") return new Response(doc.xmlAutorizado, { headers: { ...headers, "Content-Type": "application/xml; charset=utf-8", "Content-Disposition": `attachment; filename="nfe-${doc.chave}.xml"` } });
  if (formato !== "pdf" || doc.status !== "AUTORIZADA") return Response.json({ erro: "DANFE disponível somente para NF-e autorizada." }, { status: 409, headers });
  try {
    const pdf = await gerarDanfeCompartilhado(doc.xmlAutorizado);
    if (!pdf) throw new Error("Gerador indisponível");
    return new Response(new Uint8Array(pdf), { headers: { ...headers, "Content-Type": "application/pdf", "Content-Disposition": `attachment; filename="danfe-${doc.chave}.pdf"` } });
  } catch { return Response.json({ erro: "DANFE indisponível no momento. O XML autorizado continua disponível." }, { status: 503, headers }); }
}
