import { createHash } from "node:crypto";
import { Prisma } from "@prisma/client";
import { prisma } from "./db";
import { ErroApi } from "./api-resposta";
import { credencialAssinatura, ErroFiscal } from "./fiscal-certificado";
import { certificadoEmissao, enviarNfe, RESUMO_EMISSAO } from "./fiscal-emissao";
import { assinarEventoNfe, NFE_NS } from "./fiscal-emissao-xml";
import { envelopeCancelamento, justificativaCancelamento, lerRetornoCancelamento, montarCancelamentoNfe } from "./fiscal-cancelamento-xml";

const RESUMO_CANCELAMENTO = { id: true, emissaoId: true, anteriorId: true, justificativa: true, resumoHash: true, status: true, codigo: true, motivo: true, protocolo: true, criadoEm: true, concluidoEm: true } as const;
export async function obterCancelamentoNfe(tenantId: string, emissaoId: string) {
  const [emissao, cancelamento, historico] = await prisma.$transaction([
    prisma.emissaoFiscalLoja.findFirst({ where: { id: emissaoId, tenantId }, select: RESUMO_EMISSAO }),
    prisma.cancelamentoEmissaoFiscalLoja.findFirst({ where: { emissaoId, tenantId, status: { not: "SUBSTITUIDA" } }, select: RESUMO_CANCELAMENTO }),
    prisma.cancelamentoEmissaoFiscalLoja.findMany({ where: { emissaoId, tenantId }, select: RESUMO_CANCELAMENTO, orderBy: [{ criadoEm: "desc" }, { id: "desc" }], take: 10 }),
  ], { isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead });
  if (!emissao) throw new ErroApi("nao_encontrado", "Emissão não encontrada nesta loja.");
  return { emissao, cancelamento, historico };
}

