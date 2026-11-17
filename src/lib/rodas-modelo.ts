import type { Categoria, Produto, Tenant } from "@prisma/client";
import type { IdentidadePublica } from "./identidade-publica";
import type { TemaLoja } from "./tema";
import { ehTemplateRodas } from "./templates-rodas";
import { dispensavelADistancia, emPromocao, estadoDeVenda } from "./produto-regras";
import { seloDaImagem } from "./imagem-origem";

export type LayoutRodas = Extract<TemaLoja["layout"], `rodas-${string}`>;
export interface CategoriaRodas { nome: string; slug: string; imagem: string | null }
export interface LojaRodas {
  nome: string; slug: string; logo: string | null; layout: LayoutRodas;
  categorias: CategoriaRodas[]; vende: boolean; telefone: string | null;
  telefoneUri: string | null; email: string | null; endereco: string | null;
  whatsapp: string | null; aviso: string | null;
  identificacao: string[];
}
export interface ProdutoRodas {
  id: string; slug: string; nome: string; descricao: string | null;
  imagem: string | null; seloImagem: string | null; preco: number;
  precoAnterior: number | null; oferta: boolean; marca: string | null;
  adicionar: boolean; pedido: boolean;
}
export interface BannerRodas { imagem: string; alt: string; link: string }

/** Projeções públicas: nenhum token ou campo privado chega aos componentes. */
export function montarLojaRodas(t: Tenant, tema: TemaLoja, categorias: Categoria[], vende: boolean, identidade?: IdentidadePublica): LojaRodas {
  return {
    nome: t.nome, slug: t.slug, logo: t.logoUrl,
    layout: ehTemplateRodas(tema.layout) ? tema.layout : "rodas-street",
    categorias: categorias.map(c => ({ nome: c.nome, slug: c.slug, imagem: c.imagemUrl })),
    vende, telefone: identidade?.telefone?.exibicao ?? null,
    telefoneUri: identidade?.telefone?.uri ?? null, email: identidade?.email ?? null,
    endereco: identidade?.enderecoVisita?.texto ?? null,
    whatsapp: identidade?.whatsapp?.url ?? null, aviso: t.avisoTopo,
    identificacao: [identidade?.razaoSocial || t.nome, identidade?.cnpj ? `CNPJ ${identidade.cnpj}` : null].filter((valor): valor is string => Boolean(valor)),
  };
}

export function montarProdutoRodas(p: Produto, vende: boolean, temWhatsapp: boolean): ProdutoRodas {
  const estado = estadoDeVenda(p, { vende });
  const adicionar = dispensavelADistancia(p) && p.opcoes.length === 0
    && (estado.acao === "carrinho" || (estado.acao === "pedido" && temWhatsapp));
  return {
    id: p.id, slug: p.slug, nome: p.nome, descricao: p.descricaoCurta,
    imagem: p.imagens[0] || null, seloImagem: seloDaImagem(p.imagemOrigem, p.imagens.length > 0),
    preco: p.precoCentavos, precoAnterior: emPromocao(p) ? p.precoDeCentavos : null,
    oferta: emPromocao(p), marca: p.marca, adicionar, pedido: estado.acao === "pedido",
  };
}

export const HERO_RODAS: Record<LayoutRodas, string> = {
  "rodas-street": "/media/templates-rodas/street-hero.png",
  "rodas-racing": "/media/templates-rodas/racing-hero.png",
  "rodas-night": "/media/templates-rodas/night-hero.png",
  "rodas-carbon": "/media/templates-rodas/carbon-hero.png",
};

export function bannersRodas(tema: TemaLoja, banner: string | null): BannerRodas[] {
  const campanhas = (tema.campanhasHome ?? []).filter(c => c.imagemUrl);
  if (campanhas.length) return campanhas.map(c => ({ imagem: c.imagemUrl, alt: c.alt, link: c.link }));
  const layout = ehTemplateRodas(tema.layout) ? tema.layout : "rodas-street";
  return [{ imagem: banner || HERO_RODAS[layout], alt: "Coleção de rodas e pneus", link: "/produtos" }];
}
