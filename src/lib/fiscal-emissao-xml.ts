import { createHash } from "node:crypto";
import { XMLBuilder, XMLParser, XMLValidator } from "fast-xml-parser";
import { SignedXml } from "xml-crypto";
import { ErroFiscal } from "./fiscal-certificado";
import { UFS_FISCAIS } from "./fiscal-distribuicao";

export const NFE_NS = "http://www.portalfiscal.inf.br/nfe";
const parser = new XMLParser({ ignoreAttributes: false, removeNSPrefix: true, parseTagValue: false, processEntities: true });
const builder = new XMLBuilder({ ignoreAttributes: false });
type Bloco = Record<string, unknown>;
function bloco(v: unknown): Bloco {
  if (!v || typeof v !== "object" || Array.isArray(v)) throw new ErroFiscal("Estrutura XML da NF-e inválida ou duplicada.");
  return v as Bloco;
}
const texto = (v: unknown) => typeof v === "string" ? v : "";
export function lerXmlNfe(xml: string): Bloco {
  if (!xml || Buffer.byteLength(xml) > 1024 * 1024 || /<!DOCTYPE|<!ENTITY|<\?(?!xml\s)/i.test(xml) || XMLValidator.validate(xml) !== true) throw new ErroFiscal("XML fiscal inválido ou acima de 1 MB.");
  return bloco(parser.parse(xml));
}

export function chaveNfe(uf: string, anoMes: string, cnpj: string, serie: number, numero: number, codigo: string) {
  if (!/^\d{2}$/.test(uf) || !/^\d{4}$/.test(anoMes) || !/^\d{14}$/.test(cnpj) || !Number.isInteger(serie) || serie < 0 || serie > 999 || !Number.isInteger(numero) || numero < 1 || numero > 999999999 || !/^\d{8}$/.test(codigo)) throw new ErroFiscal("Identificação da NF-e inválida.");
  const base = `${uf}${anoMes}${cnpj}55${String(serie).padStart(3, "0")}${String(numero).padStart(9, "0")}1${codigo}`;
  let soma = 0;
  for (let i = base.length - 1, peso = 2; i >= 0; i--, peso = peso === 9 ? 2 : peso + 1) soma += Number(base[i]) * peso;
  const resto = soma % 11;
  return base + (resto < 2 ? 0 : 11 - resto);
}

export function validarRascunhoNfe(xml: string, cnpj: string) {
  const raiz = lerXmlNfe(xml);
  if (Object.keys(raiz).filter(k => !k.startsWith("?")).join() !== "NFe") throw new ErroFiscal("Envie somente o rascunho XML NFe, sem protocolo anterior.");
  const nfe = bloco(new XMLParser({ ignoreAttributes: false, parseTagValue: false }).parse(xml).NFe), inf = bloco(nfe.infNFe), ide = bloco(inf.ide), emit = bloco(inf.emit);
  if (nfe["@_xmlns"] !== NFE_NS || nfe.Signature || inf["@_versao"] !== "4.00") throw new ErroFiscal("XML deve ser NF-e 4.00 ainda sem assinatura.");
  if (ide.mod !== "55") throw new ErroFiscal("Emissão disponível para modelo 55.");
  if (ide.tpAmb !== "1" && ide.tpAmb !== "2") throw new ErroFiscal("Informe ambiente de homologação ou produção.");
  if (emit.CNPJ !== cnpj) throw new ErroFiscal("O emitente da NF-e deve ser o CNPJ desta loja.");
  const uf = texto(bloco(emit.enderEmit).UF);
  if (ide.cUF !== UFS_FISCAIS[uf] || ide.tpEmis !== "1") throw new ErroFiscal("UF ou modalidade de emissão da NF-e inválida.");
  const serie = Number(ide.serie), numero = Number(ide.nNF), data = texto(ide.dhEmi);
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}[+-]\d{2}:\d{2}$/.test(data) || !Number.isFinite(Date.parse(data))) throw new ErroFiscal("Data de emissão inválida.");
  const chave = chaveNfe(texto(ide.cUF), data.slice(2, 4) + data.slice(5, 7), cnpj, serie, numero, texto(ide.cNF));
  if (inf["@_Id"] !== `NFe${chave}` || ide.cDV !== chave.at(-1)) throw new ErroFiscal("Chave, série, número ou dígito verificador da NF-e divergente.");
  const itens = Array.isArray(inf.det) ? inf.det : [inf.det];
  if (!itens.length || itens.length > 990 || itens.some(item => !bloco(item).prod || !bloco(item).imposto)) throw new ErroFiscal("Confira itens e tributação antes de emitir.");
  const total = texto(bloco(bloco(inf.total).ICMSTot).vNF);
  if (!/^\d{1,13}\.\d{2}$/.test(total)) throw new ErroFiscal("Total fiscal inválido.");
  const destinatario = bloco(inf.dest);
  return { chave, cnpj, uf, ambiente: ide.tpAmb, serie, numero, total, destinatario: texto(destinatario.CNPJ ?? destinatario.CPF), nomeDestinatario: texto(destinatario.xNome), itens: itens.length };
}

