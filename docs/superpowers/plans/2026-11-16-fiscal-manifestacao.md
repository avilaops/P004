# Manifestação fiscal no Lojas

## Escopo

Corrigir a preparação local da manifestação: entradas inválidas e certificado
indisponível não podem reservar uma intenção. Somente a chamada que cria a
intenção pode transmitir. Resultado final persistido não pode regredir por
falha posterior de auditoria. CNPJ integrado continua sob autoridade do ERP.
Nenhuma alteração no ERP ou transmissão fiscal real faz parte da verificação.

## Plano e aceite

- [x] Reproduzir regressões no GitHub CI.
- [x] Validar tipo e justificativa antes da persistência e assinar antes de reservar.
- [x] Tratar concorrência pela restrição única, preservando o primeiro comando.
- [x] Preservar resultado final e a separação entre ERP e coletor local.
- [x] Verificar isolamento, concorrência e falhas com transporte sintético no CI.
- [x] Registrar versão, CI e publicação.

## Entrega

PR269 integrado em `96f3d85757f3dad11d87a8a492755ae79f08347d`.
CI final `43859738403` aprovado. Publicação contém essa correção em
`267b565663dc22c5e6b2c146f39d461b6c82720d`; pipeline `43861260846` e fumaça
aprovados na tentativa 2. Evidência detalhada:
[manifestação fiscal](../../../evidencias/fiscal-manifestacao-2026-11-16.md).
