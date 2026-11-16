import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const scope = JSON.parse(readFileSync(new URL('../../public/measurement/sites.json', import.meta.url), 'utf8'));
const coreUrl = new URL('../../public/measurement/core.mjs', import.meta.url).href;

test('o artefato publicado separa o institucional e o painel da plataforma no mesmo GA4', async () => {
  const { resolveRoute } = await import(coreUrl);
  const institutional = resolveRoute(scope, 'https://lojas.avilaops.com/');
  const application = resolveRoute(scope, 'https://lojas.avilaops.com/painel/pedidos/PRIVATE');
  assert.equal(institutional.containerId, 'GTM-MMTBHNRN');
  assert.equal(application.containerId, 'GTM-KLP5RSCZ');
  assert.equal(institutional.measurementId, 'G-TPH4PY7RVN');
  assert.equal(application.measurementId, institutional.measurementId);
});

test('o artefato mantém negócios separados e protege caminhos privados', async () => {
  const { resolveRoute, sanitizeUrl } = await import(coreUrl);
  const veda = resolveRoute(scope, 'https://vedashow.com.br/pedido/PRIVATE');
  const vinhos = resolveRoute(scope, 'https://vinhosimperial.com/');
  assert.equal(veda.measurementId, 'G-N7Y6R9XVS4');
  assert.equal(vinhos.measurementId, 'G-BGKBPQCNBQ');
  assert.equal(sanitizeUrl('https://vedashow.com.br/pedido/PRIVATE?email=private@example.invalid', veda.area), 'https://vedashow.com.br/app');
  assert.equal(resolveRoute(scope, 'https://auth.avilaops.com/login'), null);
  assert.equal(resolveRoute(scope, 'https://demo.lojas.avilaops.com/'), null);
});

test('o institucional de um produto não cai no destino corporativo por compartilhar hostname', async () => {
  const { resolveRoute } = await import(coreUrl);
  assert.equal(resolveRoute(scope, 'https://avilaops.com/crm/').measurementId, 'G-H8WNWY4KDX');
  assert.equal(resolveRoute(scope, 'https://avilaops.com/blog/').measurementId, 'G-1RDXYS7THH');
});
