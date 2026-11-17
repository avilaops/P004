import { HERO_RODAS, type LayoutRodas, type LojaRodas, type ProdutoRodas } from "./rodas-modelo";

/** Catálogo ilustrativo da prévia. Não grava nem substitui produtos da loja. */
export function demonstracaoRodas(layout: LayoutRodas) {
  const categorias = [
    { slug: "rodas", nome: "Rodas de liga leve", imagem: "/media/bereta/categories/rodas.webp" },
    { slug: "pneus", nome: "Pneus esportivos", imagem: "/media/bereta/categories/pneus.webp" },
    { slug: "conjuntos", nome: "Conjuntos de rodas", imagem: "/media/templates-rodas/racing-hero.png" },
    { slug: "rodas-suv", nome: "Rodas para SUV", imagem: null },
    { slug: "pneus-suv", nome: "Pneus para SUV", imagem: null },
  ];
  const loja: LojaRodas = {
    nome: "Bereta Rodas", slug: "demonstracao-rodas", logo: null, layout, categorias, vende: true,
    telefone: "Atendimento", telefoneUri: null, email: null, endereco: null,
    whatsapp: null, aviso: "Catálogo de demonstração • nenhum pedido real",
    identificacao: ["Catálogo ilustrativo de demonstração"],
  };
  const modelos = [
    { nome: "Roda esportiva grafite", imagem: "roda-1-transparente.png", marca: "Rodas" },
    { nome: "Pneu esportivo", imagem: "pneu-1-transparente.png", marca: "Pneus" },
    { nome: "Roda multirraios prata", imagem: "roda-2-transparente.png", marca: "Rodas" },
    { nome: "Conjunto roda e pneu", imagem: "conjunto-1-transparente.png", marca: "Conjuntos" },
  ];
  const produtos: ProdutoRodas[] = Array.from({ length: 12 }, (_, i) => {
    const modelo = modelos[i % modelos.length];
    const preco = 28900 + i * 1700;
    return {
      id: `demo-rodas-${i + 1}`, slug: `produto-demonstracao-${i + 1}`,
      nome: `${modelo.nome} ${i + 1}`, descricao: "Confira as medidas e a aplicação na ficha do produto.",
      imagem: `/media/templates-rodas/demo/${modelo.imagem}`, seloImagem: null,
      marca: modelo.marca, preco, precoAnterior: i >= 5 ? preco + 6000 : null,
      oferta: i >= 5, adicionar: true, pedido: false,
    };
  });
  return {
    loja, produtos, marcas: ["Goodyear", "Pirelli", "Yokohama", "Michelin"],
    banners: [{ imagem: HERO_RODAS[layout], alt: "Banner ilustrativo da coleção", link: "/produtos" }],
    sobre: "Demonstração de layout para comparar rodas, pneus e acessórios.",
  };
}
