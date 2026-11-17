# Bereta Rodas • Carbon em produção

## Entrega

Carbon foi implementado em TypeScript/TSX e Next.js, integrado pela
[PR274](https://github.com/avilaops/P004/pull/274). A
[PR275](https://github.com/avilaops/P004/pull/275) aplicou a orientação explícita
do proprietário para retirar o limite de um minuto do CI/CD.

- Endereço público único: `https://beretarodas.com`.
- Revisão executada: `b2d87fd2bc12c78a3ba9bf6a7033824e2306a725`.
- Imagem: `ghcr.io/avilaops/lojas.avilaops.com@sha256:8a7ad9ccb2735ca6a1aea6eb67b77ba319477923a200b7c546f7abbb9a849fa0`.
- [CI de produção 44133809562](https://github.com/avilaops/P004/actions/runs/44133809562)
  aprovado integralmente, incluindo publicação, deploy e fumaça.
- Saúde HTTP 200, banco `ok`, container `healthy` e label da revisão conferidos.

A revisão independente não identificou bloqueadores na integração Carbon,
nos ajustes de QA nem na retirada do limite. Builds e testes foram executados
exclusivamente no GitHub CI. A inspeção de produção foi feita pelo navegador
e por leituras administrativas/HTTP; nenhum pedido ou pagamento real foi criado.

## Domínio e origem

O tenant `bereta-rodas` usa `beretarodas.com` como domínio principal. DNS web
do apex e do `www` foi apontado para a origem Lojas. Foi necessário retirar
as duas associações de domínio do Pages: mesmo após a troca do CNAME e purge,
as associações ainda serviam a página institucional anterior. O projeto Pages
e suas implantações foram preservados para reversão; não representam a
experiência pública atual.

As páginas em `www.beretarodas.com` e `loja.beretarodas.com` retornam 308 para
o apex, preservando caminho e consulta. Rotas legadas de API permanecem
atendidas para não interromper integrações. Verificação real:

| Recurso | Resultado |
| --- | --- |
| `/` no apex | 200 • Carbon, banner dourado e catálogo real |
| `/api/health` | 200 • banco saudável |
| Alias `/produtos?q=KRMAI%20R81&pagina=2` | 308 • mesmo caminho e consulta no apex |
| `/robots.txt` e `/sitemap.xml` | 200 • URLs do apex, sem subdomínio antigo |
| `/opengraph-image` | 200 • `image/png` |
| `/og.jpg` antigo | 301 para `/opengraph-image` |
| `/contato` e `/sobre` | 200 |

Canonical da home e dos produtos usa o apex. TLS foi verificado por requisições
HTTPS normais, sem desabilitar validação de certificado. E-mail e demais
registros DNS foram preservados. Snapshots anteriores de tema, domínio e DNS
ficaram no workspace operacional; reativar o Pages exige reassociar seus
domínios e aguardar a validação, além de restaurar o DNS.

## Banner escolhido durante a conferência

O proprietário pediu manter Carbon, usar a imagem do Racing e gerar uma foto
bonita. Foi usada a ferramenta integrada **imagegen**, sem CLI/API alternativa.
A nova arte de coleção mostra uma roda dourada à direita e área escura para
texto à esquerda. Não é apresentada como foto de um SKU.

- Original: `artifacts/carbon-bereta/banner-racing-dourado.png` no workspace.
- Publicada: [banner WebP](https://beretarodas.com/uploads/bereta-rodas/banner-racing-dourado-20261117-2eee9a6eb156.webp).
- WebP de 1600 px, qualidade 82, **71.538 bytes**, codificado com o mesmo padrão
  usado pelo ingresso de imagens da aplicação. Original: 2.061.817 bytes.
- SHA-256: `2eee9a6eb15691d622d2793a7cd6fc92be51caa2db34dba46db786f216eedfed`.
- Layout continua `rodas-carbon`; texto: “RODAS PARA” • “O SEU ESTILO”.
- Mídia publicada no volume persistente já utilizado pela loja; não depende
  de arquivo temporário, pasta de geração ou nova imagem Docker.

Prompt usado na geração, com quebras de linha apenas para leitura:

```text
Create a beautiful premium photoreal automotive e-commerce HERO PHOTOGRAPH
for Brazilian wheel store Bereta Rodas, inspired by a racing alloy-wheel
collection. This is a new standalone image asset, NOT a screenshot or a
website mockup. Extra wide panoramic 3:1 composition, ideally 2400 x 800.
A single magnificent champagne-gold forged multi-spoke alloy wheel with
a subtly visible black performance tire, large, physically precise, shot
at a slight three-quarter angle, on the RIGHT 58% of the frame; cropped
elegantly by the far right edge, convincing hub and lug holes, thin machined
spokes, immaculate metallic reflections and realistic studio shadows.
The LEFT 42% must be dark charcoal / almost black clean negative space,
with a restrained brushed gunmetal background and subtle light falloff,
so real HTML white text can be overlaid there. Background gradually
transitions into elegant satin silver-gray metal behind the wheel on the
right, reminiscent of a refined racing workshop campaign. Dramatic but
tasteful softbox lighting, warm gold highlights, controlled contrast,
high-end commercial product photography, sophisticated and crisp, not a
flashy poster. No logos, no branded center cap, no letters, no text,
no numbers, no watermark, no UI, no button, no borders, no extra wheels,
no car. This is illustrative collection artwork, not a photograph of a
particular SKU. Keep all important wheel detail within the center-right
safe area so the photograph also crops gracefully on a mobile hero.
```

## Catálogo real e seleção da home

A loja mantém 8.426 produtos, com 6.473 ativos. A home herdava seis destaques sem
foto. Foram desmarcados esses seis e selecionados nove produtos existentes
com imagens cadastradas: SKUs 4039, 2321, 1531, 2372, 4379, 6452, 7309, 7738 e 4212.
Foram usados os trilhos administrativos existentes, sem escrita direta no
banco. A resposta confirmou zero criações e 15 atualizações editoriais.

A releitura dos 15 registros, comparando os campos públicos com o snapshot
anterior e excluindo somente `destaque`/`atualizadoEm`, confirmou preços,
estoque, disponibilidade, nomes, URLs, imagens e classificação preservados.
As nove fotos foram conferidas por HTTP 200 e decodificação no navegador.
As fotos representativas mantêm o selo **Foto de série**; não foram atribuídas
fotos de outro produto nem usadas imagens geradas nos cartões do catálogo.

## Verificação visual e navegação

Inspeção real de `https://beretarodas.com`, em 1440×1000 e 390×844:

- Carbon, novo banner e nove fotos carregadas.
- Três colunas no desktop, duas no celular, lateral ocultada no celular.
- Ausência de overflow horizontal na home e no carrinho.
- Categoria Rodas e detalhe do produto apontam para dados reais.
- Busca `KRMAI R81` preserva o termo e permanece no domínio principal.
- Adicionar ao carrinho, abrir e remover o produto funcionam no celular.
- Carrinho de inspeção isolado terminou vazio; nenhuma exceção de página.

Capturas em `artifacts/carbon-bereta-producao/` no workspace de apresentação:
`carbon-racing-desktop.png`, `carbon-racing-mobile.png` e
`carbon-racing-mobile-topo.png`. São capturas de produção; nenhum DOM/CSS foi
alterado para gerar as imagens. Imagens assíncronas foram decodificadas antes
da captura completa. Dois avisos de preload de medição foram observados;
não houve erro de console ou falha de navegação nos fluxos conferidos.

Retenção e tempos: [auditoria de CI/CD](ci-cd-retencao-lojas-2026-11-17.md).
Estado final • concluído, sem pendência obrigatória da entrega Carbon.

## Atualização posterior • paleta amarela

Após esta entrega, o proprietário pediu trocar vermelho por amarelo. A
atualização foi publicada e conferida com `#f5c518` e texto `#17181b`,
mantendo o Carbon e o banner. A revisão atual e a evidência dessa alteração
estão em [paleta amarela](bereta-carbon-amarelo-2026-11-17.md).
