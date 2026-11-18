/**
 * GTIN-13 (EAN-13) a partir do prefixo de empresa da GS1 Brasil.
 *
 * Só monta o número: quem atribui o prefixo é a GS1. Sem prefixo contratado,
 * nenhum número daqui vale no Google nem nos marketplaces, que conferem o
 * cadastro da GS1. Por isso a função recusa prefixo que não seja brasileiro
 * (789 ou 790) e nunca devolve número "de teste".
 */

/** Dígito verificador do GTIN: pesos 3 e 1, da direita para a esquerda, sobre os dígitos sem ele. */
export function digitoVerificadorGtin(semDigito: string): number {
  if (!/^\d+$/.test(semDigito)) throw new Error("O GTIN só tem dígitos.");
  let soma = 0;
  for (let i = 0; i < semDigito.length; i++) {
    const digito = Number(semDigito[semDigito.length - 1 - i]);
    soma += digito * (i % 2 === 0 ? 3 : 1);
  }
  return (10 - (soma % 10)) % 10;
}

/** O número tem 8, 12, 13 ou 14 dígitos e o último confere? */
export function gtinValido(gtin: string): boolean {
  if (!/^(\d{8}|\d{12}|\d{13}|\d{14})$/.test(gtin)) return false;
  return digitoVerificadorGtin(gtin.slice(0, -1)) === Number(gtin.at(-1));
}

/**
 * EAN-13 = prefixo da empresa + referência do item (preenchida com zeros) +
 * dígito verificador. A referência vem de um contador seu, nunca repetida.
 */
export function gerarEan13(prefixoEmpresa: string, referenciaDoItem: number): string {
  if (!/^(789|790)\d{4,9}$/.test(prefixoEmpresa)) {
    throw new Error("Prefixo da GS1 Brasil inválido: precisa começar com 789 ou 790 e ter de 7 a 12 dígitos.");
  }
  const tamanhoDaReferencia = 12 - prefixoEmpresa.length;
  if (!Number.isInteger(referenciaDoItem) || referenciaDoItem < 0 || String(referenciaDoItem).length > tamanhoDaReferencia) {
    throw new Error(`A referência do item precisa ter até ${tamanhoDaReferencia} dígitos com este prefixo.`);
  }
  const base = prefixoEmpresa + String(referenciaDoItem).padStart(tamanhoDaReferencia, "0");
  return base + digitoVerificadorGtin(base);
}