export async function cancelarNfe(dados: {
  tenantId: string; emissaoId: string; ambiente: string; resumoHash: string;
  justificativa: string; confirmacao: boolean; autor: string; anterior?: { id: string; resumoHash: string };
}, enviar: typeof enviarNfe = enviarNfe) {
  if (dados.confirmacao !== true) throw new ErroFiscal("Confirme explicitamente o cancelamento fiscal.");
  const justificativa = justificativaCancelamento(dados.justificativa);
  const doc = await prisma.emissaoFiscalLoja.findFirst({ where: { id: dados.emissaoId, tenantId: dados.tenantId }, select: { ...RESUMO_EMISSAO, cnpj: true, uf: true } });
  if (!doc) throw new ErroApi("nao_encontrado", "Emissão não encontrada nesta loja.");
  if (doc.resumoHash !== dados.resumoHash || doc.ambiente !== dados.ambiente) throw new ErroApi("conflito", "Confira a NF-e e o ambiente antes de cancelar.");
  const intencaoHash = createHash("sha256").update(JSON.stringify({ emissaoId: doc.id, documentoHash: doc.resumoHash, protocolo: doc.protocolo, justificativa, anterior: dados.anterior ?? null })).digest("hex");
  const ativo = { tenantId: dados.tenantId, emissaoId: doc.id, status: { not: "SUBSTITUIDA" } };
  const existente = await prisma.cancelamentoEmissaoFiscalLoja.findFirst({ where: ativo });
  if (existente?.intencaoHash === intencaoHash && existente.status !== "PREPARADA") return obterCancelamentoNfe(dados.tenantId, doc.id);
  if (doc.status !== "AUTORIZADA" || !doc.protocolo) throw new ErroApi("conflito", "O cancelamento exige NF-e autorizada e seu protocolo original.");
  if (existente && existente.intencaoHash !== intencaoHash && (existente.status !== "REJEITADA" || existente.id !== dados.anterior?.id || existente.resumoHash !== dados.anterior?.resumoHash)) throw new ErroApi("conflito", "Já existe uma intenção de cancelamento. Consulte a situação antes de repetir ou revisar uma rejeição.");
  const fiscal = await certificadoEmissao(dados.tenantId, doc.cnpj);
  try {
    if (fiscal.uf !== doc.uf) throw new ErroFiscal("A UF do cadastro fiscal mudou. Confira o emitente antes de cancelar.");
    const evento = montarCancelamentoNfe({ chave: doc.chave, cnpj: doc.cnpj, uf: doc.uf, ambiente: doc.ambiente, protocolo: doc.protocolo, justificativa, data: new Date() });
    const chave = credencialAssinatura(fiscal.pfx, fiscal.senha);
    const assinatura = assinarEventoNfe(evento.xml, chave.key, chave.cert);
    const lote = String(Date.now()).slice(-15);
    const reserva = await prisma.$transaction(async tx => {
      // Ordem de lock compartilhada com a consulta: documento antes do evento.
      const [atual] = await tx.$queryRaw<Array<{ status: string; protocolo: string | null }>>(Prisma.sql`SELECT "status", "protocolo" FROM "EmissaoFiscalLoja" WHERE "id" = ${doc.id} AND "tenantId" = ${dados.tenantId} FOR UPDATE`);
      const corrente = await tx.cancelamentoEmissaoFiscalLoja.findFirst({ where: ativo });
      if (corrente?.intencaoHash === intencaoHash && corrente.status !== "PREPARADA") return { registro: corrente, transmitir: false };
      if (!atual || atual.status !== "AUTORIZADA" || atual.protocolo !== doc.protocolo) throw new ErroApi("conflito", "A situação da NF-e mudou. Consulte antes de cancelar.");
      if (corrente?.intencaoHash === intencaoHash) {
        const claim = await tx.cancelamentoEmissaoFiscalLoja.updateMany({ where: { id: corrente.id, tenantId: dados.tenantId, status: "PREPARADA" }, data: { status: "ENVIANDO", enviadoEm: new Date() } });
        return { registro: corrente, transmitir: claim.count === 1 };
      }
      if (corrente) {
        if (corrente.status !== "REJEITADA" || corrente.id !== dados.anterior?.id || corrente.resumoHash !== dados.anterior?.resumoHash) throw new ErroApi("conflito", "A intenção anterior mudou ou ainda está em conferência.");
        await tx.cancelamentoEmissaoFiscalLoja.update({ where: { id: corrente.id }, data: { status: "SUBSTITUIDA" } });
      } else if (dados.anterior) throw new ErroApi("conflito", "A tentativa anterior não pertence a este cancelamento.");
      const registro = await tx.cancelamentoEmissaoFiscalLoja.create({ data: { tenantId: dados.tenantId, emissaoId: doc.id, anteriorId: corrente?.id, intencaoHash, resumoHash: assinatura.resumoHash, justificativa, autor: dados.autor, lote, xmlAssinado: assinatura.xmlAssinado, status: "ENVIANDO", enviadoEm: new Date() } });
      return { registro, transmitir: true };
    });
    if (!reserva.transmitir) return obterCancelamentoNfe(dados.tenantId, doc.id);
    let resposta: string | undefined;
    try {
      resposta = await enviar({ uf: doc.uf, ambiente: doc.ambiente, operacao: "cancelar", pfx: fiscal.pfx, senha: fiscal.senha, corpo: envelopeCancelamento(reserva.registro.xmlAssinado, reserva.registro.lote) });
      const retorno = lerRetornoCancelamento(resposta, doc);
      const xmlProcessado = retorno.xmlRetornoEvento ? `<procEventoNFe xmlns="${NFE_NS}" versao="1.00">${reserva.registro.xmlAssinado}${retorno.xmlRetornoEvento}</procEventoNFe>` : undefined;
      await prisma.$transaction(async tx => {
        if (retorno.status === "ACEITA") await tx.emissaoFiscalLoja.updateMany({ where: { id: doc.id, tenantId: dados.tenantId, status: { in: ["AUTORIZADA", "CANCELADA"] } }, data: { status: "CANCELADA", codigo: null, motivo: "Cancelamento registrado na SEFAZ." } });
        await tx.cancelamentoEmissaoFiscalLoja.updateMany({ where: { id: reserva.registro.id, tenantId: dados.tenantId, status: { in: retorno.status === "ACEITA" ? ["ENVIANDO", "PENDENTE_CONFERENCIA", "CONFIRMADA_CONSULTA"] : ["ENVIANDO", "PENDENTE_CONFERENCIA"] } }, data: { status: retorno.status, codigo: retorno.codigo, motivo: retorno.motivo, protocolo: retorno.protocolo, xmlResposta: resposta, ...(xmlProcessado ? { xmlProcessado } : {}), ...(retorno.status !== "PENDENTE_CONFERENCIA" ? { concluidoEm: new Date() } : {}) } });
      });
    } catch {
      await prisma.cancelamentoEmissaoFiscalLoja.updateMany({ where: { id: reserva.registro.id, tenantId: dados.tenantId, status: "ENVIANDO" }, data: { status: "PENDENTE_CONFERENCIA", motivo: "Não foi possível confirmar o cancelamento. Consulte a situação na SEFAZ antes de qualquer nova tentativa.", ...(resposta ? { xmlResposta: resposta } : {}) } });
    }
    return await obterCancelamentoNfe(dados.tenantId, doc.id);
  } finally { fiscal.pfx.fill(0); }
}
