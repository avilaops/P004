# Manifestação fiscal no Lojas

## Escopo

Corrigir a preparação local da manifestação: entradas inválidas e certificado
indisponível não podem reservar uma intenção. Somente a chamada que cria a
intenção pode transmitir. Resultado final persistido não pode regredir por
falha posterior de auditoria. CNPJ integrado continua sob autoridade do ERP.
Nenhuma alteração no ERP ou transmissão fiscal real faz parte da verificação.

## Plano e aceite

- [ ] Reproduzir regressões no GitHub CI.
- [ ] Validar tipo e justificativa antes da persistência e assinar antes de reservar.
- [ ] Tratar concorrência pela restrição única, preservando o primeiro comando.
- [ ] Preservar resultado final e a separação entre ERP e coletor local.
- [ ] Verificar isolamento, concorrência e falhas com transporte sintético no CI.
- [ ] Registrar versão, CI e publicação.
