"use client";

import { useState } from "react";
import { inputClasse } from "./campos";
import { centavosInformados } from "./FiscalDetalhesEntrada";

export type VarianteFiscal = { id: string; nome: string; variacao: string; sku: string | null; gtin: string | null };

export default function FiscalCadastroProduto({ documentoId, numero, descricao, selecionar, ocupado }: { documentoId: string; numero: number; descricao: string; selecionar: (variante: VarianteFiscal) => void; ocupado: (valor: boolean) => void }) {
  const [aberto, setAberto] = useState(false), [nome, setNome] = useState(descricao.slice(0, 180));
  const [preco, setPreco] = useState(""), [confirmado, setConfirmado] = useState(false), [enviando, setEnviando] = useState(false), [erro, setErro] = useState("");
  async function criar() {
    const precoCentavos = centavosInformados(preco);
    if (!confirmado || precoCentavos === null || !nome.trim() || enviando) return;
    setEnviando(true); ocupado(true); setErro("");
    try {
      const r = await fetch(`/api/painel/fiscal/documentos/${documentoId}/produtos`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ confirmacao: true, numero, nome: nome.trim(), precoCentavos }) });
      const dados = await r.json();
      if (!r.ok) throw new Error(dados.erro ?? "Não foi possível criar o produto.");
      selecionar(dados); setAberto(false);
    } catch (e) { setErro(e instanceof Error ? e.message : "Falha no cadastro."); }
    finally { setEnviando(false); ocupado(false); }
  }
  return <div className="grid min-w-0 gap-2">
    <button type="button" className="text-left text-sm underline" disabled={enviando} onClick={() => setAberto(!aberto)}>Cadastrar novo produto para o item {numero}</button>
    {aberto && <div className="grid gap-3 rounded-xl border border-border p-3">
      <label className="grid gap-1 text-sm">Nome do novo produto do item {numero}<input className={inputClasse} maxLength={180} value={nome} onChange={e => { setNome(e.target.value); setConfirmado(false); }} disabled={enviando} /></label>
      <label className="grid gap-1 text-sm">Preço de venda do item {numero} (R$)<input className={inputClasse} inputMode="decimal" value={preco} onChange={e => { setPreco(e.target.value); setConfirmado(false); }} disabled={enviando} /></label>
      <label className="flex items-start gap-2 text-sm"><input type="checkbox" checked={confirmado} onChange={e => setConfirmado(e.target.checked)} disabled={enviando} />Confirmo um produto novo no catálogo com este nome, preço e estoque inicial zero. O recebimento será confirmado separadamente.</label>
      {erro && <p role="alert" className="text-sm text-red-900">{erro}</p>}
      <button type="button" className="btn-secundario" disabled={enviando || !confirmado || !nome.trim() || centavosInformados(preco) === null} onClick={() => void criar()}>{enviando ? "Cadastrando…" : `Criar e selecionar produto do item ${numero}`}</button>
    </div>}
  </div>;
}
