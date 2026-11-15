# Sitemap de imagens das lojas

## Objetivo e desenho

Publicar `/sitemap-imagens.xml` em cada loja pública e anunciar o endereço
canônico no robots. Reutilizar a consulta paginada e isolada por tenant do
sitemap principal. Fotos próprias e representativas exibidas no catálogo
podem entrar no arquivo separado; ilustrações e origens desconhecidas não.
Cada URL de imagem aparece uma vez, vinculada à primeira página pública do
produto na ordenação estável por id. A classificação da foto, seus avisos na
vitrine e a política de fotos próprias do sitemap principal ficam preservados.

O gerador puro normaliza URLs HTTP(S), remove duplicatas e escapa XML.
O handler não publica dados de lojas canceladas, provisionando ou desconhecidas.
O arquivo é dinâmico e não depende de cópias estáticas do catálogo.

## Plano e verificação

- [x] Registrar regressões de XML, deduplicação, origem, protocolo e robots.
- [x] Observar RED no GitHub CI; não executar testes ou builds locais.
- [x] Implementar gerador, handler e indicação no robots.
- [ ] Conferir isolamento por tenant e caminhos públicos na revisão.
- [ ] Aprovar suíte, tipos e build no GitHub CI e publicar pelo fluxo existente.
- [ ] Verificar HTTP, XML, imagens e robots em beretarodas.com.

## Limites e evidências

Responsável: agente `codex`. Stack: TypeScript/Next.js existente.
Não envolve Google Search Console, que o proprietário assumiu nesta sessão.
Comparação inicial: sitemap principal com 6.483 URLs e zero imagens;
sitemap de imagens ausente (404). Banco de produção: 975 produtos ativos
com fotos representativas, 899 URLs distintas em 15/11/2026.

RED observado na CI 43678914333, job 132705274305: robots sem o segundo
sitemap e módulo `sitemap-imagens` ausente. A parte 1/2 passou; a parte 2/2
teve exatamente essas duas falhas (824 dos 826 testes passaram).
Formato XML e teto de mil imagens por página conferidos na documentação
[Google Search Central](https://developers.google.com/search/docs/crawling-indexing/sitemaps/image-sitemaps).

CI 43679134798: unidades, PostgreSQL, tipos, lint e build passaram. QA HTTP
confirmou XML e isolamento, mas domínio-base respondeu 200 em vez de 404.
Causa confirmada: `qa-cotacoes-b2b.mts` cria uma loja com `dominios: ["localhost"]`
no mesmo banco usado pelo QA seguinte. O handler agora recusa explicitamente
o domínio-base antes de resolver tenant; a expectativa 404 foi preservada.
Revisão independente confirmou a causa e não encontrou outros bloqueios.
