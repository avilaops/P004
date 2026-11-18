# Inventário e índice de imagens • Painel Lojas

[Abrir diagnóstico e backlog](RELATORIO.md)

**39 telas identificadas • 36 capturadas a 1440 × 900 • 36 a 390 × 844 • 8 conferidas também a 360 × 844.** Foram entregues 201 PNGs, contando estados e páginas inteiras. Desktop reúne 82 arquivos, mobile reúne 104 e o controle de 360 px reúne 15.

Todas as capturas são da experiência do lojista em `https://lojas.avilaops.com`. A matriz conta uma ficha por tipo de registro. Cada uma das 13 seções reais de Configurações tem sua própria linha. As quatro subseções de Marca e as abas de IA e API estão no índice de estados. “Tela” abre a primeira dobra nas linhas do inventário. Nos estados em que a ação exige rolar, abre a posição do controle ou da mensagem. “Inteira” abre a página completa.

## Cobertura por perfil

| Perfil | Fonte | Desktop | Mobile | Alcance |
| --- | --- | --- | --- |
| Dono ou acesso equivalente | Sessão SSO da demo e controles exclusivos de dono | 36 telas | 36 telas | Consulta e operações descritas no diagnóstico |
| Gerente | Matriz de permissões da branch | 0 | 0 | Sem sessão independente por orientação do solicitante |
| Balcão (OPERADOR) | Matriz de permissões da branch | 0 | 0 | Sem sessão independente pelo mesmo motivo |

D = dono, G = gerente, B = balcão. “Sessão” indica página sob o layout autenticado. A coluna de capacidade se refere à tarefa indicada. Um papel pode ver a moldura de uma página e receber restrição ao carregar dados ou gravar. A visibilidade do menu por si só não demonstra permissão de escrita. [Permissões](../../../src/lib/operadores.ts) • [Menu condicional](../../../src/lib/navegacao-painel.ts) • [Layout autenticado](../../../src/app/plataforma/%28admin%29/layout.tsx)

## Inventário das telas

