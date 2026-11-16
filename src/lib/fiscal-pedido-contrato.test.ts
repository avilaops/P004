import assert from "node:assert/strict";
import test from "node:test";
import { conferirPedidoFiscal } from "./fiscal-pedido-contrato";

const dados = () => ({
  pedido: { id: "pedido-1", numero: 12, referencia: "checkout-12", status: "PAGO", atualizadoEm: "2026-11-15T10:00:00.000Z" },
  emitente: { nome: "Loja QA", documento: "11222333000181" },
  destinatario: { nome: "Comprador QA", documento: "52998224725", endereco: { logradouro: "Rua QA", numero: "1", bairro: "Centro", cidade: "São Paulo", uf: "SP", cep: "01001000", complemento: null } },
  pagamento: { meio: "pix", situacao: "approved" },
  frete: { nome: "Entrega QA", valorCentavos: 500 },
  totais: { subtotalCentavos: 20000, descontoCentavos: 1000, totalCentavos: 19500 },
  itens: [{ id: "item-1", produtoId: "produto-1", varianteId: "variante-1", nome: "Peça QA", sku: "QA-1", quantidade: 2, precoUnitarioCentavos: 10000, classificacaoAtual: { ncm: "40111000", cest: null } }],
});

test("conferência mantém centavos e identifica snapshot comercial sem prometer emissão", () => {
  const r = conferirPedidoFiscal(dados());
  assert.equal(r.versao, "avila.lojas.fiscal.pedido.v2");
  assert.equal(r.emissaoDisponivel, true);
  assert.equal(r.modoEmissao, "DIRETA");
  assert.equal(r.dados.itens[0].totalCentavos, 20000);
  assert.equal(r.dados.totais.totalCentavos, 19500);
  assert.match(r.resumoHash, /^[a-f0-9]{64}$/);
  assert.equal(r.resumoHash, conferirPedidoFiscal(dados()).resumoHash);
  assert.ok(!r.pendencias.some(p => p.codigo.includes("ERP") || p.codigo === "EMISSAO_INDISPONIVEL"));
  assert.ok(!r.pendencias.some(p => p.codigo === "TOTAIS_DIVERGENTES"));
  const outro = dados(); outro.itens[0].classificacaoAtual.ncm = "40112000";
  assert.notEqual(r.resumoHash, conferirPedidoFiscal(outro).resumoHash);
});

test("divergência e valores fora do limite nunca são corrigidos silenciosamente", () => {
  const divergente = dados(); divergente.totais.totalCentavos = 19501;
  assert.ok(conferirPedidoFiscal(divergente).pendencias.some(p => p.codigo === "TOTAIS_DIVERGENTES"));
  const excedido = dados(); excedido.itens[0].quantidade = 10_000_000;
  const resultado = conferirPedidoFiscal(excedido);
  assert.equal(resultado.dados.itens[0].totalCentavos, null);
  assert.ok(resultado.pendencias.some(p => p.codigo === "TOTAIS_DIVERGENTES"));
});

test("classificação ausente, CPF inválido e pedido cancelado ficam acionáveis", () => {
  const entrada = dados();
  entrada.itens[0].classificacaoAtual.ncm = "";
  entrada.destinatario.documento = "00000000000";
  entrada.pedido.status = "CANCELADO";
  const codigos = conferirPedidoFiscal(entrada).pendencias.map(p => p.codigo);
  assert.ok(codigos.includes("ITEM_NCM"));
  assert.ok(codigos.includes("DESTINATARIO_DOCUMENTO"));
  assert.ok(codigos.includes("PEDIDO_SITUACAO"));
});

test("cancelamento parcial e endereço ausente pedem revisão sem reduzir a compra", () => {
  const base = dados();
  const resultado = conferirPedidoFiscal({ ...base, destinatario: { ...base.destinatario, endereco: null }, itens: base.itens.map(i => ({ ...i, quantidadeCancelada: 1 })) });
  assert.equal(resultado.dados.itens[0].quantidade, 2);
  assert.equal(resultado.dados.itens[0].totalCentavos, 20000);
  assert.ok(resultado.pendencias.some(p => p.codigo === "ITEM_MOVIMENTACAO"));
  assert.ok(resultado.pendencias.some(p => p.codigo === "DESTINATARIO_ENDERECO"));
});