export function assinarNfe(xml: string, key: string, cert: string) {
  const assinatura = new SignedXml({ privateKey: key, publicCert: cert, canonicalizationAlgorithm: "http://www.w3.org/TR/2001/REC-xml-c14n-20010315", signatureAlgorithm: "http://www.w3.org/2000/09/xmldsig#rsa-sha1" });
  assinatura.addReference({ xpath: `/*[local-name()='NFe' and namespace-uri()='${NFE_NS}']/*[local-name()='infNFe' and namespace-uri()='${NFE_NS}']`, digestAlgorithm: "http://www.w3.org/2000/09/xmldsig#sha1", transforms: ["http://www.w3.org/2000/09/xmldsig#enveloped-signature", "http://www.w3.org/TR/2001/REC-xml-c14n-20010315"] });
  assinatura.computeSignature(xml, { location: { reference: "/*", action: "append" } });
  const xmlAssinado = assinatura.getSignedXml().replace(/^<\?xml[^?]*\?>\s*/, "");
  const digest = texto(bloco(bloco(bloco(bloco(lerXmlNfe(xmlAssinado).NFe).Signature).SignedInfo).Reference).DigestValue);
  if (!digest) throw new ErroFiscal("Assinatura fiscal sem digest.");
  return { xmlAssinado, digest, resumoHash: createHash("sha256").update(xmlAssinado).digest("hex") };
}

type Operacao = "autorizar" | "consultar";
/** Catálogo oficial consultado em16/11/2026. Nunca recebe URL do navegador. */
export function destinoNfe(uf: string, ambiente: string, operacao: Operacao): string {
  if (!UFS_FISCAIS[uf] || !["1", "2"].includes(ambiente)) throw new ErroFiscal("UF ou ambiente fiscal inválido.");
  const prod = ambiente === "1";
  const simples: Record<string, [string, string, string]> = {
    SP: [prod ? "https://nfe.fazenda.sp.gov.br/ws" : "https://homologacao.nfe.fazenda.sp.gov.br/ws", "nfeautorizacao4.asmx", "nfeconsultaprotocolo4.asmx"],
    AM: [prod ? "https://nfe.sefaz.am.gov.br/services2/services" : "https://homnfe.sefaz.am.gov.br/services2/services", "NfeAutorizacao4", "NfeConsulta4"],
    GO: [prod ? "https://nfe.sefaz.go.gov.br/nfe/services" : "https://homolog.sefaz.go.gov.br/nfe/services", "NFeAutorizacao4", "NFeConsultaProtocolo4"],
    MG: [prod ? "https://nfe.fazenda.mg.gov.br/nfe2/services" : "https://hnfe.fazenda.mg.gov.br/nfe2/services", "NFeAutorizacao4", "NFeConsultaProtocolo4"],
    MS: [prod ? "https://nfe.sefaz.ms.gov.br/ws" : "https://hom.nfe.sefaz.ms.gov.br/ws", "NFeAutorizacao4", "NFeConsultaProtocolo4"],
    MT: [prod ? "https://nfe.sefaz.mt.gov.br/nfews/v2/services" : "https://homologacao.sefaz.mt.gov.br/nfews/v2/services", "NfeAutorizacao4", "NfeConsulta4"],
    PE: [prod ? "https://nfe.sefaz.pe.gov.br/nfe-service/services" : "https://nfehomolog.sefaz.pe.gov.br/nfe-service/services", "NFeAutorizacao4", "NFeConsultaProtocolo4"],
    PR: [prod ? "https://nfe.sefa.pr.gov.br/nfe" : "https://homologacao.nfe.sefa.pr.gov.br/nfe", "NFeAutorizacao4", "NFeConsultaProtocolo4"],
    BA: [prod ? "https://nfe.sefaz.ba.gov.br/webservices" : "https://hnfe.sefaz.ba.gov.br/webservices", "NFeAutorizacao4/NFeAutorizacao4.asmx", "NFeConsultaProtocolo4/NFeConsultaProtocolo4.asmx"],
    MA: [prod ? "https://www.sefazvirtual.fazenda.gov.br" : "https://hom.sefazvirtual.fazenda.gov.br", "NFeAutorizacao4/NFeAutorizacao4.asmx", "NFeConsultaProtocolo4/NFeConsultaProtocolo4.asmx"],
  };
  const proprio = simples[uf];
  if (proprio) return `${proprio[0]}/${proprio[operacao === "autorizar" ? 1 : 2]}`;
  const host = uf === "RS" ? (prod ? "nfe.sefazrs.rs.gov.br" : "nfe-homologacao.sefazrs.rs.gov.br") : (prod ? "nfe.svrs.rs.gov.br" : "nfe-homologacao.svrs.rs.gov.br");
  return `https://${host}/ws/${operacao === "autorizar" ? "NfeAutorizacao/NFeAutorizacao4.asmx" : "NfeConsulta/NfeConsulta4.asmx"}`;
}

