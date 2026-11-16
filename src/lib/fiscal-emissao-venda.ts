import { randomInt } from "node:crypto";
import { z } from "zod";
import { XMLBuilder } from "fast-xml-parser";
import { ErroFiscal } from "./fiscal-certificado";
import { UFS_FISCAIS } from "./fiscal-distribuicao";
import { chaveNfe, NFE_NS } from "./fiscal-emissao-xml";
import type { ConferenciaFiscalPedido } from "./fiscal-pedido-contrato";

export const OpcoesVendaSchema = z.object({
  ambiente: z.enum(["1", "2"]), serie: z.number().int().min(0).max(999), numero: z.number().int().min(1).max(999999999),
  natureza: z.string().trim().min(1).max(60), inscricaoEstadual: z.string().regex(/^\d{2,14}$/),
  municipioEmitente: z.string().regex(/^\d{7}$/), municipioDestinatario: z.string().regex(/^\d{7}$/),
  tributacao: z.literal("SIMPLES_102_PIS07_COFINS07"), destinatarioNaoContribuinte: z.literal(true),
  pagamento: z.enum(["01", "03", "04", "15", "17"]), modalidadeFrete: z.enum(["0", "1", "9"]),
  itens: z.array(z.object({ itemId: z.string().min(1), cfop: z.enum(["5102", "6102"]), origem: z.enum(["0", "1", "2", "3", "4", "5", "6", "7", "8"]), unidade: z.string().trim().min(1).max(6), gtin: z.string().regex(/^(?:SEM GTIN|\d{8}|\d{12,14})$/) })).min(1).max(990),
});
export type OpcoesVenda = z.infer<typeof OpcoesVendaSchema>;
const Endereco = z.object({ logradouro: z.string().trim().min(2).max(60), numero: z.string().trim().min(1).max(60), bairro: z.string().trim().min(2).max(60), cidade: z.string().trim().min(2).max(60), uf: z.string().regex(/^[A-Z]{2}$/), cep: z.string().transform(v => v.replace(/\D/g, "")).pipe(z.string().regex(/^\d{8}$/)), complemento: z.string().max(60).nullish() });
const centavos = (n: number) => `${Math.floor(n / 100)}.${String(n % 100).padStart(2, "0")}`;
function ratear(valor: number, pesos: number[]): number[] {
  const soma = pesos.reduce((s, p) => s + BigInt(p), 0n);
  if (!soma) throw new ErroFiscal("Produtos sem valor não permitem rateio fiscal.");
  const partes = pesos.map((p, indice) => ({ indice, valor: Number(BigInt(valor) * BigInt(p) / soma), resto: BigInt(valor) * BigInt(p) % soma }));
  const faltam = valor - partes.reduce((s, p) => s + p.valor, 0);
  const ordenadas = [...partes].sort((a, b) => a.resto === b.resto ? a.indice - b.indice : a.resto > b.resto ? -1 : 1);
  for (let i = 0; i < faltam; i++) ordenadas[i].valor++;
  return partes.map(p => p.valor);
}

