import { XMLBuilder } from "fast-xml-parser";
import { ErroFiscal } from "./fiscal-certificado";
import { lerXmlNfe, NFE_NS } from "./fiscal-emissao-xml";
import { UFS_FISCAIS } from "./fiscal-distribuicao";

type Bloco = Record<string, unknown>;
function bloco(v: unknown): Bloco {
  if (!v || typeof v !== "object" || Array.isArray(v)) throw new ErroFiscal("Resposta do evento de cancelamento inválida ou duplicada.");
  return v as Bloco;
}
const texto = (v: unknown) => typeof v === "string" ? v : "";
const builder = new XMLBuilder({ ignoreAttributes: false });
export function justificativaCancelamento(valor: string) {
  const motivo = valor.replace(/\s+/g, " ").trim();
  if (motivo.length < 15 || motivo.length > 255 || /[\u0000-\u0008\u000B\u000C\u000E-\u001F]/.test(motivo)) throw new ErroFiscal("Informe a justificativa do cancelamento com 15 a 255 caracteres válidos.");
  return motivo;
}
export function montarCancelamentoNfe(dados: { chave: string; cnpj: string; uf: string; ambiente: string; protocolo: string; justificativa: string; data: Date }) {
  if (!/^\d{44}$/.test(dados.chave) || !/^\d{14}$/.test(dados.cnpj) || !Object.hasOwn(UFS_FISCAIS, dados.uf) || !["1", "2"].includes(dados.ambiente) || dados.chave.slice(6, 20) !== dados.cnpj || dados.chave.slice(0, 2) !== UFS_FISCAIS[dados.uf]) throw new ErroFiscal("Chave, emitente ou ambiente do cancelamento inválido.");
  if (!/^\d{15}$/.test(dados.protocolo)) throw new ErroFiscal("O cancelamento exige o protocolo original de autorização.");
  const justificativa = justificativaCancelamento(dados.justificativa);
  const instante = `${new Date(dados.data.getTime() - 3 * 3600000).toISOString().slice(0, 19)}-03:00`;
  const id = `ID110111${dados.chave}01`;
  const xml = builder.build({ evento: { "@_xmlns": NFE_NS, "@_versao": "1.00", infEvento: { "@_Id": id, cOrgao: UFS_FISCAIS[dados.uf], tpAmb: dados.ambiente, CNPJ: dados.cnpj, chNFe: dados.chave, dhEvento: instante, tpEvento: "110111", nSeqEvento: "1", verEvento: "1.00", detEvento: { "@_versao": "1.00", descEvento: "Cancelamento", nProt: dados.protocolo, xJust: justificativa } } } }) as string;
  return { id, xml, justificativa };
}
export function envelopeCancelamento(xmlAssinado: string, lote: string) {
  if (!/^\d{1,15}$/.test(lote) || !xmlAssinado.includes("<Signature")) throw new ErroFiscal("Lote ou assinatura do cancelamento inválido.");
  return `<soap12:Envelope xmlns:soap12="http://www.w3.org/2003/05/soap-envelope"><soap12:Body><nfeDadosMsg xmlns="${NFE_NS}/wsdl/NFeRecepcaoEvento4"><envEvento xmlns="${NFE_NS}" versao="1.00"><idLote>${lote}</idLote>${xmlAssinado}</envEvento></nfeDadosMsg></soap12:Body></soap12:Envelope>`;
}
export function lerRetornoCancelamento(xml: string, esperado: { chave: string; ambiente: string }) {
  let raiz = lerXmlNfe(xml);
  for (let i = 0; i < 4 && !raiz.retEnvEvento; i++) {
    if (raiz.Envelope) { raiz = bloco(bloco(raiz.Envelope).Body); continue; }
    const filhos = Object.entries(raiz).filter(([k]) => !/^[?@#]/.test(k));
    if (filhos.length !== 1) throw new ErroFiscal("Resposta de cancelamento sem identificação única.");
    raiz = typeof filhos[0][1] === "string" ? lerXmlNfe(filhos[0][1]) : bloco(filhos[0][1]);
  }
  const lote = bloco(raiz.retEnvEvento);
  if (lote.tpAmb !== esperado.ambiente) throw new ErroFiscal("Resposta de outro ambiente no cancelamento.");
  if (!lote.retEvento) {
    const codigo = texto(lote.cStat);
    if (!["215", "225"].includes(codigo)) throw new ErroFiscal("A SEFAZ ainda não confirmou o evento de cancelamento.");
    return { status: "REJEITADA", codigo, motivo: texto(lote.xMotivo).slice(0, 400), protocolo: null, xmlRetornoEvento: null };
  }
  const evento = bloco(lote.retEvento), inf = bloco(evento.infEvento);
  if (inf.chNFe && inf.chNFe !== esperado.chave) throw new ErroFiscal("Retorno de outra chave no cancelamento.");
  if (inf.tpAmb && inf.tpAmb !== esperado.ambiente) throw new ErroFiscal("Retorno de outro ambiente no cancelamento.");
  if (inf.tpEvento && inf.tpEvento !== "110111" || inf.nSeqEvento && inf.nSeqEvento !== "1") throw new ErroFiscal("Retorno de outro evento ou sequência no cancelamento.");
  const codigo = texto(inf.cStat), protocolo = texto(inf.nProt), motivo = texto(inf.xMotivo).slice(0, 400);
  if (!/^\d{3}$/.test(codigo)) throw new ErroFiscal("Retorno do cancelamento sem código válido.");
  const aceita = ["135", "155"].includes(codigo);
  if (aceita && (inf.chNFe !== esperado.chave || inf.tpAmb !== esperado.ambiente || inf.tpEvento !== "110111" || inf.nSeqEvento !== "1" || !/^\d{15}$/.test(protocolo))) throw new ErroFiscal("Protocolo do cancelamento sem vínculo com o evento solicitado.");
  const status = aceita ? "ACEITA" : ["136", "573", "108", "109", "999"].includes(codigo) ? "PENDENTE_CONFERENCIA" : "REJEITADA";
  return { status, codigo, motivo, protocolo: aceita ? protocolo : null, xmlRetornoEvento: aceita ? builder.build({ retEvento: { ...evento, "@_xmlns": NFE_NS, "@_versao": "1.00" } }) as string : null };
}
