"use client";

import { useEffect, useState } from "react";
import type { ResumoEmissao } from "@/lib/fiscal-emissao";
import type { ConferenciaFiscalPedido } from "@/lib/fiscal-pedido-contrato";
import { Secao } from "./campos";
import FormularioNfeVenda from "./FormularioNfeVenda";

type Emissao = Omit<ResumoEmissao, "criadoEm" | "atualizadoEm"> & { criadoEm: string; atualizadoEm: string };
const SITUACOES: Record<string, string> = { PREPARADA: "Preparada • aguardando confirmação", ENVIANDO: "Enviando • consulte antes de repetir", PENDENTE_CONFERENCIA: "Aguardando confirmação da SEFAZ", AUTORIZADA: "Autorizada", REJEITADA: "Rejeitada", CANCELADA: "Cancelada", DENEGADA: "Uso denegado • consulte o responsável fiscal", SUBSTITUIDA: "Rascunho substituído • consulte a versão atual" };
export default function EmissaoFiscal({ pedidoId, conferencia }: { pedidoId?: string; conferencia?: ConferenciaFiscalPedido }) {
  const [emissoes, setEmissoes] = useState<Emissao[]>([]), [atual, setAtual] = useState<Emissao | null>(null);
  const [correcao, setCorrecao] = useState<Emissao | null>(null);
  const [erro, setErro] = useState(""), [ocupado, setOcupado] = useState(false), [confirmado, setConfirmado] = useState(false), [xml, setXml] = useState("");
  const url = `/api/painel/fiscal/emissoes${pedidoId ? `?pedidoId=${encodeURIComponent(pedidoId)}` : ""}`;
  useEffect(() => {
    const controller = new AbortController();
    void fetch(url, { cache: "no-store", signal: controller.signal }).then(async r => {
      const dados = await r.json(); if (!r.ok) throw new Error(dados.erro ?? "Não foi possível consultar as emissões.");
      setEmissoes(dados.emissoes);
    }).catch(e => { if (!controller.signal.aborted) setErro(e instanceof Error ? e.message : "Falha ao consultar emissões."); });
    return () => controller.abort();
  }, [url]);
  async function acionar(caminho: string, corpo: unknown) {
    if (ocupado) return;
    setOcupado(true); setErro(""); setConfirmado(false);
    try {
      const comando = correcao && caminho === "/api/painel/fiscal/emissoes" && corpo && typeof corpo === "object" ? { ...corpo, substituir: { id: correcao.id, resumoHash: correcao.resumoHash } } : corpo;
      const r = await fetch(caminho, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(comando) });
      const dados = await r.json(); if (!r.ok) throw new Error(dados.erro ?? "Não foi possível confirmar a operação fiscal.");
      setAtual(dados); setConfirmado(false); setCorrecao(null);
      setEmissoes(anteriores => [dados, ...anteriores.filter(item => item.id !== dados.id).map(item => item.id === correcao?.id ? { ...item, status: "SUBSTITUIDA" } : item)]);
    } catch (e) { setErro(e instanceof Error ? e.message : "Falha fiscal. Consulte antes de repetir."); }
    finally { setOcupado(false); }
  }
  return <Secao titulo="Emissão direta de NF-e" descricao="Prepare e revise. O Lojas transmite à SEFAZ usando o A1 desta loja.">
    {erro && <p role="alert" className="break-words rounded-lg bg-red-50 p-3 text-sm text-red-900">{erro}</p>}
    {correcao && <p role="status" className="rounded-lg bg-amber-50 p-3 text-sm text-amber-950">Corrigindo NF-e {correcao.numero} • série {correcao.serie} • {correcao.ambiente === "1" ? "Produção" : "Homologação"}. Informe a mesma numeração no formulário ou no XML revisado. A versão anterior será preservada. <button type="button" className="underline" onClick={() => setCorrecao(null)}>Cancelar correção</button></p>}
    {conferencia && <FormularioNfeVenda conferencia={conferencia} ocupado={ocupado} preparar={corpo => void acionar("/api/painel/fiscal/emissoes", corpo)} />}
    <details className="min-w-0 rounded-xl border border-border p-3"><summary className="cursor-pointer font-medium">Importar rascunho XML revisado</summary><div className="mt-3 grid min-w-0 gap-3"><p className="text-sm">NF-e modelo 55, sem assinatura e sem protocolo anterior. Confira tributação e numeração. A preparação apenas assina e permite revisar antes do envio.</p><input aria-label="Rascunho XML da NF-e" type="file" accept=".xml,application/xml,text/xml" disabled={ocupado} onChange={async e => { const file = e.target.files?.[0]; setXml(""); if (!file) return; if (file.size > 1024 * 1024) { setErro("XML acima de 1 MB."); return; } try { setXml(await file.text()); } catch { setErro("Não foi possível ler o XML."); } }} /><button type="button" className="btn-secundario" disabled={ocupado || !xml} onClick={() => void acionar("/api/painel/fiscal/emissoes", { xml, ...(pedidoId ? { pedidoId } : {}) })}>Preparar e assinar rascunho</button></div></details>
    {atual && <div className="grid min-w-0 gap-3 rounded-xl border border-border p-4" role="region" aria-label="Revisão da NF-e preparada">
      <strong>{atual.ambiente === "1" ? "PRODUÇÃO • documento fiscal real" : "HOMOLOGAÇÃO • sem valor fiscal"}</strong>
      <p className="text-sm">NF-e {atual.numero} • série {atual.serie} • R$ {atual.total.replace(".", ",")}</p><p className="break-words text-sm">Destinatário {atual.destinatarioNome} • {atual.destinatarioDocumento}</p><p className="break-all text-xs">Chave {atual.chave}</p>
      <p role="status" className="break-words text-sm">{SITUACOES[atual.status] ?? "Confira a situação"}{atual.codigo ? ` • ${atual.codigo}` : ""}{atual.motivo ? ` • ${atual.motivo}` : ""}</p>
      {atual.protocolo && <p className="break-all text-sm">Protocolo {atual.protocolo}</p>}
      <a href={`/api/painel/fiscal/emissoes/${atual.id}?formato=rascunho`} className="text-sm underline">Baixar XML assinado para conferência</a>
      {atual.status === "PREPARADA" ? <><label className="flex gap-2 text-sm"><input type="checkbox" checked={confirmado} onChange={e => setConfirmado(e.target.checked)} disabled={ocupado} />Conferi o XML assinado, a operação, os tributos, o destinatário, a numeração e o ambiente desta NF-e. Autorizo o envio à SEFAZ.</label><button type="button" className="btn-primario" disabled={ocupado || !confirmado} onClick={() => void acionar(`/api/painel/fiscal/emissoes/${atual.id}`, { acao: "emitir", confirmacao: true, resumoHash: atual.resumoHash, ambiente: atual.ambiente })}>{ocupado ? "Enviando…" : atual.ambiente === "1" ? "Emitir NF-e em produção" : "Emitir NF-e em homologação"}</button></> : <button type="button" className="btn-secundario" disabled={ocupado || atual.status === "SUBSTITUIDA"} onClick={() => void acionar(`/api/painel/fiscal/emissoes/${atual.id}`, { acao: "consultar" })}>{ocupado ? "Consultando…" : "Consultar situação na SEFAZ"}</button>}
      {["PREPARADA", "REJEITADA"].includes(atual.status) && <button type="button" className="btn-secundario" disabled={ocupado} onClick={() => { setCorrecao(atual); setAtual(null); setConfirmado(false); }}>Corrigir preparação desta NF-e</button>}
      {["AUTORIZADA", "CANCELADA"].includes(atual.status) && <div className="flex flex-wrap gap-3 text-sm"><a href={`/api/painel/fiscal/emissoes/${atual.id}?formato=xml`} className="underline">Baixar XML autorizado</a>{atual.status === "AUTORIZADA" && <a href={`/api/painel/fiscal/emissoes/${atual.id}?formato=pdf`} className="underline">Baixar DANFE</a>}</div>}
    </div>}
    {emissoes.length > 0 && <ul className="grid min-w-0 gap-2">{emissoes.map(item => <li key={item.id} className="flex min-w-0 flex-wrap items-center justify-between gap-2 rounded-lg border border-border p-3 text-sm"><span className="min-w-0 break-words">NF-e {item.numero} • série {item.serie} • {item.ambiente === "1" ? "Produção" : "Homologação"} • {SITUACOES[item.status] ?? "Confira a situação"}</span><button type="button" className="btn-secundario" disabled={ocupado} onClick={() => { setAtual(item); setConfirmado(false); setCorrecao(null); }}>Revisar NF-e {item.numero}</button></li>)}</ul>}
  </Secao>;
}
