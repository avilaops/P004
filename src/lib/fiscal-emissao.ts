import { request } from "node:https";
import { Prisma, type EmissaoFiscalLoja } from "@prisma/client";
import { prisma } from "./db";
import { ErroApi } from "./api-resposta";
import { abrirCertificado, credencialAssinatura, credencialTls, ErroFiscal, lerCertificado } from "./fiscal-certificado";
import { assinarNfe, destinoNfe, envelopeConsulta, envelopeEmissao, lerRespostaNfe, NFE_NS, validarRascunhoNfe } from "./fiscal-emissao-xml";

export const RESUMO_EMISSAO = { id: true, pedidoId: true, ambiente: true, chave: true, serie: true, numero: true, resumoHash: true, status: true, codigo: true, motivo: true, protocolo: true, criadoEm: true, atualizadoEm: true } as const;
export type ResumoEmissao = Pick<EmissaoFiscalLoja, keyof typeof RESUMO_EMISSAO>;

export async function enviarNfe(dados: { uf: string; ambiente: string; operacao: "autorizar" | "consultar"; corpo: string; pfx: Buffer; senha: string }): Promise<string> {
  const servico = dados.operacao === "autorizar" ? "NFeAutorizacao4/nfeAutorizacaoLote" : "NFeConsultaProtocolo4/nfeConsultaNF";
  return new Promise<string>((resolve, reject) => {
    const req = request(destinoNfe(dados.uf, dados.ambiente, dados.operacao), {
      method: "POST", ...credencialTls(dados.pfx, dados.senha),
      headers: { "Content-Type": `application/soap+xml; charset=utf-8; action="${NFE_NS}/wsdl/${servico}"`, "Content-Length": Buffer.byteLength(dados.corpo) },
    }, (res) => {
      const partes: Buffer[] = []; let tamanho = 0;
      res.on("data", (p: Buffer) => { tamanho += p.length; if (tamanho > 1024 * 1024) req.destroy(new Error("Resposta fiscal excessiva")); else partes.push(p); });
      res.on("error", reject);
      res.on("end", () => res.statusCode === 200 ? resolve(Buffer.concat(partes).toString("utf8")) : reject(new Error("Resposta HTTP fiscal inválida")));
    });
    const prazo = setTimeout(() => req.destroy(new Error("Prazo fiscal excedido")), 30000);
    req.on("close", () => clearTimeout(prazo)); req.on("error", reject); req.end(dados.corpo);
  });
}

async function certificado(tenantId: string, cnpjEsperado?: string) {
  const fiscal = await prisma.fiscalLoja.findUnique({ where: { tenantId }, include: { tenant: { select: { cnpj: true, status: true } } } });
  if (!fiscal || fiscal.tenant.status !== "ATIVA") throw new ErroFiscal("Cadastre o certificado A1 de uma loja ativa antes de emitir.");
  const cnpj = fiscal.tenant.cnpj?.replace(/\D/g, "") ?? "";
  if (fiscal.cnpj !== cnpj || cnpjEsperado && cnpjEsperado !== cnpj) throw new ErroFiscal("O CNPJ mudou. Confira a configuração fiscal antes de continuar.");
  const aberto = abrirCertificado(fiscal.certificadoEnc);
  try { lerCertificado(aberto.pfx, aberto.senha, cnpj); }
  catch (erro) { aberto.pfx.fill(0); throw erro; }
  return { ...aberto, cnpj, uf: fiscal.uf };
}

/** Preparação apenas assina e persiste. Não faz requisição externa. */
export async function prepararEmissao(dados: { tenantId: string; pedidoId?: string; xml: string; autor: string }) {
  const fiscal = await certificado(dados.tenantId);
  try {
    const nota = validarRascunhoNfe(dados.xml, fiscal.cnpj);
    if (nota.uf !== fiscal.uf) throw new ErroFiscal("A UF do emitente diverge do cadastro fiscal.");
    const pedido = dados.pedidoId ? await prisma.pedido.findFirst({ where: { tenantId: dados.tenantId, id: dados.pedidoId }, select: { id: true, totalCentavos: true, clienteDocumento: true, status: true, atualizadoEm: true } }) : null;
    if (dados.pedidoId && !pedido) throw new ErroApi("nao_encontrado", "Pedido não encontrado nesta loja.");
    if (pedido && (pedido.status !== "PAGO" || pedido.clienteDocumento.replace(/\D/g, "") !== nota.destinatario || BigInt(nota.total.replace(".", "")) !== BigInt(pedido.totalCentavos))) throw new ErroFiscal("Confira situação, destinatário e total: a NF-e diverge do pedido pago.");
    const chave = credencialAssinatura(fiscal.pfx, fiscal.senha);
    const assinado = assinarNfe(dados.xml, chave.key, chave.cert);
    const identidade = { tenantId: dados.tenantId, ambiente: nota.ambiente, serie: nota.serie, numero: nota.numero };
    try {
      return await prisma.emissaoFiscalLoja.create({ data: { ...identidade, pedidoId: pedido?.id, pedidoAtualizadoEm: pedido?.atualizadoEm, cnpj: fiscal.cnpj, uf: nota.uf, chave: nota.chave, autor: dados.autor, ...assinado }, select: RESUMO_EMISSAO });
    } catch (erro) {
      if (!(erro instanceof Prisma.PrismaClientKnownRequestError) || erro.code !== "P2002") throw erro;
      const existente = await prisma.emissaoFiscalLoja.findUnique({ where: { tenantId_ambiente_serie_numero: identidade }, select: RESUMO_EMISSAO });
      if (!existente || existente.resumoHash !== assinado.resumoHash || existente.pedidoId !== (dados.pedidoId ?? null)) throw new ErroApi("conflito", "Série e número já reservados para outro documento. Consulte a emissão existente.");
      return existente;
    }
  } finally { fiscal.pfx.fill(0); }
}

