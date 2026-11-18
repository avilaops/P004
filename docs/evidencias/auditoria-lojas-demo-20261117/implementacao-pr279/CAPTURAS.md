# Painel do lojista • primeiro lote da auditoria

O segundo lote inclui o pré-cadastro de clientes e as melhorias de catálogo, estoque, pedidos, promoções e conexões. [Abrir índice das 42 capturas](segundo-lote/CAPTURAS.md) • [Verificação da publicação](publicacao/PUBLICACAO.md)

O GitHub Actions abriu o painel autenticado com dados sintéticos e capturou as telas da PR #279. Cada coluna identifica a janela inicial. As imagens incluem a página inteira. No Pix em mobile, o cabeçalho fixo aparece na posição de rolagem do formulário. [Revisão no GitHub](https://github.com/avilaops/P004/pull/279) • [Execução e artefatos](https://github.com/avilaops/P004/actions/runs/44194765495)

| Estado observado | 1440 × 900 | 390 × 844 | 360 × 844 |
| --- | --- | --- | --- |
| Pedidos • falha HTTP na primeira leitura e ação “Tentar novamente” | [Desktop](pedidos-erro-1440.png) | [Mobile](pedidos-erro-390.png) | [Mobile estreito](pedidos-erro-360.png) |
| Pedidos • resultado recuperado com a mesma consulta | [Desktop](pedidos-recuperados-1440.png) | [Mobile](pedidos-recuperados-390.png) | [Mobile estreito](pedidos-recuperados-360.png) |
| Pix direto • formato válido e orientação para conferir o recebedor no banco | [Desktop](pix-formato-valido-1440.png) | [Mobile](pix-formato-valido-390.png) | [Mobile estreito](pix-formato-valido-360.png) |

O teste também interrompeu a rede após uma consulta bem-sucedida. Conferiu que o registro anterior permaneceu visível e que a nova tentativa terminou no estado vazio esperado para a nova busca. No formulário Pix, verificou que apagar a chave desabilita “Salvar”.

Para comparar com o painel antes da correção, consulte as capturas da auditoria original. [Pedidos durante a falha](../capturas/pedidos-leitura-interrompida-mobile.png) • [Pix depois de testar a chave](../capturas/pix-teste-de-formato-mobile.png)
