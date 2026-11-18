# P004 • verificação de sitemaps

Início: 2026-11-14T22:43:45.706Z

Conclusão: 2026-11-14T22:45:14.042Z

Todos os tenants cadastrados, plataforma e aliases. XML integral; HTTP, canonical e noindex por amostragem de páginas. Sem consulta ao Search Console.

Totais: 10 lojas • 17 hosts • 12486 URLs nos sitemaps oficiais, incluindo a plataforma • 76 páginas conferidas por HTTP • 0 falhas detectadas.

| Host | Cadastro | HTTP | URLs | Páginas verificadas | Resultado |
| --- | --- | --- | --- | --- | --- |
| lojas.avilaops.com | ATIVA | 200 | 14 | 14 | Sem falhas detectadas |
| mrgcaixastermicas.com.br | ATIVA | 200 | 8 | 5 | Sem falhas detectadas |
| mrg-caixas-termicas.lojas.avilaops.com | ATIVA • alias | 200 | 8 | 0 | Sem falhas detectadas |
| vinhosimperial.com | PROVISIONANDO | 200 | 0 | 0 | Sem falhas detectadas |
| vinhos-imperial.lojas.avilaops.com | PROVISIONANDO • alias | 200 | 0 | 0 | Sem falhas detectadas |
| bereta-rodas.lojas.avilaops.com | ATIVA | 200 | 6483 | 9 | Sem falhas detectadas |
| domiriodistribuidora.com.br | ATIVA | 200 | 115 | 11 | Sem falhas detectadas |
| domi-rio.lojas.avilaops.com | ATIVA • alias | 200 | 115 | 0 | Sem falhas detectadas |
| pkvedacoes.com.br | ATIVA | 200 | 836 | 9 | Sem falhas detectadas |
| pkvedacoes.lojas.avilaops.com | ATIVA • alias | 200 | 836 | 0 | Sem falhas detectadas |
| brilhax.com | ATIVA | 200 | 108 | 9 | Sem falhas detectadas |
| brilhax.lojas.avilaops.com | ATIVA • alias | 200 | 108 | 0 | Sem falhas detectadas |
| vedashow.com.br | ATIVA | 200 | 4908 | 10 | Sem falhas detectadas |
| vedashow.lojas.avilaops.com | ATIVA • alias | 200 | 4908 | 0 | Sem falhas detectadas |
| sandromotos.lojas.avilaops.com | CANCELADA | 200 | 0 | 0 | Sem falhas detectadas |
| avila-ops-store.lojas.avilaops.com | CANCELADA | 200 | 0 | 0 | Sem falhas detectadas |
| demo.lojas.avilaops.com | ATIVA | 200 | 14 | 9 | Sem falhas detectadas |

## Verificações realizadas

• HTTP e XML completos de cada host, namespace, limites de 50.000 URLs e 50 MiB.
• Todas as entradas: URL absoluta HTTPS, host canônico, duplicações, lastmod inválido ou futuro, imagem absoluta HTTPS, até 1.000 imagens por página, priority e changefreq.
• Todas as URLs contra as regras de robots.txt aplicáveis ao Googlebot.
• robots.txt anunciando o sitemap oficial; índice público comparado ao cadastro.
• Amostra por loja: HTTP final, redirecionamentos, canonical e noindex. Todas as 14 páginas do sitemap da plataforma foram consultadas.
• Página inicial de cada alias ativo com domínio próprio: noindex ou redirecionamento para o host oficial.

## Índice e lojas fora de operação

Índice público: HTTP 200 • 2 sitemaps • coerente com o cadastro de lojas ativas sem domínio próprio. Domínios próprios se anunciam pelo robots.txt de cada loja.

As lojas PROVISIONANDO e CANCELADA responderam com sitemap vazio, conforme a regra vigente. A MRG está ativa, com zero produtos cadastrados; suas oito URLs institucionais não constituem falha do sitemap.

## Limites e observações do código

• A coleta não consulta Search Console e não comprova indexação ou submissão ao Google.
• XML integral verificado; HTTP e metadados das páginas por amostragem, sem rastrear individualmente todas as URLs ou imagens.
• O gerador atual monta um único sitemap por loja; a paginação de consulta ao banco não divide o XML. Será necessário dividir se uma loja ultrapassar os limites do protocolo. Nenhum arquivo coletado ultrapassou os limites.
• O código limita o blog a 500 publicações por sitemap. Não foi constatada loja afetada nesta coleta; confirmar total de posts no banco antes de concluir cobertura integral do blog.
• Nenhuma configuração ou dado de produção foi alterado.

Os XMLs, robots.txt e o resultado JSON detalhado estão nesta pasta.
