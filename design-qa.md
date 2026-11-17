# Bereta Rodas • conferência das quatro referências

## Escopo

Comparação dos componentes reais TypeScript/TSX com as quatro imagens enviadas
pelo proprietário. Os screenshots são produzidos pelo Chromium no GitHub CI,
a partir de `ComposicaoRodas`, `CabecalhoRodas` e `RodapeRodas`. Não são montagens
por alteração do DOM da loja publicada. O catálogo é demonstrativo e identificado.

## Referências e correções verificadas

| Referência | Template | Estrutura conservada |
| --- | --- | --- |
| 1 | Street | Cabeçalho vermelho, banner branco com três rodas, faixa de marcas, cinco colunas, duas vitrines, rodapé claro |
| 2 | Racing | Cabeçalho amarelo, roda dourada sobre metal, moldura preta, painéis brancos, quatro colunas, cartões com base preta |
| 3 | Night | Fundo carvão, destaque amarelo, macro de pneu, três coleções, quatro colunas, banner inferior |
| 4 | Carbon | Cabeçalho escuro, carro esportivo, cenário de estrada, painel central branco, menu lateral, três colunas, três painéis editoriais |

A primeira comparação dos componentes em `4ad5889` mostrou cabeçalhos baixos,
hero curto no Street/Night, linhas altas no Carbon e cenário excessivamente
presente ao redor do Carbon. As proporções foram corrigidas em `d87803e`.
As quatro comparações e capturas mobile dessa versão foram inspecionadas.

O CI visual [44102475375](https://github.com/avilaops/P004/actions/runs/44102475375)
passou para os quatro templates, em desktop e 390 px, com verificação de
carrossel, carrinho, imagens, ausência de overflow e erros de renderização.

A inspeção mobile identificou sobreposição entre preço anterior e botão no
Racing. `20e267d` substitui a margem negativa por grid, preserva a leitura das
marcas e mantém os botões Carbon alinhados. O modo claro do Night ganhou
cores legíveis na navegação e no telefone, conservando a topbar escura.
O teste visual agora verifica a geometria do preço e as cores desse modo.

## Resultado visual final

**Aprovado para apresentação visual.** A execução
[44105546998](https://github.com/avilaops/P004/actions/runs/44105546998)
passou nos quatro templates no commit `2cf29bc27c7c1faba34df21c3f4e27cc21591cee`.
Inclui Next Link real, preços Racing mobile sem sobreposição e Night claro
legível. Artefatos `rodas-comparacao-<layout>-2cf29bc…` contêm capturas desktop,
mobile, comparação com a referência, páginas compiladas e `resultado.json`.
Não há pendências visuais bloqueadoras identificadas nas quatro referências.
Essa era a aprovação visual; a entrega integrada está registrada abaixo.

## Diferenças intencionais

- Marca Bereta Rodas, português e moeda brasileira substituem os exemplos.
- Artes próprias preservam composição e assunto das referências. Nenhuma
  marca de fabricante é inventada na arte do hero.
- Catálogo sintético e preços ilustrativos servem somente à demonstração.
  A loja publicada usa as fotos e regras dos próprios produtos.
- Conteúdo editorial e links úteis substituem plugins sociais e promoções
  antigas, sem inventar frete grátis, descontos ou depoimentos.
- Mobile usa duas colunas e navegação horizontal. A lateral Carbon é ocultada
  para reservar espaço ao catálogo.

## Integração e limites da evidência

O ciclo [44104228504](https://github.com/avilaops/P004/actions/runs/44104228504)
aprovou tipos, as três fatias de lint, as duas fatias de testes unitários,
as três fatias PostgreSQL e contratos de payload/infraestrutura no commit
`20e267d`. O build completo atingiu o limite de um minuto e foi cancelado;
o navegador integrado ficou sem executar. A revisão independente
confirmou correções de telefone discável, identificação legal, políticas
publicadas, categorias sem imagem e rodapé compartilhado de farmácia.

A apresentação estática compila os mesmos componentes com versões diretas do
lockfile. As dependências transitivas desse ambiente mínimo são resolvidas na
instalação; isso não equivale ao build completo do Next.js com `npm ci`.
O adaptador LinkLoja usa Next real e pré-carregamento desativado na apresentação.

Build completo, PostgreSQL, prévia autenticada e publicação são evidências
separadas. O sucesso visual não os substitui. Naquela etapa nenhum tema ativo
havia sido alterado.

## Carbon publicado • 17/11/2026

O proprietário escolheu Carbon. PR274 integrou a implementação TypeScript/TSX;
PR275 retirou o bloqueio de um minuto por sua orientação explícita. O run
[44133809562](https://github.com/avilaops/P004/actions/runs/44133809562) aprovou
tipos, lint, unitários, PostgreSQL, build, navegador, contratos, imagem,
entrega, deploy e fumaça. Revisão publicada:
`b2d87fd2bc12c78a3ba9bf6a7033824e2306a725`.

Carbon está ativo em `https://beretarodas.com`. A inspeção real em 1440 px e 390 px
confirmou ausência de overflow, nove fotos carregadas, categoria, detalhe,
busca e adicionar/remover do carrinho, sem exceções de página ou pedido real.
O proprietário pediu em seguida a imagem do Racing e uma nova foto bonita;
foi gerado e aplicado um banner de roda dourada, mantendo Carbon.

As capturas finais são do site publicado, sem alteração de DOM/CSS para a
imagem. Detalhes de domínio, mídia, seleção dos destaques, versão e limites
da evidência estão em [Carbon em produção](evidencias/bereta-carbon-2026-11-17.md).

## Abrir o artefato da CI

Baixar o artefato `rodas-comparacao-<layout>-<sha>` da execução visual. A pasta
`site` contém as quatro páginas compiladas. Servir sem build ou testes locais:

```powershell
node --experimental-strip-types scripts/servir-apresentacao-rodas.mts CAMINHO_DA_PASTA_SITE
```

Abrir `http://localhost:3118/street.html`, `racing.html`, `night.html` ou
`carbon.html`. A apresentação é isolada e não envia pedidos reais.
