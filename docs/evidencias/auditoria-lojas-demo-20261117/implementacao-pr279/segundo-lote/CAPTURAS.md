# Painel do lojista • segundo lote da auditoria

[Verificação da publicação e capturas finais](../publicacao/PUBLICACAO.md)

Evidências do commit `49f1354`, no painel autenticado com dados sintéticos do GitHub Actions. A execução aplicou a migração de contatos a um banco descartável. [PR #279](https://github.com/avilaops/P004/pull/279) • [Execução do CI](https://github.com/avilaops/P004/actions/runs/44199701534) • [Diagnóstico e capturas originais](../../RELATORIO.md)

| Fluxo e estado | 1440 × 900 | 390 × 844 | 360 × 844 |
| --- | --- | --- | --- |
| Inventário • produto sem contagem e acesso ao saldo | [Abrir](inventario-sem-contagem-1440.png) | [Abrir](inventario-sem-contagem-390.png) | [Abrir](inventario-sem-contagem-360.png) |
| Pedidos • retorno da ficha com os filtros | [Abrir](pedidos-retorno-filtrado-1440.png) | [Abrir](pedidos-retorno-filtrado-390.png) | [Abrir](pedidos-retorno-filtrado-360.png) |
| Variações • editor com foco, na área visível | [Abrir](variacoes-foco-visivel-1440.png) | [Abrir](variacoes-foco-visivel-390.png) | [Abrir](variacoes-foco-visivel-360.png) |
| Variações • página inteira | [Abrir](variacoes-abertas-1440.png) | [Abrir](variacoes-abertas-390.png) | [Abrir](variacoes-abertas-360.png) |
| Clientes • pré-cadastro localizado após recarga | [Abrir](cliente-sem-pedido-1440.png) | [Abrir](cliente-sem-pedido-390.png) | [Abrir](cliente-sem-pedido-360.png) |
| Clientes • aviso de e-mail já cadastrado | [Abrir](cliente-email-duplicado-1440.png) | [Abrir](cliente-email-duplicado-390.png) | [Abrir](cliente-email-duplicado-360.png) |
| Conexões • credencial cadastrada e sem teste | [Abrir](conexao-sem-teste-1440.png) | [Abrir](conexao-sem-teste-390.png) | [Abrir](conexao-sem-teste-360.png) |
| Conexões • resultado e data do teste de formato do Pix |  | [Abrir](conexao-teste-datado-390.png) |  |
| Catálogo • seletor com o último filtro selecionado |  | [Abrir](catalogo-filtro-final-390.png) | [Abrir](catalogo-filtro-final-360.png) |
| Preço • campo e mensagem na área visível | [Abrir](produto-preco-foco-visivel-1440.png) | [Abrir](produto-preco-foco-visivel-390.png) | [Abrir](produto-preco-foco-visivel-360.png) |
| Preço • página inteira | [Abrir](produto-preco-invalido-1440.png) | [Abrir](produto-preco-invalido-390.png) | [Abrir](produto-preco-invalido-360.png) |
| Cupons • dois vencidos e um vigente | [Abrir](cupons-vigencia-1440.png) | [Abrir](cupons-vigencia-390.png) | [Abrir](cupons-vigencia-360.png) |
| Pedidos • erro na consulta inicial | [Abrir](pedidos-erro-1440.png) | [Abrir](pedidos-erro-390.png) | [Abrir](pedidos-erro-360.png) |
| Pedidos • nova tentativa bem-sucedida | [Abrir](pedidos-recuperados-1440.png) | [Abrir](pedidos-recuperados-390.png) | [Abrir](pedidos-recuperados-360.png) |
| Pix direto • orientação sobre titularidade | [Abrir](pix-formato-valido-1440.png) | [Abrir](pix-formato-valido-390.png) | [Abrir](pix-formato-valido-360.png) |

As capturas de foco mostram exatamente a área visível. As páginas inteiras registram também os campos acima e abaixo dela. O seletor de filtros é específico do layout móvel. O teste adicional da Central foi registrado em 390 px após a validação local do Pix.

## Verificações funcionais

* A ficha e o botão Voltar do navegador recuperaram a busca, a situação e a página. A interrupção de rede preservou o último resultado e a repetição concluiu a consulta.
* A busca pelo SKU existente abriu o campo de saldo com foco. Um código inexistente produziu o estado vazio. Em 360 px, Enter abriu o editor de variações e Fechar devolveu o foco ao acionador.
* Com nome preenchido e preço em branco, o preço recebeu o foco. O teste verificou que o centro do campo estava visível e acessível ao toque.
* Um contato sintético permaneceu pesquisável após a recarga, com zero pedidos. O e-mail repetido em maiúsculas gerou um aviso de duplicidade. A API permitiu a criação por Gerente e recusou a gravação por Balcão.
* A Central distinguiu o cadastro da credencial, a atividade e o resultado datado do teste. A contagem dos cupons correspondeu à situação das três linhas.
