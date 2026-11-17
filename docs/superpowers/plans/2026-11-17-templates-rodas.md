# Templates de rodas • plano e contrato

**Objetivo:** oferecer quatro novas composições para testar na Bereta pelo painel.
**Responsável:** agente Codex (`codex`).
**Stack:** TypeScript, Next.js, React e CSS com escopo `data-layout`.

## Decisões de implementação

O proprietário enviou quatro imagens durante a implementação. Criar
`rodas-street` (cabeçalho vermelho e vitrine clara), `rodas-racing`
(amarelo/preto com painéis claros), `rodas-carbon` (menu lateral e catálogo
com contorno) e `rodas-night` (escuro/amarelo e categorias fotográficas).
Reproduzir as referências: Street com cinco colunas e banner claro, Racing
com quatro colunas e painéis brancos em moldura escura, Night com quatro
colunas e coleções fotográficas sobre preto, Carbon com três colunas e menu
lateral. Cada modelo fornece cabeçalho, cartões e rodapé próprios. Paletas
iniciais são aplicadas ao selecionar no painel; o lojista
pode personalizá-las antes de salvar. Fonte e conteúdo permanecem os existentes.
Usar composições sobre dados existentes, mantendo o carrinho e o checkout
compartilhados. A adaptação anterior foi rejeitada por distância visual;
trocar apenas cores ou aplicar CSS no DOM da loja não satisfaz este contrato.

O tema ativo não muda. As opções aparecem em Marca • Vitrine e na prévia
existente. Preços e disponibilidade usam as regras compartilhadas. O catálogo
real mantém as próprias fotos, sem substituições ilustrativas. O hero tem arte
default do template e aceita banners cadastrados. Sem produtos, há estado vazio.
Fotografias de categoria podem ilustrar navegação, sem representar SKU.
O institucional permanece fora desta alteração.

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
Artefato contém capturas e JSON com versão, ambiente e resultados. O workflow
`rodas-apresentacao.yml` compila os componentes TSX reais com as versões do
lockfile, usa catálogo demonstrativo identificado, verifica carrinho e overflow
e gera comparações lado a lado com as quatro imagens anexadas pelo proprietário.
É evidência visual dos componentes, separada da integração Next.js/PostgreSQL.
Não se apresenta montagem por alteração do DOM como captura da aplicação.

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
