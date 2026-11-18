import type { Cupom } from "@prisma/client";
import type { ItemCarrinho } from "@avilaops/checkout";
import { prisma } from "./db";
import { estadoCupom } from "./vigencia-cupom";

/**
 * Cupons. O desconto é sempre calculado no servidor a partir do código; a
 * tela só mostra. FRETE_GRATIS é tratado em frete.ts (zera a opção mais barata).
 */
export function normalizarCodigo(c: string) {
  return c.trim().toUpperCase().replace(/\s+/g, "");
}

export type MotivoCupom = "nao_encontrado" | "inativo" | "vencido" | "esgotado" | "minimo";

export async function buscarCupomValido(tenantId: string, codigo: string, subtotal: number): Promise<{ cupom: Cupom } | { erro: MotivoCupom; minimo?: number }> {
  const c = await prisma.cupom.findUnique({ where: { tenantId_codigo: { tenantId, codigo: normalizarCodigo(codigo) } } });
  if (!c) return { erro: "nao_encontrado" };
  const estado = estadoCupom(c);
  if (estado !== "vigente") return { erro: estado };
  if (subtotal < c.minimoCentavos) return { erro: "minimo", minimo: c.minimoCentavos };
  return { cupom: c };
}

export function descontoDoCupom(c: Cupom, itens: ItemCarrinho[]): number {
  const subtotal = itens.reduce((s, i) => s + i.precoUnitario * i.quantidade, 0);
  if (c.tipo === "PERCENTUAL") return Math.min(subtotal, Math.round((subtotal * Math.min(100, Math.max(0, c.valor))) / 100));
  if (c.tipo === "FIXO") return Math.min(subtotal, c.valor);
  return 0; // FRETE_GRATIS não mexe no subtotal
}

export const MENSAGEM_CUPOM: Record<MotivoCupom, string> = {
  nao_encontrado: "Cupom não encontrado.",
  inativo: "Este cupom não está mais ativo.",
  vencido: "Este cupom venceu.",
  esgotado: "Este cupom já atingiu o limite de usos.",
  minimo: "Este cupom exige um valor mínimo de compra.",
};
