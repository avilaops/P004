# Pedidos • busca por telefone e filas de atendimento

## Disponibilidade do conjunto antes da publicação

Em 17/11/2026 às 22h52 de Brasília, o perfil Dono da Loja Demo abriu as 36 telas acessíveis do inventário em 1440 × 900 e 390 × 844. Nas 72 navegações, o documento retornou HTTP 200 na rota esperada. A medição cobriu abertura das páginas. Os ensaios de operações ficam descritos em cada fluxo. As três rotas condicionadas a outro tenant ou recurso estão discriminadas no inventário. [Resultado por rota e largura](disponibilidade-painel-demo.json) • [Matriz de cobertura](../INVENTARIO.md) • [Versão publicada durante a medição](https://github.com/avilaops/P004/actions/runs/44204799388)

Na mesma versão, 23 verificações funcionais passaram no painel publicado. Sete percursos rodaram nas três larguras: recuperar a lista de pedidos após falha simulada no navegador e voltar da ficha, procurar SKU sem contagem e abrir o saldo, abrir e fechar variações com o teclado, validar preço vazio, abrir e cancelar o pré-cadastro, ler teste e atividade da conexão e conferir a contagem de cupons. Em 360 e 390 px, o operador também selecionou o último filtro do catálogo e voltou a Todos. O navegador registrou zero tentativas de gravação nas APIs do painel. [Resultado por fluxo e largura](fluxos-painel-demo.json)

## Antes • versão d92a595 em produção

O perfil Dono da Loja Demo pesquisou um celular sintético de 11 dígitos. A consulta devolveu HTTP 500 e o painel mostrou “Não foi possível carregar os pedidos”. A faixa de filtros tinha 606 px de conteúdo para 310 px de área visível a 360 px e 332 px a 390 px. [Captura do painel em 390 × 844](antes-telefone-390.png)

## Critérios de aceite

- A busca com o celular sintético, digitado com e sem máscara, devolve HTTP 200 e encontra o mesmo pedido do banco de teste.
- O operador consegue escolher Entregues, Cancelados e Estornados. Depois de abrir o pedido cancelado e voltar, a busca e a situação continuam selecionadas.
- A jornada cobre 1440 × 900, 390 × 844 e 360 × 844.

## Depois • painel no GitHub CI

O pedido sintético foi encontrado nos dois formatos do celular. A busca retornou HTTP 200 nas três larguras. O navegador selecionou as três filas finais, abriu o pedido cancelado e recuperou a mesma consulta ao voltar da ficha. Os hashes SHA-256 das imagens abaixo coincidem com o manifesto da jornada. [Artefato original](https://github.com/avilaops/P004/actions/runs/44217114424/artifacts/14388948418)

| Estado | 1440 × 900 | 390 × 844 | 360 × 844 |
| --- | --- | --- | --- |
| Retorno da ficha • telefone preenchido e fila Cancelados ativa | [Desktop](pedidos-consulta-cancelados-1440.png) | [Mobile](pedidos-consulta-cancelados-390.png) | [Mobile estreito](pedidos-consulta-cancelados-360.png) |

[PR #280](https://github.com/avilaops/P004/pull/280) • [Execução do CI](https://github.com/avilaops/P004/actions/runs/44217114424) • [Registro no Linear](https://linear.app/avilaops/document/auditoria-do-painel-implementacao-e-aceite-17112026-71a9e096e7c2)
