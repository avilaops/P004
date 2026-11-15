import test from 'node:test';
import assert from 'node:assert/strict';
import { medicaoGerenciadaPara } from './medicao-gerenciada';

test('a implantação abrange as seis lojas aprovadas e distingue o institucional da plataforma', () => {
  for (const host of ['beretarodas.com', 'domiriodistribuidora.com.br', 'mrgcaixastermicas.com.br', 'pkvedacoes.com.br', 'vedashow.com.br', 'vinhosimperial.com']) {
    assert.equal(medicaoGerenciadaPara(host)?.gtmId, 'GTM-M6JQNNMS');
    assert.equal(medicaoGerenciadaPara('www.' + host)?.gtmId, 'GTM-M6JQNNMS');
  }
  assert.equal(medicaoGerenciadaPara('lojas.avilaops.com')?.gtmId, 'GTM-MMTBHNRN');
  for (const host of ['brilhax.com', 'demo.lojas.avilaops.com', 'auth.avilaops.com', 'vinhosimperial.com.br', 'vedashow.com.br.example.org', '']) {
    assert.equal(medicaoGerenciadaPara(host), null, host);
  }
});
