const LOJAS = new Set(['beretarodas.com', 'domiriodistribuidora.com.br', 'mrgcaixastermicas.com.br', 'pkvedacoes.com.br', 'vedashow.com.br', 'vinhosimperial.com']);

/** Somente a ficha aprovada; domínios de outros lojistas mantêm sua configuração. */
export function medicaoGerenciadaPara(hostname: string): { gtmId: string } | null {
  const host = hostname.toLowerCase().replace(/:443$/, '');
  if (LOJAS.has(host) || host.startsWith('www.') && LOJAS.has(host.slice(4))) return { gtmId: 'GTM-M6JQNNMS' };
  if (host === 'lojas.avilaops.com') return { gtmId: 'GTM-MMTBHNRN' };
  return null;
}
