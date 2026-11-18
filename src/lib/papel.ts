/**
 * Papéis de quem entra no painel da loja.
 *
 * Fica fora de `operadores.ts` porque `sessao.ts` precisa converter o papel
 * guardado no banco, e `operadores.ts` já importa `sessao.ts`: ler daqui evita
 * o ciclo entre os dois.
 */
export type Papel = "DONO" | "GERENTE" | "OPERADOR";

/**
 * Papel guardado no banco → papel que vale na sessão.
 *
 * Valor desconhecido cai em `OPERADOR`, o de menos poder: erro de digitação ou
 * papel antigo nunca pode abrir mais acesso do que o combinado.
 */
export function papelDe(valor: string | null | undefined): Papel {
  return valor === "DONO" || valor === "GERENTE" ? valor : "OPERADOR";
}