export function envelopeEmissao(xml: string, chave: string) {
  return `<soap12:Envelope xmlns:soap12="http://www.w3.org/2003/05/soap-envelope"><soap12:Body><nfeDadosMsg xmlns="${NFE_NS}/wsdl/NFeAutorizacao4"><enviNFe xmlns="${NFE_NS}" versao="4.00"><idLote>${chave.slice(-15)}</idLote><indSinc>1</indSinc>${xml}</enviNFe></nfeDadosMsg></soap12:Body></soap12:Envelope>`;
}
export function envelopeConsulta(chave: string, ambiente: string) {
  if (!/^\d{44}$/.test(chave) || !["1", "2"].includes(ambiente)) throw new ErroFiscal("Consulta fiscal inválida.");
  return `<soap12:Envelope xmlns:soap12="http://www.w3.org/2003/05/soap-envelope"><soap12:Body><nfeDadosMsg xmlns="${NFE_NS}/wsdl/NFeConsultaProtocolo4"><consSitNFe xmlns="${NFE_NS}" versao="4.00"><tpAmb>${ambiente}</tpAmb><xServ>CONSULTAR</xServ><chNFe>${chave}</chNFe></consSitNFe></nfeDadosMsg></soap12:Body></soap12:Envelope>`;
}

export function lerRespostaNfe(xml: string, esperado: { chave: string; ambiente: string; digest: string }) {
  let raiz = lerXmlNfe(xml);
  if (raiz.Envelope) {
    const body = bloco(bloco(raiz.Envelope).Body);
    const candidato = Object.values(body)[0];
    raiz = typeof candidato === "string" ? lerXmlNfe(candidato) : bloco(candidato);
    if (!raiz.retEnviNFe && !raiz.retConsSitNFe) {
      const interno = Object.values(raiz)[0];
      raiz = typeof interno === "string" ? lerXmlNfe(interno) : bloco(interno);
    }
  }
  const retorno = bloco(raiz.retEnviNFe ?? raiz.retConsSitNFe);
  if (retorno.tpAmb !== esperado.ambiente) throw new ErroFiscal("Resposta de outro ambiente fiscal.");
  if (retorno.chNFe && retorno.chNFe !== esperado.chave) throw new ErroFiscal("Resposta de outra chave fiscal.");
  const prot = retorno.protNFe === undefined ? null : bloco(retorno.protNFe);
  const inf = prot ? bloco(prot.infProt) : retorno;
  if (prot && (inf.chNFe !== esperado.chave || inf.tpAmb !== esperado.ambiente)) throw new ErroFiscal("Protocolo de outra chave ou ambiente fiscal.");
  const codigo = texto(inf.cStat), motivo = texto(inf.xMotivo).slice(0, 400);
  if (!/^\d{3}$/.test(codigo)) throw new ErroFiscal("Resposta fiscal sem código válido.");
  const autorizada = prot && ["100", "150"].includes(codigo);
  if (["101", "151"].includes(codigo) && retorno.chNFe !== esperado.chave) throw new ErroFiscal("Cancelamento sem confirmação da mesma chave fiscal.");
  if (autorizada && (inf.digVal !== esperado.digest || !/^\d{15}$/.test(texto(inf.nProt)))) throw new ErroFiscal("Protocolo sem digest ou identificação correspondente.");
  const status = autorizada ? "AUTORIZADA" : ["101", "151"].includes(codigo) ? "CANCELADA" : ["110", "205", "301", "302", "303"].includes(codigo) ? "DENEGADA" : ["103", "104", "105", "106", "108", "109", "204", "217", "539", "656", "999"].includes(codigo) ? "PENDENTE_CONFERENCIA" : "REJEITADA";
  return { status, codigo, motivo, protocolo: autorizada ? texto(inf.nProt) : null, protocoloXml: autorizada ? builder.build({ protNFe: { ...prot, "@_xmlns": NFE_NS, "@_versao": "4.00" } }) as string : null };
}