| Módulo | Rota | Capacidade de referência | Desktop | Mobile | Estado da sessão |
| --- | --- | --- | --- | --- | --- |
| Visão geral | `/painel` | Sessão • leitura | [Tela](capturas/painel-desktop.png) | [Tela](capturas/painel-mobile.png) | Capturada |
| Análises | `/painel/analises` | Sessão • leitura | [Tela](capturas/painel-analises-desktop.png) | [Tela](capturas/painel-analises-mobile.png) • [Inteira](capturas/painel-analises-mobile-completa.png) | Capturada |
| Atribuição | `/painel/analises/atribuicao` | Sessão • leitura | [Tela](capturas/painel-analises-atribuicao-desktop.png) • [Inteira](capturas/painel-analises-atribuicao-desktop-completa.png) | [Tela](capturas/painel-analises-atribuicao-mobile.png) • [Inteira](capturas/painel-analises-atribuicao-mobile-completa.png) | Capturada |
| Buscas técnicas PK | `/painel/analises/buscas-pk` | Sessão • leitura | • | • | Relatório exclusivo de pkvedacoes. A demo recebeu HTTP 404. |
| Funil da loja | `/painel/analises/funil` | Sessão • leitura | [Tela](capturas/painel-analises-funil-desktop.png) • [Inteira](capturas/painel-analises-funil-desktop-completa.png) | [Tela](capturas/painel-analises-funil-mobile.png) • [Inteira](capturas/painel-analises-funil-mobile-completa.png) | Capturada |
| Avaliações | `/painel/avaliacoes` | D/G • operar catálogo | [Tela](capturas/painel-avaliacoes-desktop.png) | [Tela](capturas/painel-avaliacoes-mobile.png) | Capturada |
| Clientes | `/painel/clientes` | Sessão • leitura | [Tela](capturas/painel-clientes-desktop.png) • [Inteira](capturas/painel-clientes-desktop-completa.png) | [Tela](capturas/painel-clientes-mobile.png) • [Inteira](capturas/painel-clientes-mobile-completa.png) | Capturada |
| Conexões | `/painel/conexoes` | D/G/B • ler, D/G • testar | [Tela](capturas/painel-conexoes-desktop.png) • [Inteira](capturas/painel-conexoes-desktop-completa.png) | [Tela](capturas/painel-conexoes-mobile.png) • [Inteira](capturas/painel-conexoes-mobile-completa.png) | Capturada |
| Configurações | `/painel/configuracoes` | Sessão • leitura | [Tela](capturas/painel-configuracoes-desktop.png) • [Inteira](capturas/painel-configuracoes-desktop-completa.png) | [Tela](capturas/painel-configuracoes-mobile.png) • [Inteira](capturas/painel-configuracoes-mobile-completa.png) | Capturada |
| Assinatura | `/painel/configuracoes/assinatura` | D | [Tela](capturas/config-assinatura-desktop.png) | [Tela](capturas/config-assinatura-mobile.png) | Capturada |
| Automações | `/painel/configuracoes/automacoes` | D/G • configurar | [Tela](capturas/config-automacoes-desktop.png) • [Inteira](capturas/config-automacoes-desktop-completa.png) | [Tela](capturas/config-automacoes-mobile.png) • [Inteira](capturas/config-automacoes-mobile-completa.png) | Capturada |
| Campos do produto | `/painel/configuracoes/campos` | D/G • configurar | [Tela](capturas/config-campos-desktop.png) | [Tela](capturas/config-campos-mobile.png) • [Inteira](capturas/config-campos-mobile-completa.png) | Capturada |
| Marketplaces | `/painel/configuracoes/canais` | D/G • configurar | [Tela](capturas/config-canais-desktop.png) • [Inteira](capturas/config-canais-desktop-completa.png) | [Tela](capturas/config-canais-mobile.png) • [Inteira](capturas/config-canais-mobile-completa.png) | Capturada |
| Dados da empresa | `/painel/configuracoes/conta` | D/G • configurar | [Tela](capturas/config-conta-desktop.png) • [Inteira](capturas/config-conta-desktop-completa.png) | [Tela](capturas/config-conta-mobile.png) • [Inteira](capturas/config-conta-mobile-completa.png) | Capturada |
| SEO e descoberta | `/painel/configuracoes/descoberta` | D/G • configurar | [Tela](capturas/config-descoberta-desktop.png) • [Inteira](capturas/config-descoberta-desktop-completa.png) | [Tela](capturas/config-descoberta-mobile.png) • [Inteira](capturas/config-descoberta-mobile-completa.png) | Capturada |
| Domínio | `/painel/configuracoes/dominio` | D/G • configurar | [Tela](capturas/config-dominio-desktop.png) | [Tela](capturas/config-dominio-mobile.png) | Capturada |
| Entrega | `/painel/configuracoes/entrega` | D/G • configurar | [Tela](capturas/config-entrega-desktop.png) • [Inteira](capturas/config-entrega-desktop-completa.png) | [Tela](capturas/config-entrega-mobile.png) • [Inteira](capturas/config-entrega-mobile-completa.png) | Capturada |
| Equipe | `/painel/configuracoes/equipe` | D | [Tela](capturas/config-equipe-desktop.png) | [Tela](capturas/config-equipe-mobile.png) | Capturada |
| Notas fiscais | `/painel/configuracoes/fiscal` | D | [Tela](capturas/config-fiscal-desktop.png) • [Inteira](capturas/config-fiscal-desktop-completa.png) | [Tela](capturas/config-fiscal-mobile.png) • [Inteira](capturas/config-fiscal-mobile-completa.png) | Capturada |
| Marca | `/painel/configuracoes/marca` | D/G • configurar | [Tela](capturas/config-marca-desktop.png) | [Tela](capturas/config-marca-mobile.png) | Capturada |
| Políticas | `/painel/configuracoes/politicas` | D/G • configurar | [Tela](capturas/config-politicas-desktop.png) • [Inteira](capturas/config-politicas-desktop-completa.png) | [Tela](capturas/config-politicas-mobile.png) • [Inteira](capturas/config-politicas-mobile-completa.png) | Capturada |
| Pagamentos | `/painel/configuracoes/recebimento` | D/G • configurar | [Tela](capturas/config-recebimento-desktop.png) | [Tela](capturas/config-recebimento-mobile.png) • [Inteira](capturas/config-recebimento-mobile-completa.png) | Capturada |
| Cotações B2B | `/painel/cotacoes` | D/G/B • pedidos | [Tela](capturas/painel-cotacoes-desktop.png) | [Tela](capturas/painel-cotacoes-mobile.png) | Capturada |
| Inventário | `/painel/estoque` | D/G • operar catálogo | [Tela](capturas/painel-estoque-desktop.png) • [Inteira](capturas/painel-estoque-desktop-completa.png) | [Tela](capturas/painel-estoque-mobile.png) • [Inteira](capturas/painel-estoque-mobile-completa.png) | Capturada |
| IA e API | `/painel/ia` | D/G • configurar | [Tela](capturas/painel-ia-desktop.png) • [Inteira](capturas/painel-ia-desktop-completa.png) | [Tela](capturas/painel-ia-mobile.png) • [Inteira](capturas/painel-ia-mobile-completa.png) | Capturada |
| Buscadores | `/painel/marketing` | Sessão • leitura | [Tela](capturas/painel-marketing-desktop.png) | [Tela](capturas/painel-marketing-mobile.png) | Capturada |
| Anúncios | `/painel/marketing/anuncios` | Sessão • leitura | [Tela](capturas/painel-marketing-anuncios-desktop.png) • [Inteira](capturas/painel-marketing-anuncios-desktop-completa.png) | [Tela](capturas/painel-marketing-anuncios-mobile.png) • [Inteira](capturas/painel-marketing-anuncios-mobile-completa.png) | Capturada |
| Blog | `/painel/marketing/blog` | Sessão • leitura | [Tela](capturas/painel-marketing-blog-desktop.png) | [Tela](capturas/painel-marketing-blog-mobile.png) | Capturada |
| Pedidos | `/painel/pedidos` | D/G/B • pedidos | [Tela](capturas/painel-pedidos-desktop.png) | [Tela](capturas/painel-pedidos-mobile.png) • [Inteira](capturas/painel-pedidos-mobile-completa.png) | Capturada |
| Ficha do pedido | `/painel/pedidos/[id]` | D/G/B • pedidos | [Tela](capturas/painel-pedidos-detalhe-desktop.png) • [Inteira](capturas/painel-pedidos-detalhe-desktop-completa.png) | [Tela](capturas/painel-pedidos-detalhe-mobile.png) • [Inteira](capturas/painel-pedidos-detalhe-mobile-completa.png) | Capturada |
| Pix a conferir | `/painel/pedidos/pix` | D/G/B • pedidos | [Tela](capturas/painel-pedidos-pix-desktop.png) | [Tela](capturas/painel-pedidos-pix-mobile.png) | Capturada |
| Prévia do tema | `/painel/previa` | Sessão • leitura | [Tela](capturas/painel-previa-desktop.png) • [Inteira](capturas/painel-previa-desktop-completa.png) | [Tela](capturas/painel-previa-mobile.png) • [Inteira](capturas/painel-previa-mobile-completa.png) | Capturada pelo link em Marca |
| Produtos | `/painel/produtos` | D/G • operar catálogo | [Tela](capturas/painel-produtos-desktop.png) • [Inteira](capturas/painel-produtos-desktop-completa.png) | [Tela](capturas/painel-produtos-mobile.png) • [Inteira](capturas/painel-produtos-mobile-completa.png) | Capturada |
| Ficha e preço do produto | `/painel/produtos/[id]` | D/G • operar catálogo | [Tela](capturas/painel-produtos-detalhe-desktop.png) • [Inteira](capturas/painel-produtos-detalhe-desktop-completa.png) | [Tela](capturas/painel-produtos-detalhe-mobile.png) • [Inteira](capturas/painel-produtos-detalhe-mobile-completa.png) | Capturada |
| Categorias | `/painel/produtos/categorias` | D/G • operar catálogo | [Tela](capturas/painel-produtos-categorias-desktop.png) | [Tela](capturas/painel-produtos-categorias-mobile.png) • [Inteira](capturas/painel-produtos-categorias-mobile-completa.png) | Capturada |
| Códigos de barras e etiquetas | `/painel/produtos/etiquetas` | D/G • operar catálogo | [Tela](capturas/painel-produtos-etiquetas-desktop.png) • [Inteira](capturas/painel-produtos-etiquetas-desktop-completa.png) | [Tela](capturas/painel-produtos-etiquetas-mobile.png) • [Inteira](capturas/painel-produtos-etiquetas-mobile-completa.png) | Capturada |
| Promoções | `/painel/promocoes` | D/G • operar catálogo | [Tela](capturas/painel-promocoes-desktop.png) | [Tela](capturas/painel-promocoes-mobile.png) • [Inteira](capturas/painel-promocoes-mobile-completa.png) | Capturada |
| Projetos sob medida | `/painel/sob-medida` | Sessão • leitura | • | • | Configurador sob medida desativado na demo. Menu condicional e HTTP 404 confirmado. |
| Ficha do projeto | `/painel/sob-medida/[id]` | Sessão • leitura | • | • | Depende da mesma habilitação e de um projeto do tenant. Sem registro acessível para abrir a ficha. |

