/** Decimal sem agrupamento, no intervalo de um inteiro PostgreSQL em centavos. */
export function centavosInformados(valor: string): number | null {
  if (!/^\d{1,8}(?:[.,]\d{1,2})?$/.test(valor)) return null;
  const [inteiro, fracao = ""] = valor.replace(",", ".").split(".");
  const centavos = Number(inteiro) * 100 + Number(fracao.padEnd(2, "0"));
  return centavos <= 2_147_483_647 ? centavos : null;
}

export function precoDoCatalogoEmCentavos(entrada: string): number | null {
  const texto = entrada.trim();
  const valor = texto.replace(/^R\$\s*/i, "");
  // O ponto sozinho com três dígitos é ambíguo. Com vírgula decimal ou R$,
  // grupos completos de três dígitos representam milhares.
  if (/^\d{1,3}(?:\.\d{3})+(?:,\d{1,2})?$/.test(valor) && (valor.includes(",") || valor !== texto)) {
    return centavosInformados(valor.replaceAll(".", ""));
  }
  return centavosInformados(valor.replace(/^([.,])/, "0$1"));
}
