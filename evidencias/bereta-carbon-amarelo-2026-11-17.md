# Bereta • paleta amarela no Carbon

O proprietário pediu substituir os destaques vermelhos por amarelo, mantendo
o Carbon e o banner dourado já aprovados.

## Implementação e publicação

A [PR277](https://github.com/avilaops/P004/pull/277) removeu cores vermelhas
fixas da linha de seção e dos links editoriais. Esses detalhes agora seguem
a paleta. Nomes de produtos, links e aba ativa no celular usam uma tonalidade
escura em fundo claro; no modo escuro os links usam tonalidade clara.

O ajuste de código ficou no CSS do Carbon. Não foram alterados templates
selecionados de outras lojas, banner, domínio ou dados comerciais.

- Revisão publicada: `874c5999f42fe0beb7e16fc9f00bdbae1ce99072`.
- [CI de produção 44165079446](https://github.com/avilaops/P004/actions/runs/44165079446)
  aprovada integralmente • 20:02:45 a 20:14:59 UTC • 12min14s.
- Build, tipos, lint, unitários, integração, navegador, contratos, imagem,
  entrega, deploy e fumaça aprovados exclusivamente no GitHub CI.
- Container `healthy`, com a revisão exata e duas imagens de execução.

## Configuração da Bereta

A API administrativa recebeu somente os dois campos de cor do tema:

```json
{
  "tema": {
    "corPrimaria": "#f5c518",
    "corPrimariaTexto": "#17181b"
  }
}
```

A releitura confirmou os valores novos e igualdade dos demais campos do tema
e da URL do banner. O domínio continua `https://beretarodas.com`, o layout
continua `rodas-carbon` e o catálogo mantém 8.426 produtos. O cache da zona
Bereta foi limpo para publicar os novos tokens de cor.

## Verificação real no navegador

Em 1440×1000 e 390×844, os estilos calculados confirmaram:

- Navegação, botões e linha de seção: `rgb(245, 197, 24)`.
- Texto dos botões: `rgb(23, 24, 27)` • contraste 10,89:1.
- Links, nomes dos produtos e aba móvel: amarelo escurecido por mistura com
  preto • contraste 5,82:1 em branco.
- Tokens de checkout: `#f5c518` e `#17181b`.
- Banner original preservado e nove produtos na vitrine.
- Home, catálogo e carrinho sem overflow horizontal ou exceções de página.

Foram inspecionadas as capturas reais `carbon-amarelo-desktop.png`,
`carbon-amarelo-mobile.png` e `carbon-amarelo-mobile-topo.png`, no diretório
operacional `artifacts/carbon-bereta-producao`. Não houve alteração de DOM
ou CSS para fabricar a captura. Nenhum pedido ou pagamento foi criado.

Revisão independente • sem bloqueadores. Estado final • concluído.
