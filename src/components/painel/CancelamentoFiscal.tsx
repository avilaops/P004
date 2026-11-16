"use client";

import { useEffect, useState } from "react";
import type { ResumoEmissao } from "@/lib/fiscal-emissao";
import type { obterCancelamentoNfe } from "@/lib/fiscal-cancelamento";
type Emissao = Omit<ResumoEmissao, "criadoEm" | "atualizadoEm"> & { criadoEm: string; atualizadoEm: string };
type Situacao = Awaited<ReturnType<typeof obterCancelamentoNfe>>;
const ESTADOS: Record<string, string> = { PREPARADA: "Intenção registrada", ENVIANDO: "Enviando • consulte antes de repetir", ACEITA: "Cancelamento aceito pela SEFAZ", REJEITADA: "Cancelamento rejeitado", PENDENTE_CONFERENCIA: "Cancelamento ainda não confirmado", CONFIRMADA_CONSULTA: "NF-e cancelada • situação confirmada por consulta", SUBSTITUIDA: "Tentativa anterior preservada" };

export default function CancelamentoFiscal({ emissao, ocupado, atualizar }: { emissao: Emissao; ocupado: boolean; atualizar: (doc: Emissao) => void }) {
  const [situacao, setSituacao] = useState<Situacao | null>(null), [erro, setErro] = useState("");
  const [justificativa, setJustificativa] = useState(""), [confirmacao, setConfirmacao] = useState(false), [enviando, setEnviando] = useState(false);
  const [revisar, setRevisar] = useState(false);
  const url = `/api/painel/fiscal/emissoes/${encodeURIComponent(emissao.id)}/cancelamento`;
  useEffect(() => {
    const controle = new AbortController();
    void fetch(url, { cache: "no-store", signal: controle.signal }).then(async r => {
      const dados = await r.json(); if (!r.ok) throw new Error(dados.erro ?? "Falha ao consultar cancelamento.");
      setSituacao(dados);
    }).catch(e => { if (!controle.signal.aborted) setErro(e instanceof Error ? e.message : "Falha ao consultar cancelamento."); });
    return () => controle.abort();
  }, [url, emissao.status]);
  const cancelamento = situacao?.cancelamento;
  const podeSolicitar = emissao.status === "AUTORIZADA" && situacao && (!cancelamento || revisar && cancelamento.status === "REJEITADA");
  async function solicitar() {
    if (ocupado || enviando || !podeSolicitar || !confirmacao) return;
    setEnviando(true); setErro(""); setConfirmacao(false);
    try {
      const r = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ confirmacao: true, ambiente: emissao.ambiente, resumoHash: emissao.resumoHash, justificativa, ...(revisar && cancelamento ? { anterior: { id: cancelamento.id, resumoHash: cancelamento.resumoHash } } : {}) }) });
      const dados = await r.json(); if (!r.ok) throw new Error(dados.erro ?? "Não foi possível confirmar o cancelamento.");
      setSituacao(dados); setRevisar(false); atualizar(dados.emissao);
    } catch (e) { setErro(e instanceof Error ? e.message : "Falha no cancelamento. Consulte antes de repetir."); }
    finally { setEnviando(false); }
  }
  return <div className="grid min-w-0 gap-3 rounded-lg border border-border p-3" role="region" aria-label="Cancelamento fiscal da NF-e">
    <h3 className="text-sm font-medium">Cancelamento na SEFAZ</h3>
    <p className="text-xs text-muted-foreground">O cancelamento fiscal não estorna pagamentos nem movimenta estoque. A SEFAZ valida o prazo e as condições da operação.</p>
    {erro && <p role="alert" className="break-words text-sm text-red-900">{erro}</p>}
    {!situacao && !erro && <p role="status" className="text-sm">Consultando o registro do cancelamento…</p>}
    {cancelamento && <div className="grid gap-2 text-sm"><p role="status">{ESTADOS[cancelamento.status] ?? "Consulte a situação"}{cancelamento.codigo ? ` • ${cancelamento.codigo}` : ""}{cancelamento.motivo ? ` • ${cancelamento.motivo}` : ""}</p><p className="break-words">Justificativa registrada: {cancelamento.justificativa}</p>{cancelamento.protocolo && <p className="break-all">Protocolo do cancelamento {cancelamento.protocolo}</p>}{cancelamento.status === "ACEITA" && <a href={`${url}?formato=xml`} className="underline">Baixar comprovante do cancelamento</a>}{cancelamento.status === "REJEITADA" && emissao.status === "AUTORIZADA" && !revisar && <button type="button" className="btn-secundario" disabled={ocupado || enviando} onClick={() => { setRevisar(true); setJustificativa(cancelamento.justificativa); setConfirmacao(false); }}>Revisar cancelamento rejeitado</button>}{["ENVIANDO", "PENDENTE_CONFERENCIA"].includes(cancelamento.status) && <p>Use “Consultar situação na SEFAZ” para conferir o resultado. A solicitação não será reenviada automaticamente.</p>}</div>}
    {podeSolicitar && <details><summary className="cursor-pointer text-sm font-medium">{revisar ? "Nova tentativa de cancelamento" : "Solicitar cancelamento desta NF-e"}</summary><div className="mt-3 grid gap-3"><label className="grid gap-1 text-sm">Justificativa do cancelamento<textarea minLength={15} maxLength={255} required value={justificativa} onChange={e => { setJustificativa(e.target.value); setConfirmacao(false); }} className="min-h-24 rounded-lg border border-border bg-background p-2" disabled={ocupado || enviando} /></label><label className="flex gap-2 text-sm"><input type="checkbox" checked={confirmacao} onChange={e => setConfirmacao(e.target.checked)} disabled={ocupado || enviando} />Confirmo o cancelamento desta NF-e na SEFAZ e a justificativa informada.</label><button type="button" className="btn-secundario" disabled={ocupado || enviando || !confirmacao || justificativa.trim().length < 15} onClick={() => void solicitar()}>{enviando ? "Solicitando…" : emissao.ambiente === "1" ? "Cancelar NF-e em produção" : "Cancelar NF-e em homologação"}</button></div></details>}
    {situacao && situacao.historico.length > 1 && <details className="text-xs"><summary className="cursor-pointer">Histórico das tentativas de cancelamento</summary><ul className="mt-2 grid gap-2">{situacao.historico.map(item => <li key={item.id} className="break-words">{ESTADOS[item.status] ?? item.status} • {item.justificativa}{item.codigo ? ` • ${item.codigo}` : ""}</li>)}</ul></details>}
  </div>;
}
