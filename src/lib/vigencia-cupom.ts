type Vigencia = { ativo: boolean; validoAte: string | Date | null; usos: number; usosMax: number | null };

export function estadoCupom(cupom: Vigencia, agora = new Date()) {
  if (!cupom.ativo) return "inativo";
  if (cupom.validoAte && new Date(cupom.validoAte) < agora) return "vencido";
  if (cupom.usosMax !== null && cupom.usos >= cupom.usosMax) return "esgotado";
  return "vigente";
}
