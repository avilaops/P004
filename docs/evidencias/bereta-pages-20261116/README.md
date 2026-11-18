# Bereta • migração e descoberta pública

Verificação em 16/11/2026. Responsável: agente Codex (`codex`).

## Continuação • remover modal automático

Por solicitação explícita do proprietário, removido o gatilho de primeira
visita que atribuía `zaraz.consent.modal = true`. A tela não abre mais ao
entrar no institucional. Preferências continuam disponíveis pelo botão do
rodapé, sem presumir aceite. Alteração de três linhas em CookiePreferences,
commit `157b2818eb17953b3bb09920f9122c145aafa32f`, publicado pela CI
`43897268810`. Preservada a integração de mensuração adicionada pela PR3.

## Continuação • imagem de compartilhamento da loja

Após o proprietário comparar os previews no WhatsApp, a imagem amarela gerada
pela loja foi substituída, no endereço público de compartilhamento, pela mesma
foto do letreiro Bereta Box usada pelo institucional. Implementação pela regra
Cloudflare `1247e28d1c4e429ba5ef14d228a51696` no ruleset
`7535b2fb81aa4ee69a72a928fb902087`: somente host `loja.beretarodas.com` e caminho
exato `/opengraph-image`, redirecionamento 302 para
`https://beretarodas.com/og.jpg`, descartando o query antigo da imagem.

As tags Open Graph e Twitter da loja já apontam para esse endpoint. O destino
retorna HTTP 200, JPEG 1200×630, inclusive em requisição com User-Agent WhatsApp.
Os bytes recuperados pelos dois endereços têm SHA-256 idêntico:
`6d6ef34c9af787f7fdac90f4aa8b324f9c2605b140232d6a3950ac4d98d7b351`.
Foto final inspecionada visualmente. Sem alteração de código, banco, layout,
produto ou publicação do backend Lojas. Preview já salvo no WhatsApp pode
continuar exibindo a imagem anterior até o aplicativo renovar seu cache.

## Publicação

- Institucional: <https://beretarodas.com> no Cloudflare Pages `bereta-rodas`.
- Loja Next.js preservada: <https://loja.beretarodas.com> no servidor `applications`.
- Fonte institucional: <https://github.com/avilaops/bereta/pull/2>.
- Código publicado: `9fe01d0ec16fd5e0c3a43d0deb599eb1e1c624c0`.
- Deploy Pages: `0b99e283`; produção, publicação aprovada.
- CI final: <https://github.com/avilaops/bereta/actions/runs/43874930478>.
- Domínios `beretarodas.com`, `www.beretarodas.com` e `bereta.avilaops.com`
  ativos no Pages. Os dois últimos redirecionam com 301 para o canonical.
- `/loja` e rotas comerciais antigas redirecionam para o subdomínio da loja;
  inclui `/produtos/*`, `/categoria/*`, `/uploads/*`, carrinho e checkout.
- Cadastro da loja alterado pela API administrativa normal, sem SQL direto.
  Backup: `/opt/lojas/bereta-domain-before-pages-20261116.json`, modo 0600.
- Caddy sincronizado e validado. Cadastro final retém somente o subdomínio
  comercial dentre os três hosts da marca; apex não resolve mais a loja.
- `bereta.service` desabilitado e inativo após verificar ambos os sites com
  HTTPS 200. Arquivos antigos preservados para eventual reversão.

## Conteúdo e interface

`production.json`, baixado do artefato da mesma CI, comprova 23 páginas HTML
com seus MDX, canonical correto e conteúdo principal disponível sem executar JS.
São 24 imagens únicas; o sitemap relaciona 95 referências distribuídas nas páginas.
Sitemap de URLs contém somente os 23 HTML canônicos. `lastmod` vem do histórico
Git das fontes, sem usar a hora do build. MDX declara o canonical HTML por header
Link e frontmatter. llms.txt e llms-full.txt publicados.

Metadados individuais, Open Graph, Twitter e JSON-LD usam os dados já presentes
no institucional. Sem inventar preço, disponibilidade, avaliações ou coordenadas.
Imagem social real de 1200×630; favicons PNG 48/180/192/512 derivados do SVG da
marca existente. Ícones genéricos do antigo sandbox não entram no HTML exportado.