async function documento(tenantId: string, id: string) {
  const doc = await prisma.emissaoFiscalLoja.findFirst({ where: { tenantId, id } });
  if (!doc) throw new ErroApi("nao_encontrado", "Emissão não encontrada nesta loja.");
  return doc;
}

async function registrarResposta(doc: EmissaoFiscalLoja, resposta: string) {
  const retorno = lerRespostaNfe(resposta, doc);
  const xmlAutorizado = retorno.protocoloXml ? `<nfeProc xmlns="${NFE_NS}" versao="4.00">${doc.xmlAssinado}${retorno.protocoloXml}</nfeProc>` : undefined;
  // Uma consulta sem resultado não desfaz protocolo já confirmado.
  const estados = retorno.status === "CANCELADA" ? ["ENVIANDO", "PENDENTE_CONFERENCIA", "AUTORIZADA"] : ["ENVIANDO", "PENDENTE_CONFERENCIA"];
  await prisma.emissaoFiscalLoja.updateMany({ where: { id: doc.id, tenantId: doc.tenantId, status: { in: estados } }, data: { status: retorno.status, codigo: retorno.codigo, motivo: retorno.motivo, xmlResposta: resposta, ...(retorno.protocolo ? { protocolo: retorno.protocolo } : {}), ...(xmlAutorizado ? { xmlAutorizado } : {}) } });
  return prisma.emissaoFiscalLoja.findFirstOrThrow({ where: { id: doc.id, tenantId: doc.tenantId }, select: RESUMO_EMISSAO });
}

export async function emitirNfe(dados: { tenantId: string; id: string; resumoHash: string; ambiente: string }, enviar: typeof enviarNfe = enviarNfe) {
  const doc = await documento(dados.tenantId, dados.id);
  if (doc.resumoHash !== dados.resumoHash || doc.ambiente !== dados.ambiente) throw new ErroApi("conflito", "O documento ou ambiente mudou. Confira novamente antes de emitir.");
  if (doc.status !== "PREPARADA") return prisma.emissaoFiscalLoja.findFirstOrThrow({ where: { id: doc.id, tenantId: doc.tenantId }, select: RESUMO_EMISSAO });
  const fiscal = await certificado(dados.tenantId, doc.cnpj);
  try {
    if (doc.pedidoId) {
      const pedido = await prisma.pedido.findFirst({ where: { tenantId: doc.tenantId, id: doc.pedidoId, status: "PAGO", atualizadoEm: doc.pedidoAtualizadoEm ?? undefined } });
      if (!pedido) throw new ErroApi("conflito", "O pedido mudou após a preparação. Revise a NF-e antes de emitir.");
    }
    const reserva = await prisma.emissaoFiscalLoja.updateMany({ where: { id: doc.id, tenantId: doc.tenantId, status: "PREPARADA" }, data: { status: "ENVIANDO", enviadoEm: new Date() } });
    if (!reserva.count) return prisma.emissaoFiscalLoja.findFirstOrThrow({ where: { id: doc.id, tenantId: doc.tenantId }, select: RESUMO_EMISSAO });
    try {
      const resposta = await enviar({ uf: doc.uf, ambiente: doc.ambiente, operacao: "autorizar", corpo: envelopeEmissao(doc.xmlAssinado, doc.chave), pfx: fiscal.pfx, senha: fiscal.senha });
      return await registrarResposta(doc, resposta);
    } catch {
      await prisma.emissaoFiscalLoja.updateMany({ where: { id: doc.id, status: "ENVIANDO" }, data: { status: "PENDENTE_CONFERENCIA", motivo: "Resultado ainda não confirmado. Consulte a SEFAZ por chave antes de qualquer nova emissão." } });
      return prisma.emissaoFiscalLoja.findFirstOrThrow({ where: { id: doc.id, tenantId: doc.tenantId }, select: RESUMO_EMISSAO });
    }
  } finally { fiscal.pfx.fill(0); }
}

export async function consultarNfe(tenantId: string, id: string, enviar: typeof enviarNfe = enviarNfe) {
  const doc = await documento(tenantId, id);
  if (doc.status === "PREPARADA") throw new ErroApi("conflito", "Este documento ainda não foi enviado.");
  const fiscal = await certificado(tenantId, doc.cnpj);
  try {
    const resposta = await enviar({ uf: doc.uf, ambiente: doc.ambiente, operacao: "consultar", corpo: envelopeConsulta(doc.chave, doc.ambiente), pfx: fiscal.pfx, senha: fiscal.senha });
    return await registrarResposta(doc, resposta);
  } finally { fiscal.pfx.fill(0); }
}
