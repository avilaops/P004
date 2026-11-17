# Lojas • tempo de CI/CD e retenção de releases

## Escopo

Em 17/11/2026, o proprietário pediu a medição do CI/CD e a remoção de releases
excedentes, mantendo duas. Confirmou explicitamente que a limpeza abrange
somente o Lojas, sem alterar os demais aplicativos do servidor compartilhado.

## Medição no GitHub

O run de PR [44125994179](https://github.com/avilaops/P004/actions/runs/44125994179)
foi aprovado integralmente: início às 16:27:33 UTC e conclusão às 16:36:28 UTC,
total de **8min55s**. O commit da branch era
`96bf113649e36636fcfeb0743e351835aa7277aa`; o merge de verificação da PR era
`12f184aa1b50d873193befebe237cbfdce80e785`.

| Etapa | Tempo do job |
| --- | ---: |
| Navegador • cotação, HTTP e reinício | 4min04s |
| Navegador • etiquetas e PDFs | 1min11s |
| Integração PostgreSQL • parte 1 | 1min09s |
| Build | 1min00s |
| Unitários • parte 2 | 1min00s |
| Lint • componentes | 57s |
| TypeScript | 56s |

Os tempos incluem preparação e finalização de cada job. As etapas paralelas
não devem ser somadas para representar a duração total do pipeline.

Os 27 artefatos desse run somam **1.140.205.856 bytes** no GitHub. Entre eles:
dependências completas com 311.124.632 bytes, build com 205.968.675 bytes,
contexto de imagem com 215.713.771 bytes e evidência de navegador dos templates
com 22.160.408 bytes. São artefatos de CI; o publicador baixa no servidor a
imagem identificada por digest, sem copiar os pacotes de testes e dependências
da CI para uma pasta de releases.

A primeira tentativa de produção do run
[44127728346](https://github.com/avilaops/P004/actions/runs/44127728346), revisão
`f4095c4a3d2f625511fe1e24eb3a176d56c326d1`, aprovou todos os gates e publicou a
imagem no registro. O job de preparação foi cancelado durante o `docker pull`
às 16:46:29 UTC, antes de trocar o serviço. A execução completa foi repetida,
preservando a validação por revisão, run e tentativa. Não houve build ou teste
local ou no servidor.

## Estado do servidor antes da nova entrega

Leitura por SSH em 17/11/2026, aproximadamente às 16:43 UTC:

- Disco raiz: 38 GB, 94% ocupado, aproximadamente 2,5 GB livres.
- Repositório `ghcr.io/avilaops/lojas.avilaops.com`: **duas imagens**.
- Ativa: `36ea7a4162b2…`, revisão `435bb5a8db8c142815609a345c1cdf1c9ecd3909`.
- Anterior: `161587b7120c…`, revisão `dc0da1612ad42e8f0a0e4cfc04392c3f5e3cbd22`.
- `docker image ls` informa 894 MB e 892 MB. Esses valores não representam
  necessariamente espaço recuperável pela soma, pois o Docker compartilha
  camadas e mantém conteúdo comprimido e snapshots.
- Estado de publicação `/var/lib/avilaops/deploy/lojas.avilaops.com`: 8 KB.
- `/opt/lojas/uploads`: 528 MB de dados da loja, preservados.
- `/opt/lojas/backups`: 40 MB, preservados.

Não havia terceira release do Lojas para exclusão nessa leitura. O acúmulo
maior de imagens está em outros aplicativos, fora do escopo confirmado.

## Retenção existente

O publicador instalado em `/usr/local/sbin/avila-deploy` já executa
`prune_old_images` após conferir a saúde e o ID exato do container novo.
O filtro se limita a `IMAGE_REPOSITORY` desta aplicação e preserva
`expected_image` e `previous_image`. A exclusão usa `docker image rm`, sem
forçar a remoção de imagens usadas por outros containers.

Os caminhos ativos e as imagens foram inspecionados antes de qualquer limpeza.
Não foi executado prune global, exclusão de volumes, uploads ou backups por
esta auditoria. O build e os testes continuam exclusivamente no GitHub CI.