/** Perfil explícito de venda online SN102, sem ST, PIS/COFINS07 e consumidor não contribuinte. */
export function montarNfeVenda(conferencia: ConferenciaFiscalPedido, enderecoEmitente: unknown, entrada: OpcoesVenda, agora = new Date(), codigo = String(randomInt(100000000)).padStart(8, "0")) {
  const op = OpcoesVendaSchema.parse(entrada), dados = conferencia.dados;
  if (conferencia.pendencias.some(p => !["EMISSAO_INDISPONIVEL", "ERP_NAO_CONFIGURADO", "EMISSAO_DIRETA"].includes(p.codigo))) throw new ErroFiscal("Resolva as pendências comerciais antes de preparar a NF-e.");
  const emissor = Endereco.safeParse(enderecoEmitente), destino = Endereco.safeParse(dados.destinatario.endereco);
  if (!emissor.success || !destino.success || !UFS_FISCAIS[emissor.data.uf] || !UFS_FISCAIS[destino.data.uf]) throw new ErroFiscal("Complete os endereços do emitente e do destinatário antes de emitir.");
  if (!op.municipioEmitente.startsWith(UFS_FISCAIS[emissor.data.uf]) || !op.municipioDestinatario.startsWith(UFS_FISCAIS[destino.data.uf])) throw new ErroFiscal("Município IBGE incompatível com a UF informada.");
  if (dados.frete.valorCentavos > 0 && op.modalidadeFrete === "9") throw new ErroFiscal("Confira a modalidade do frete cobrado no pedido.");
  if (op.itens.length !== dados.itens.length || new Set(op.itens.map(i => i.itemId)).size !== dados.itens.length) throw new ErroFiscal("Confira a classificação fiscal de todos os itens.");
  const cnpj = dados.emitente.documento.replace(/\D/g, ""), destinatario = dados.destinatario.documento.replace(/\D/g, "");
  const data = `${new Date(agora.getTime() - 3 * 3600000).toISOString().slice(0, 19)}-03:00`;
  const chave = chaveNfe(UFS_FISCAIS[emissor.data.uf], data.slice(2, 4) + data.slice(5, 7), cnpj, op.serie, op.numero, codigo);
  const totais = dados.itens.map(i => i.totalCentavos!);
  const descontos = ratear(dados.totais.descontoCentavos, totais), fretes = ratear(dados.frete.valorCentavos, totais);
  const fora = emissor.data.uf !== destino.data.uf;
  const endereco = (e: z.infer<typeof Endereco>, municipio: string) => ({ xLgr: e.logradouro, nro: e.numero, ...(e.complemento ? { xCpl: e.complemento } : {}), xBairro: e.bairro, cMun: municipio, xMun: e.cidade, UF: e.uf, CEP: e.cep, cPais: "1058", xPais: "BRASIL" });
  const det = dados.itens.map((i, indice) => {
    const fiscal = op.itens.find(item => item.itemId === i.id);
    if (!fiscal || fiscal.cfop !== (fora ? "6102" : "5102")) throw new ErroFiscal("CFOP incompatível com a UF de destino deste perfil de venda.");
    if (descontos[indice] > totais[indice]) throw new ErroFiscal("Desconto fiscal maior que o valor do item.");
    return { "@_nItem": indice + 1, prod: { cProd: (i.sku || i.id).slice(0, 60), cEAN: fiscal.gtin, xProd: i.nome.slice(0, 120), NCM: i.classificacaoAtual!.ncm!, ...(i.classificacaoAtual?.cest ? { CEST: i.classificacaoAtual.cest } : {}), CFOP: fiscal.cfop, uCom: fiscal.unidade, qCom: `${i.quantidade}.0000`, vUnCom: centavos(i.precoUnitarioCentavos), vProd: centavos(totais[indice]), cEANTrib: fiscal.gtin, uTrib: fiscal.unidade, qTrib: `${i.quantidade}.0000`, vUnTrib: centavos(i.precoUnitarioCentavos), ...(fretes[indice] ? { vFrete: centavos(fretes[indice]) } : {}), ...(descontos[indice] ? { vDesc: centavos(descontos[indice]) } : {}), indTot: "1" }, imposto: { ICMS: { ICMSSN102: { orig: fiscal.origem, CSOSN: "102" } }, PIS: { PISNT: { CST: "07" } }, COFINS: { COFINSNT: { CST: "07" } } } };
  });
  const impostos = { vBC: "0.00", vICMS: "0.00", vICMSDeson: "0.00", vFCP: "0.00", vBCST: "0.00", vST: "0.00", vFCPST: "0.00", vFCPSTRet: "0.00", vProd: centavos(dados.totais.subtotalCentavos), vFrete: centavos(dados.frete.valorCentavos), vSeg: "0.00", vDesc: centavos(dados.totais.descontoCentavos), vII: "0.00", vIPI: "0.00", vIPIDevol: "0.00", vPIS: "0.00", vCOFINS: "0.00", vOutro: "0.00", vNF: centavos(dados.totais.totalCentavos) };
  return new XMLBuilder({ ignoreAttributes: false }).build({ NFe: { "@_xmlns": NFE_NS, infNFe: { "@_Id": `NFe${chave}`, "@_versao": "4.00", ide: { cUF: UFS_FISCAIS[emissor.data.uf], cNF: codigo, natOp: op.natureza, mod: "55", serie: op.serie, nNF: op.numero, dhEmi: data, tpNF: "1", idDest: fora ? "2" : "1", cMunFG: op.municipioEmitente, tpImp: "1", tpEmis: "1", cDV: chave.at(-1), tpAmb: op.ambiente, finNFe: "1", indFinal: "1", indPres: "2", indIntermed: "0", procEmi: "0", verProc: "Lojas-1" }, emit: { CNPJ: cnpj, xNome: dados.emitente.nome.slice(0, 60), enderEmit: endereco(emissor.data, op.municipioEmitente), IE: op.inscricaoEstadual, CRT: "1" }, dest: { [destinatario.length === 14 ? "CNPJ" : "CPF"]: destinatario, xNome: op.ambiente === "2" ? "NF-E EMITIDA EM AMBIENTE DE HOMOLOGACAO - SEM VALOR FISCAL" : dados.destinatario.nome.slice(0, 60), enderDest: endereco(destino.data, op.municipioDestinatario), indIEDest: "9" }, det, total: { ICMSTot: impostos }, transp: { modFrete: op.modalidadeFrete }, pag: { detPag: { tPag: op.pagamento, vPag: centavos(dados.totais.totalCentavos), ...(["03", "04"].includes(op.pagamento) ? { card: { tpIntegra: "2" } } : {}) } } } } }) as string;
}
