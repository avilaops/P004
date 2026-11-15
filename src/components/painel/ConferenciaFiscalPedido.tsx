"use client";

import { useState } from "react";
import type { ConferenciaFiscalPedido as Conferencia } from "@/lib/fiscal-pedido-contrato";
import { brl, Secao } from "./campos";

export default function ConferenciaFiscalPedido({ pedidoId }: { pedidoId: string }) {
  const [dados, setDados] = useState<Conferencia | null>(null), [erro, setErro] = useState("");
  const [ocupado, setOcupado] = useState(false);
  async function conferir() {
    if (ocupado) return;
    setOcupado(true); setErro(""); setDados(null);
    try {
      const r = await fetch(`/api/painel/pedidos/${encodeURIComponent(pedidoId)}/fiscal`, { cache: "no-store" });
      const resposta = await r.json();
      if (!r.ok) throw new Error(resposta.erro ?? "Não foi possível conferir este pedido.");
      setDados(resposta);
    } catch (e) { setErro(e instanceof Error ? e.message : "Falha ao consultar a conferência."); }
    finally { setOcupado(false); }
  }
  const base = dados?.dados;
  return <Secao titulo="Conferência fiscal do pedido" descricao="Confira os dados comerciais e as pendências para preparar a emissão.">
    <button type="button" className="btn-secundario" disabled={ocupado} onClick={() => void conferir()}>{ocupado ? "Conferindo…" : dados ? "Atualizar conferência fiscal" : "Conferir dados fiscais"}</button>
    {ocupado && <p role="status" className="text-sm">Consultando os dados atuais do pedido…</p>}
    {erro && <p role="alert" className="break-words rounded-lg bg-red-50 p-3 text-sm text-red-900">{erro}</p>}
    {dados && base && <div className="grid min-w-0 gap-4">
      <p role="status" className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950">Conferência disponível • emissão de NF-e ainda indisponível nesta integração.</p>
      <dl className="grid min-w-0 gap-3 text-sm sm:grid-cols-2">
        <div><dt className="text-muted-foreground">Emitente</dt><dd className="break-words">{base.emitente.nome} • {base.emitente.documento || "Documento não informado"}</dd></div>
        <div><dt className="text-muted-foreground">Destinatário</dt><dd className="break-words">{base.destinatario.nome} • {base.destinatario.documento || "Documento não informado"}</dd></div>
        <div><dt className="text-muted-foreground">Pagamento registrado</dt><dd>{base.pagamento.meio || "Não informado"} • {base.pagamento.situacao ?? "Situação não informada"}</dd></div>
        <div><dt className="text-muted-foreground">Frete</dt><dd className="break-words">{base.frete.nome} • {brl(base.frete.valorCentavos)}</dd></div>
        <div className="sm:col-span-2"><dt className="text-muted-foreground">Endereço comercial do destinatário</dt><dd className="break-words">{base.destinatario.endereco ? [base.destinatario.endereco.logradouro, base.destinatario.endereco.numero, base.destinatario.endereco.complemento, base.destinatario.endereco.bairro, base.destinatario.endereco.cidade, base.destinatario.endereco.uf, base.destinatario.endereco.cep].filter(Boolean).join(" • ") : "Não informado no pedido"}</dd></div>
      </dl>
      <ul className="grid min-w-0 gap-3">{base.itens.map((item, indice) => <li key={item.id} className="grid min-w-0 gap-1 rounded-lg border border-border p-3 text-sm"><strong className="break-words">{indice + 1}. {item.nome}</strong><p className="break-words">{item.quantidade} unidade(s) × {brl(item.precoUnitarioCentavos)} • total {item.totalCentavos === null ? "A conferir" : brl(item.totalCentavos)}</p><p className="break-words text-xs text-muted-foreground">SKU do pedido: {item.sku ?? "Não informado"} • NCM atual: {item.classificacaoAtual?.ncm ?? "Não informado"} • CEST atual: {item.classificacaoAtual?.cest ?? "Não informado"}</p></li>)}</ul>
      <p className="text-sm">Subtotal {brl(base.totais.subtotalCentavos)} • frete {brl(base.frete.valorCentavos)} • desconto {brl(base.totais.descontoCentavos)} • total preservado {brl(base.totais.totalCentavos)}</p>
      <p className="text-xs text-muted-foreground">Preços e descrições são os registrados na compra. NCM/CEST são os atuais do catálogo e precisam de revisão para a operação fiscal.</p>
      <div className="grid gap-2"><h3 className="font-medium">Pendências para revisão</h3><ul className="grid gap-2">{dados.pendencias.map((p, indice) => <li key={`${p.codigo}:${p.campo}:${indice}`} className="break-words rounded-lg bg-amber-50 p-3 text-sm text-amber-950">{p.mensagem}{p.href && <> <a href={p.href} className="underline">Abrir cadastro</a></>}</li>)}</ul></div>
      <details className="text-xs text-muted-foreground"><summary className="cursor-pointer">Identificação desta conferência</summary><p className="mt-2 break-all">Pedido {base.pedido.referencia} • dados de {new Date(base.pedido.atualizadoEm).toLocaleString("pt-BR")} • {dados.versao}</p><p className="mt-1 break-all">Resumo SHA-256: {dados.resumoHash}</p><p className="mt-1">Identifica os dados consultados; não representa assinatura ou autorização fiscal.</p></details>
    </div>}
  </Secao>;
}
