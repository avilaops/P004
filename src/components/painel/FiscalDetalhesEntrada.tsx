import type { ItemNotaEntrada } from "@/lib/fiscal-entrada-xml";

export function DetalhesItemFiscal({ item }: { item: ItemNotaEntrada }) {
  return <details className="min-w-0 text-sm">
    <summary className="cursor-pointer font-medium">Descontos, despesas e tributos declarados</summary>
    <dl className="mt-2 grid grid-cols-2 gap-2">
      {[["CEST", item.cest ?? "Não informado"], ["Desconto", item.desconto], ["Frete", item.frete], ["Seguro", item.seguro], ["Outras despesas", item.outrasDespesas]].map(([nome, valor]) => <div key={nome}><dt className="text-xs text-muted-foreground">{nome}</dt><dd className="break-words">{valor}</dd></div>)}
    </dl>
    <ul className="mt-3 grid gap-2">{item.tributos.map(t => <li key={t.tipo} className="break-words">{t.tipo} • CST/CSOSN {t.codigo ?? "Não informado"} • base {t.base ?? "Não informada"} • alíquota {t.aliquota ?? "Não informada"} • valor {t.valor ?? "Não informado"}</li>)}</ul>
    <p className="mt-2 text-xs text-muted-foreground">Valores do XML em reais. Tributos declarados não representam crédito fiscal nem cálculo do custo de aquisição.</p>
  </details>;
}

/** Conversão decimal exata para o contrato em centavos, sem arredondar entradas. */
export function centavosInformados(valor: string): number | null {
  if (!/^\d{1,8}(?:[.,]\d{1,2})?$/.test(valor)) return null;
  const [inteiro, fracao = ""] = valor.replace(",", ".").split(".");
  const centavos = Number(inteiro) * 100 + Number(fracao.padEnd(2, "0"));
  return centavos <= 2_147_483_647 ? centavos : null;
}
