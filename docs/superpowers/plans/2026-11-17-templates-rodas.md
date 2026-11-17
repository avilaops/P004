# Templates de rodas • plano e contrato

**Objetivo:** oferecer três novas composições para testar na Bereta pelo painel.
**Responsável:** agente Codex (`codex`).
**Stack:** TypeScript, Next.js, React e CSS Modules existentes.

## Decisões de implementação

Criar `rodas-performance` (hero escuro e categorias numeradas),
`rodas-showroom` (composição editorial com fotografia e categorias visuais) e
`rodas-catalogo` (busca inicial e catálogo compacto). São decisões do agente
para atender ao pedido de alguns templates novos, sem preferência visual definida.
Usar três composições de home sobre os dados existentes, em vez de duplicar
checkout ou criar sites separados. Alterar só cores não oferece comparação
de hierarquia; reimplementar a loja inteira amplia o escopo sem necessidade.

O tema ativo não muda. As opções aparecem em Marca • Vitrine e na prévia
existente. Produtos, preços, disponibilidade e atendimento usam os componentes
compartilhados. Nenhuma foto, avaliação ou condição comercial é inventada.
Sem imagem, o hero apresenta texto; sem produtos, apresenta estado vazio.
Categorias sem foto respeitam `categoriaSemImagem`. Cores, fonte e cantos
continuam configuráveis. O institucional permanece fora desta alteração.

## Tarefas

- [ ] Registrar os três layouts no schema, catálogo, contrato e composição.
- [ ] Implementar as três homes e os blocos comuns, com estilos responsivos.
- [ ] Conferir seleção, prévia sem escrita, links, ausência de imagem e catálogo
  vazio; executar matriz mobile/desktop, claro/escuro no GitHub CI.
- [ ] Vincular fontes ao perfil MLOps, registrar evidências e entregar opções
  disponíveis para teste, sem selecionar um novo tema na loja.

## Verificação

Testes e build exclusivamente no GitHub CI. Teste de contrato fixa aceitação
do tema e roundtrip da prévia. Teste de navegador usa tenant isolado e servidor
compilado: três layouts em 390 e 1440 px, modos claro e escuro, fotos reais
do repositório, nenhuma gravação pela prévia, navegação e estado sem catálogo.
Artefato contém capturas e JSON com versão, ambiente e resultados.

## Revisão

Conferir overflow com nomes longos; ausência de foto ou produtos; catálogo
somente consulta; busca com caracteres escapados; seleção sem publicação.
Não executar testes locais nem reutilizar o checkout fiscal em andamento.
