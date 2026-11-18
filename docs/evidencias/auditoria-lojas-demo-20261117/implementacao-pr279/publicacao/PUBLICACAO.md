# Publicação da PR #279 • painel do lojista

Os dez itens da auditoria foram integrados à `main` em 17/11/2026 no [commit d92a595](https://github.com/avilaops/P004/commit/d92a5954aaf1af0f0c99fc21f3035f1ddd8938a7). [PR #279](https://github.com/avilaops/P004/pull/279) • [Acompanhamento no Linear](https://linear.app/avilaops/document/auditoria-do-painel-implementacao-e-aceite-17112026-71a9e096e7c2)

## Produção • painel autenticado da Loja Demo

Em 17/11/2026 às 21h17 de Brasília, o servidor concluiu a publicação e confirmou a aplicação da migração `20261117190000_contato_atendimento`. O teste público passou. Uma leitura independente de `/api/health` retornou HTTP 200 e banco `ok`. [Log do deploy](https://github.com/avilaops/P004/actions/runs/44204799388/job/134473109991) • [Verificação pública](https://github.com/avilaops/P004/actions/runs/44204799388/job/134473912760)

| Fluxo verificado com o perfil Dono | 1440 × 900 | 390 × 844 |
| --- | --- | --- |
| Pedidos • depois de fazer duas buscas e usar Voltar e Avançar, o campo e a URL recuperaram cada termo | [Tela do painel](producao-pedidos-busca-1440.png) | [Tela do painel](producao-pedidos-busca-390.png) |
| Clientes • “Novo cliente” abriu o pré-cadastro e “Cancelar” retornou à lista | [Recorte do formulário](producao-cliente-formulario-1440.png) | [Recorte do formulário](producao-cliente-formulario-390.png) |

As buscas usaram termos sintéticos sem resultados. O e-mail da loja e os campos de contato estão ocultos nas imagens. A gravação do pré-cadastro, a rejeição de e-mail duplicado e as permissões de Gerente e Balcão foram verificadas no CI com banco de teste. A sessão de produção usou apenas o perfil Dono.

## Preços • gravação e releitura no CI

O navegador salvou um produto sintético com preço de venda de R$ 1.234,56 e preço de referência de R$ 2.345,67. Depois da recarga, os dois campos conservaram os valores. Uma referência inválida reteve o foco no campo e impediu a gravação. Os 24 jobs executados na revisão `0a4977a` passaram. [Execução da PR](https://github.com/avilaops/P004/actions/runs/44203495355) • [Artefato de origem](https://github.com/avilaops/P004/actions/runs/44203495355/artifacts/14382463782)

| Painel no CI com dados sintéticos | 1440 × 900 | 390 × 844 | 360 × 844 |
| --- | --- | --- | --- |
| Produto após salvar e recarregar | [Desktop](produto-preco-persiste-1440.png) | [Mobile](produto-preco-persiste-390.png) | [Mobile estreito](produto-preco-persiste-360.png) |

## Evidências anteriores

[Diagnóstico original](../../RELATORIO.md) • [Primeiro lote](../CAPTURAS.md) • [42 capturas do segundo lote](../segundo-lote/CAPTURAS.md)
