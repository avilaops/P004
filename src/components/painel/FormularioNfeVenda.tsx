"use client";

import { useId, useState, type FormEvent } from "react";
import type { ConferenciaFiscalPedido } from "@/lib/fiscal-pedido-contrato";
import { inputClasse } from "./campos";

export default function FormularioNfeVenda({ conferencia, ocupado, preparar }: { conferencia: ConferenciaFiscalPedido; ocupado: boolean; preparar: (corpo: unknown) => void }) {
  const prefixo = useId();
  const [pagamento, setPagamento] = useState("");
  const seletor = (nome: string, rotulo: string, opcoes: Array<[string, string]>, inicial = "") => <div className="grid min-w-0 gap-1 text-sm"><label htmlFor={`${prefixo}-${nome}`}>{rotulo}</label><select id={`${prefixo}-${nome}`} name={nome} className={inputClasse} required defaultValue={inicial} onChange={nome === "pagamento" ? e => setPagamento(e.target.value) : undefined}><option value="" disabled>Selecione após conferir</option>{opcoes.map(([v, texto]) => <option key={v} value={v}>{texto}</option>)}</select></div>;
  function enviar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const texto = (nome: string) => String(form.get(nome) ?? "");
    const cartao = ["03", "04"].includes(texto("pagamento")) ? { cartao: { integracao: texto("integracaoCartao"), cnpj: texto("cnpjCartao"), autorizacao: texto("autorizacaoCartao"), ...(texto("bandeiraCartao") ? { bandeira: texto("bandeiraCartao") } : {}) } } : {};
    preparar({ pedidoId: conferencia.dados.pedido.id, venda: { ambiente: texto("ambiente"), serie: Number(texto("serie")), numero: Number(texto("numero")), natureza: texto("natureza"), inscricaoEstadual: texto("ie"), municipioEmitente: texto("municipioEmitente"), municipioDestinatario: texto("municipioDestinatario"), tributacao: texto("tributacao"), destinatarioNaoContribuinte: form.get("naoContribuinte") === "on", semIntermediador: form.get("naoContribuinte") === "on", pagamento: texto("pagamento"), ...cartao, modalidadeFrete: texto("modalidadeFrete"), itens: conferencia.dados.itens.map(i => ({ itemId: i.id, cfop: texto(`cfop:${i.id}`), origem: texto(`origem:${i.id}`), unidade: texto(`unidade:${i.id}`), gtin: texto(`gtin:${i.id}`) })) } });
  }
  return <details className="min-w-0 rounded-xl border border-border p-3"><summary className="cursor-pointer font-medium">Preparar NF-e de venda deste pedido</summary><form onSubmit={enviar} className="mt-4 grid min-w-0 gap-4">
    <p className="text-sm">Venda online direta, sem intermediador, a consumidor final não contribuinte, no Simples Nacional, sem crédito de ICMS e sem ST. Confira o enquadramento com o responsável fiscal. Para outros perfis, importe um rascunho XML revisado.</p>
    <div className="grid min-w-0 gap-3 sm:grid-cols-2">
      {seletor("ambiente", "Ambiente da NF-e", [["2", "Homologação • sem valor fiscal"], ["1", "Produção • documento fiscal real"]], "2")}
      {([
        { nome: "serie", rotulo: "Série da NF-e", tipo: "number", min: 0, max: 999 },
        { nome: "numero", rotulo: "Número da NF-e", tipo: "number", min: 1, max: 999999999 },
        { nome: "natureza", rotulo: "Natureza da operação", tipo: "text", inicial: "Venda de mercadoria", padrao: ".{1,60}" },
        { nome: "ie", rotulo: "Inscrição estadual do emitente", tipo: "text", padrao: "[0-9]{2,14}" },
        { nome: "municipioEmitente", rotulo: "Município IBGE do emitente", tipo: "text", padrao: "[0-9]{7}" },
        { nome: "municipioDestinatario", rotulo: "Município IBGE do destinatário", tipo: "text", padrao: "[0-9]{7}" },
      ]).map(c => <label key={c.nome} className="grid min-w-0 gap-1 text-sm" htmlFor={`${prefixo}-${c.nome}`}>{c.rotulo}<input id={`${prefixo}-${c.nome}`} name={c.nome} type={c.tipo} min={c.min} max={c.max} pattern={c.padrao} defaultValue={c.inicial} className={inputClasse} required /></label>)}
      {seletor("tributacao", "Tributação revisada", [["SIMPLES_102_PIS07_COFINS07", "CRT 1 • CSOSN 102 • PIS 07 • COFINS 07"]])}
      {seletor("pagamento", "Pagamento da NF-e", [["17", "Pix"], ["15", "Boleto"], ["03", "Cartão de crédito"], ["04", "Cartão de débito"], ["01", "Dinheiro"]])}
      {seletor("modalidadeFrete", "Responsável pelo frete", [["0", "Emitente"], ["1", "Destinatário"], ["9", "Sem ocorrência de transporte"]])}
    </div>
    {["03", "04"].includes(pagamento) && <fieldset className="grid gap-3 rounded-lg border border-border p-3"><legend className="text-sm">Dados reais do pagamento com cartão</legend>{seletor("integracaoCartao", "Integração do cartão", [["1", "Integrado à automação"], ["2", "Não integrado à automação"]])}<label className="grid gap-1 text-sm">CNPJ da credenciadora<input name="cnpjCartao" className={inputClasse} pattern="[0-9]{14}" required /></label><label className="grid gap-1 text-sm">Código de autorização do cartão<input name="autorizacaoCartao" className={inputClasse} maxLength={128} required /></label><label className="grid gap-1 text-sm">Código fiscal da bandeira • se informado<input name="bandeiraCartao" className={inputClasse} pattern="[0-9]{2}" /></label></fieldset>}
    {conferencia.dados.itens.map((i, indice) => <fieldset key={i.id} className="grid min-w-0 gap-3 rounded-lg border border-border p-3"><legend className="max-w-full break-words text-sm">{indice + 1}. {i.nome}</legend><p className="text-xs">NCM {i.classificacaoAtual?.ncm || "Não informado"} • CEST {i.classificacaoAtual?.cest || "Não informado"}</p><div className="grid min-w-0 gap-3 sm:grid-cols-2">
      {seletor(`cfop:${i.id}`, `CFOP do item ${indice + 1}`, [["5102", "5102 • venda dentro da UF"], ["6102", "6102 • venda para outra UF"]])}
      {seletor(`origem:${i.id}`, `Origem do item ${indice + 1}`, ["Nacional", "Importação direta", "Estrangeira adquirida no mercado interno", "Nacional • conteúdo de importação de 40% a 70%", "Produção conforme processo produtivo básico", "Nacional • conteúdo de importação até 40%", "Importação direta sem similar nacional", "Estrangeira adquirida sem similar nacional", "Nacional • conteúdo de importação acima de 70%"].map((t, n) => [String(n), `${n} • ${t}`]))}
      <label className="grid gap-1 text-sm">Unidade fiscal do item {indice + 1}<input name={`unidade:${i.id}`} maxLength={6} className={inputClasse} required /></label>
      <label className="grid gap-1 text-sm">GTIN do item {indice + 1}<input name={`gtin:${i.id}`} maxLength={14} placeholder="Código ou SEM GTIN" className={inputClasse} required /></label>
    </div></fieldset>)}
    <label className="flex gap-2 text-sm"><input type="checkbox" name="naoContribuinte" required />Confirmei que a venda é direta, sem intermediador, o destinatário é consumidor final não contribuinte de ICMS e a tributação selecionada se aplica.</label>
    <p className="text-xs text-muted-foreground">Preços e quantidades vêm do pedido. Frete e desconto são rateados em centavos. Os endereços da empresa e do pedido precisam estar completos.</p>
    <button className="btn-secundario" disabled={ocupado}>Preparar e assinar NF-e do pedido</button>
  </form></details>;
}
