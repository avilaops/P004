# Templates de rodas • plano e contrato

**Objetivo:** oferecer quatro novas composições para testar na Bereta pelo painel.
**Responsável:** agente Codex (`codex`).
**Stack:** TypeScript, Next.js, React e CSS com escopo `data-layout`.

## Decisões de implementação

O proprietário enviou quatro imagens durante a implementação. Criar
`rodas-street` (cabeçalho vermelho e vitrine clara), `rodas-racing`
(amarelo/preto com painéis claros), `rodas-carbon` (menu lateral e catálogo
com contorno) e `rodas-night` (escuro/amarelo e categorias fotográficas).
Preservar a hierarquia das referências, usando fotos, logo e dados reais
da loja. Paletas iniciais são aplicadas ao selecionar no painel; o lojista
pode personalizá-las antes de salvar. Fonte e conteúdo permanecem os existentes.
Usar quatro composições de home sobre os dados existentes, em vez de duplicar
checkout ou criar sites separados. Alterar só cores não oferece comparação
de hierarquia; reimplementar a loja inteira amplia o escopo sem necessidade.

O tema ativo não muda. As opções aparecem em Marca • Vitrine e na prévia
existente. Produtos, preços, disponibilidade e atendimento usam os componentes
compartilhados. Nenhuma foto, avaliação ou condição comercial é inventada.
Sem imagem, o hero apresenta texto; sem produtos, apresenta estado vazio.
Categorias sem foto respeitam `categoriaSemImagem`. Cores, fonte e cantos
continuam configuráveis. O institucional permanece fora desta alteração.

## Tarefas

- [x] Registrar os quatro layouts no schema, catálogo, contrato e composição.
- [x] Implementar as quatro variantes e os blocos comuns, com estilos responsivos.
- [ ] Conferir seleção, prévia sem escrita, links, ausência de imagem e catálogo
  vazio; executar matriz mobile/desktop, claro/escuro no GitHub CI.
- [ ] Vincular fontes ao perfil MLOps, registrar evidências e entregar opções
  disponíveis para teste, sem selecionar um novo tema na loja.

## Verificação

Testes e build exclusivamente no GitHub CI. Teste de contrato fixa aceitação
do tema e roundtrip da prévia. Teste de navegador usa tenant isolado e servidor
compilado: quatro layouts em 390 e 1440 px, modos claro e escuro, fotos reais
do repositório, nenhuma gravação pela prévia, navegação e estado sem catálogo.
Artefato contém capturas e JSON com versão, ambiente e resultados.

## Revisão

Conferir overflow com nomes longos; ausência de foto ou produtos; catálogo
somente consulta; busca com caracteres escapados; seleção sem publicação.
Não executar testes locais nem reutilizar o checkout fiscal em andamento.

Revisão independente em `78ab837`: corrigidos contraste do cabeçalho,
persistência da paleta no PATCH e cobertura visual da home com catálogo.
CI `44084998509`: tipos, lint, unitários e build aprovados; navegador detectou
asserção de conteúdo que comparava `innerText` transformado pelo CSS com texto
original. Usar `textContent` conserva a verificação exata do conteúdo salvo.
Resultado final será vinculado à PR274 e ao artefato versionado
`lojas-templates-rodas-browser-<sha>` da mesma execução de CI.

Continuação: o proprietário reiterou TypeScript/Next.js e dispensou Rust.
Após cancelamentos nativos do build por tempo em `44087397104`,
`44088283133` e `44089060984`, o consumidor de build passa a baixar o arquivo
completo do produtor original. O conteúdo e SHA-256 são os mesmos das quatro
partes; versão, execução, tentativa e hash continuam conferidos pelo protocolo
existente. O gate de qualidade e o timeout de um minuto são preservados.
O mesmo arquivo completo é usado pela matriz de qualidade: em `44089948211`
a restauração de quatro partes consumiu 44 segundos antes do ESLint e o job
foi cancelado pelo limite nativo. A matriz, os comandos e o limite permanecem.