## Estados e verificações a 360 px

A coluna sem link indica que aquela combinação adicional de estado e largura não foi capturada. As telas-base estão na matriz acima.

| Estado ou controle | Rota de origem | 1440 px | 390 px | 360 px |
| --- | --- | --- | --- | --- |
| Conexoes sem teste | `/painel/conexoes` | • | [Tela](capturas/conexoes-sem-teste-mobile.png) • [Inteira](capturas/conexoes-sem-teste-mobile-completa.png) | • |
| Equipe formulario | `/painel/configuracoes/equipe` | [Tela](capturas/equipe-formulario-desktop.png) • [Inteira](capturas/equipe-formulario-desktop-completa.png) | [Tela](capturas/equipe-formulario-mobile.png) • [Inteira](capturas/equipe-formulario-mobile-completa.png) | • |
| Estoque confirmacao | `/painel/estoque` | • | [Tela](capturas/estoque-confirmacao-mobile.png) • [Inteira](capturas/estoque-confirmacao-mobile-completa.png) | • |
| Estoque sku sem contagem | `/painel/estoque` | [Tela](capturas/estoque-sku-sem-contagem-desktop.png) • [Inteira](capturas/estoque-sku-sem-contagem-desktop-completa.png) | [Tela](capturas/estoque-sku-sem-contagem-mobile.png) • [Inteira](capturas/estoque-sku-sem-contagem-mobile-completa.png) | [Tela](capturas/estoque-sku-sem-contagem-360.png) |
| Filtros final estoque | `/painel/estoque` | • | • | [Tela](capturas/filtros-final-estoque-360.png) |
| Filtros final produtos | `/painel/produtos` | • | • | [Tela](capturas/filtros-final-produtos-360.png) |
| Ia chaves | `/painel/ia` | [Tela](capturas/ia-chaves-desktop.png) | [Tela](capturas/ia-chaves-mobile.png) | • |
| Ia webhooks | `/painel/ia` | [Tela](capturas/ia-webhooks-desktop.png) | [Tela](capturas/ia-webhooks-mobile.png) | • |
| Integracao pix formulario | `/painel/configuracoes/recebimento` | [Tela](capturas/integracao-pix-formulario-desktop.png) • [Inteira](capturas/integracao-pix-formulario-desktop-completa.png) | [Tela](capturas/integracao-pix-formulario-mobile.png) • [Inteira](capturas/integracao-pix-formulario-mobile-completa.png) | • |
| Marca contato | `/painel/configuracoes/marca` | [Tela](capturas/marca-contato-desktop.png) | [Tela](capturas/marca-contato-mobile.png) • [Inteira](capturas/marca-contato-mobile-completa.png) | • |
| Marca direcao | `/painel/configuracoes/marca` | [Tela](capturas/marca-direcao-desktop.png) • [Inteira](capturas/marca-direcao-desktop-completa.png) | [Tela](capturas/marca-direcao-mobile.png) • [Inteira](capturas/marca-direcao-mobile-completa.png) | • |
| Marca visual | `/painel/configuracoes/marca` | [Tela](capturas/marca-visual-desktop.png) | [Tela](capturas/marca-visual-mobile.png) • [Inteira](capturas/marca-visual-mobile-completa.png) | • |
| Marca vitrine | `/painel/configuracoes/marca` | [Tela](capturas/marca-vitrine-desktop.png) • [Inteira](capturas/marca-vitrine-desktop-completa.png) | [Tela](capturas/marca-vitrine-mobile.png) • [Inteira](capturas/marca-vitrine-mobile-completa.png) | • |
| Painel busca teclado | `/painel` | [Tela](capturas/painel-busca-teclado-desktop.png) | • | • |
| Painel menu toque | `/painel` | • | [Tela](capturas/painel-menu-toque-mobile.png) | • |
| Pedidos filtro numero | `/painel/pedidos` | [Tela](capturas/pedidos-filtro-numero-desktop.png) | [Tela](capturas/pedidos-filtro-numero-mobile.png) | [Tela](capturas/pedidos-filtro-numero-360.png) |
| Pedidos leitura interrompida | `/painel/pedidos` | [Tela](capturas/pedidos-leitura-interrompida-desktop.png) | [Tela](capturas/pedidos-leitura-interrompida-mobile.png) | [Tela](capturas/pedidos-leitura-interrompida-360.png) |
| Pedidos sem resultados | `/painel/pedidos` | [Tela](capturas/pedidos-sem-resultados-desktop.png) | [Tela](capturas/pedidos-sem-resultados-mobile.png) | • |
| Pedidos volta pela tela | `/painel/pedidos` | • | [Tela](capturas/pedidos-volta-pela-tela-mobile.png) • [Inteira](capturas/pedidos-volta-pela-tela-mobile-completa.png) | [Tela](capturas/pedidos-volta-pela-tela-360.png) |
| Pix campo obrigatorio | `/painel/configuracoes/recebimento` | • | [Tela](capturas/pix-campo-obrigatorio-mobile.png) • [Inteira](capturas/pix-campo-obrigatorio-mobile-completa.png) | • |
| Pix teste de formato | `/painel/configuracoes/recebimento` | [Tela](capturas/pix-teste-de-formato-desktop.png) • [Inteira](capturas/pix-teste-de-formato-desktop-completa.png) | [Tela](capturas/pix-teste-de-formato-mobile.png) • [Inteira](capturas/pix-teste-de-formato-mobile-completa.png) | [Tela](capturas/pix-teste-de-formato-360.png) |
| Produto busca sku | `/painel/produtos` | [Tela](capturas/produto-busca-sku-desktop.png) • [Inteira](capturas/produto-busca-sku-desktop-completa.png) | [Tela](capturas/produto-busca-sku-mobile.png) • [Inteira](capturas/produto-busca-sku-mobile-completa.png) | • |
| Produto grade variacoes | `/painel/produtos/[id]` | [Tela](capturas/produto-grade-variacoes-desktop.png) • [Inteira](capturas/produto-grade-variacoes-desktop-completa.png) | [Tela](capturas/produto-grade-variacoes-mobile.png) • [Inteira](capturas/produto-grade-variacoes-mobile-completa.png) | [Tela](capturas/produto-grade-variacoes-360.png) |
| Produto novo formulario | `/painel/produtos` | [Tela](capturas/produto-novo-formulario-desktop.png) • [Inteira](capturas/produto-novo-formulario-desktop-completa.png) | [Tela](capturas/produto-novo-formulario-mobile.png) • [Inteira](capturas/produto-novo-formulario-mobile-completa.png) | • |
| Produto validacao preco | `/painel/produtos/[id]` | • | [Tela](capturas/produto-validacao-preco-mobile.png) • [Inteira](capturas/produto-validacao-preco-mobile-completa.png) | • |
| Revisao clientes | `/painel/clientes` | • | • | [Tela](capturas/revisao-clientes-360.png) |
| Revisao conexoes | `/painel/conexoes` | • | • | [Tela](capturas/revisao-conexoes-360.png) |
| Revisao configuracoes canais | `/painel/configuracoes/canais` | • | • | [Tela](capturas/revisao-configuracoes-canais-360.png) |
| Revisao estoque | `/painel/estoque` | • | • | [Tela](capturas/revisao-estoque-360.png) |
| Revisao produtos | `/painel/produtos` | • | • | [Tela](capturas/revisao-produtos-360.png) |
| Variacoes apos rolagem | `/painel/produtos/[id]` | • | [Tela](capturas/variacoes-apos-rolagem-mobile.png) • [Inteira](capturas/variacoes-apos-rolagem-mobile-completa.png) | [Tela](capturas/variacoes-apos-rolagem-360.png) |
| Variacoes apos toque | `/painel/produtos/[id]` | • | [Tela](capturas/variacoes-apos-toque-mobile.png) • [Inteira](capturas/variacoes-apos-toque-mobile-completa.png) | [Tela](capturas/variacoes-apos-toque-360.png) |

## Cobertura pendente

- **Configuração do tenant • 3 telas.** A lista e a ficha de projetos sob medida dependem da habilitação do configurador. O relatório de buscas técnicas pertence a outro tenant. Os bloqueios individuais estão na matriz.
- **Perfis • 2 contas independentes.** Gerente e Balcão ficaram com leitura de contrato. A navegação, o bloqueio efetivo das ações e o texto de recusa nesses perfis exigem sessões próprias.
- **Dados operacionais.** Havia três pedidos cancelados e nenhuma ficha paga em separação para demonstrar despacho. A fila Pix a conferir estava vazia. O painel tinha um cliente e quatro produtos, dos quais um controlava saldo. Não foram gerados pedidos, etiquetas, cobranças ou mensagens.
- **Integrações.** A validação local do Pix foi exercitada. Substituição da chave padrão, nova autorização OAuth de terceiros e liquidação bancária exigem ambiente e credenciais de homologação. O estado mostrado por um conector não comprova uma venda processada.
- **Dispositivo e concorrente.** A emulação verificou toque e largura. Teclado virtual físico e sessão administrativa da TOTVS permaneceram sem teste direto. Vitrine, checkout, site institucional e seleção de outras lojas ficaram fora do escopo final.
