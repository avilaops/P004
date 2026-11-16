import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { transpileModule, ModuleKind, JsxEmit } from 'typescript';
import { pixelsDo, temRastreio } from './pixels';

test('a loja gerenciada sem IDs antigos mantém o controle de preferências no rodapé', () => {
  const previous = process.env.MEDICAO_33_ATIVA;
  process.env.MEDICAO_33_ATIVA = '1';
  try {
    const tenant = { nome: 'Veda Show', slug: 'vedashow', gtmId: null, ga4Id: null, metaPixelId: null, googleAdsId: null, tiktokPixelId: null, googleMerchantId: null } as Parameters<typeof pixelsDo>[0];
    const preferences = () => null;
    const element = (type: unknown, props: unknown) => ({ type, props });
    const mocks: Record<string, unknown> = {
      'react/jsx-runtime': { jsx: element, jsxs: element, Fragment: 'fragment' },
      '@/lib/pixels': { pixelsDo, temRastreio },
      '@/lib/tenant': { lojaVende: () => false },
      '@/lib/identidade-publica': { identidadePublica: () => ({ nome: tenant.nome }) },
      '@/components/Consentimento': { PreferenciasCookies: preferences },
      '@avilaops/checkout': { mascararDocumento: () => '' },
      '@/lib/farmacia': { lerResponsavel: () => null },
      '@/lib/politicas': { politicasPublicadas: () => [] },
    };
    const output = { exports: {} as { default: (props: unknown) => unknown } };
    const source = readFileSync(new URL('../components/Footer.tsx', import.meta.url), 'utf8');
    runInNewContext(transpileModule(source, { compilerOptions: { module: ModuleKind.CommonJS, jsx: JsxEmit.ReactJSX } }).outputText, {
      exports: output.exports, process, URL, require: (name: string) => mocks[name] ?? {},
    });
    const containsPreferences = (value: unknown): boolean => {
      if (!value || typeof value !== 'object') return false;
      const node = value as { type?: unknown; props?: { children?: unknown } };
      return node.type === preferences || (Array.isArray(value) ? value.some(containsPreferences) : containsPreferences(node.props?.children));
    };
    const pixels = pixelsDo(tenant, 'vedashow.com.br');
    assert.equal(temRastreio(pixels), true);
    assert.equal(temRastreio(pixelsDo(tenant)), false);
    assert.equal(containsPreferences(output.exports.default({ tenant, categorias: [], rastreioAtivo: temRastreio(pixels) })), true);
    assert.equal(containsPreferences(output.exports.default({ tenant, categorias: [], rastreioAtivo: false })), false);
  } finally {
    if (previous === undefined) delete process.env.MEDICAO_33_ATIVA; else process.env.MEDICAO_33_ATIVA = previous;
  }
});