Navegação desktop e mobile conferida com navegador: contato, menu, empresa e
passagem para a loja. Sem overflow no celular ou erros de console no institucional.
Preview social e CTA configurados; não representam taxa de conversão comprovada.

## Descoberta

Robots institucional sem Disallow ou Content-Signal, com os dois sitemaps.
Googlebot, Googlebot-Image, OAI-SearchBot e Claude-SearchBot obtiveram 200 na home
e robots permitindo leitura, via CI. Esses testes verificam User-Agent e borda;
não simulam identidade/IP oficialmente verificados dos provedores.

Cloudflare Bot Management: proteções AI search, training, user e agents
desabilitadas; fight mode desligado e robots gerenciado desligado. Sem liberar
áreas privadas da loja. WAF permanece ativo. Regra de skip somente de Browser
Integrity Check para GET/HEAD do institucional público, nos hosts apex/www.

O Pages ainda retorna erro 1010 ao User-Agent genérico `Python-urllib/3.12`,
inclusive no domínio pages.dev. Isso persistiu com BIC desativado na zona e não
afeta os quatro agentes de busca testados. O verificador usa a identificação
explícita `BeretaPublicationVerifier/1.0 (+https://beretarodas.com)`; não se
apresenta como um bot de terceiros. BIC global da zona foi restaurado para on.

## Zaraz e mensuração

Consentimento nativo com idioma `pt`, cookie `bereta-consent` e finalidade
`analytics`. Banner aparece no institucional; modal automático global oculto
para não duplicar a interface de consentimento da loja. Botão permanente de
preferências permite reabrir. Rejeição, aceite e revogação comprovados, incluindo
Google Consent Mode atualizado para denied após revogar. Publicidade sempre denied.

GA4 usa o componente nativo `google-analytics_v4`, ferramenta `BeretaGA4`,
finalidade analytics e gatilhos restritos a apex/www. Measurement ID
`G-9E0JTVJDPC`, propriedade `564394458`. Configuração publicada explicitamente
pelo fluxo preview/publish/realtime do Zaraz e verificada no navegador.

Eventos genéricos `store_click` e `whatsapp_click` não enviam nome, veículo,
mensagem ou query de WhatsApp. Consulta realtime pelo Avila Marketing MCP
retornou page_view e um whatsapp_click após o teste consentido. Isso comprova
recebimento de teste, não eficácia comercial ou produção de leads reais.

## Search Console

Identidade conectada possui `siteOwner` de `sc-domain:beretarodas.com`.
Reenviei os quatro sitemaps e confirmei por releitura da API:

| Sitemap | Conteúdo recebido | Processamento |
| --- | --- | --- |
| `https://beretarodas.com/sitemap.xml` | 23 URLs | Sem erros ou avisos |
| `https://beretarodas.com/sitemap-imagens.xml` | 23 páginas, 95 referências de imagens | Sem erros ou avisos |
| `https://loja.beretarodas.com/sitemap.xml` | 6.483 URLs | Sem erros ou avisos |
| `https://loja.beretarodas.com/sitemap-imagens.xml` | 899 páginas e referências de imagens | Sem erros ou avisos |

A ponte MCP retornou erro de parse na resposta vazia das submissões, mas a
releitura confirmou os novos horários, download e processamento. Não houve
repetição cega da escrita. Sitemap aceito não comprova indexação de cada URL.

## Limites observados

A loja Next.js já apresentou erro React 418 durante a navegação, também no
apex enquanto ele ainda servia a loja. A migração preservou a versão da loja
`267b565663dc22c5e6b2c146f39d461b6c82720d`; nenhuma alteração de código da loja
foi publicada nesta demanda. O institucional final está sem erros de console.

Revisão independente do código institucional não encontrou bloqueios críticos
ou importantes. Testes e builds executados somente no GitHub CI. Registros
desta demanda no checkout Lojas não foram commitados na branch fiscal que já
estava em uso por outra demanda.
