import { createHash } from "node:crypto";
import { validarDocumento } from "@avilaops/checkout";

export type EnderecoConferenciaFiscal = { logradouro: string; numero: string; bairro: string; cidade: string; uf: string; cep: string; complemento: string | null };
export type DadosPedidoFiscal = {
  pedido: { id: string; numero: number; referencia: string; status: string; atualizadoEm: string };
  emitente: { nome: string; documento: string };
  destinatario: { nome: string; documento: string; endereco: EnderecoConferenciaFiscal | null };
  pagamento: { meio: string; situacao: string | null };
  frete: { nome: string; valorCentavos: number };
  totais: { subtotalCentavos: number; descontoCentavos: number; totalCentavos: number };
  itens: Array<{ id: string; produtoId: string | null; varianteId: string | null; nome: string; sku: string | null; quantidade: number; precoUnitarioCentavos: number; quantidadeCancelada?: number; quantidadeDevolvida?: number; classificacaoAtual: { ncm: string | null; cest: string | null } | null }>;
};
export type PendenciaPedidoFiscal = { codigo: string; campo: string; mensagem: string; href?: string };
const LIMITE = 2_147_483_647;
const inteiro = (n: number) => Number.isSafeInteger(n) && n >= 0 && n <= LIMITE;

/** Conferência comercial local. Não é payload de emissão nem cálculo tributário. */
export function conferirPedidoFiscal(entrada: DadosPedidoFiscal, opcoes: { consultaErpConfigurada: boolean } = { consultaErpConfigurada: false }) {
  const pendencias: PendenciaPedidoFiscal[] = [];
  const apontar = (codigo: string, campo: string, mensagem: string, href?: string) => pendencias.push({ codigo, campo, mensagem, ...(href ? { href } : {}) });
  if (!/^[\d./\s-]+$/.test(entrada.emitente.documento) || entrada.emitente.documento.replace(/\D/g, "").length !== 14 || !validarDocumento(entrada.emitente.documento)) apontar("EMITENTE_DOCUMENTO", "emitente.documento", "Confira o CNPJ da empresa nos dados da loja.");
  if (!entrada.emitente.nome.trim()) apontar("EMITENTE_NOME", "emitente.nome", "Informe a identificação da empresa nos dados da loja.");
  if (!/^[\d./\s-]+$/.test(entrada.destinatario.documento) || !validarDocumento(entrada.destinatario.documento)) apontar("DESTINATARIO_DOCUMENTO", "destinatario.documento", "Confira o CPF/CNPJ do comprador antes de preparar a nota.");
  if (!entrada.destinatario.nome.trim()) apontar("DESTINATARIO_NOME", "destinatario.nome", "Confira o nome do comprador no pedido.");
  const endereco = entrada.destinatario.endereco;
  if (!endereco || [endereco.logradouro, endereco.numero, endereco.bairro, endereco.cidade].some(v => !v.trim()) || !/^[A-Z]{2}$/.test(endereco.uf) || !/^\d{8}$/.test(endereco.cep.replace(/\D/g, ""))) apontar("DESTINATARIO_ENDERECO", "destinatario.endereco", "Confira o endereço fiscal do destinatário; endereço de entrega não comprova cadastro fiscal completo.");
  if (["CANCELADO", "ESTORNADO", "COTADO"].includes(entrada.pedido.status)) apontar("PEDIDO_SITUACAO", "pedido.status", "Revise a situação comercial deste pedido antes de preparar a operação fiscal.");
  if (!entrada.pagamento.meio.trim()) apontar("PAGAMENTO", "pagamento.meio", "Confira o meio de pagamento registrado no pedido.");

  let soma = 0n;
  let linhasValidas = entrada.itens.length > 0;
  const itens = entrada.itens.map((item, indice) => {
    const campo = `itens.${indice}`;
    const href = item.produtoId ? `/painel/produtos/${encodeURIComponent(item.produtoId)}#classificacao-fiscal` : "/painel/produtos";
    if (!item.produtoId || !item.varianteId) apontar("ITEM_VINCULO", campo, `Vincule o item ${indice + 1} a um produto e variante desta loja.`, "/painel/produtos");
    if (!/^\d{8}$/.test(item.classificacaoAtual?.ncm ?? "")) apontar("ITEM_NCM", `${campo}.classificacaoAtual.ncm`, `Confira o NCM atual do item ${indice + 1} no catálogo.`, href);
    if (item.classificacaoAtual?.cest && !/^\d{7}$/.test(item.classificacaoAtual.cest)) apontar("ITEM_CEST", `${campo}.classificacaoAtual.cest`, `Confira o CEST informado no item ${indice + 1}.`, href);
    if ((item.quantidadeCancelada ?? 0) > 0 || (item.quantidadeDevolvida ?? 0) > 0) apontar("ITEM_MOVIMENTACAO", campo, `O item ${indice + 1} possui cancelamento ou devolução. Revise a quantidade fiscal; a conferência preserva a quantidade comprada.`);
    const valida = inteiro(item.quantidade) && item.quantidade > 0 && inteiro(item.precoUnitarioCentavos);
    const total = valida ? BigInt(item.quantidade) * BigInt(item.precoUnitarioCentavos) : null;
    const totalCentavos = total !== null && total <= BigInt(LIMITE) ? Number(total) : null;
    if (totalCentavos === null) linhasValidas = false;
    else soma += BigInt(totalCentavos);
    return { ...item, totalCentavos };
  });
  const { subtotalCentavos, descontoCentavos, totalCentavos } = entrada.totais;
  const valoresValidos = [subtotalCentavos, descontoCentavos, totalCentavos, entrada.frete.valorCentavos].every(inteiro);
  if (!linhasValidas || !valoresValidos || soma !== BigInt(subtotalCentavos) || BigInt(subtotalCentavos) + BigInt(entrada.frete.valorCentavos) - BigInt(descontoCentavos) !== BigInt(totalCentavos)) apontar("TOTAIS_DIVERGENTES", "totais", "Os totais preservados divergem das linhas, frete ou desconto, ou excedem o limite do pedido. Revise a origem comercial; nenhum valor foi corrigido automaticamente.");
  if (!opcoes.consultaErpConfigurada) apontar("ERP_NAO_CONFIGURADO", "integracao", "A consulta fiscal do ERP não está configurada para esta empresa. Solicite a configuração ao suporte.");
  apontar("EMISSAO_INDISPONIVEL", "integracao", "A emissão de pedidos pelo ERP ainda precisa ser liberada pelo suporte. Operação, município e tributação devem ser conferidos no ERP.");
  const dados = { ...entrada, itens };
  const resumoHash = createHash("sha256").update(JSON.stringify(dados)).digest("hex");
  return { versao: "avila.lojas.fiscal.pedido.v1" as const, emissaoDisponivel: false as const, consultaErpConfigurada: opcoes.consultaErpConfigurada, resumoHash, dados, pendencias };
}

export type ConferenciaFiscalPedido = ReturnType<typeof conferirPedidoFiscal>;
